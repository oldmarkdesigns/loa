import { queryGeneric } from "convex/server";
import { v } from "convex/values";
import { applyListingFilters, parseNeedsFromPrompt } from "./lib.js";

export const search = queryGeneric({
  args: {
    prompt: v.string(),
    currentFilters: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const filters = args?.currentFilters || {};
    const parsed = parseNeedsFromPrompt(args?.prompt || "");
    const merged = {
      ...filters,
      ...parsed
    };

    const listings = await ctx.db.query("listings").collect();
    const activeListings = listings.filter((listing) => listing.status === "active");
    const matches = applyListingFilters(activeListings, merged).slice(0, 3);

    return {
      suggestedFilters: merged,
      topListingIds: matches.map((listing) => listing.id),
      explanation:
        matches.length > 0
          ? `Tillämpade AI-filter gav ${matches.length} toppträffar.`
          : "Inga direkta träffar, testa bredare budget eller fler områden."
    };
  }
});
