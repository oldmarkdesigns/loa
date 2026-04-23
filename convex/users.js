import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import {
  defaultPublisherPlan,
  findUserByEmail,
  findUserByTokenIdentifier,
  getViewer,
  getViewerOrThrow,
  nowIso,
  sanitizeUser,
  slugId
} from "./lib.js";

function normalizeRoles(roles, fallbackRole = "renter") {
  const normalizeRole = (role) => {
    if (role === "publisher") return "broker";
    return role;
  };
  const requestedRoles = Array.isArray(roles)
    ? roles.map(normalizeRole).filter((role) => role === "renter" || role === "broker" || role === "company_admin")
    : [];

  return requestedRoles.length > 0 ? Array.from(new Set(requestedRoles)) : [normalizeRole(fallbackRole)];
}

async function upsertAuthenticatedUser(ctx, payload = {}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("WorkOS-session saknas.");
  }

  const email = String(payload.email || identity.email || "").trim().toLowerCase();
  const requestedRole = payload.role === "publisher" ? "broker" : payload.role;
  const fallbackRole = requestedRole === "broker" || requestedRole === "company_admin" ? requestedRole : "renter";
  const roles = normalizeRoles(payload.roles, fallbackRole);
  const role = roles.includes(requestedRole) ? requestedRole : roles[0];
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
      role,
      roles,
      publisherPlan: defaultPublisherPlan(),
      onboardingCompleted: false,
      profile: baseProfile,
      authProvider: "workos",
      createdAt,
      updatedAt: createdAt
    });

    return sanitizeUser(await ctx.db.get(insertedId));
  }

  const currentRoles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role || "renter"];
  // Never demote a user's active role due to a stale/incomplete roles array.
  const normalizedCurrentRoles = normalizeRoles(
    Array.from(new Set([...(Array.isArray(user.roles) ? user.roles : []), user.role].filter(Boolean))),
    user.role || "renter"
  );
  const nextRoles = Array.from(new Set([...normalizedCurrentRoles, ...roles]));
  const nextRole = nextRoles.includes(user.role) ? user.role : (nextRoles[0] || "renter");
  const updatedAt = nowIso();

  await ctx.db.patch(user._id, {
    tokenIdentifier: identity.tokenIdentifier,
    subject: identity.subject || user.subject || "",
    email: email || user.email,
    name,
    role: nextRole,
    roles: nextRoles,
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
    const users = await ctx.db.query("users").collect();
    const user = users.find((entry) => entry.testSessionToken === args.token) || null;
    return { user: sanitizeUser(user) };
  }
});

export const createTestUser = mutationGeneric({
  args: {
    role: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const role = args.role === "company_admin" || args.role === "broker" ? args.role : "renter";
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
      roles: [role],
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
    imageUrl: v.optional(v.string()),
    role: v.optional(v.string()),
    roles: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    return { user: await upsertAuthenticatedUser(ctx, args || {}) };
  }
});

export const updateMe = mutationGeneric({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    roles: v.optional(v.array(v.string())),
    profile: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);
    const roles = normalizeRoles(args?.roles, viewer.role || "renter");
    const requestedRole = args?.role === "publisher" ? "broker" : args?.role;
    const role = requestedRole === "broker" || requestedRole === "company_admin" || requestedRole === "renter" ? requestedRole : viewer.role;
    const mergedRoles = roles.includes(role) ? roles : Array.from(new Set([...roles, role]));

    await ctx.db.patch(viewer._id, {
      name: args?.name ?? viewer.name,
      phone: args?.phone ?? viewer.phone,
      role,
      roles: mergedRoles.length > 0 ? mergedRoles : viewer.roles,
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

export const updateTestUser = mutationGeneric({
  args: {
    token: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    roles: v.optional(v.array(v.string())),
    profile: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const viewer = users.find((entry) => entry.testSessionToken === args.token);
    if (!viewer) {
      throw new Error("Testsessionen hittades inte.");
    }

    const roles = normalizeRoles(args?.roles, args?.role || viewer.role || "renter");
    const requestedRole = args?.role === "publisher" ? "broker" : args?.role;
    const role = requestedRole === "broker" || requestedRole === "company_admin" || requestedRole === "renter" ? requestedRole : viewer.role;
    const mergedRoles = roles.includes(role) ? roles : Array.from(new Set([...roles, role]));

    await ctx.db.patch(viewer._id, {
      name: args?.name ?? viewer.name,
      phone: args?.phone ?? viewer.phone,
      role,
      roles: mergedRoles,
      profile: {
        ...(viewer.profile || {}),
        ...(args?.profile || {})
      },
      updatedAt: nowIso()
    });

    return { user: sanitizeUser(await ctx.db.get(viewer._id)) };
  }
});

export const addRoleToMe = mutationGeneric({
  args: {
    role: v.string()
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);
    const requestedRole = args.role === "publisher" ? "broker" : args.role;
    const normalizedRole = requestedRole === "broker" || requestedRole === "company_admin" || requestedRole === "renter"
      ? requestedRole
      : viewer.role || "renter";
    const currentRoles = Array.isArray(viewer.roles) && viewer.roles.length > 0 ? viewer.roles : [viewer.role || "renter"];
    const roles = Array.from(new Set([...currentRoles, normalizedRole].map((role) => role === "publisher" ? "broker" : role)));

    await ctx.db.patch(viewer._id, {
      role: normalizedRole,
      roles,
      updatedAt: nowIso()
    });

    return { user: sanitizeUser(await ctx.db.get(viewer._id)) };
  }
});

export const addRoleToTestUser = mutationGeneric({
  args: {
    token: v.string(),
    role: v.string()
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const viewer = users.find((entry) => entry.testSessionToken === args.token);
    if (!viewer) {
      throw new Error("Testsessionen hittades inte.");
    }

    const requestedRole = args.role === "publisher" ? "broker" : args.role;
    const normalizedRole = requestedRole === "broker" || requestedRole === "company_admin" || requestedRole === "renter"
      ? requestedRole
      : viewer.role || "renter";
    const currentRoles = Array.isArray(viewer.roles) && viewer.roles.length > 0 ? viewer.roles : [viewer.role || "renter"];
    const roles = Array.from(new Set([...currentRoles, normalizedRole].map((role) => role === "publisher" ? "broker" : role)));

    await ctx.db.patch(viewer._id, {
      role: normalizedRole,
      roles,
      updatedAt: nowIso()
    });

    return { user: sanitizeUser(await ctx.db.get(viewer._id)) };
  }
});

export const completeOnboarding = mutationGeneric({
  args: {
    primaryRole: v.optional(v.string()),
    account: v.optional(v.any()),
    profile: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);
    const requestedRole = args?.primaryRole === "publisher" ? "broker" : args?.primaryRole;
    const primaryRole = requestedRole === "broker" || requestedRole === "company_admin" ? requestedRole : "renter";
    const roles = Array.from(new Set([...(Array.isArray(viewer.roles) ? viewer.roles : [viewer.role || "renter"]), primaryRole]));
    const account = args?.account || {};

    await ctx.db.patch(viewer._id, {
      name: account.name || viewer.name,
      phone: account.phone || viewer.phone,
      role: primaryRole,
      roles,
      onboardingCompleted: true,
      profile: {
        ...(viewer.profile || {}),
        ...(args?.profile || {})
      },
      updatedAt: nowIso()
    });

    return { user: sanitizeUser(await ctx.db.get(viewer._id)) };
  }
});

export const completeTestOnboarding = mutationGeneric({
  args: {
    token: v.string(),
    primaryRole: v.optional(v.string()),
    account: v.optional(v.any()),
    profile: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const viewer = users.find((entry) => entry.testSessionToken === args.token);
    if (!viewer) {
      throw new Error("Testsessionen hittades inte.");
    }

    const requestedRole = args?.primaryRole === "publisher" ? "broker" : args?.primaryRole;
    const primaryRole = requestedRole === "broker" || requestedRole === "company_admin" ? requestedRole : "renter";
    const roles = Array.from(new Set([...(Array.isArray(viewer.roles) ? viewer.roles : [viewer.role || "renter"]), primaryRole]));
    const account = args?.account || {};

    await ctx.db.patch(viewer._id, {
      name: account.name || viewer.name,
      phone: account.phone || viewer.phone,
      role: primaryRole,
      roles,
      onboardingCompleted: true,
      profile: {
        ...(viewer.profile || {}),
        ...(args?.profile || {})
      },
      updatedAt: nowIso()
    });

    return { user: sanitizeUser(await ctx.db.get(viewer._id)) };
  }
});
