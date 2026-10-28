import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import { getViewer, getVisibleListingOrThrow, nowIso, slugId } from "./lib.js";

// Canonical reasons offered as one-click chips — mirrors the LEAD_STATUSES/LISTING_STATUSES
// convention (a plain string column; canonical values live here, not in a v.union() literal).
// "other" is a server-side fallback only, never offered as its own chip in the UI (see
// MATCH_DISMISSAL_REASONS in src/lib/matchFeedback.js for the labelled chip list).
export const MATCH_DISMISSAL_REASONS = ["too_expensive", "wrong_location", "wrong_size", "wrong_move_in_date", "other"];

export const dismiss = mutationGeneric({
  args: {
    listingId: v.string(),
    reason: v.string()
  },
  handler: async (ctx, args) => {
    const listing = await getVisibleListingOrThrow(ctx, args?.listingId || "");
    // No getViewerOrThrow here: an unauthenticated /app/rent guest can see a match too,
    // and this is a low-stakes signal, not a protected action (mirrors listings.recordView).
    const viewer = await getViewer(ctx);
    const reason = MATCH_DISMISSAL_REASONS.includes(args?.reason) ? args.reason : "other";

    await ctx.db.insert("matchDismissals", {
      id: slugId("md"),
      listingId: listing.id,
      ...(viewer?.id ? { viewerId: viewer.id } : {}),
      reason,
      createdAt: nowIso()
    });

    return { ok: true };
  }
});
