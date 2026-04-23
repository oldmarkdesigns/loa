import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import {
  assertViewerHasRole,
  getViewerOrThrow,
  getVisibleListingOrThrow,
  listingWithOwner,
  nowIso,
  qualifyLead,
  slugId,
  stripSystemFields
} from "./lib.js";

export const create = mutationGeneric({
  args: {
    listingId: v.string(),
    preferredSlots: v.optional(v.array(v.string())),
    message: v.optional(v.string()),
    budget: v.optional(v.number()),
    teamSize: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);
    assertViewerHasRole(viewer, "renter");
    const listing = await getVisibleListingOrThrow(ctx, args?.listingId || "");
    const preferredSlots = Array.isArray(args?.preferredSlots) ? args.preferredSlots.filter(Boolean) : [];
    const createdAt = nowIso();

    const viewing = {
      id: slugId("vw"),
      listingId: listing.id,
      renterId: viewer.id,
      preferredSlots,
      message: String(args?.message || ""),
      budget: Number(args?.budget || 0),
      teamSize: Number(args?.teamSize || 0),
      status: "Ny",
      createdAt,
      updatedAt: createdAt
    };

    await ctx.db.insert("viewings", viewing);

    const tags = qualifyLead(listing, viewing);
    await ctx.db.insert("leads", {
      id: slugId("lead"),
      listingId: listing.id,
      renterId: viewer.id,
      publisherId: listing.ownerId,
      status: "Ny",
      fitScore: Math.max(61, 70 + tags.length * 8),
      tags,
      notes: "Skapad från visningsförfrågan",
      createdAt,
      updatedAt: createdAt
    });

    return { viewing };
  }
});

export const list = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerOrThrow(ctx);
    assertViewerHasRole(viewer, "renter");
    const viewings = await ctx.db
      .query("viewings")
      .withIndex("by_renter_id", (query) => query.eq("renterId", viewer.id))
      .collect();

    const hydrated = await Promise.all(
      viewings.map(async (viewing) => ({
        ...stripSystemFields(viewing),
        listing: await listingWithOwner(ctx, await getVisibleListingOrThrow(ctx, viewing.listingId))
      }))
    );

    return { viewings: hydrated };
  }
});
