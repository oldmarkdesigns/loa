import { internalMutationGeneric, mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import {
  defaultPublisherPlan,
  findUserByEmail,
  findUserByTokenIdentifier,
  getViewer,
  getViewerOrThrow,
  normalizeRole,
  normalizeRoles,
  nowIso,
  normalizeOrganizationNumber,
  seedCompanies,
  sanitizeUser,
  slugId,
  stripSystemFields,
  userGrantedRoles
} from "./lib.js";

const appRoleValidator = v.union(v.literal("renter"), v.literal("broker"), v.literal("company_admin"), v.literal("publisher"));
const profileValidator = v.record(v.string(), v.any());
const onboardingAccountValidator = v.object({
  name: v.optional(v.string()),
  phone: v.optional(v.string())
});
const maxInlineDataUrlBytes = 300_000;

function sanitizeProfileForStorage(profile = {}) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return {};
  }

  const nextProfile = { ...profile };
  for (const key of ["logoUrl", "avatarUrl", "imageUrl"]) {
    const value = nextProfile[key];
    if (typeof value === "string" && value.startsWith("data:") && value.length > maxInlineDataUrlBytes) {
      nextProfile[key] = "";
    }
  }
  return nextProfile;
}

function roleRequestProfile(viewer, requestedRole, profile = {}) {
  const role = normalizeRole(requestedRole);
  const grantedRoles = userGrantedRoles(viewer);
  const storageProfile = sanitizeProfileForStorage(profile);
  const nextProfile = {
    ...(viewer.profile || {}),
    ...storageProfile
  };

  if ((role === "broker" || role === "company_admin") && !grantedRoles.includes(role)) {
    nextProfile.requestedRole = role;
    nextProfile.roleRequestStatus = "pending";
    nextProfile.roleRequestedAt = nowIso();
  }

  return nextProfile;
}

function activeRoleAfterRequest(viewer, requestedRole) {
  const role = normalizeRole(requestedRole);
  const roles = userGrantedRoles(viewer);
  const currentRole = normalizeRole(viewer.role);

  if (roles.includes(role)) {
    return role;
  }
  if (roles.includes(currentRole)) {
    return currentRole;
  }
  return "renter";
}

function companyPayloadFromProfile(profile = {}, viewer = null) {
  const legalEntity = String(profile.legalEntity || profile.companyName || "").trim();
  const organizationNumber = String(profile.organizationNumber || profile.companyOrganizationNumber || "").trim();
  const normalizedOrganizationNumber = normalizeOrganizationNumber(organizationNumber);

  if (!legalEntity && !normalizedOrganizationNumber) {
    return null;
  }

  return {
    name: legalEntity || "Nytt bolag",
    organizationNumber,
    normalizedOrganizationNumber,
    ownerUserId: viewer?.id || "",
    companyType: String(profile.companyType || "").trim(),
    phone: String(profile.companyPhone || profile.contactPhone || "").trim(),
    streetAddress: String(profile.streetAddress || "").trim(),
    postalCode: String(profile.postalCode || "").trim(),
    city: String(profile.city || "").trim(),
    parentCompany: String(profile.parentCompany || "").trim(),
    websiteUrl: String(profile.websiteUrl || "").trim(),
    source: String(profile.companyProfileSource || "user_created").trim() || "user_created",
    status: "active"
  };
}

async function upsertAdminCompany(ctx, viewer, profile = {}) {
  const payload = companyPayloadFromProfile(profile, viewer);
  if (!payload) {
    return { companyId: profile.companyId || "", profile };
  }

  const now = nowIso();
  let company = null;

  if (profile.companyId) {
    company = await ctx.db
      .query("companies")
      .withIndex("by_public_id", (query) => query.eq("id", String(profile.companyId)))
      .unique();
  }

  if (!company && payload.normalizedOrganizationNumber) {
    company = await ctx.db
      .query("companies")
      .withIndex("by_normalized_organization_number", (query) =>
        query.eq("normalizedOrganizationNumber", payload.normalizedOrganizationNumber)
      )
      .unique();
  }

  if (company) {
    await ctx.db.patch(company._id, {
      ...payload,
      id: company.id,
      ownerUserId: company.ownerUserId || viewer.id,
      source: company.source === "seed" ? "seed" : payload.source,
      createdAt: company.createdAt,
      updatedAt: now
    });
    company = { ...stripSystemFields(company), ...payload, id: company.id, ownerUserId: company.ownerUserId || viewer.id };
  } else {
    const companyId = slugId("company");
    await ctx.db.insert("companies", {
      id: companyId,
      ...payload,
      ownerUserId: viewer.id,
      createdAt: now,
      updatedAt: now
    });
    company = { id: companyId, ...payload, ownerUserId: viewer.id, createdAt: now, updatedAt: now };
  }

  const existingMembership = await ctx.db
    .query("companyMemberships")
    .withIndex("by_user_company", (query) => query.eq("userId", viewer.id).eq("companyId", company.id))
    .unique();

  if (existingMembership) {
    await ctx.db.patch(existingMembership._id, {
      role: "owner",
      status: "active",
      updatedAt: now
    });
  } else {
    await ctx.db.insert("companyMemberships", {
      id: slugId("membership"),
      companyId: company.id,
      userId: viewer.id,
      role: "owner",
      status: "active",
      createdAt: now,
      updatedAt: now
    });
  }

  return {
    companyId: company.id,
    profile: {
      ...profile,
      companyId: company.id,
      companyName: company.name,
      legalEntity: company.name,
      organizationNumber: company.organizationNumber,
      companyOrganizationNumber: company.organizationNumber,
      companyProfileSource: company.source
    }
  };
}

async function findCompanyForProfile(ctx, profile = {}) {
  if (profile.companyId) {
    const company = await ctx.db
      .query("companies")
      .withIndex("by_public_id", (query) => query.eq("id", String(profile.companyId)))
      .unique();
    if (company) return company;
  }

  const normalizedOrganizationNumber = normalizeOrganizationNumber(
    profile.organizationNumber || profile.companyOrganizationNumber
  );
  if (!normalizedOrganizationNumber) return null;

  return await ctx.db
    .query("companies")
    .withIndex("by_normalized_organization_number", (query) =>
      query.eq("normalizedOrganizationNumber", normalizedOrganizationNumber)
    )
    .unique();
}

async function requireAdminCompany(ctx, viewer) {
  if (!userGrantedRoles(viewer).includes("company_admin")) {
    throw new Error("Du behöver bolagsadminbehörighet.");
  }

  const profileCompany = await findCompanyForProfile(ctx, viewer.profile || {});
  if (profileCompany) return profileCompany;

  const ownedCompany = await ctx.db
    .query("companies")
    .withIndex("by_owner_user_id", (query) => query.eq("ownerUserId", viewer.id))
    .first();
  if (ownedCompany) return ownedCompany;

  throw new Error("Bolaget hittades inte.");
}

async function upsertBrokerMembershipRequest(ctx, user, company, profile = {}) {
  if (!company) return null;

  const now = nowIso();
  const existingMembership = await ctx.db
    .query("companyMemberships")
    .withIndex("by_user_company", (query) => query.eq("userId", user.id).eq("companyId", company.id))
    .unique();

  if (existingMembership) {
    const nextStatus = existingMembership.status === "active" ? "active" : "pending";
    const nextRequestedAt = nextStatus === "active"
      ? existingMembership.requestedAt || profile.roleRequestedAt || now
      : profile.roleRequestedAt || now;
    await ctx.db.patch(existingMembership._id, {
      role: "broker",
      status: nextStatus,
      requestedAt: nextRequestedAt,
      updatedAt: now
    });
    return { ...existingMembership, role: "broker", status: nextStatus, requestedAt: nextRequestedAt };
  }

  const membershipId = slugId("membership");
  await ctx.db.insert("companyMemberships", {
    id: membershipId,
    companyId: company.id,
    userId: user.id,
    role: "broker",
    status: "pending",
    requestedAt: profile.roleRequestedAt || now,
    createdAt: now,
    updatedAt: now
  });

  return {
    id: membershipId,
    companyId: company.id,
    userId: user.id,
    role: "broker",
    status: "pending",
    requestedAt: profile.roleRequestedAt || now,
    createdAt: now,
    updatedAt: now
  };
}

async function insertNotification(ctx, payload) {
  const createdAt = payload.createdAt || nowIso();
  await ctx.db.insert("notifications", {
    id: slugId("notification"),
    userId: payload.userId,
    ...(payload.companyId ? { companyId: payload.companyId } : {}),
    type: payload.type,
    title: payload.title,
    body: payload.body,
    status: "unread",
    createdAt,
    ...(payload.metadata ? { metadata: payload.metadata } : {})
  });
}

async function notifyCompanyAdminsOfBrokerRequest(ctx, company, broker, profile = {}) {
  const notifiedUserIds = new Set();
  const memberships = await ctx.db
    .query("companyMemberships")
    .withIndex("by_company_id", (query) => query.eq("companyId", company.id))
    .take(50);

  for (const membership of memberships) {
    if (membership.status !== "active") continue;
    if (membership.role !== "owner" && membership.role !== "admin") continue;
    notifiedUserIds.add(membership.userId);
  }

  if (company.ownerUserId) {
    notifiedUserIds.add(company.ownerUserId);
  }

  for (const userId of notifiedUserIds) {
    if (userId === broker.id) continue;
    await insertNotification(ctx, {
      userId,
      companyId: company.id,
      type: "broker_verification_requested",
      title: "Ny mäklarförfrågan",
      body: `${broker.name || broker.email} vill bli verifierad som mäklare för ${company.name} (${company.organizationNumber}).`,
      createdAt: profile.roleRequestedAt || nowIso(),
      metadata: {
        brokerUserId: broker.id,
        companyId: company.id
      }
    });
  }
}

async function markBrokerRequestNotificationsHandled(ctx, companyId, brokerUserId) {
  const now = nowIso();
  const notifications = await ctx.db
    .query("notifications")
    .withIndex("by_company_id", (query) => query.eq("companyId", companyId))
    .take(100);

  for (const notification of notifications) {
    if (notification.type !== "broker_verification_requested") continue;
    if (notification.metadata?.brokerUserId !== brokerUserId) continue;
    await ctx.db.patch(notification._id, {
      status: "handled",
      readAt: notification.readAt || now
    });
  }
}

function brokerProfileMatchesCompany(profile = {}, company) {
  if (!company) return false;
  const profileCompanyId = String(profile.companyId || "");
  if (profileCompanyId && profileCompanyId === company.id) return true;
  const profileOrganizationNumber = normalizeOrganizationNumber(
    profile.organizationNumber || profile.companyOrganizationNumber
  );
  return Boolean(profileOrganizationNumber && profileOrganizationNumber === company.normalizedOrganizationNumber);
}

function brokerRequestPayload(user, company, membership = null, source = "membership") {
  const profile = user.profile || {};
  return {
    id: membership?.id || `profile-${user.id}-${company.id}`,
    source,
    userId: user.id,
    name: user.name || profile.contactFirstName || user.email,
    email: user.email,
    phone: user.phone || profile.contactPhone || "",
    fmiNumber: profile.fmiNumber || "",
    companyId: company.id,
    companyName: company.name,
    organizationNumber: company.organizationNumber,
    status: membership?.status || profile.roleRequestStatus || "pending",
    requestedAt: membership?.requestedAt || profile.roleRequestedAt || user.updatedAt || user.createdAt,
    approvedAt: membership?.approvedAt || profile.roleApprovedAt || ""
  };
}

async function upsertAuthenticatedUser(ctx, payload = {}, options = {}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("WorkOS-session saknas.");
  }

  const email = String(payload.email || identity.email || "").trim().toLowerCase();
  const name =
    String(payload.name || identity.name || "").trim() ||
    [payload.firstName, payload.lastName].filter(Boolean).join(" ").trim() ||
    email.split("@")[0] ||
    "Ny användare";

  let user = await findUserByTokenIdentifier(ctx, identity.tokenIdentifier);

  const baseProfile = {
    ...(user?.profile || {}),
    ...(payload.firstName ? { firstName: String(payload.firstName).trim() } : {}),
    ...(payload.lastName ? { lastName: String(payload.lastName).trim() } : {}),
    ...(payload.imageUrl ? { avatarUrl: String(payload.imageUrl).trim() } : {})
  };

  if (!user && !options.createIfMissing) {
    return null;
  }

  if (!user) {
    const createdAt = nowIso();
    const insertedId = await ctx.db.insert("users", {
      id: slugId("u"),
      tokenIdentifier: identity.tokenIdentifier,
      subject: identity.subject || "",
      email,
      name,
      phone: "",
      role: "renter",
      roles: ["renter"],
      publisherPlan: defaultPublisherPlan(),
      onboardingCompleted: false,
      profile: baseProfile,
      authProvider: "workos",
      createdAt,
      updatedAt: createdAt
    });

    return sanitizeUser(await ctx.db.get(insertedId));
  }

  const roles = userGrantedRoles(user);
  const currentRole = normalizeRole(user.role);
  const role = roles.includes(currentRole) ? currentRole : (roles[0] || "renter");
  const updatedAt = nowIso();

  await ctx.db.patch(user._id, {
    tokenIdentifier: identity.tokenIdentifier,
    subject: identity.subject || user.subject || "",
    email: email || user.email,
    name,
    role,
    roles,
    publisherPlan: user.publisherPlan || defaultPublisherPlan(),
    profile: baseProfile,
    authProvider: "workos",
    updatedAt
  });

  return sanitizeUser(await ctx.db.get(user._id));
}

export const me = queryGeneric({
  args: {},
  handler: async (ctx) => {
    return { user: sanitizeUser(await getViewer(ctx)) };
  }
});

export const findCompanyByOrganizationNumber = queryGeneric({
  args: {
    organizationNumber: v.string(),
    excludeUserId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const normalized = normalizeOrganizationNumber(args.organizationNumber);
    if (!normalized) {
      return { exists: false, company: null };
    }

    const company = await ctx.db
      .query("companies")
      .withIndex("by_normalized_organization_number", (query) => query.eq("normalizedOrganizationNumber", normalized))
      .unique();

    if (company) {
      return {
        exists: true,
        company: {
          id: company.id,
          name: company.name,
          organizationNumber: company.organizationNumber,
          normalizedOrganizationNumber: normalized,
          companyType: company.companyType,
          phone: company.phone || "",
          streetAddress: company.streetAddress,
          postalCode: company.postalCode,
          city: company.city,
          parentCompany: company.parentCompany || "",
          websiteUrl: company.websiteUrl || "",
          source: company.source
        }
      };
    }

    const seededCompany = seedCompanies().find((entry) => entry.normalizedOrganizationNumber === normalized);
    if (seededCompany) {
      return {
        exists: true,
        company: {
          id: seededCompany.id,
          name: seededCompany.name,
          organizationNumber: seededCompany.organizationNumber,
          normalizedOrganizationNumber: normalized,
          companyType: seededCompany.companyType,
          phone: seededCompany.phone || "",
          streetAddress: seededCompany.streetAddress,
          postalCode: seededCompany.postalCode,
          city: seededCompany.city,
          parentCompany: seededCompany.parentCompany || "",
          websiteUrl: seededCompany.websiteUrl || "",
          source: seededCompany.source
        }
      };
    }

    const legacyUsers = await ctx.db.query("users").take(200);
    const legacyCompanyAdmin = legacyUsers.find((user) => {
      if (args.excludeUserId && user.id === args.excludeUserId) return false;
      const roles = userGrantedRoles(user);
      if (!roles.includes("company_admin")) return false;
      const profile = user.profile || {};
      const profileOrganizationNumber = normalizeOrganizationNumber(
        profile.organizationNumber || profile.companyOrganizationNumber
      );
      return profileOrganizationNumber === normalized;
    });

    if (legacyCompanyAdmin) {
      const profile = legacyCompanyAdmin.profile || {};
      return {
        exists: true,
        company: {
          id: profile.companyId || `legacy-${legacyCompanyAdmin.id}`,
          name: profile.legalEntity || profile.companyName || "Registrerat bolag",
          organizationNumber: profile.organizationNumber || profile.companyOrganizationNumber || args.organizationNumber,
          normalizedOrganizationNumber: normalized,
          companyType: profile.companyType || "",
          phone: profile.companyPhone || profile.contactPhone || "",
          streetAddress: profile.streetAddress || "",
          postalCode: profile.postalCode || "",
          city: profile.city || "",
          parentCompany: profile.parentCompany || "",
          websiteUrl: profile.websiteUrl || "",
          source: "legacy_user_profile"
        }
      };
    }

    return { exists: false, company: null };
  }
});

export const checkEmailRegistered = queryGeneric({
  args: {
    email: v.string()
  },
  handler: async (ctx, args) => {
    const email = String(args.email || "").trim().toLowerCase();
    if (!email) {
      return { exists: false };
    }

    const user = await findUserByEmail(ctx, email);
    return { exists: Boolean(user) };
  }
});

export const upsertFromAuth = mutationGeneric({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    return { user: await upsertAuthenticatedUser(ctx, args || {}) };
  }
});

export const updateMe = mutationGeneric({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    profile: v.optional(profileValidator)
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);
    const storageProfile = sanitizeProfileForStorage(args?.profile || {});
    const canManageCompany = userGrantedRoles(viewer).includes("company_admin");
    const companyResult = canManageCompany
      ? await upsertAdminCompany(ctx, viewer, { ...(viewer.profile || {}), ...storageProfile })
      : { profile: storageProfile };

    await ctx.db.patch(viewer._id, {
      name: args?.name ?? viewer.name,
      phone: args?.phone ?? viewer.phone,
      publisherPlan: viewer.publisherPlan || defaultPublisherPlan(),
      profile: {
        ...(viewer.profile || {}),
        ...storageProfile,
        ...(canManageCompany ? companyResult.profile : {})
      },
      updatedAt: nowIso()
    });

    return { user: sanitizeUser(await ctx.db.get(viewer._id)) };
  }
});

export const switchActiveRole = mutationGeneric({
  args: {
    role: appRoleValidator
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);
    const role = normalizeRole(args.role);
    const roles = userGrantedRoles(viewer);

    if (!roles.includes(role)) {
      throw new Error("Rollen är inte beviljad för ditt konto.");
    }

    await ctx.db.patch(viewer._id, {
      role,
      roles,
      updatedAt: nowIso()
    });

    return { user: sanitizeUser(await ctx.db.get(viewer._id)) };
  }
});

export const listNotifications = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerOrThrow(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (query) => query.eq("userId", viewer.id))
      .order("desc")
      .take(30);

    const visibleNotifications = [];
    for (const notification of notifications) {
      if (notification.status === "handled") continue;

      if (
        notification.type === "broker_verification_requested" &&
        notification.metadata?.brokerUserId &&
        notification.metadata?.companyId
      ) {
        const membership = await ctx.db
          .query("companyMemberships")
          .withIndex("by_user_company", (query) =>
            query.eq("userId", notification.metadata.brokerUserId).eq("companyId", notification.metadata.companyId)
          )
          .unique();
        if (membership && membership.status !== "pending") {
          continue;
        }
      }

      visibleNotifications.push(stripSystemFields(notification));
    }

    return {
      notifications: visibleNotifications
    };
  }
});

export const listCompanyBrokers = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerOrThrow(ctx);
    const company = await requireAdminCompany(ctx, viewer);
    const memberships = await ctx.db
      .query("companyMemberships")
      .withIndex("by_company_id", (query) => query.eq("companyId", company.id))
      .take(100);

    const requests = [];
    const seenUserIds = new Set();

    for (const membership of memberships) {
      if (membership.role !== "broker") continue;
      const user = await ctx.db
        .query("users")
        .withIndex("by_public_id", (query) => query.eq("id", membership.userId))
        .unique();
      if (!user) continue;
      seenUserIds.add(user.id);
      requests.push(brokerRequestPayload(user, company, stripSystemFields(membership), "membership"));
    }

    const legacyUsers = await ctx.db.query("users").take(200);
    for (const user of legacyUsers) {
      if (seenUserIds.has(user.id)) continue;
      const profile = user.profile || {};
      const isPendingBroker = profile.requestedRole === "broker" && profile.roleRequestStatus === "pending";
      if (!isPendingBroker || !brokerProfileMatchesCompany(profile, company)) continue;
      requests.push(brokerRequestPayload(user, company, null, "profile"));
      seenUserIds.add(user.id);
    }

    const sorted = requests.sort((left, right) => {
      if (left.status === right.status) {
        return String(right.requestedAt || "").localeCompare(String(left.requestedAt || ""));
      }
      if (left.status === "pending") return -1;
      if (right.status === "pending") return 1;
      return String(left.name || "").localeCompare(String(right.name || ""));
    });

    return {
      company: {
        id: company.id,
        name: company.name,
        organizationNumber: company.organizationNumber
      },
      brokers: sorted
    };
  }
});

export const approveBrokerRequest = mutationGeneric({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const admin = await getViewerOrThrow(ctx);
    const company = await requireAdminCompany(ctx, admin);
    const broker = await ctx.db
      .query("users")
      .withIndex("by_public_id", (query) => query.eq("id", args.userId))
      .unique();

    if (!broker) {
      throw new Error("Mäklaren hittades inte.");
    }
    if (!brokerProfileMatchesCompany(broker.profile || {}, company)) {
      const membership = await ctx.db
        .query("companyMemberships")
        .withIndex("by_user_company", (query) => query.eq("userId", broker.id).eq("companyId", company.id))
        .unique();
      if (!membership) {
        throw new Error("Förfrågan hör inte till ert bolag.");
      }
    }

    const now = nowIso();
    const existingMembership = await ctx.db
      .query("companyMemberships")
      .withIndex("by_user_company", (query) => query.eq("userId", broker.id).eq("companyId", company.id))
      .unique();

    if (existingMembership) {
      await ctx.db.patch(existingMembership._id, {
        role: "broker",
        status: "active",
        approvedAt: now,
        approvedByUserId: admin.id,
        updatedAt: now
      });
    } else {
      await ctx.db.insert("companyMemberships", {
        id: slugId("membership"),
        companyId: company.id,
        userId: broker.id,
        role: "broker",
        status: "active",
        requestedAt: broker.profile?.roleRequestedAt || now,
        approvedAt: now,
        approvedByUserId: admin.id,
        createdAt: now,
        updatedAt: now
      });
    }

    const roles = normalizeRoles([...userGrantedRoles(broker), "broker"], broker.role || "renter");
    await ctx.db.patch(broker._id, {
      role: "broker",
      roles,
      onboardingCompleted: true,
      profile: {
        ...(broker.profile || {}),
        companyId: company.id,
        companyName: company.name,
        legalEntity: company.name,
        organizationNumber: company.organizationNumber,
        companyOrganizationNumber: company.organizationNumber,
        requestedRole: "",
        roleRequestStatus: "approved",
        roleApprovedAt: now,
        roleApprovedByUserId: admin.id
      },
      updatedAt: now
    });

    await insertNotification(ctx, {
      userId: broker.id,
      companyId: company.id,
      type: "broker_verification_approved",
      title: "Mäklarverifiering godkänd",
      body: `Du är nu godkänd som mäklare för ${company.name} (${company.organizationNumber}).`,
      metadata: {
        companyId: company.id,
        approvedByUserId: admin.id
      }
    });
    await markBrokerRequestNotificationsHandled(ctx, company.id, broker.id);

    return {
      broker: sanitizeUser(await ctx.db.get(broker._id))
    };
  }
});

export const rejectBrokerRequest = mutationGeneric({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const admin = await getViewerOrThrow(ctx);
    const company = await requireAdminCompany(ctx, admin);
    const broker = await ctx.db
      .query("users")
      .withIndex("by_public_id", (query) => query.eq("id", args.userId))
      .unique();

    if (!broker) {
      throw new Error("Mäklaren hittades inte.");
    }

    const now = nowIso();
    const membership = await ctx.db
      .query("companyMemberships")
      .withIndex("by_user_company", (query) => query.eq("userId", broker.id).eq("companyId", company.id))
      .unique();
    if (membership) {
      await ctx.db.patch(membership._id, {
        status: "rejected",
        updatedAt: now
      });
    }

    await ctx.db.patch(broker._id, {
      profile: {
        ...(broker.profile || {}),
        companyId: company.id,
        companyName: company.name,
        legalEntity: company.name,
        organizationNumber: company.organizationNumber,
        companyOrganizationNumber: company.organizationNumber,
        requestedRole: "",
        roleRequestStatus: "rejected",
        roleRejectedAt: now,
        roleRejectedByUserId: admin.id
      },
      updatedAt: now
    });

    await insertNotification(ctx, {
      userId: broker.id,
      companyId: company.id,
      type: "broker_verification_rejected",
      title: "Mäklarverifiering avslogs",
      body: `Din förfrågan om att bli mäklare för ${company.name} (${company.organizationNumber}) avslogs.`,
      metadata: {
        companyId: company.id,
        rejectedByUserId: admin.id
      }
    });
    await markBrokerRequestNotificationsHandled(ctx, company.id, broker.id);

    return { ok: true };
  }
});

export const resendBrokerVerificationRequest = mutationGeneric({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerOrThrow(ctx);
    const profile = viewer.profile || {};
    const company = await findCompanyForProfile(ctx, profile);

    if (!company) {
      throw new Error("Bolaget hittades inte. Kontrollera organisationsnumret.");
    }

    const now = nowIso();
    const nextProfile = {
      ...profile,
      companyId: company.id,
      companyName: company.name,
      legalEntity: company.name,
      organizationNumber: company.organizationNumber,
      companyOrganizationNumber: company.organizationNumber,
      requestedRole: "broker",
      roleRequestStatus: "pending",
      roleRequestedAt: now,
      roleRejectedAt: "",
      roleRejectedByUserId: ""
    };

    await upsertBrokerMembershipRequest(ctx, viewer, company, nextProfile);
    await notifyCompanyAdminsOfBrokerRequest(ctx, company, viewer, nextProfile);

    await ctx.db.patch(viewer._id, {
      onboardingCompleted: true,
      profile: nextProfile,
      updatedAt: now
    });

    return {
      user: sanitizeUser(await ctx.db.get(viewer._id))
    };
  }
});

export const updateCompanyBroker = mutationGeneric({
  args: {
    userId: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    fmiNumber: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const admin = await getViewerOrThrow(ctx);
    const company = await requireAdminCompany(ctx, admin);
    const broker = await ctx.db
      .query("users")
      .withIndex("by_public_id", (query) => query.eq("id", args.userId))
      .unique();
    if (!broker) {
      throw new Error("Mäklaren hittades inte.");
    }

    const membership = await ctx.db
      .query("companyMemberships")
      .withIndex("by_user_company", (query) => query.eq("userId", broker.id).eq("companyId", company.id))
      .unique();
    if (!membership || membership.role !== "broker" || membership.status !== "active") {
      throw new Error("Mäklaren är inte aktiv i ert bolag.");
    }

    const name = String(args.name || "").trim();
    if (!name) {
      throw new Error("Namn krävs.");
    }

    const phone = String(args.phone || "").trim();
    const fmiNumber = String(args.fmiNumber || "").trim();
    await ctx.db.patch(broker._id, {
      name,
      phone,
      profile: {
        ...(broker.profile || {}),
        fmiNumber,
        brokerAdminEditedAt: nowIso()
      },
      updatedAt: nowIso()
    });

    return { broker: sanitizeUser(await ctx.db.get(broker._id)) };
  }
});

export const removeCompanyBroker = mutationGeneric({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const admin = await getViewerOrThrow(ctx);
    const company = await requireAdminCompany(ctx, admin);
    const broker = await ctx.db
      .query("users")
      .withIndex("by_public_id", (query) => query.eq("id", args.userId))
      .unique();
    if (!broker) {
      throw new Error("Mäklaren hittades inte.");
    }

    const membership = await ctx.db
      .query("companyMemberships")
      .withIndex("by_user_company", (query) => query.eq("userId", broker.id).eq("companyId", company.id))
      .unique();
    if (!membership || membership.role !== "broker") {
      throw new Error("Mäklaren finns inte i ert bolag.");
    }

    const now = nowIso();
    await ctx.db.patch(membership._id, {
      status: "removed",
      updatedAt: now
    });

    const allBrokerMemberships = await ctx.db
      .query("companyMemberships")
      .withIndex("by_user_id", (query) => query.eq("userId", broker.id))
      .take(50);
    const hasOtherActiveBrokerMembership = allBrokerMemberships.some((entry) => (
      entry._id !== membership._id && entry.role === "broker" && entry.status === "active"
    ));
    const existingRoles = userGrantedRoles(broker);
    const nextRoles = hasOtherActiveBrokerMembership || existingRoles.includes("company_admin")
      ? existingRoles
      : normalizeRoles(existingRoles.filter((role) => role !== "broker"), "renter");
    const currentRole = normalizeRole(broker.role);
    const nextRole = nextRoles.includes(currentRole) ? currentRole : (nextRoles[0] || "renter");

    await ctx.db.patch(broker._id, {
      role: nextRole,
      roles: nextRoles,
      profile: {
        ...(broker.profile || {}),
        ...(hasOtherActiveBrokerMembership
          ? {}
          : {
              roleRequestStatus: "",
              roleApprovedAt: "",
              companyId: "",
              companyName: "",
              legalEntity: "",
              organizationNumber: "",
              companyOrganizationNumber: ""
            })
      },
      updatedAt: now
    });

    await insertNotification(ctx, {
      userId: broker.id,
      companyId: company.id,
      type: "broker_removed_from_company",
      title: "Mäklarbehörighet borttagen",
      body: `Din mäklarbehörighet för ${company.name} (${company.organizationNumber}) har tagits bort.`,
      metadata: {
        companyId: company.id,
        removedByUserId: admin.id
      }
    });

    return { ok: true };
  }
});

export const completeSignup = mutationGeneric({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(appRoleValidator),
    roles: v.optional(v.array(appRoleValidator)),
    profile: v.optional(profileValidator)
  },
  handler: async (ctx, args) => {
    const ensuredUser = await upsertAuthenticatedUser(ctx, args || {}, { createIfMissing: true });
    if (!ensuredUser) {
      throw new Error("WorkOS-session saknas.");
    }
    const viewer = await getViewerOrThrow(ctx);
    const requestedRole = normalizeRole(args?.role);
    const grantedRoles = userGrantedRoles(viewer);
    const storageProfile = sanitizeProfileForStorage(args?.profile || {});
    const nextRoles = requestedRole === "company_admin"
      ? normalizeRoles([...grantedRoles, "company_admin"], viewer.role || "renter")
      : grantedRoles;
    const nextRole = requestedRole === "company_admin" ? "company_admin" : activeRoleAfterRequest(viewer, requestedRole);
    const onboardingCompleted = requestedRole === "company_admin" || requestedRole === "renter";
    const companyResult = requestedRole === "company_admin"
      ? await upsertAdminCompany(ctx, viewer, { ...(viewer.profile || {}), ...storageProfile })
      : { profile: storageProfile };

    await ctx.db.patch(viewer._id, {
      name: args?.name ?? viewer.name,
      phone: args?.phone ?? viewer.phone,
      role: nextRole,
      roles: nextRoles,
      publisherPlan: viewer.publisherPlan || defaultPublisherPlan(),
      onboardingCompleted,
      profile: {
        ...(viewer.profile || {}),
        ...storageProfile,
        ...(requestedRole === "company_admin" ? companyResult.profile : {}),
        ...(requestedRole === "company_admin"
          ? { requestedRole: "", roleRequestStatus: "", roleRequestedAt: "" }
          : {})
      },
      updatedAt: nowIso()
    });

    return { user: sanitizeUser(await ctx.db.get(viewer._id)) };
  }
});

export const grantRole = internalMutationGeneric({
  args: {
    userId: v.string(),
    role: appRoleValidator
  },
  handler: async (ctx, args) => {
    const viewer = await ctx.db
      .query("users")
      .withIndex("by_public_id", (query) => query.eq("id", args.userId))
      .unique();
    if (!viewer) {
      throw new Error("Användaren hittades inte.");
    }

    const role = normalizeRole(args.role);
    const roles = normalizeRoles([...userGrantedRoles(viewer), role], viewer.role || "renter");
    await ctx.db.patch(viewer._id, {
      role,
      roles,
      updatedAt: nowIso()
    });

    return { user: sanitizeUser(await ctx.db.get(viewer._id)) };
  }
});

export const backfillCompaniesFromAdminProfiles = mutationGeneric({
  args: {
    dryRun: v.optional(v.boolean()),
    organizationNumber: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const targetOrganizationNumber = normalizeOrganizationNumber(args.organizationNumber || "");
    const users = await ctx.db.query("users").take(200);
    const companyAdmins = users.filter((user) => {
      if (!userGrantedRoles(user).includes("company_admin")) return false;
      const profile = user.profile || {};
      const profileOrganizationNumber = normalizeOrganizationNumber(profile.organizationNumber || profile.companyOrganizationNumber);
      if (targetOrganizationNumber && profileOrganizationNumber !== targetOrganizationNumber) return false;
      return Boolean(
        profileOrganizationNumber
        && String(profile.legalEntity || profile.companyName || "").trim()
      );
    });

    if (args.dryRun) {
      return {
        dryRun: true,
        candidates: companyAdmins.map((user) => {
          const profile = user.profile || {};
          return {
            userId: user.id,
            email: user.email,
            companyName: profile.legalEntity || profile.companyName || "",
            organizationNumber: profile.organizationNumber || profile.companyOrganizationNumber || ""
          };
        })
      };
    }

    const migrated = [];
    for (const user of companyAdmins) {
      const result = await upsertAdminCompany(ctx, user, user.profile || {});
      await ctx.db.patch(user._id, {
        profile: {
          ...(user.profile || {}),
          ...(result.profile || {})
        },
        updatedAt: nowIso()
      });
      migrated.push({
        userId: user.id,
        companyId: result.companyId,
        companyName: result.profile?.legalEntity || result.profile?.companyName || ""
      });
    }

    return {
      dryRun: false,
      migrated
    };
  }
});

export const completeOnboarding = mutationGeneric({
  args: {
    primaryRole: v.optional(appRoleValidator),
    account: v.optional(onboardingAccountValidator),
    profile: v.optional(profileValidator)
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);
    const requestedRole = normalizeRole(args?.primaryRole);
    const roles = userGrantedRoles(viewer);
    const account = args?.account || {};
    const storageProfile = sanitizeProfileForStorage(args?.profile || {});
    const nextRoles = requestedRole === "company_admin"
      ? normalizeRoles([...roles, "company_admin"], viewer.role || "renter")
      : roles;
    const nextRole = requestedRole === "company_admin"
      ? "company_admin"
      : activeRoleAfterRequest(viewer, requestedRole);
    const companyResult = requestedRole === "company_admin"
      ? await upsertAdminCompany(ctx, viewer, { ...(viewer.profile || {}), ...storageProfile })
      : null;
    const requestedBrokerCompany = requestedRole === "broker"
      ? await findCompanyForProfile(ctx, { ...(viewer.profile || {}), ...storageProfile })
      : null;
    const nextProfile = requestedRole === "company_admin"
      ? {
          ...(viewer.profile || {}),
          ...storageProfile,
          ...(companyResult?.profile || {}),
          requestedRole: "",
          roleRequestStatus: "",
          roleRequestedAt: ""
        }
      : {
          ...roleRequestProfile(viewer, requestedRole, storageProfile),
          ...(requestedBrokerCompany
            ? {
                companyId: requestedBrokerCompany.id,
                companyName: requestedBrokerCompany.name,
                legalEntity: requestedBrokerCompany.name,
                organizationNumber: requestedBrokerCompany.organizationNumber,
                companyOrganizationNumber: requestedBrokerCompany.organizationNumber
              }
            : {})
        };

    if (requestedRole === "broker" && requestedBrokerCompany) {
      await upsertBrokerMembershipRequest(ctx, viewer, requestedBrokerCompany, nextProfile);
      await notifyCompanyAdminsOfBrokerRequest(ctx, requestedBrokerCompany, viewer, nextProfile);
    }

    await ctx.db.patch(viewer._id, {
      name: account.name || viewer.name,
      phone: account.phone || viewer.phone,
      role: nextRole,
      roles: nextRoles,
      onboardingCompleted: true,
      profile: nextProfile,
      updatedAt: nowIso()
    });

    return { user: sanitizeUser(await ctx.db.get(viewer._id)) };
  }
});
