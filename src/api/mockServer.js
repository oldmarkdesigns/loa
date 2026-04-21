import { listings as seedListings } from "../data/mockData";
import amfScraped from "../data/scraped/amf-kontor-latest.json";
import { applyListingFilters, parseNeedsFromPrompt } from "../data/matchEngine";
import { parseAmenities, slugId } from "../lib/formatters";

const DB_KEY = "office_rental_mock_db_v3";
const SESSION_KEY = "office_rental_mock_session_v1";

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function defaultPublisherPlan() {
  return {
    name: "Gratis",
    freePublishUnlimited: true,
    expiresAt: null
  };
}

function parseSizeSqm(text) {
  const match = String(text || "").match(/(\d{2,5})(?:\s*-\s*(\d{2,5}))?\s*kvm/i);
  if (!match) return 120;
  const low = Number(match[1]);
  const high = match[2] ? Number(match[2]) : low;
  if (!Number.isFinite(low) || low <= 0) return 120;
  if (!Number.isFinite(high) || high <= 0) return low;
  return Math.round((low + high) / 2);
}

function inferDistrict(text) {
  const value = String(text || "").toLowerCase();
  if (value.includes("södermalm") || value.includes("sodermalm") || value.includes("marievik")) return "Södermalm";
  if (value.includes("sundbyberg")) return "Solna";
  if (value.includes("stockholm city")) return "Norrmalm";
  return "Norrmalm";
}

function parseAvailability(text) {
  const match = String(text || "").match(/(Tillgänglig[^.]*|Inflytt[^.]*)/i);
  if (!match) return "Tillgänglig enligt överenskommelse";
  const normalized = match[1].replace(/\s+/g, " ").trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function normalizeAmfTitle(title) {
  const base = String(title || "").replace(/^Go to\s+/i, "").trim();
  return base || "AMF Kontor";
}

function normalizeAmfListings() {
  const rawListings = Array.isArray(amfScraped?.listings) ? amfScraped.listings : [];
  const imagePool = [
    "/object-images/object-1.jpeg",
    "/object-images/object-2.jpeg",
    "/object-images/object-3.jpeg",
    "/object-images/object-4.jpeg",
    "/object-images/object-5.jpeg",
    "/object-images/object-6.jpeg",
    "/object-images/object-7.jpeg",
    "/object-images/object-8.jpeg",
    "/object-images/object-9.jpeg",
    "/object-images/object-10.jpeg"
  ];

  return rawListings.map((entry, index) => {
    const baseText = String(entry.rawText || entry.snippet || "");
    const sizeSqm = parseSizeSqm(baseText);
    const title = normalizeAmfTitle(entry.title);
    return {
      id: `AMF-${String(index + 1).padStart(3, "0")}`,
      title: `${title} (AMF)`,
      district: inferDistrict(baseText),
      address: title,
      type: "Kontor",
      priceMonthly: Math.max(25000, Math.round(sizeSqm * 450)),
      sizeSqm,
      capacity: Math.max(4, Math.round(sizeSqm / 10)),
      availability: parseAvailability(baseText),
      term: "12-24 månader",
      responseHours: 24,
      verified: true,
      score: 78,
      image: imagePool[index % imagePool.length],
      amenities: ["Extern källa", "AMF Fastigheter"],
      tags: ["Importerad listing"],
      sourceUrl: String(entry.url || ""),
      ownerId: "u-publisher-2"
    };
  });
}

function defaultDb() {
  const dayMs = 1000 * 60 * 60 * 24;
  const allSeedListings = [...seedListings, ...normalizeAmfListings()];
  const initialListings = allSeedListings.map((listing, index) => ({
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

  return {
    users: [
      {
        id: "u-renter-demo",
        email: "hyresgast@demo.se",
        password: "demo123",
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
        }
      },
      {
        id: "u-publisher-demo",
        email: "annonsor@demo.se",
        password: "demo123",
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
        }
      },
      {
        id: "u-publisher-2",
        email: "kombi@demo.se",
        password: "demo123",
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
        }
      }
    ],
    listings: initialListings,
    favorites: [],
    viewings: [
      {
        id: "vw-2001",
        listingId: "L-102",
        renterId: "u-renter-demo",
        preferredSlots: ["2026-02-18T09:30:00.000Z"],
        message: "Vi vill se lokalen nästa vecka.",
        status: "Kontaktad",
        createdAt: nowIso(),
        updatedAt: nowIso()
      }
    ],
    leads: [
      {
        id: "lead-3901",
        listingId: "L-102",
        renterId: "u-renter-demo",
        publisherId: "u-publisher-2",
        status: "Visning bokad",
        fitScore: 88,
        tags: ["Budget-fit", "Timing-fit"],
        notes: "Hög prioritet",
        createdAt: nowIso(),
        updatedAt: nowIso()
      }
    ],
    aiPrompts: [],
    analytics: []
  };
}

function readDb() {
  const raw = window.localStorage.getItem(DB_KEY);
  if (!raw) {
    const seeded = defaultDb();
    writeDb(seeded);
    return seeded;
  }

  try {
    return migrateDb(JSON.parse(raw));
  } catch (_error) {
    const seeded = defaultDb();
    writeDb(seeded);
    return seeded;
  }
}

function writeDb(db) {
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function migrateDb(db) {
  let changed = false;
  const dayMs = 1000 * 60 * 60 * 24;

  db.users.forEach((user) => {
    if (!Array.isArray(user.roles) || user.roles.length === 0) {
      user.roles = [user.role === "publisher" || user.role === "company_admin" ? user.role : "renter"];
      changed = true;
    }

    if (!user.publisherPlan) {
      user.publisherPlan = defaultPublisherPlan();
      changed = true;
    }
  });

  const shouldStaggerListingDates = Array.isArray(db.listings) && db.listings.length > 0 && db.listings.every((listing) => {
    const createdAtMs = new Date(listing.createdAt || 0).getTime();
    if (!Number.isFinite(createdAtMs) || createdAtMs <= 0) {
      return true;
    }
    const ageDays = (Date.now() - createdAtMs) / dayMs;
    return ageDays < 3;
  });

  db.listings.forEach((listing, index) => {
    if (!listing.county) {
      listing.county = "Stockholms län";
      changed = true;
    }
    if (typeof listing.isBostadsratt !== "boolean") {
      listing.isBostadsratt = false;
      changed = true;
    }
    if (!listing.createdAt) {
      listing.createdAt = nowIso();
      changed = true;
    }
    if (!listing.updatedAt) {
      listing.updatedAt = listing.createdAt;
      changed = true;
    }
    if (shouldStaggerListingDates) {
      listing.createdAt = new Date(Date.now() - (((index * 9) % 120) + 2) * dayMs).toISOString();
      listing.updatedAt = new Date(Date.now() - (((index * 9) % 120) + 1) * dayMs).toISOString();
      changed = true;
    }
  });

  const hybrid = db.users.find((user) => user.email?.toLowerCase() === "kombi@demo.se");
  const legacyHybrid = db.users.find((user) => user.id === "u-publisher-2" || user.email?.toLowerCase() === "partner@demo.se");

  if (!hybrid && legacyHybrid) {
    legacyHybrid.email = "kombi@demo.se";
    legacyHybrid.name = "Demo Kombi";
    legacyHybrid.role = "renter";
    legacyHybrid.roles = ["renter", "publisher"];
    legacyHybrid.onboardingCompleted = true;
    legacyHybrid.profile = {
      ...legacyHybrid.profile,
      propertyType: legacyHybrid.profile?.propertyType || "Blandat"
    };
    changed = true;
  } else if (!hybrid) {
    db.users.push({
      id: "u-hybrid-demo",
      email: "kombi@demo.se",
      password: "demo123",
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
      }
    });
    changed = true;
  }

  const canonicalDemoAccounts = {
    "hyresgast@demo.se": {
      name: "Demo Hyresgäst",
      role: "renter",
      roles: ["renter"],
      onboardingCompleted: true
    },
    "annonsor@demo.se": {
      name: "Demo Hyresvärd",
      role: "publisher",
      roles: ["publisher"],
      onboardingCompleted: true
    },
    "kombi@demo.se": {
      name: "Demo Kombi",
      role: "renter",
      roles: ["renter", "publisher"],
      onboardingCompleted: true
    }
  };

  db.users.forEach((user) => {
    const email = String(user.email || "").toLowerCase();
    const canonical = canonicalDemoAccounts[email];
    if (!canonical) {
      return;
    }
    if (user.name !== canonical.name) {
      user.name = canonical.name;
      changed = true;
    }
    if (user.role !== canonical.role) {
      user.role = canonical.role;
      changed = true;
    }

    const currentRoles = Array.isArray(user.roles) ? user.roles : [];
    const canonicalRoles = canonical.roles;
    if (JSON.stringify(currentRoles) !== JSON.stringify(canonicalRoles)) {
      user.roles = [...canonicalRoles];
      changed = true;
    }

    if (!user.onboardingCompleted) {
      user.onboardingCompleted = canonical.onboardingCompleted;
      changed = true;
    }
  });

  if (changed) {
    writeDb(db);
  }

  return db;
}

function readSession() {
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function writeSession(session) {
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

function delay(ms = 180) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms + Math.round(Math.random() * 180));
  });
}

function resolveUserOrThrow(db) {
  const session = readSession();
  if (!session?.userId) {
    throw new ApiError(401, "Du behöver logga in först.");
  }
  const user = db.users.find((entry) => entry.id === session.userId);
  if (!user) {
    throw new ApiError(401, "Sessionen är ogiltig. Logga in igen.");
  }
  return user;
}

function parseFilters(params) {
  const typeValue = params.get("type");
  const parsedTypes =
    typeValue && typeValue !== "Alla"
      ? typeValue
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const daysRaw = params.get("daysOnMarket") || "all";
  const parsedDays = daysRaw === "all" ? "all" : String(Math.max(0, Number(daysRaw || 0)));

  return {
    county: params.get("county") || "",
    query: params.get("query") || "",
    district: params.get("district") || "Alla",
    type: parsedTypes,
    minSize: params.get("minSize") || "",
    maxSize: params.get("maxSize") || "",
    maxBudget: params.get("maxBudget") ? Number(params.get("maxBudget")) : "",
    teamSize: params.get("teamSize") || "",
    requirePrice: params.get("requirePrice") === "true",
    onlyBostadsratt: params.get("onlyBostadsratt") === "true",
    daysOnMarket: parsedDays,
    keyword: params.get("keyword") || "",
    advertiser: params.get("advertiser") || "Alla",
    onlyVerified: params.get("verified") === "true",
    readyNow: params.get("readyNow") === "true"
  };
}

function listingWithOwner(db, listing) {
  if (!listing) {
    return null;
  }
  const owner = db.users.find((entry) => entry.id === listing.ownerId);
  return {
    ...listing,
    advertiserName: owner?.name || "Hyresvärd"
  };
}

function minimalRequiredFields(listing) {
  const required = [listing.title, listing.address, listing.type, listing.priceMonthly, listing.sizeSqm, listing.capacity];
  return required.every((value) => String(value ?? "").trim() !== "");
}

function listingQualityScore(payload) {
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

function duplicateSignal(db, candidate, ignoreListingId = null) {
  const normalizedAddress = String(candidate.address || "").toLowerCase().trim();
  const normalizedTitle = String(candidate.title || "").toLowerCase().trim();
  if (!normalizedAddress && !normalizedTitle) {
    return false;
  }

  return db.listings.some((listing) => {
    if (ignoreListingId && listing.id === ignoreListingId) {
      return false;
    }

    const addressSame = normalizedAddress && String(listing.address).toLowerCase().trim() === normalizedAddress;
    const titleSame = normalizedTitle && String(listing.title).toLowerCase().trim() === normalizedTitle;
    return addressSame || titleSame;
  });
}

function qualifyLead(listing, viewingRequest) {
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

async function handleRequest(method, endpoint, body = {}) {
  await delay();

  const url = new URL(endpoint, "http://mock.local");
  const db = readDb();

  if (method === "POST" && url.pathname === "/api/auth/signup") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !body.password || !body.name) {
      throw new ApiError(400, "Fyll i namn, e-post och lösenord.");
    }

    if (db.users.some((user) => user.email.toLowerCase() === email)) {
      throw new ApiError(409, "E-postadressen används redan.");
    }

    const requestedRoles = Array.isArray(body.roles)
      ? body.roles.filter((role) => role === "renter" || role === "publisher" || role === "company_admin")
      : [];
    const roles = requestedRoles.length ? Array.from(new Set(requestedRoles)) : [body.role === "publisher" || body.role === "company_admin" ? body.role : "renter"];
    const primaryRole = roles.includes(body.role) ? body.role : roles[0];
    const user = {
      id: slugId("u"),
      email,
      password: body.password,
      name: body.name,
      phone: body.phone || "",
      role: primaryRole,
      roles,
      publisherPlan: defaultPublisherPlan(),
      onboardingCompleted: false,
      profile: {}
    };

    db.users.push(user);
    writeDb(db);
    writeSession({ userId: user.id, issuedAt: nowIso() });

    return {
      user: sanitizeUser(user)
    };
  }

  if (method === "POST" && url.pathname === "/api/auth/login") {
    const email = String(body.email || "").trim().toLowerCase();
    const user = db.users.find((entry) => entry.email.toLowerCase() === email);
    if (!user || user.password !== body.password) {
      throw new ApiError(401, "Fel e-post eller lösenord.");
    }

    writeSession({ userId: user.id, issuedAt: nowIso() });
    return { user: sanitizeUser(user) };
  }

  if (method === "POST" && url.pathname === "/api/auth/clerk-session") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) {
      throw new ApiError(400, "Saknar e-post från Clerk-konto.");
    }

    const requestedRoles = Array.isArray(body.roles)
      ? body.roles.filter((role) => role === "renter" || role === "publisher" || role === "company_admin")
      : [];
    const hasRoleOverride = body.role === "publisher" || body.role === "company_admin" || body.role === "renter";
    const rolesFromPayload = requestedRoles.length
      ? Array.from(new Set(requestedRoles))
      : (hasRoleOverride ? [body.role] : []);
    const primaryRole = hasRoleOverride ? body.role : (rolesFromPayload[0] || "renter");

    let user = db.users.find((entry) => entry.email.toLowerCase() === email);

    if (!user) {
      user = {
        id: slugId("u"),
        email,
        password: `clerk-${crypto.randomUUID()}`,
        name: String(body.name || "").trim() || "Ny användare",
        phone: body.phone || "",
        role: primaryRole,
        roles: rolesFromPayload.length ? rolesFromPayload : [primaryRole],
        publisherPlan: defaultPublisherPlan(),
        onboardingCompleted: false,
        profile: {
          avatarUrl: String(body.imageUrl || "").trim()
        },
        authProvider: "clerk",
        clerkUserId: String(body.clerkUserId || "").trim()
      };
      db.users.push(user);
    } else {
      user.name = String(body.name || "").trim() || user.name;
      user.phone = body.phone ?? user.phone;
      if (hasRoleOverride) {
        user.role = primaryRole;
      }
      if (rolesFromPayload.length) {
        user.roles = rolesFromPayload;
      }
      user.publisherPlan = user.publisherPlan || defaultPublisherPlan();
      user.profile = {
        ...user.profile,
        ...(body.imageUrl ? { avatarUrl: String(body.imageUrl).trim() } : {})
      };
      user.authProvider = "clerk";
      user.clerkUserId = String(body.clerkUserId || "").trim() || user.clerkUserId;
    }

    writeDb(db);
    writeSession({ userId: user.id, issuedAt: nowIso() });
    return { user: sanitizeUser(user) };
  }

  if (method === "POST" && url.pathname === "/api/auth/logout") {
    writeSession(null);
    return { ok: true };
  }

  if (method === "GET" && url.pathname === "/api/auth/session") {
    const session = readSession();
    if (!session) {
      return { user: null };
    }

    const user = db.users.find((entry) => entry.id === session.userId);
    return { user: sanitizeUser(user || null) };
  }

  if (method === "GET" && url.pathname === "/api/me") {
    const user = resolveUserOrThrow(db);
    return { user: sanitizeUser(user) };
  }

  if (method === "PATCH" && url.pathname === "/api/me") {
    const user = resolveUserOrThrow(db);

    user.name = body.name ?? user.name;
    user.phone = body.phone ?? user.phone;
    user.role = body.role ?? user.role;
    user.roles = Array.isArray(body.roles) && body.roles.length ? body.roles : user.roles;
    user.publisherPlan = user.publisherPlan || defaultPublisherPlan();
    user.profile = {
      ...user.profile,
      ...(body.profile || {})
    };

    writeDb(db);
    return { user: sanitizeUser(user) };
  }

  if (method === "POST" && url.pathname === "/api/onboarding/complete") {
    const user = resolveUserOrThrow(db);
    const primaryRole = body.primaryRole === "publisher" ? "publisher" : "renter";

    user.role = primaryRole;
    user.roles = user.roles.includes(primaryRole) ? user.roles : [...user.roles, primaryRole];
    user.publisherPlan = user.publisherPlan || defaultPublisherPlan();
    user.onboardingCompleted = true;
    if (body.account) {
      user.name = body.account.name || user.name;
      user.email = body.account.email || user.email;
      user.phone = body.account.phone || user.phone;
    }
    user.profile = {
      ...user.profile,
      ...(body.profile || {})
    };

    writeDb(db);
    return { user: sanitizeUser(user) };
  }

  if (method === "GET" && url.pathname === "/api/listings") {
    const filters = parseFilters(url.searchParams);
    const onlyActive = db.listings.filter((listing) => listing.status === "active" || listing.status === "draft");
    const enrichedListings = onlyActive.map((listing) => listingWithOwner(db, listing));
    const items = applyListingFilters(enrichedListings, filters);
    return { listings: items };
  }

  if (method === "GET" && /^\/api\/listings\/[A-Za-z0-9-]+$/.test(url.pathname)) {
    const listingId = url.pathname.split("/").pop();
    const listing = db.listings.find((entry) => entry.id === listingId);
    if (!listing) {
      throw new ApiError(404, "Objektet hittades inte.");
    }
    return { listing: listingWithOwner(db, listing) };
  }

  if (method === "POST" && url.pathname === "/api/listings") {
    const user = resolveUserOrThrow(db);
    const payload = {
      title: body.title || "",
      district: body.district || "Norrmalm",
      county: body.county || "Stockholms län",
      address: body.address || "",
      type: body.type || "Kontor",
      priceMonthly: Number(body.priceMonthly || 0),
      sizeSqm: Number(body.sizeSqm || 0),
      capacity: Number(body.capacity || 0),
      availability: body.availability || "Ledig nu",
      term: body.term || "12 månader",
      responseHours: Number(body.responseHours || 2),
      verified: Boolean(body.verified),
      isBostadsratt: Boolean(body.isBostadsratt),
      score: Number(body.score || 72),
      image: body.image || body.coverImage || "/object-images/object-1.jpeg",
      images: Array.isArray(body.images) && body.images.length ? body.images : [body.image || body.coverImage || "/object-images/object-1.jpeg"],
      amenities: Array.isArray(body.amenities) ? body.amenities : parseAmenities(body.amenities),
      tags: Array.isArray(body.tags) ? body.tags : ["Ny annons"],
      ownerId: user.id,
      status: body.status || "draft",
      qualityScore: listingQualityScore(body),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      verifyRequestedAt: null
    };

    const listing = {
      id: slugId("L"),
      ...payload
    };

    const duplicateWarning = duplicateSignal(db, listing);
    db.listings.unshift(listing);
    writeDb(db);

    return {
      listing: listingWithOwner(db, listing),
      qualityScore: listing.qualityScore,
      duplicateWarning
    };
  }

  if (method === "PATCH" && /^\/api\/listings\/[A-Za-z0-9-]+$/.test(url.pathname)) {
    const user = resolveUserOrThrow(db);
    const listingId = url.pathname.split("/").pop();
    const listing = db.listings.find((entry) => entry.id === listingId);

    if (!listing) {
      throw new ApiError(404, "Objektet hittades inte.");
    }

    if (listing.ownerId !== user.id) {
      throw new ApiError(403, "Du kan bara uppdatera dina egna objekt.");
    }

    Object.assign(listing, {
      ...body,
      qualityScore: listingQualityScore({ ...listing, ...body }),
      updatedAt: nowIso()
    });

    writeDb(db);
    return {
      listing: listingWithOwner(db, listing),
      qualityScore: listing.qualityScore,
      duplicateWarning: duplicateSignal(db, listing, listing.id)
    };
  }

  if (method === "DELETE" && /^\/api\/listings\/[A-Za-z0-9-]+$/.test(url.pathname)) {
    const user = resolveUserOrThrow(db);
    const listingId = url.pathname.split("/").pop();
    const listing = db.listings.find((entry) => entry.id === listingId);

    if (!listing) {
      throw new ApiError(404, "Objektet hittades inte.");
    }

    if (listing.ownerId !== user.id) {
      throw new ApiError(403, "Du kan bara radera dina egna objekt.");
    }

    db.listings = db.listings.filter((entry) => entry.id !== listingId);
    db.favorites = db.favorites.filter((entry) => entry.listingId !== listingId);
    db.viewings = db.viewings.filter((entry) => entry.listingId !== listingId);
    db.leads = db.leads.filter((entry) => entry.listingId !== listingId);
    writeDb(db);

    return { ok: true };
  }

  if (method === "POST" && /^\/api\/listings\/[A-Za-z0-9-]+\/publish$/.test(url.pathname)) {
    const user = resolveUserOrThrow(db);
    const listingId = url.pathname.split("/")[3];
    const listing = db.listings.find((entry) => entry.id === listingId);

    if (!listing) {
      throw new ApiError(404, "Objektet hittades inte.");
    }

    if (listing.ownerId !== user.id) {
      throw new ApiError(403, "Du kan bara publicera dina egna objekt.");
    }

    if (!minimalRequiredFields(listing)) {
      throw new ApiError(422, "Fyll i rubrik, adress, typ, hyra, yta och kapacitet innan publicering.");
    }

    listing.status = "active";
    listing.updatedAt = nowIso();
    listing.qualityScore = listingQualityScore(listing);
    writeDb(db);

    return { listing: listingWithOwner(db, listing) };
  }

  if (method === "POST" && /^\/api\/listings\/[A-Za-z0-9-]+\/verify-request$/.test(url.pathname)) {
    const user = resolveUserOrThrow(db);
    const listingId = url.pathname.split("/")[3];
    const listing = db.listings.find((entry) => entry.id === listingId);

    if (!listing) {
      throw new ApiError(404, "Objektet hittades inte.");
    }

    if (listing.ownerId !== user.id) {
      throw new ApiError(403, "Du kan bara verifiera dina egna objekt.");
    }

    listing.verifyRequestedAt = nowIso();
    writeDb(db);
    return { listing: listingWithOwner(db, listing) };
  }

  if (method === "GET" && url.pathname === "/api/favorites") {
    const user = resolveUserOrThrow(db);
    const favorites = db.favorites
      .filter((entry) => entry.userId === user.id)
      .map((entry) => {
        const listing = db.listings.find((item) => item.id === entry.listingId);
        return {
          ...entry,
          listing: listing ? listingWithOwner(db, listing) : null
        };
      })
      .filter((entry) => Boolean(entry.listing));

    return { favorites };
  }

  if (method === "POST" && /^\/api\/favorites\/[A-Za-z0-9-]+$/.test(url.pathname)) {
    const user = resolveUserOrThrow(db);
    const listingId = url.pathname.split("/").pop();

    const existing = db.favorites.find((entry) => entry.userId === user.id && entry.listingId === listingId);
    if (!existing) {
      db.favorites.unshift({
        id: slugId("fav"),
        userId: user.id,
        listingId,
        createdAt: nowIso()
      });
    }

    writeDb(db);
    return { ok: true };
  }

  if (method === "DELETE" && /^\/api\/favorites\/[A-Za-z0-9-]+$/.test(url.pathname)) {
    const user = resolveUserOrThrow(db);
    const listingId = url.pathname.split("/").pop();

    db.favorites = db.favorites.filter((entry) => !(entry.userId === user.id && entry.listingId === listingId));
    writeDb(db);
    return { ok: true };
  }

  if (method === "POST" && url.pathname === "/api/viewings") {
    const user = resolveUserOrThrow(db);

    const listing = db.listings.find((entry) => entry.id === body.listingId);
    if (!listing) {
      throw new ApiError(404, "Objektet hittades inte.");
    }

    const preferredSlots = Array.isArray(body.preferredSlots) ? body.preferredSlots : [];

    const viewing = {
      id: slugId("vw"),
      listingId: listing.id,
      renterId: user.id,
      preferredSlots,
      message: body.message || "",
      budget: Number(body.budget || 0),
      teamSize: Number(body.teamSize || 0),
      status: "Ny",
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    db.viewings.unshift(viewing);

    const tags = qualifyLead(listing, viewing);
    db.leads.unshift({
      id: slugId("lead"),
      listingId: listing.id,
      renterId: user.id,
      publisherId: listing.ownerId,
      status: "Ny",
      fitScore: Math.max(61, 70 + tags.length * 8),
      tags,
      notes: "Skapad från visningsförfrågan",
      createdAt: nowIso(),
      updatedAt: nowIso()
    });

    writeDb(db);
    return { viewing };
  }

  if (method === "GET" && url.pathname === "/api/viewings") {
    const user = resolveUserOrThrow(db);

    const viewings = db.viewings
      .filter((entry) => entry.renterId === user.id)
      .map((entry) => ({
        ...entry,
        listing: listingWithOwner(db, db.listings.find((item) => item.id === entry.listingId))
      }));

    return { viewings };
  }

  if (method === "GET" && url.pathname === "/api/leads") {
    const user = resolveUserOrThrow(db);
    const leads = db.leads
      .filter((entry) => entry.publisherId === user.id)
      .map((entry) => ({
        ...entry,
        listing: listingWithOwner(db, db.listings.find((item) => item.id === entry.listingId)),
        renter: sanitizeUser(db.users.find((item) => item.id === entry.renterId))
      }));

    return { leads };
  }

  if (method === "PATCH" && /^\/api\/leads\/[A-Za-z0-9-]+$/.test(url.pathname)) {
    const user = resolveUserOrThrow(db);
    const leadId = url.pathname.split("/").pop();
    const lead = db.leads.find((entry) => entry.id === leadId);

    if (!lead) {
      throw new ApiError(404, "Intresseanmälan hittades inte.");
    }

    if (lead.publisherId !== user.id) {
      throw new ApiError(403, "Du kan bara uppdatera dina egna intresseanmälningar.");
    }

    lead.status = body.status || lead.status;
    lead.notes = body.notes ?? lead.notes;
    lead.updatedAt = nowIso();

    db.viewings = db.viewings.map((viewing) => {
      if (viewing.listingId === lead.listingId && viewing.renterId === lead.renterId) {
        return {
          ...viewing,
          status: lead.status,
          updatedAt: nowIso()
        };
      }
      return viewing;
    });

    writeDb(db);
    return { lead };
  }

  if (method === "POST" && url.pathname === "/api/ai/search") {
    const filters = body.currentFilters || {};
    const parsed = parseNeedsFromPrompt(body.prompt || "");
    const merged = {
      ...filters,
      ...parsed
    };

    const matches = applyListingFilters(db.listings.filter((entry) => entry.status === "active"), merged).slice(0, 3);

    db.aiPrompts.unshift({
      id: slugId("ai"),
      prompt: body.prompt || "",
      userId: readSession()?.userId || "anonymous",
      createdAt: nowIso()
    });
    db.aiPrompts = db.aiPrompts.slice(0, 50);
    writeDb(db);

    return {
      suggestedFilters: merged,
      topListingIds: matches.map((item) => item.id),
      explanation:
        matches.length > 0
          ? `Tillämpade AI-filter gav ${matches.length} toppträffar.`
          : "Inga direkta träffar, testa bredare budget eller fler områden."
    };
  }

  if (method === "POST" && url.pathname === "/api/analytics/events") {
    db.analytics.unshift({
      id: slugId("evt"),
      eventName: body.eventName,
      payload: body.payload || {},
      timestamp: body.timestamp || nowIso(),
      userId: readSession()?.userId || "anonymous"
    });
    db.analytics = db.analytics.slice(0, 300);
    writeDb(db);
    return { ok: true };
  }

  throw new ApiError(404, `Ingen mock-endpoint för ${method} ${url.pathname}`);
}

export async function mockRequest(method, endpoint, body) {
  try {
    return await handleRequest(method, endpoint, body);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Något gick fel i mock-servern.");
  }
}

export function resetMockDb() {
  writeDb(defaultDb());
  writeSession(null);
}

export { ApiError, DB_KEY, SESSION_KEY };
