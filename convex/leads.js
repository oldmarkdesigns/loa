import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import {
  assertViewerHasRole,
  findListingByPublicId,
  findUserByPublicId,
  getViewerOrThrow,
  listingWithOwner,
  nowIso,
  sanitizeUser,
  stripSystemFields
} from "./lib.js";

async function hydrateLead(ctx, lead) {
  const listing = await findListingByPublicId(ctx, lead.listingId);
  const renter = await findUserByPublicId(ctx, lead.renterId);

  return {
    ...stripSystemFields(lead),
    listing: await listingWithOwner(ctx, listing),
    renter: sanitizeUser(renter)
  };
}

export const list = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerOrThrow(ctx);
    assertViewerHasRole(viewer, "publisher");
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_publisher_id", (query) => query.eq("publisherId", viewer.id))
      .collect();

    return {
      leads: await Promise.all(leads.map((lead) => hydrateLead(ctx, lead)))
    };
  }
});

export const update = mutationGeneric({
  args: {
    id: v.string(),
    payload: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);
    assertViewerHasRole(viewer, "publisher");
    const lead = await ctx.db
      .query("leads")
      .withIndex("by_public_id", (query) => query.eq("id", args?.id || ""))
      .unique();

    if (!lead) {
      throw new Error("Intresseanmälan hittades inte.");
    }

    if (lead.publisherId !== viewer.id) {
      throw new Error("Du kan bara uppdatera dina egna intresseanmälningar.");
    }

    const patch = {
      status: args?.payload?.status || lead.status,
      notes: args?.payload?.notes ?? lead.notes,
      updatedAt: nowIso()
    };

    await ctx.db.patch(lead._id, patch);

    const relatedViewing = await ctx.db
      .query("viewings")
      .withIndex("by_listing_renter", (query) => query.eq("listingId", lead.listingId).eq("renterId", lead.renterId))
      .unique();

    if (relatedViewing) {
      await ctx.db.patch(relatedViewing._id, {
        status: patch.status,
        updatedAt: patch.updatedAt
      });
    }

    return { lead: { ...stripSystemFields(lead), ...patch } };
  }
});
