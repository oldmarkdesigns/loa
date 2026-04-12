export const POPULAR_LISTING_FALLBACK_PREFIX = "office_rental_popular_listing_fallback_v1";

export function popularListingFallbackKey(id) {
  return `${POPULAR_LISTING_FALLBACK_PREFIX}:${String(id)}`;
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function normalizePopularListingFallback(payload) {
  const baseImage = String(payload?.image || "/object-images/object-1.jpeg");
  const normalizedImages = Array.isArray(payload?.images) && payload.images.length > 0
    ? payload.images.filter(Boolean)
    : [baseImage];

  return {
    id: String(payload?.id || ""),
    title: String(payload?.title || "Objekt"),
    district: String(payload?.district || "Stockholm"),
    address: String(payload?.address || payload?.title || "Adress saknas"),
    type: String(payload?.type || "Kontor"),
    priceMonthly: toNumber(payload?.priceMonthly, 0),
    sizeSqm: toNumber(payload?.sizeSqm, 0),
    capacity: toNumber(payload?.capacity, 0),
    responseHours: toNumber(payload?.responseHours, 8),
    verified: Boolean(payload?.verified),
    tags: Array.isArray(payload?.tags) ? payload.tags.filter(Boolean) : [],
    amenities: Array.isArray(payload?.amenities) ? payload.amenities.filter(Boolean) : [],
    image: baseImage,
    images: normalizedImages,
    description: String(payload?.description || ""),
    term: String(payload?.term || "6-24 månader"),
    advertiserName: String(payload?.advertiserName || "Hyresvärd")
  };
}
