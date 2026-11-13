const districtMappings = [
  { label: "Norrmalm", variants: ["norrmalm"] },
  { label: "Södermalm", variants: ["södermalm", "sodermalm"] },
  { label: "Vasastan", variants: ["vasastan"] },
  { label: "Östermalm", variants: ["östermalm", "ostermalm"] },
  { label: "Kungsholmen", variants: ["kungsholmen"] },
  { label: "Solna", variants: ["solna"] }
];

const typeMappings = [
  { label: "Kontor", variants: ["kontor", "office"] },
  { label: "Coworking", variants: ["coworking"] },
  { label: "Studio", variants: ["studio"] },
  { label: "Butik", variants: ["butik", "retail"] },
  { label: "Klinik", variants: ["klinik", "clinic"] }
];

export function applyListingFilters(listings, filters) {
  const selectedTypes = Array.isArray(filters.type)
    ? filters.type
    : (typeof filters.type === "string" && filters.type !== "Alla" ? filters.type.split(",").map((item) => item.trim()).filter(Boolean) : []);

  const maxAgeDays = Number(filters.daysOnMarket || 0);

  return listings
    .filter((listing) => {
      if (filters.county && filters.county !== "Alla" && listing.county && filters.county !== listing.county) {
        return false;
      }

      if (filters.query) {
        const q = filters.query.toLowerCase();
        const haystack = `${listing.title} ${listing.address} ${listing.district} ${listing.type} ${listing.county || ""}`.toLowerCase();
        if (!haystack.includes(q)) {
          return false;
        }
      }

      if (filters.district && filters.district !== "Alla" && listing.district !== filters.district) {
        return false;
      }

      if (selectedTypes.length > 0 && !selectedTypes.includes(listing.type)) {
        return false;
      }

      if (filters.minSize && Number(listing.sizeSqm || 0) < Number(filters.minSize || 0)) {
        return false;
      }

      if (filters.maxSize && Number(listing.sizeSqm || 0) > Number(filters.maxSize || 0)) {
        return false;
      }

      if (filters.maxBudget && listing.priceMonthly > Number(filters.maxBudget)) {
        return false;
      }

      if (filters.requirePrice && Number(listing.priceMonthly || 0) <= 0) {
        return false;
      }

      if (filters.teamSize && listing.capacity < Number(filters.teamSize)) {
        return false;
      }

      if (filters.onlyBostadsratt && !listing.isBostadsratt) {
        return false;
      }

      if (filters.keyword) {
        const keyword = String(filters.keyword).toLowerCase();
        const amenityText = Array.isArray(listing.amenities) ? listing.amenities.join(" ") : "";
        const haystack = `${listing.title} ${listing.address} ${amenityText}`.toLowerCase();
        if (!haystack.includes(keyword)) {
          return false;
        }
      }

      if (filters.advertiser && filters.advertiser !== "Alla" && listing.advertiserName !== filters.advertiser) {
        return false;
      }

      if (maxAgeDays > 0) {
        const createdAt = new Date(listing.createdAt || 0).getTime();
        const ageDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
        if (!Number.isFinite(ageDays) || ageDays > maxAgeDays) {
          return false;
        }
      }

      if (filters.onlyVerified && !listing.verified) {
        return false;
      }

      if (filters.readyNow) {
        const availability = listing.availability.toLowerCase();
        if (!availability.includes("ledig") && !availability.includes("ready")) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => b.score - a.score);
}

export function parseNeedsFromPrompt(prompt) {
  const normalized = prompt.toLowerCase();
  const parsed = {};

  const districtMatch = districtMappings.find((entry) => entry.variants.some((variant) => normalized.includes(variant)));
  if (districtMatch) {
    parsed.district = districtMatch.label;
  }

  const typeMatch = typeMappings.find((entry) => entry.variants.some((variant) => normalized.includes(variant)));
  if (typeMatch) {
    parsed.type = typeMatch.label;
  }

  const budgetPatterns = [
    /under\s*(\d{2,6})\s*(kr|sek|k)?/,
    /max\s*(\d{2,6})\s*(kr|sek|k)?/,
    /högst\s*(\d{2,6})\s*(kr|sek|k)?/,
    /(\d{2,6})\s*(kr|sek|k)\s*budget/
  ];

  for (const pattern of budgetPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const base = Number(match[1]);
      parsed.maxBudget = match[2] === "k" ? base * 1000 : base;
      break;
    }
  }

  const peopleMatch = normalized.match(/(\d{1,3})\s*(personer|platser|team|seats|people|persons)/);
  if (peopleMatch) {
    parsed.teamSize = Number(peopleMatch[1]);
  }

  if (
    normalized.includes("ledig nu") ||
    normalized.includes("inflytt nu") ||
    normalized.includes("omgående") ||
    normalized.includes("asap") ||
    normalized.includes("ready now")
  ) {
    parsed.readyNow = true;
  }

  if (normalized.includes("verifierad") || normalized.includes("verified") || normalized.includes("trygg")) {
    parsed.onlyVerified = true;
  }

  return parsed;
}
