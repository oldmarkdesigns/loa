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
  sanitizeUser,
  slugId,
  userGrantedRoles
} from "./lib.js";

const appRoleValidator = v.union(v.literal("renter"), v.literal("broker"), v.literal("company_admin"), v.literal("publisher"));
const profileValidator = v.record(v.string(), v.any());
const onboardingAccountValidator = v.object({
  name: v.optional(v.string()),
  phone: v.optional(v.string())
});

function assertTestAuthEnabled() {
  if (process.env.ENABLE_TEST_AUTH !== "true") {
    throw new Error("Testauth är inte aktiverat.");
  }
}

async function findTestUserByToken(ctx, token) {
  assertTestAuthEnabled();
  return await ctx.db
    .query("users")
    .withIndex("by_test_session_token", (query) => query.eq("testSessionToken", token))
    .unique();
}

function roleRequestProfile(viewer, requestedRole, profile = {}) {
  const role = normalizeRole(requestedRole);
  const grantedRoles = userGrantedRoles(viewer);
  const nextProfile = {
    ...(viewer.profile || {}),
    ...profile
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

async function upsertAuthenticatedUser(ctx, payload = {}) {
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
  if (!user && email) {
    user = await findUserByEmail(ctx, email);
  }

  const baseProfile = {
    ...(user?.profile || {}),
    ...(payload.firstName ? { firstName: String(payload.firstName).trim() } : {}),
    ...(payload.lastName ? { lastName: String(payload.lastName).trim() } : {}),
    ...(payload.imageUrl ? { avatarUrl: String(payload.imageUrl).trim() } : {})
  };

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

export const getTestSession = queryGeneric({
  args: {
    token: v.string()
  },
  handler: async (ctx, args) => {
    const user = await findTestUserByToken(ctx, args.token);
    return { user: sanitizeUser(user) };
  }
});

export const createTestUser = mutationGeneric({
  args: {
    role: v.optional(appRoleValidator)
  },
  handler: async (ctx, args) => {
    assertTestAuthEnabled();
    const role = args.role === "company_admin" || args.role === "broker" ? args.role : "renter";
    const roles = normalizeRoles([role], role);
    const createdAt = nowIso();
    const token = `test-session-${crypto.randomUUID()}`;
    const insertedId = await ctx.db.insert("users", {
      id: slugId("u"),
      tokenIdentifier: `test|${token}`,
      testSessionToken: token,
      subject: `test-${token}`,
      email: `test+${role}-${Date.now()}@lokalflode.demo`,
      name: "Test Användare",
      phone: "",
      role,
      roles,
      publisherPlan: defaultPublisherPlan(),
      onboardingCompleted: false,
      profile: {},
      authProvider: "test",
      createdAt,
      updatedAt: createdAt
    });

    return { user: sanitizeUser(await ctx.db.get(insertedId)), token };
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

    await ctx.db.patch(viewer._id, {
      name: args?.name ?? viewer.name,
      phone: args?.phone ?? viewer.phone,
      publisherPlan: viewer.publisherPlan || defaultPublisherPlan(),
      profile: {
        ...(viewer.profile || {}),
        ...(args?.profile || {})
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

export const updateTestUser = mutationGeneric({
  args: {
    token: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    profile: v.optional(profileValidator)
  },
  handler: async (ctx, args) => {
    const viewer = await findTestUserByToken(ctx, args.token);
    if (!viewer) {
      throw new Error("Testsessionen hittades inte.");
    }

    await ctx.db.patch(viewer._id, {
      name: args?.name ?? viewer.name,
      phone: args?.phone ?? viewer.phone,
      profile: {
        ...(viewer.profile || {}),
        ...(args?.profile || {})
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

export const addRoleToTestUser = mutationGeneric({
  args: {
    token: v.string(),
    role: appRoleValidator
  },
  handler: async (ctx, args) => {
    const viewer = await findTestUserByToken(ctx, args.token);
    if (!viewer) {
      throw new Error("Testsessionen hittades inte.");
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

    await ctx.db.patch(viewer._id, {
      name: account.name || viewer.name,
      phone: account.phone || viewer.phone,
      role: activeRoleAfterRequest(viewer, requestedRole),
      roles,
      onboardingCompleted: true,
      profile: roleRequestProfile(viewer, requestedRole, args?.profile || {}),
      updatedAt: nowIso()
    });

    return { user: sanitizeUser(await ctx.db.get(viewer._id)) };
  }
});

export const completeTestOnboarding = mutationGeneric({
  args: {
    token: v.string(),
    primaryRole: v.optional(appRoleValidator),
    account: v.optional(onboardingAccountValidator),
    profile: v.optional(profileValidator)
  },
  handler: async (ctx, args) => {
    const viewer = await findTestUserByToken(ctx, args.token);
    if (!viewer) {
      throw new Error("Testsessionen hittades inte.");
    }

    const requestedRole = normalizeRole(args?.primaryRole);
    const roles = userGrantedRoles(viewer);
    const account = args?.account || {};

    await ctx.db.patch(viewer._id, {
      name: account.name || viewer.name,
      phone: account.phone || viewer.phone,
      role: activeRoleAfterRequest(viewer, requestedRole),
      roles,
      onboardingCompleted: true,
      profile: roleRequestProfile(viewer, requestedRole, args?.profile || {}),
      updatedAt: nowIso()
    });

    return { user: sanitizeUser(await ctx.db.get(viewer._id)) };
  }
});
