import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import {
  assertViewerHasRole,
  duplicateSignal,
  findListingByPublicId,
  findOwnedListingOrThrow,
  getViewer,
  getViewerOrThrow,
  getVisibleListingOrThrow,
  listVisibleListings,
  listingQualityScore,
  listingWithOwner,
  minimalRequiredFields,
  nowIso,
  parseAmenities,
  slugId,
  stripSystemFields,
  userCompanyId
} from "./lib.js";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toImageEntry(entry, index) {
  if (entry && typeof entry === "object" && typeof entry.url === "string") {
    return {
      url: entry.url,
      order: typeof entry.order === "number" ? entry.order : index,
      ...(entry.tag ? { tag: entry.tag } : {})
    };
  }
  return { url: String(entry), order: index };
}

function normalizeImages(payload) {
  let rawImages;
  if (Array.isArray(payload.images) && payload.images.length > 0) {
    rawImages = payload.images.filter(Boolean);
  } else {
    const cover = payload.image || payload.coverImage || "";
    rawImages = cover ? [cover] : ["/object-images/object-1.jpeg"];
  }
  return rawImages.map(toImageEntry);
}

function buildListingPayload(payload, ownerId, companyId = "", existingListing = null) {
  const images = normalizeImages(payload);
  const image = payload.image || payload.coverImage || images[0]?.url || existingListing?.image || "/object-images/object-1.jpeg";

  return {
    title: payload.title ?? existingListing?.title ?? "",
    district: payload.district ?? existingListing?.district ?? "Norrmalm",
    county: payload.county ?? existingListing?.county ?? "Stockholms län",
    address: payload.address ?? existingListing?.address ?? "",
    type: payload.type ?? existingListing?.type ?? "Kontor",
    priceMonthly: payload.priceMonthly !== undefined ? toNumber(payload.priceMonthly) : existingListing?.priceMonthly ?? 0,
    sizeSqm: payload.sizeSqm !== undefined ? toNumber(payload.sizeSqm) : existingListing?.sizeSqm ?? 0,
    capacity: payload.capacity !== undefined ? toNumber(payload.capacity) : existingListing?.capacity ?? 0,
    availability: payload.availability ?? existingListing?.availability ?? "Ledig nu",
    term: payload.term ?? existingListing?.term ?? "12 månader",
    responseHours: payload.responseHours !== undefined ? toNumber(payload.responseHours, 2) : existingListing?.responseHours ?? 2,
    verified: payload.verified !== undefined ? Boolean(payload.verified) : existingListing?.verified ?? false,
    score: payload.score !== undefined ? toNumber(payload.score, 72) : existingListing?.score ?? 72,
    image,
    images,
    amenities: Array.isArray(payload.amenities) ? payload.amenities : parseAmenities(payload.amenities ?? existingListing?.amenities ?? ""),
    tags: Array.isArray(payload.tags) ? payload.tags : existingListing?.tags ?? ["Ny annons"],
    ownerId,
    ...(companyId || existingListing?.companyId ? { companyId: companyId || existingListing.companyId } : {}),
    status: payload.status ?? existingListing?.status ?? "draft",
    isBostadsratt: payload.isBostadsratt !== undefined ? Boolean(payload.isBostadsratt) : existingListing?.isBostadsratt ?? false,
    verifyRequestedAt: existingListing?.verifyRequestedAt ?? null,
    sourceUrl: payload.sourceUrl ?? existingListing?.sourceUrl
  };
}

async function collectAllListings(ctx) {
  const listings = await ctx.db.query("listings").collect();
  return listings.map(stripSystemFields);
}

export const list = queryGeneric({
  args: {
    filters: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    return { listings: await listVisibleListings(ctx, args?.filters || {}) };
  }
});

export const get = queryGeneric({
  args: {
    id: v.string()
  },
  handler: async (ctx, args) => {
    const listing = await getVisibleListingOrThrow(ctx, args?.id || "");
    return { listing: await listingWithOwner(ctx, listing) };
  }
});

export const recordView = mutationGeneric({
  args: {
    id: v.string(),
    source: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const listing = await getVisibleListingOrThrow(ctx, args?.id || "");
    const viewer = await getViewer(ctx);
    const createdAt = nowIso();

    await ctx.db.insert("listingViews", {
      id: slugId("lv"),
      listingId: listing.id,
      ...(viewer?.id ? { viewerId: viewer.id } : {}),
      ...(args?.source ? { source: String(args.source).slice(0, 120) } : {}),
      createdAt
    });

    return { ok: true };
  }
});

export const create = mutationGeneric({
  args: {
    payload: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);
    assertViewerHasRole(viewer, "publisher");
    const createdAt = nowIso();
    const payload = buildListingPayload(args?.payload || {}, viewer.id, userCompanyId(viewer));
    const listing = {
      id: slugId("L"),
      ...payload,
      qualityScore: listingQualityScore(payload),
      createdAt,
      updatedAt: createdAt
    };

    const allListings = await collectAllListings(ctx);
    const duplicateWarning = duplicateSignal(allListings, listing);

    await ctx.db.insert("listings", listing);

    return {
      listing: await listingWithOwner(ctx, listing),
      qualityScore: listing.qualityScore,
      duplicateWarning
    };
  }
});

export const update = mutationGeneric({
  args: {
    id: v.string(),
    payload: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const { viewer, listing } = await findOwnedListingOrThrow(ctx, args?.id || "");
    assertViewerHasRole(viewer, "publisher");
    const nextPayload = buildListingPayload(args?.payload || {}, listing.ownerId, listing.companyId || userCompanyId(viewer), stripSystemFields(listing));
    const patch = {
      ...nextPayload,
      qualityScore: listingQualityScore(nextPayload),
      updatedAt: nowIso()
    };

    await ctx.db.patch(listing._id, patch);

    const allListings = await collectAllListings(ctx);
    const nextListing = { ...stripSystemFields(listing), ...patch };

    return {
      listing: await listingWithOwner(ctx, nextListing),
      qualityScore: patch.qualityScore,
      duplicateWarning: duplicateSignal(allListings, nextListing, nextListing.id)
    };
  }
});

export const remove = mutationGeneric({
  args: {
    id: v.string()
  },
  handler: async (ctx, args) => {
    const { viewer, listing } = await findOwnedListingOrThrow(ctx, args?.id || "");
    assertViewerHasRole(viewer, "publisher");

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_listing_id", (query) => query.eq("listingId", listing.id))
      .collect();
    const viewings = await ctx.db
      .query("viewings")
      .withIndex("by_listing_id", (query) => query.eq("listingId", listing.id))
      .collect();
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_listing_id", (query) => query.eq("listingId", listing.id))
      .collect();

    for (const favorite of favorites) {
      await ctx.db.delete(favorite._id);
    }
    for (const viewing of viewings) {
      await ctx.db.delete(viewing._id);
    }
    for (const lead of leads) {
      await ctx.db.delete(lead._id);
    }

    await ctx.db.delete(listing._id);
    return { ok: true };
  }
});

export const publish = mutationGeneric({
  args: {
    id: v.string()
  },
  handler: async (ctx, args) => {
    const { viewer, listing } = await findOwnedListingOrThrow(ctx, args?.id || "");
    assertViewerHasRole(viewer, "publisher");

    if (!minimalRequiredFields(listing)) {
      throw new Error("Fyll i rubrik, adress, typ, hyra, yta och kapacitet innan publicering.");
    }

    const patch = {
      status: "active",
      updatedAt: nowIso(),
      qualityScore: listingQualityScore(listing)
    };

    await ctx.db.patch(listing._id, patch);
    return { listing: await listingWithOwner(ctx, { ...stripSystemFields(listing), ...patch }) };
  }
});

export const requestVerification = mutationGeneric({
  args: {
    id: v.string()
  },
  handler: async (ctx, args) => {
    const { viewer, listing } = await findOwnedListingOrThrow(ctx, args?.id || "");
    assertViewerHasRole(viewer, "publisher");
    const patch = {
      verifyRequestedAt: nowIso(),
      updatedAt: nowIso()
    };

    await ctx.db.patch(listing._id, patch);
    return { listing: await listingWithOwner(ctx, { ...stripSystemFields(listing), ...patch }) };
  }
});
