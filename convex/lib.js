import { listings as seedListings } from "../src/data/mockData.js";
import { applyListingFilters, parseNeedsFromPrompt } from "../src/data/matchEngine.js";
import { parseAmenities, slugId } from "../src/lib/formatters.js";

export { applyListingFilters, parseAmenities, parseNeedsFromPrompt, slugId };

// Canonical lead pipeline stages. Stored as plain strings on leads.status (matching
// every other status field in this schema), not enforced via a v.union() literal —
// this list is the single source of truth for the values the CRM UI should offer.
export const LEAD_STATUSES = ["new", "contacted", "viewing_booked", "negotiating", "won", "lost"];

// Canonical listing lifecycle stages, same convention as LEAD_STATUSES above.
export const LISTING_STATUSES = ["draft", "active", "negotiating", "rented", "inactive"];

// Canonical prospect lifecycle stages, same convention as LEAD_STATUSES above.
export const PROSPECT_STATUSES = ["draft", "published", "archived"];

export function nowIso() {
  return new Date().toISOString();
}

export function defaultPublisherPlan() {
  return {
    name: "Gratis",
    freePublishUnlimited: true,
    expiresAt: null
  };
}

export function normalizeOrganizationNumber(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

export function formatOrganizationNumber(value) {
  const digits = normalizeOrganizationNumber(value);
  if (digits.length <= 6) return digits;
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const {
    _id,
    _creationTime,
    tokenIdentifier,
    subject,
    testSessionToken,
    ...safeUser
  } = user;

  return safeUser;
}

export function normalizeRole(role, fallbackRole = "renter") {
  if (role === "company-admin" || role === "companyAdmin" || role === "admin") return "company_admin";
  if (role === "publisher") return "broker";
  if (role === "company_admin" || role === "broker" || role === "renter") return role;
  return fallbackRole;
}

export function normalizeRoles(roles, fallbackRole = "renter") {
  const requestedRoles = Array.isArray(roles)
    ? roles.map((role) => normalizeRole(role, null)).filter(Boolean)
    : [];
  const normalized = requestedRoles.length > 0
    ? Array.from(new Set(requestedRoles))
    : [normalizeRole(fallbackRole)];

  const withImpliedRoles = new Set(normalized);
  if (withImpliedRoles.has("company_admin")) {
    withImpliedRoles.add("broker");
    withImpliedRoles.add("renter");
  }
  return Array.from(withImpliedRoles);
}

export function userGrantedRoles(user) {
  return normalizeRoles(
    Array.from(new Set([...(Array.isArray(user?.roles) ? user.roles : []), user?.role].filter(Boolean))),
    user?.role || "renter"
  );
}

export function stripSystemFields(document) {
  if (!document) {
    return null;
  }

  const { _id, _creationTime, ...safeDocument } = document;
  return safeDocument;
}

export async function findUserByTokenIdentifier(ctx, tokenIdentifier) {
  return await ctx.db
    .query("users")
    .withIndex("by_token_identifier", (query) => query.eq("tokenIdentifier", tokenIdentifier))
    .unique();
}

export async function findUserByEmail(ctx, email) {
  const users = await ctx.db
    .query("users")
    .withIndex("by_email", (query) => query.eq("email", String(email || "").trim().toLowerCase()))
    .collect();

  return users.find((user) => userGrantedRoles(user).includes("company_admin"))
    || users.find((user) => userGrantedRoles(user).includes("broker"))
    || users[0]
    || null;
}

export async function findUserByPublicId(ctx, userId) {
  return await ctx.db
    .query("users")
    .withIndex("by_public_id", (query) => query.eq("id", userId))
    .unique();
}

export function userCompanyId(user) {
  return typeof user?.profile?.companyId === "string" ? user.profile.companyId : "";
}

export async function companyBrokerUserIds(ctx, viewer) {
  const companyId = userCompanyId(viewer);
  if (!companyId || !userGrantedRoles(viewer).includes("company_admin")) {
    return new Set();
  }

  const memberships = await ctx.db
    .query("companyMemberships")
    .withIndex("by_company_id", (query) => query.eq("companyId", companyId))
    .take(200);

  return new Set(
    memberships
      .filter((membership) => membership.role === "broker" && membership.status === "active")
      .map((membership) => membership.userId)
  );
}

export async function getViewer(ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  return await findUserByTokenIdentifier(ctx, identity.tokenIdentifier);
}

export async function getViewerOrThrow(ctx) {
  const viewer = await getViewer(ctx);
  if (!viewer) {
    throw new Error("Du behöver logga in först.");
  }
  return viewer;
}

export function viewerHasRole(viewer, role) {
  const normalizedTarget = normalizeRole(role);
  const roles = userGrantedRoles(viewer);

  if (normalizedTarget === "broker") {
    return roles.includes("broker") || roles.includes("company_admin");
  }

  return roles.includes(normalizedTarget);
}

export function assertViewerHasRole(viewer, role) {
  if (viewerHasRole(viewer, role)) {
    return;
  }

  if (role === "publisher") {
    throw new Error("Du behöver hyresvärdsbehörighet för det här.");
  }

  if (role === "renter") {
    throw new Error("Du behöver hyresgästbehörighet för det här.");
  }

  throw new Error("Du saknar behörighet för det här.");
}

export async function findListingByPublicId(ctx, listingId) {
  return await ctx.db
    .query("listings")
    .withIndex("by_public_id", (query) => query.eq("id", listingId))
    .unique();
}

export async function listingWithOwner(ctx, listing) {
  if (!listing) {
    return null;
  }

  const owner = await findUserByPublicId(ctx, listing.ownerId);
  const companyId = listing.companyId || userCompanyId(owner);
  const [views, leads] = await Promise.all([
    ctx.db
      .query("listingViews")
      .withIndex("by_listing_id", (query) => query.eq("listingId", listing.id))
      .collect(),
    ctx.db
      .query("leads")
      .withIndex("by_listing_id", (query) => query.eq("listingId", listing.id))
      .collect()
  ]);
  return {
    ...stripSystemFields(listing),
    ...(companyId ? { companyId } : {}),
    advertiserName: owner?.name || "Hyresvärd",
    views: views.length,
    inquiries: leads.length
  };
}

export function listingQualityScore(payload) {
  let score = 0;
  if (payload.title) score += 18;
  if (payload.address) score += 14;
  if (payload.type) score += 12;
  if (payload.priceMonthly) score += 16;
  if (payload.sizeSqm) score += 14;
  if (payload.capacity) score += 10;
  if (payload.amenities?.length) score += 8;
  if (payload.images?.length || payload.image) score += 8;
  return Math.min(100, score);
}

export function minimalRequiredFields(listing) {
  const required = [listing.title, listing.address, listing.type, listing.priceMonthly, listing.sizeSqm, listing.capacity];
  return required.every((value) => String(value ?? "").trim() !== "");
}

export function duplicateSignal(listings, candidate, ignoreListingId = null) {
  const normalizedAddress = String(candidate.address || "").toLowerCase().trim();
  const normalizedTitle = String(candidate.title || "").toLowerCase().trim();

  if (!normalizedAddress && !normalizedTitle) {
    return false;
  }

  return listings.some((listing) => {
    if (ignoreListingId && listing.id === ignoreListingId) {
      return false;
    }

    const addressSame = normalizedAddress && String(listing.address || "").toLowerCase().trim() === normalizedAddress;
    const titleSame = normalizedTitle && String(listing.title || "").toLowerCase().trim() === normalizedTitle;
    return addressSame || titleSame;
  });
}

export function qualifyLead(listing, viewingRequest) {
  const tags = [];

  if (Number(viewingRequest.budget || 0) >= Number(listing.priceMonthly || 0)) {
    tags.push("Budgetmatch");
  }

  const slot = viewingRequest.preferredSlots?.[0];
  if (slot) {
    const diffMs = new Date(slot).getTime() - Date.now();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays <= 21) {
      tags.push("Tidsmatch");
    }
  }

  if (Number(viewingRequest.teamSize || 0) <= Number(listing.capacity || 0)) {
    tags.push("Teammatch");
  }

  return tags;
}

export async function listVisibleListings(ctx, filters = {}) {
  const viewer = await getViewer(ctx);
  const viewerCompanyId = userCompanyId(viewer);
  const brokerUserIds = await companyBrokerUserIds(ctx, viewer);
  const listings = await ctx.db.query("listings").collect();
  const visibleListings = listings.filter((listing) => {
    if (listing.status === "active") {
      return true;
    }

    return Boolean(
      viewer
      && (
        viewer.id === listing.ownerId
        || (viewerCompanyId && listing.companyId === viewerCompanyId)
        || brokerUserIds.has(listing.ownerId)
      )
    );
  });

  const enrichedListings = await Promise.all(visibleListings.map((listing) => listingWithOwner(ctx, listing)));
  return applyListingFilters(enrichedListings.filter(Boolean), filters);
}

export async function getVisibleListingOrThrow(ctx, listingId) {
  const viewer = await getViewer(ctx);
  const viewerCompanyId = userCompanyId(viewer);
  const brokerUserIds = await companyBrokerUserIds(ctx, viewer);
  const listing = await findListingByPublicId(ctx, listingId);

  const canViewDraft = Boolean(
    viewer
    && (
      viewer.id === listing?.ownerId
      || (viewerCompanyId && listing?.companyId === viewerCompanyId)
      || brokerUserIds.has(listing?.ownerId)
    )
  );

  if (!listing || (listing.status !== "active" && !canViewDraft)) {
    throw new Error("Objektet hittades inte.");
  }

  return listing;
}

export async function findOwnedListingOrThrow(ctx, listingId) {
  const viewer = await getViewerOrThrow(ctx);
  const listing = await findListingByPublicId(ctx, listingId);
  const viewerCompanyId = userCompanyId(viewer);

  if (!listing) {
    throw new Error("Objektet hittades inte.");
  }

  const brokerUserIds = await companyBrokerUserIds(ctx, viewer);

  if (
    listing.ownerId !== viewer.id
    && (!viewerCompanyId || listing.companyId !== viewerCompanyId)
    && !brokerUserIds.has(listing.ownerId)
  ) {
    throw new Error("Du kan bara uppdatera dina egna objekt.");
  }

  return { viewer, listing };
}

export async function findProspectByPublicId(ctx, prospectId) {
  return await ctx.db
    .query("prospects")
    .withIndex("by_public_id", (query) => query.eq("id", prospectId))
    .unique();
}

export async function findProspectCollaboration(ctx, prospectId, userId) {
  return await ctx.db
    .query("prospectCollaborators")
    .withIndex("by_prospect_user", (query) => query.eq("prospectId", prospectId).eq("userId", userId))
    .unique();
}

export async function findOwnedProspectOrThrow(ctx, prospectId) {
  const viewer = await getViewerOrThrow(ctx);
  const prospect = await findProspectByPublicId(ctx, prospectId);

  if (!prospect) {
    throw new Error("Prospektet hittades inte.");
  }

  const viewerCompanyId = userCompanyId(viewer);
  const brokerUserIds = await companyBrokerUserIds(ctx, viewer);

  if (
    prospect.ownerId !== viewer.id
    && (!viewerCompanyId || prospect.companyId !== viewerCompanyId)
    && !brokerUserIds.has(prospect.ownerId)
  ) {
    throw new Error("Du kan bara redigera dina egna prospekt.");
  }

  return { viewer, prospect };
}

export async function findViewableProspectOrThrow(ctx, prospectId) {
  const viewer = await getViewerOrThrow(ctx);
  const prospect = await findProspectByPublicId(ctx, prospectId);

  if (!prospect) {
    throw new Error("Prospektet hittades inte.");
  }

  const viewerCompanyId = userCompanyId(viewer);
  const brokerUserIds = await companyBrokerUserIds(ctx, viewer);
  const hasEditAccess = Boolean(
    prospect.ownerId === viewer.id
    || (viewerCompanyId && prospect.companyId === viewerCompanyId)
    || brokerUserIds.has(prospect.ownerId)
  );

  if (hasEditAccess) {
    return { viewer, prospect, hasEditAccess: true };
  }

  const collaboration = await findProspectCollaboration(ctx, prospect.id, viewer.id);
  if (!collaboration) {
    throw new Error("Du har inte åtkomst till det här prospektet.");
  }

  return { viewer, prospect, hasEditAccess: false };
}

export async function findProspectByGuestTokenOrThrow(ctx, token) {
  const guestLink = await ctx.db
    .query("prospectGuestLinks")
    .withIndex("by_token", (query) => query.eq("token", String(token || "")))
    .unique();

  const now = nowIso();
  const isValid = Boolean(
    guestLink
    && !guestLink.revokedAt
    && (!guestLink.expiresAt || guestLink.expiresAt > now)
  );

  // One generic message whether the token is missing, revoked, or expired — never
  // reveal which, so a guessed token can't be used to probe link state.
  if (!isValid) {
    throw new Error("Länken är inte längre giltig.");
  }

  const prospect = await findProspectByPublicId(ctx, guestLink.prospectId);
  if (!prospect) {
    throw new Error("Länken är inte längre giltig.");
  }

  return { guestLink, prospect };
}

export async function hydrateProspectComment(ctx, comment) {
  if (comment.authorType !== "user" || !comment.authorId) {
    return stripSystemFields(comment);
  }

  const author = await findUserByPublicId(ctx, comment.authorId);
  return { ...stripSystemFields(comment), authorName: author?.name || "Användare" };
}

export async function resolveProspectSectionsForDisplay(ctx, sections) {
  return Promise.all(
    (sections || []).map(async (section) => ({
      ...section,
      attachments: await Promise.all(
        (section.attachments || []).map(async (attachment) => ({
          ...attachment,
          url: await ctx.storage.getUrl(attachment.storageId)
        }))
      )
    }))
  );
}

function seedUsers() {
  return [
    {
      id: "u-renter-demo",
      tokenIdentifier: "seed|hyresgast-demo",
      subject: "seed-hyresgast-demo",
      email: "hyresgast@demo.se",
      name: "Demo Hyresgäst",
      phone: "0701234567",
      role: "renter",
      roles: ["renter"],
      publisherPlan: defaultPublisherPlan(),
      onboardingCompleted: true,
      profile: {
        companySize: "11-25",
        budgetRange: "50000-90000",
        preferredAreas: ["Norrmalm", "Södermalm"],
        moveInTimeline: "1-2 månader"
      },
      authProvider: "seed"
    },
    {
      id: "u-publisher-demo",
      tokenIdentifier: "seed|annonsor-demo",
      subject: "seed-annonsor-demo",
      email: "annonsor@demo.se",
      name: "Demo Hyresvärd",
      phone: "0702223344",
      role: "publisher",
      roles: ["publisher"],
      publisherPlan: defaultPublisherPlan(),
      onboardingCompleted: true,
      profile: {
        propertyType: "Kontor",
        legalEntity: "Lokalbolaget AB",
        contactRole: "Förvaltare",
        portfolioSize: "6-20"
      },
      authProvider: "seed"
    },
    {
      id: "u-publisher-2",
      tokenIdentifier: "seed|kombi-demo",
      subject: "seed-kombi-demo",
      email: "kombi@demo.se",
      name: "Demo Kombi",
      phone: "0705556600",
      role: "renter",
      roles: ["renter", "publisher"],
      publisherPlan: defaultPublisherPlan(),
      onboardingCompleted: true,
      profile: {
        propertyType: "Blandat",
        legalEntity: "Partner Fastigheter AB",
        contactRole: "Uthyrare",
        portfolioSize: "21-80"
      },
      authProvider: "seed"
    }
  ];
}

export function seedCompanies() {
  const vasakronanOrganizationNumber = "556474-0123";

  return [
    {
      id: "company-vasakronan-fastigheter",
      name: "Vasakronan Fastigheter AB",
      organizationNumber: vasakronanOrganizationNumber,
      normalizedOrganizationNumber: normalizeOrganizationNumber(vasakronanOrganizationNumber),
      companyType: "Fastighetsbolag",
      phone: "08-783 21 00",
      streetAddress: "Mäster Samuelsgatan 56",
      postalCode: "111 21",
      city: "Stockholm",
      parentCompany: "Civitas Holding Aktiebolag",
      websiteUrl: "https://vasakronan.se",
      source: "seed"
    }
  ];
}

export async function ensureSeedCompanies(ctx) {
  const createdAt = nowIso();

  for (const company of seedCompanies()) {
    const existing = await ctx.db
      .query("companies")
      .withIndex("by_normalized_organization_number", (query) =>
        query.eq("normalizedOrganizationNumber", company.normalizedOrganizationNumber)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...company,
        updatedAt: createdAt
      });
    } else {
      await ctx.db.insert("companies", {
        ...company,
        createdAt,
        updatedAt: createdAt
      });
    }
  }
}

function normalizeSeedListings() {
  const dayMs = 1000 * 60 * 60 * 24;

  return seedListings.map((listing, index) => ({
    ...listing,
    ownerId: listing.ownerId || (index % 2 === 0 ? "u-publisher-demo" : "u-publisher-2"),
    county: "Stockholms län",
    isBostadsratt: index % 5 === 0,
    images: [listing.image],
    qualityScore: Math.max(62, Math.min(98, listing.score - 2)),
    status: "active",
    createdAt: new Date(Date.now() - (((index * 9) % 120) + 2) * dayMs).toISOString(),
    updatedAt: new Date(Date.now() - (((index * 9) % 120) + 1) * dayMs).toISOString(),
    verifyRequestedAt: null
  }));
}

function seedViewings() {
  const now = nowIso();

  return [
    {
      id: "vw-2001",
      listingId: "L-102",
      renterId: "u-renter-demo",
      preferredSlots: ["2026-02-18T09:30:00.000Z"],
      message: "Vi vill se lokalen nästa vecka.",
      budget: 70000,
      teamSize: 12,
      status: "contacted",
      createdAt: now,
      updatedAt: now
    }
  ];
}

function seedLeads() {
  const now = nowIso();

  return [
    {
      id: "lead-3901",
      listingId: "L-102",
      renterId: "u-renter-demo",
      publisherId: "u-publisher-2",
      status: "viewing_booked",
      fitScore: 88,
      tags: ["Budget-fit", "Timing-fit"],
      notes: "Hög prioritet",
      createdAt: now,
      updatedAt: now
    }
  ];
}

export async function ensureSeedData(ctx) {
  await ensureSeedCompanies(ctx);

  const seedMarker = await ctx.db
    .query("appMeta")
    .withIndex("by_key", (query) => query.eq("key", "seedVersion"))
    .unique();

  if (seedMarker) {
    return false;
  }

  const existingListings = await ctx.db.query("listings").take(1);
  if (existingListings.length > 0) {
    await ctx.db.insert("appMeta", { key: "seedVersion", value: "1" });
    return false;
  }

  const createdAt = nowIso();
  for (const user of seedUsers()) {
    await ctx.db.insert("users", {
      ...user,
      createdAt,
      updatedAt: createdAt
    });
  }

  for (const listing of normalizeSeedListings()) {
    await ctx.db.insert("listings", listing);
  }

  for (const viewing of seedViewings()) {
    await ctx.db.insert("viewings", viewing);
  }

  for (const lead of seedLeads()) {
    await ctx.db.insert("leads", lead);
  }

  await ctx.db.insert("appMeta", { key: "seedVersion", value: "1" });
  return true;
}
