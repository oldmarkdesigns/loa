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
  const requestedRoles = Array.isArray(roles)
    ? roles.filter((role) => role === "renter" || role === "publisher")
    : [];

  return requestedRoles.length > 0 ? Array.from(new Set(requestedRoles)) : [fallbackRole];
}

async function upsertAuthenticatedUser(ctx, payload = {}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("WorkOS-session saknas.");
  }

  const email = String(payload.email || identity.email || "").trim().toLowerCase();
  const fallbackRole = payload.role === "publisher" ? "publisher" : "renter";
  const roles = normalizeRoles(payload.roles, fallbackRole);
  const role = roles.includes(payload.role) ? payload.role : roles[0];
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
  const nextRoles = currentRoles.length > 0 ? Array.from(new Set([...currentRoles, ...roles])) : roles;
  const nextRole = nextRoles.includes(user.role) ? user.role : nextRoles[0];
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
    const role = args?.role === "publisher" || args?.role === "renter" ? args.role : viewer.role;
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

export const completeOnboarding = mutationGeneric({
  args: {
    primaryRole: v.optional(v.string()),
    account: v.optional(v.any()),
    profile: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);
    const primaryRole = args?.primaryRole === "publisher" ? "publisher" : "renter";
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
