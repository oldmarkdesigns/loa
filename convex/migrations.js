import { internalMutationGeneric } from "convex/server";
import { v } from "convex/values";
import { nowIso } from "./lib.js";

// One-time backfills for the CRM/CMS data-model expansion. Each is idempotent
// (safe to run more than once) and supports dryRun to preview the row counts
// before writing anything.

// "Stängd" (closed) doesn't distinguish won vs. lost in the old data — mapped to
// "lost" as the more common default meaning of a generically-closed pipeline item.
// Review this mapping against real data before running for real, not dryRun.
const LEAD_AND_VIEWING_STATUS_MAP = {
  "Ny": "new",
  "Kontaktad": "contacted",
  "Visning bokad": "viewing_booked",
  "Stängd": "lost"
};

export const backfillLeadAndViewingStatuses = internalMutationGeneric({
  args: {
    dryRun: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const leads = await ctx.db.query("leads").collect();
    const viewings = await ctx.db.query("viewings").collect();
    const now = nowIso();

    const leadChanges = leads
      .filter((lead) => LEAD_AND_VIEWING_STATUS_MAP[lead.status])
      .map((lead) => ({ _id: lead._id, from: lead.status, to: LEAD_AND_VIEWING_STATUS_MAP[lead.status] }));
    const viewingChanges = viewings
      .filter((viewing) => LEAD_AND_VIEWING_STATUS_MAP[viewing.status])
      .map((viewing) => ({ _id: viewing._id, from: viewing.status, to: LEAD_AND_VIEWING_STATUS_MAP[viewing.status] }));

    if (!args.dryRun) {
      for (const change of leadChanges) {
        await ctx.db.patch(change._id, { status: change.to, updatedAt: now });
      }
      for (const change of viewingChanges) {
        await ctx.db.patch(change._id, { status: change.to, updatedAt: now });
      }
    }

    return {
      dryRun: Boolean(args.dryRun),
      leadsChanged: leadChanges.length,
      viewingsChanged: viewingChanges.length,
      sample: [...leadChanges, ...viewingChanges].slice(0, 10).map(({ from, to }) => ({ from, to }))
    };
  }
});

// Converts listings.images entries from plain URL strings to {url, order, tag}.
// Run this AFTER deploying the widened schema (which accepts both shapes) and
// BEFORE narrowing the schema back down to just the object shape.
export const backfillListingImageShape = internalMutationGeneric({
  args: {
    dryRun: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const listings = await ctx.db.query("listings").collect();
    const candidates = listings.filter(
      (listing) => Array.isArray(listing.images) && listing.images.some((entry) => typeof entry === "string")
    );

    if (!args.dryRun) {
      for (const listing of candidates) {
        const nextImages = listing.images.map((entry, index) =>
          typeof entry === "string" ? { url: entry, order: index } : entry
        );
        await ctx.db.patch(listing._id, { images: nextImages, updatedAt: nowIso() });
      }
    }

    return {
      dryRun: Boolean(args.dryRun),
      listingsChanged: candidates.length
    };
  }
});
