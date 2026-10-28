import { parseAmenities } from "./formatters";

// Shape of a listing while it is being written, whether typed by hand or extracted from documents.
export const initialDraft = {
  title: "",
  district: "Norrmalm",
  address: "",
  type: "Kontor",
  description: "",
  priceMonthly: "",
  sizeSqm: "",
  capacity: "",
  term: "12 månader",
  availability: "Ledig nu",
  responseHours: "2",
  transitDistance: "",
  moveInDate: "",
  contractFlex: "",
  accessHours: "",
  parkingType: "",
  layoutType: "",
  includeOperatingCosts: false,
  accessibilityAdapted: false,
  ecoCertified: false,
  images: [
    {
      id: "seed-cover",
      src: "/object-images/object-4.jpeg",
      name: "Omslagsbild"
    }
  ],
  amenities: ["Mötesrum", "Fiber", "Kök"],
  additionalAmenities: "",
  furnished: "all"
};

export function toNumber(value) {
  return Number(value || 0);
}

export function mergeAmenities(draft) {
  const textAmenities = parseAmenities(draft.additionalAmenities);
  const furnishedAmenity = draft.furnished === "yes"
    ? ["Möblerad"]
    : draft.furnished === "no"
      ? ["Omöblerad"]
      : [];
  return Array.from(new Set([...(draft.amenities || []), ...textAmenities, ...furnishedAmenity]));
}

export function computeQualityScore(draft) {
  let score = 0;
  if (draft.title.trim()) score += 14;
  if (draft.address.trim()) score += 12;
  if (draft.district) score += 8;
  if (draft.type) score += 8;
  if (toNumber(draft.priceMonthly) > 0) score += 14;
  if (toNumber(draft.sizeSqm) > 0) score += 12;
  if (toNumber(draft.capacity) > 0) score += 10;
  if (draft.term) score += 5;
  if (draft.availability) score += 5;
  if (toNumber(draft.responseHours) > 0) score += 4;
  if (draft.transitDistance) score += 3;
  if (draft.moveInDate) score += 3;
  if (draft.contractFlex) score += 3;
  if (draft.accessHours) score += 2;
  if (draft.parkingType) score += 2;
  if (draft.layoutType) score += 2;
  if (draft.includeOperatingCosts) score += 2;
  if (draft.accessibilityAdapted) score += 2;
  if (draft.ecoCertified) score += 2;
  if (draft.description.trim().length >= 40) score += 10;
  if (Array.isArray(draft.images) && draft.images.length > 0) score += 8;
  if (mergeAmenities(draft).length > 0) score += 10;
  return Math.min(100, score);
}

// Steps that carry required fields, in the order the questions are asked.
export const requiredStepIds = ["title", "place", "size", "rent", "availability", "photos", "amenities", "description"];

export function getStepErrors(stepId, draft) {
  const missing = [];
  if (stepId === "title" && !draft.title.trim()) missing.push("Rubrik");
  if (stepId === "place") {
    if (!draft.address.trim()) missing.push("Adress");
    if (!draft.district) missing.push("Område");
    if (!draft.type) missing.push("Typ");
  }
  if (stepId === "size") {
    if (toNumber(draft.sizeSqm) <= 0) missing.push("Storlek");
    if (toNumber(draft.capacity) <= 0) missing.push("Team / platser");
  }
  if (stepId === "rent") {
    if (toNumber(draft.priceMonthly) <= 0) missing.push("Månadshyra");
    if (!draft.term) missing.push("Avtalstid");
  }
  if (stepId === "availability" && !draft.availability) missing.push("Tillgänglighet");
  if (stepId === "photos" && (!Array.isArray(draft.images) || draft.images.length === 0)) missing.push("Minst en bild");
  if (stepId === "amenities" && mergeAmenities(draft).length === 0) missing.push("Minst en bekvämlighet");
  if (stepId === "description" && !draft.description.trim()) missing.push("Beskrivning");
  return missing;
}

/** Every required field that is still empty, across all steps. */
export function listMissingFields(draft) {
  return requiredStepIds.flatMap((stepId) => getStepErrors(stepId, draft));
}

export function buildPayload(draft, status = "draft") {
  const imageList = Array.isArray(draft.images) ? draft.images.map((image) => image.src).filter(Boolean) : [];
  return {
    title: draft.title.trim(),
    district: draft.district,
    address: draft.address.trim(),
    type: draft.type,
    description: draft.description.trim(),
    priceMonthly: toNumber(draft.priceMonthly),
    sizeSqm: toNumber(draft.sizeSqm),
    capacity: toNumber(draft.capacity),
    term: draft.term,
    availability: draft.availability,
    responseHours: Math.max(1, toNumber(draft.responseHours || 2)),
    transitDistance: draft.transitDistance || "",
    moveInDate: draft.moveInDate || "",
    contractFlex: draft.contractFlex || "",
    accessHours: draft.accessHours || "",
    parkingType: draft.parkingType || "",
    layoutType: draft.layoutType || "",
    includeOperatingCosts: Boolean(draft.includeOperatingCosts),
    accessibilityAdapted: Boolean(draft.accessibilityAdapted),
    ecoCertified: Boolean(draft.ecoCertified),
    image: imageList[0] || "",
    images: imageList,
    amenities: mergeAmenities(draft),
    status
  };
}
