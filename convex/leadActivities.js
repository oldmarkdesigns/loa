import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import {
  getViewerOrThrow,
  nowIso,
  slugId,
  stripSystemFields
} from "./lib.js";

async function findOwnedLeadOrThrow(ctx, leadId) {
  const viewer = await getViewerOrThrow(ctx);
  const lead = await ctx.db
    .query("leads")
    .withIndex("by_public_id", (query) => query.eq("id", leadId))
    .unique();

  if (!lead) {
    throw new Error("Intresseanmälan hittades inte.");
  }
  if (lead.publisherId !== viewer.id) {
    throw new Error("Du kan bara se aktivitet på dina egna intresseanmälningar.");
  }

  return { viewer, lead };
}

export const list = queryGeneric({
  args: {
    leadId: v.string()
  },
  handler: async (ctx, args) => {
    await findOwnedLeadOrThrow(ctx, args.leadId);
    const activities = await ctx.db
      .query("leadActivities")
      .withIndex("by_lead_id", (query) => query.eq("leadId", args.leadId))
      .order("desc")
      .take(200);

    return { activities: activities.map(stripSystemFields) };
  }
});

export const create = mutationGeneric({
  args: {
    leadId: v.string(),
    type: v.union(v.literal("note"), v.literal("call"), v.literal("email"), v.literal("viewing")),
    body: v.string()
  },
  handler: async (ctx, args) => {
    const { viewer } = await findOwnedLeadOrThrow(ctx, args.leadId);
    const body = String(args.body || "").trim();
    if (!body) {
      throw new Error("Aktiviteten behöver en text.");
    }

    const activity = {
      id: slugId("activity"),
      leadId: args.leadId,
      authorId: viewer.id,
      type: args.type,
      body,
      createdAt: nowIso()
    };

    await ctx.db.insert("leadActivities", activity);
    return { activity };
  }
});
