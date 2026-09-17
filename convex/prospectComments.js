import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import {
  findProspectByGuestTokenOrThrow,
  findViewableProspectOrThrow,
  hydrateProspectComment,
  nowIso,
  slugId
} from "./lib.js";

export const listComments = queryGeneric({
  args: { prospectId: v.string() },
  handler: async (ctx, args) => {
    await findViewableProspectOrThrow(ctx, args?.prospectId || "");
    const comments = await ctx.db
      .query("prospectComments")
      .withIndex("by_prospect_id", (query) => query.eq("prospectId", args?.prospectId || ""))
      .order("asc")
      .take(500);

    return { comments: await Promise.all(comments.map((comment) => hydrateProspectComment(ctx, comment))) };
  }
});

export const addComment = mutationGeneric({
  args: {
    prospectId: v.string(),
    sectionId: v.string(),
    body: v.string()
  },
  handler: async (ctx, args) => {
    const { viewer } = await findViewableProspectOrThrow(ctx, args?.prospectId || "");
    const body = String(args?.body || "").trim();
    if (!body) {
      throw new Error("Kommentaren behöver en text.");
    }

    const comment = {
      id: slugId("pc"),
      prospectId: args.prospectId,
      sectionId: args?.sectionId || "general",
      authorType: "user",
      authorId: viewer.id,
      body,
      createdAt: nowIso()
    };

    await ctx.db.insert("prospectComments", comment);
    return { comment };
  }
});

export const addGuestComment = mutationGeneric({
  args: {
    token: v.string(),
    sectionId: v.string(),
    guestName: v.string(),
    body: v.string()
  },
  handler: async (ctx, args) => {
    const { prospect, guestLink } = await findProspectByGuestTokenOrThrow(ctx, args?.token || "");
    const body = String(args?.body || "").trim();
    const guestName = String(args?.guestName || "").trim();

    if (!guestName) {
      throw new Error("Ange ditt namn innan du kommenterar.");
    }
    if (!body) {
      throw new Error("Kommentaren behöver en text.");
    }

    const comment = {
      id: slugId("pc"),
      prospectId: prospect.id,
      sectionId: args?.sectionId || "general",
      authorType: "guest",
      guestName,
      guestLinkId: guestLink.id,
      body,
      createdAt: nowIso()
    };

    await ctx.db.insert("prospectComments", comment);
    return { comment };
  }
});
