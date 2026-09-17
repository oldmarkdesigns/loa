import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import {
  findOwnedProspectOrThrow,
  findProspectByGuestTokenOrThrow,
  findProspectCollaboration,
  hydrateProspectComment,
  nowIso,
  resolveProspectSectionsForDisplay,
  slugId,
  stripSystemFields
} from "./lib.js";

function generateGuestToken() {
  // Cryptographically strong, unlike slugId's Math.random ids — this token grants
  // read+comment access with no login, so it must not be practically guessable.
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const addCollaborator = mutationGeneric({
  args: {
    prospectId: v.string(),
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const { viewer, prospect } = await findOwnedProspectOrThrow(ctx, args?.prospectId || "");
    const existing = await findProspectCollaboration(ctx, prospect.id, args?.userId || "");
    if (!existing) {
      await ctx.db.insert("prospectCollaborators", {
        id: slugId("pcol"),
        prospectId: prospect.id,
        userId: args?.userId || "",
        addedByUserId: viewer.id,
        createdAt: nowIso()
      });
    }

    return { ok: true };
  }
});

export const removeCollaborator = mutationGeneric({
  args: {
    prospectId: v.string(),
    userId: v.string()
  },
  handler: async (ctx, args) => {
    await findOwnedProspectOrThrow(ctx, args?.prospectId || "");
    const collaboration = await findProspectCollaboration(ctx, args?.prospectId || "", args?.userId || "");
    if (collaboration) {
      await ctx.db.delete(collaboration._id);
    }

    return { ok: true };
  }
});

export const listCollaborators = queryGeneric({
  args: { prospectId: v.string() },
  handler: async (ctx, args) => {
    await findOwnedProspectOrThrow(ctx, args?.prospectId || "");
    const collaborators = await ctx.db
      .query("prospectCollaborators")
      .withIndex("by_prospect_id", (query) => query.eq("prospectId", args?.prospectId || ""))
      .collect();

    return { collaborators: collaborators.map(stripSystemFields) };
  }
});

export const createGuestLink = mutationGeneric({
  args: {
    prospectId: v.string(),
    label: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { viewer, prospect } = await findOwnedProspectOrThrow(ctx, args?.prospectId || "");
    if (!prospect.currentVersion) {
      throw new Error("Publicera en version innan du kan dela prospektet.");
    }

    const createdAt = nowIso();
    const guestLink = {
      id: slugId("pgl"),
      token: generateGuestToken(),
      prospectId: prospect.id,
      ...(args?.label?.trim() ? { label: args.label.trim() } : {}),
      createdByUserId: viewer.id,
      createdAt
    };

    await ctx.db.insert("prospectGuestLinks", guestLink);
    return { guestLink };
  }
});

export const revokeGuestLink = mutationGeneric({
  args: {
    prospectId: v.string(),
    guestLinkId: v.string()
  },
  handler: async (ctx, args) => {
    await findOwnedProspectOrThrow(ctx, args?.prospectId || "");
    const guestLink = await ctx.db
      .query("prospectGuestLinks")
      .withIndex("by_public_id", (query) => query.eq("id", args?.guestLinkId || ""))
      .unique();

    if (guestLink && guestLink.prospectId === args?.prospectId) {
      await ctx.db.patch(guestLink._id, { revokedAt: nowIso() });
    }

    return { ok: true };
  }
});

export const listGuestLinks = queryGeneric({
  args: { prospectId: v.string() },
  handler: async (ctx, args) => {
    await findOwnedProspectOrThrow(ctx, args?.prospectId || "");
    const guestLinks = await ctx.db
      .query("prospectGuestLinks")
      .withIndex("by_prospect_id", (query) => query.eq("prospectId", args?.prospectId || ""))
      .collect();

    return { guestLinks: guestLinks.map(stripSystemFields) };
  }
});

// Mutation, not query — it also stamps lastAccessedAt, same pattern as
// listings.recordView (a read-shaped action with a write side effect).
export const getByGuestToken = mutationGeneric({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { prospect, guestLink } = await findProspectByGuestTokenOrThrow(ctx, args?.token || "");
    await ctx.db.patch(guestLink._id, { lastAccessedAt: nowIso() });

    const comments = await ctx.db
      .query("prospectComments")
      .withIndex("by_prospect_id", (query) => query.eq("prospectId", prospect.id))
      .order("asc")
      .take(500);

    return {
      prospect: {
        id: prospect.id,
        title: prospect.title,
        status: prospect.status,
        currentVersion: prospect.currentVersion,
        publishedSections: await resolveProspectSectionsForDisplay(ctx, prospect.publishedSections)
      },
      comments: await Promise.all(comments.map((comment) => hydrateProspectComment(ctx, comment)))
    };
  }
});
