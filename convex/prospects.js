import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import {
  assertViewerHasRole,
  companyBrokerUserIds,
  findListingByPublicId,
  findOwnedListingOrThrow,
  findOwnedProspectOrThrow,
  findUserByPublicId,
  findViewableProspectOrThrow,
  getViewerOrThrow,
  nowIso,
  resolveProspectSectionsForDisplay,
  slugId,
  stripSystemFields,
  userCompanyId
} from "./lib.js";

function toListingSummary(listing) {
  if (!listing) return null;
  return {
    address: listing.address,
    district: listing.district,
    county: listing.county,
    type: listing.type,
    sizeSqm: listing.sizeSqm,
    capacity: listing.capacity,
    priceMonthly: listing.priceMonthly,
    availability: listing.availability,
    term: listing.term,
    amenities: listing.amenities || [],
    tags: listing.tags || []
  };
}

function toAttachmentPayload(entry, index) {
  return {
    storageId: entry.storageId,
    fileName: String(entry.fileName || "Bilaga"),
    ...(entry.contentType ? { contentType: entry.contentType } : {}),
    order: typeof entry.order === "number" ? entry.order : index
  };
}

// Mirrors STRUCTURED_FIELD_SCHEMAS in src/components/app/ProspectEditorSections.jsx —
// keep the label wording in sync so seeded body text matches what the editor composes.
const STRUCTURED_FIELD_LABELS = {
  contact: [["firstName", "Förnamn"], ["lastName", "Efternamn"], ["phone", "Telefon"], ["email", "E-post"]],
  terms: [["term", "Hyrestid"], ["noticePeriod", "Uppsägningstid"], ["deposit", "Deposition"]],
  location: [["transit", "Kollektivtrafik"], ["parking", "Parkering"], ["neighborhood", "Närområde"]]
};

function composeBodyFromFields(kind, fields) {
  const labels = STRUCTURED_FIELD_LABELS[kind];
  if (!labels) return null;
  return labels
    .map(([key, label]) => (fields?.[key] ? `${label}: ${fields[key]}` : ""))
    .filter(Boolean)
    .join("\n");
}

function toSectionPayload(entry, index) {
  const fields = entry.fields && typeof entry.fields === "object" ? entry.fields : undefined;
  return {
    id: entry.id || slugId("section"),
    kind: entry.kind || "custom",
    title: String(entry.title || ""),
    body: String(entry.body || ""),
    ...(fields ? { fields } : {}),
    order: typeof entry.order === "number" ? entry.order : index,
    attachments: Array.isArray(entry.attachments) ? entry.attachments.map(toAttachmentPayload) : []
  };
}

function normalizeSections(sections) {
  return Array.isArray(sections) ? sections.map(toSectionPayload) : [];
}

function seedSectionsFromListing(listing, ownerUser) {
  const overviewLines = [
    listing.sizeSqm ? `${listing.sizeSqm} kvm` : "",
    listing.capacity ? `${listing.capacity} arbetsplatser` : "",
    listing.priceMonthly ? `${listing.priceMonthly} kr/månad` : "",
    listing.availability ? `Tillträde: ${listing.availability}` : ""
  ].filter(Boolean).join("\n");

  const termsFields = listing.term ? { term: listing.term } : {};
  const [ownerFirstName, ...ownerLastNameParts] = String(ownerUser?.name || "").trim().split(/\s+/).filter(Boolean);
  const ownerLastName = ownerLastNameParts.join(" ");
  const contactFields = {
    ...(ownerFirstName ? { firstName: ownerFirstName } : {}),
    ...(ownerLastName ? { lastName: ownerLastName } : {}),
    ...(ownerUser?.phone ? { phone: ownerUser.phone } : {}),
    ...(ownerUser?.email ? { email: ownerUser.email } : {})
  };

  return [
    {
      id: slugId("section"),
      kind: "overview",
      title: "Objektsöversikt",
      body: [listing.address, overviewLines].filter(Boolean).join("\n\n"),
      order: 0,
      attachments: []
    },
    {
      id: slugId("section"),
      kind: "description",
      title: "Lokalbeskrivning",
      body: "",
      order: 1,
      attachments: []
    },
    {
      id: slugId("section"),
      kind: "terms",
      title: "Hyresvillkor",
      body: composeBodyFromFields("terms", termsFields) || "",
      fields: termsFields,
      order: 2,
      attachments: []
    },
    {
      id: slugId("section"),
      kind: "location",
      title: "Läge & kommunikationer",
      body: "",
      fields: {},
      order: 3,
      attachments: []
    },
    {
      id: slugId("section"),
      kind: "contact",
      title: "Kontaktperson",
      body: composeBodyFromFields("contact", contactFields) || "",
      fields: contactFields,
      order: 4,
      attachments: []
    },
    {
      id: slugId("section"),
      kind: "materials",
      title: "Bilagor & presentationsmaterial",
      body: "",
      order: 5,
      attachments: []
    }
  ];
}

export const generateUploadUrl = mutationGeneric({
  args: {},
  handler: async (ctx) => {
    await getViewerOrThrow(ctx);
    return { uploadUrl: await ctx.storage.generateUploadUrl() };
  }
});

export const create = mutationGeneric({
  args: {
    listingId: v.string(),
    title: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { viewer, listing } = await findOwnedListingOrThrow(ctx, args?.listingId || "");
    assertViewerHasRole(viewer, "publisher");

    const ownerUser = listing.ownerId === viewer.id ? viewer : (await findUserByPublicId(ctx, listing.ownerId)) || viewer;
    const createdAt = nowIso();
    const companyId = listing.companyId || userCompanyId(viewer);
    const prospect = {
      id: slugId("prospect"),
      listingId: listing.id,
      title: args?.title?.trim() || `Prospekt – ${listing.title}`,
      status: "draft",
      currentVersion: 0,
      draftSections: seedSectionsFromListing(listing, ownerUser),
      publishedSections: [],
      ownerId: viewer.id,
      ...(companyId ? { companyId } : {}),
      createdAt,
      updatedAt: createdAt
    };

    await ctx.db.insert("prospects", prospect);
    return { prospect };
  }
});

export const saveDraft = mutationGeneric({
  args: {
    id: v.string(),
    title: v.optional(v.string()),
    sections: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const { prospect } = await findOwnedProspectOrThrow(ctx, args?.id || "");
    const patch = {
      title: args?.title?.trim() || prospect.title,
      draftSections: normalizeSections(args?.sections ?? prospect.draftSections),
      updatedAt: nowIso()
    };

    await ctx.db.patch(prospect._id, patch);
    return { prospect: { ...stripSystemFields(prospect), ...patch } };
  }
});

export const publishVersion = mutationGeneric({
  args: {
    id: v.string(),
    changeSummary: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { viewer, prospect } = await findOwnedProspectOrThrow(ctx, args?.id || "");
    const versionNumber = (prospect.currentVersion || 0) + 1;
    const createdAt = nowIso();

    await ctx.db.insert("prospectVersions", {
      id: slugId("pv"),
      prospectId: prospect.id,
      versionNumber,
      title: prospect.title,
      sectionsSnapshot: prospect.draftSections,
      authorId: viewer.id,
      ...(args?.changeSummary?.trim() ? { changeSummary: args.changeSummary.trim() } : {}),
      createdAt
    });

    const patch = {
      status: "published",
      currentVersion: versionNumber,
      publishedSections: prospect.draftSections,
      updatedAt: createdAt
    };

    await ctx.db.patch(prospect._id, patch);
    return { prospect: { ...stripSystemFields(prospect), ...patch } };
  }
});

export const archive = mutationGeneric({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const { prospect } = await findOwnedProspectOrThrow(ctx, args?.id || "");
    const patch = { status: "archived", updatedAt: nowIso() };
    await ctx.db.patch(prospect._id, patch);
    return { prospect: { ...stripSystemFields(prospect), ...patch } };
  }
});

export const get = queryGeneric({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const { prospect, hasEditAccess } = await findViewableProspectOrThrow(ctx, args?.id || "");
    const publishedSections = await resolveProspectSectionsForDisplay(ctx, prospect.publishedSections);
    const listing = hasEditAccess ? await findListingByPublicId(ctx, prospect.listingId) : null;

    return {
      prospect: {
        ...stripSystemFields(prospect),
        ...(hasEditAccess
          ? { draftSections: await resolveProspectSectionsForDisplay(ctx, prospect.draftSections) }
          : { draftSections: [] }),
        publishedSections,
        listingSummary: toListingSummary(listing)
      },
      hasEditAccess
    };
  }
});

export const listMine = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerOrThrow(ctx);
    const owned = await ctx.db
      .query("prospects")
      .withIndex("by_owner_id", (query) => query.eq("ownerId", viewer.id))
      .collect();

    return { prospects: owned.map(stripSystemFields) };
  }
});

export const listForListing = queryGeneric({
  args: { listingId: v.string() },
  handler: async (ctx, args) => {
    await findOwnedListingOrThrow(ctx, args?.listingId || "");
    const prospects = await ctx.db
      .query("prospects")
      .withIndex("by_listing_id", (query) => query.eq("listingId", args?.listingId || ""))
      .collect();

    return { prospects: prospects.map(stripSystemFields) };
  }
});

export const listForCompany = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerOrThrow(ctx);
    const viewerCompanyId = userCompanyId(viewer);
    const brokerUserIds = await companyBrokerUserIds(ctx, viewer);

    const ownProspects = await ctx.db
      .query("prospects")
      .withIndex("by_owner_id", (query) => query.eq("ownerId", viewer.id))
      .collect();

    const companyProspects = viewerCompanyId ? await ctx.db.query("prospects").collect() : [];
    const visibleCompanyProspects = companyProspects.filter((prospect) => (
      (viewerCompanyId && prospect.companyId === viewerCompanyId)
      || brokerUserIds.has(prospect.ownerId)
    ));

    const merged = [...ownProspects, ...visibleCompanyProspects]
      .filter((prospect, index, list) => list.findIndex((item) => item.id === prospect.id) === index);

    return { prospects: merged.map(stripSystemFields) };
  }
});

export const listVersions = queryGeneric({
  args: { prospectId: v.string() },
  handler: async (ctx, args) => {
    await findViewableProspectOrThrow(ctx, args?.prospectId || "");
    const versions = await ctx.db
      .query("prospectVersions")
      .withIndex("by_prospect_id", (query) => query.eq("prospectId", args?.prospectId || ""))
      .order("desc")
      .take(200);

    return { versions: versions.map(stripSystemFields) };
  }
});

export const restoreVersion = mutationGeneric({
  args: {
    prospectId: v.string(),
    versionNumber: v.number()
  },
  handler: async (ctx, args) => {
    const { prospect } = await findOwnedProspectOrThrow(ctx, args?.prospectId || "");
    const version = await ctx.db
      .query("prospectVersions")
      .withIndex("by_prospect_version", (query) =>
        query.eq("prospectId", prospect.id).eq("versionNumber", args?.versionNumber || 0)
      )
      .unique();

    if (!version) {
      throw new Error("Versionen hittades inte.");
    }

    const patch = {
      draftSections: version.sectionsSnapshot,
      title: version.title,
      updatedAt: nowIso()
    };

    await ctx.db.patch(prospect._id, patch);
    return { prospect: { ...stripSystemFields(prospect), ...patch } };
  }
});
