import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  appMeta: defineTable({
    key: v.string(),
    value: v.string()
  }).index("by_key", ["key"]),
  users: defineTable({
    id: v.string(),
    tokenIdentifier: v.string(),
    subject: v.optional(v.string()),
    email: v.string(),
    name: v.string(),
    phone: v.string(),
    role: v.string(),
    roles: v.array(v.string()),
    publisherPlan: v.any(),
    onboardingCompleted: v.boolean(),
    profile: v.any(),
    authProvider: v.string(),
    createdAt: v.string(),
    updatedAt: v.string()
  })
    .index("by_public_id", ["id"])
    .index("by_token_identifier", ["tokenIdentifier"])
    .index("by_email", ["email"]),
  listings: defineTable({
    id: v.string(),
    title: v.string(),
    district: v.string(),
    county: v.string(),
    address: v.string(),
    type: v.string(),
    priceMonthly: v.number(),
    sizeSqm: v.number(),
    capacity: v.number(),
    availability: v.string(),
    term: v.string(),
    responseHours: v.number(),
    verified: v.boolean(),
    score: v.number(),
    image: v.string(),
    images: v.array(v.string()),
    amenities: v.array(v.string()),
    tags: v.array(v.string()),
    ownerId: v.string(),
    status: v.string(),
    qualityScore: v.number(),
    isBostadsratt: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
    verifyRequestedAt: v.union(v.string(), v.null()),
    sourceUrl: v.optional(v.string())
  })
    .index("by_public_id", ["id"])
    .index("by_owner_id", ["ownerId"])
    .index("by_status", ["status"]),
  favorites: defineTable({
    id: v.string(),
    userId: v.string(),
    listingId: v.string(),
    createdAt: v.string()
  })
    .index("by_public_id", ["id"])
    .index("by_user_id", ["userId"])
    .index("by_user_listing", ["userId", "listingId"])
    .index("by_listing_id", ["listingId"]),
  viewings: defineTable({
    id: v.string(),
    listingId: v.string(),
    renterId: v.string(),
    preferredSlots: v.array(v.string()),
    message: v.string(),
    budget: v.number(),
    teamSize: v.number(),
    status: v.string(),
    createdAt: v.string(),
    updatedAt: v.string()
  })
    .index("by_public_id", ["id"])
    .index("by_renter_id", ["renterId"])
    .index("by_listing_id", ["listingId"])
    .index("by_listing_renter", ["listingId", "renterId"]),
  leads: defineTable({
    id: v.string(),
    listingId: v.string(),
    renterId: v.string(),
    publisherId: v.string(),
    status: v.string(),
    fitScore: v.number(),
    tags: v.array(v.string()),
    notes: v.string(),
    createdAt: v.string(),
    updatedAt: v.string()
  })
    .index("by_public_id", ["id"])
    .index("by_publisher_id", ["publisherId"])
    .index("by_listing_id", ["listingId"])
    .index("by_listing_renter", ["listingId", "renterId"])
});
