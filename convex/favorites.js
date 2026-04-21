import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import {
  assertViewerHasRole,
  getViewerOrThrow,
  getVisibleListingOrThrow,
  listingWithOwner,
  nowIso,
  slugId,
  stripSystemFields
} from "./lib.js";

export const list = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerOrThrow(ctx);
    assertViewerHasRole(viewer, "renter");
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user_id", (query) => query.eq("userId", viewer.id))
      .collect();

    const hydrated = await Promise.all(
      favorites.map(async (favorite) => {
        const listing = await getVisibleListingOrThrow(ctx, favorite.listingId).catch(() => null);
        if (!listing) {
          return null;
        }

        return {
          ...stripSystemFields(favorite),
          listing: await listingWithOwner(ctx, listing)
        };
      })
    );

    return { favorites: hydrated.filter(Boolean) };
  }
});

export const add = mutationGeneric({
  args: {
    listingId: v.string()
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);
    assertViewerHasRole(viewer, "renter");
    await getVisibleListingOrThrow(ctx, args?.listingId || "");

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_listing", (query) => query.eq("userId", viewer.id).eq("listingId", args?.listingId || ""))
      .unique();

    if (!existing) {
      await ctx.db.insert("favorites", {
        id: slugId("fav"),
        userId: viewer.id,
        listingId: args?.listingId || "",
        createdAt: nowIso()
      });
    }

    return { ok: true };
  }
});

export const remove = mutationGeneric({
  args: {
    listingId: v.string()
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);
    assertViewerHasRole(viewer, "renter");
    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_user_listing", (query) => query.eq("userId", viewer.id).eq("listingId", args?.listingId || ""))
      .unique();

    if (favorite) {
      await ctx.db.delete(favorite._id);
    }

    return { ok: true };
  }
});
