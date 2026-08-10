import { propertyAmenityOptions } from "./propertyAmenityIcons";

export const DEFAULT_MAX_BUDGET = 250000;

export const typeOptions = ["Kontor", "Coworking", "Kontorshotell", "Butik", "Lager", "Showroom", "Ateljé", "Klinik", "Restaurang"];
export const districtOptions = ["Alla", "Norrmalm", "Södermalm", "Vasastan", "Östermalm", "Kungsholmen", "Solna", "Sundbyberg"];
export const contractOptions = ["Alla", "Kort (0-6 mån)", "Mellan (6-12 mån)", "Lång (12+ mån)"];
export const transitOptions = ["Alla", "0-300 meter", "0-600 meter", "0-1000 meter", "0-1100 meter"];
export const parkingOptions = ["Alla", "Ingen preferens", "Bilparkering", "Laddplats", "Garage"];
export const layoutOptions = ["Alla", "Öppet landskap", "Mixat", "Cellkontor", "Flexibelt"];
export const accessOptions = ["Alla", "Kontorstid", "Utökad access", "24/7"];
export const amenityOptions = propertyAmenityOptions;

export function formatTimestamp(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Nyss";
  return parsed.toLocaleString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function buildHistoryChips(filters = {}, aiPrompt = "") {
  const chips = [];
  const query = String(filters.query || "").trim();
  const keyword = String(filters.keyword || "").trim();
  const district = String(filters.district || "").trim();
  const typeArray = Array.isArray(filters.type) ? filters.type.filter(Boolean) : [];
  const minSize = String(filters.minSize || "").trim();
  const maxSize = String(filters.maxSize || "").trim();
  const teamSize = String(filters.teamSize || "").trim();
  const minBudget = String(filters.minBudget || "").trim();
  const maxBudget = String(filters.maxBudget || "").trim();

  if (aiPrompt) chips.push(`AI: ${aiPrompt}`);
  if (query) chips.push(`Sök: ${query}`);
  if (!query && keyword) chips.push(`Sökord: ${keyword}`);
  if (district && district !== "Alla") chips.push(`Område: ${district}`);
  if (typeArray.length > 0) chips.push(`Typ: ${typeArray.join(", ")}`);
  if (teamSize) chips.push(`Platser: ${teamSize}+`);
  if (minSize || maxSize) chips.push(`Yta: ${minSize || 0}-${maxSize || "∞"} kvm`);
  if (minBudget || (maxBudget && Number(maxBudget) !== DEFAULT_MAX_BUDGET)) chips.push(`Budget: ${minBudget || 0}-${maxBudget || "∞"} kr`);
  if (filters.transitDistance) chips.push(`Kommunaltrafik: ${filters.transitDistance}`);
  if (filters.contractFlex) chips.push(`Avtal: ${filters.contractFlex}`);
  if (filters.accessHours) chips.push(`Access: ${filters.accessHours}`);
  if (filters.parkingType) chips.push(`Parkering: ${filters.parkingType}`);
  if (filters.layoutType) chips.push(`Planlösning: ${filters.layoutType}`);
  if (filters.advertiser && filters.advertiser !== "Alla") chips.push(`Hyresvärd: ${filters.advertiser}`);
  if (filters.includeOperatingCosts) chips.push("Driftkostnader ingår");
  if (filters.accessibilityAdapted) chips.push("Tillgänglighetsanpassad");
  if (filters.ecoCertified) chips.push("Miljöcertifierad");
  if (filters.verified) chips.push("Verifierade objekt");
  if (filters.readyNow) chips.push("Ledig nu");

  return chips.slice(0, 12);
}

export function buildHistoryDetails(filters = {}, aiPrompt = "") {
  const details = [];
  const query = String(filters.query || "").trim();
  const keyword = String(filters.keyword || "").trim();
  const district = String(filters.district || "").trim();
  const typeArray = Array.isArray(filters.type) ? filters.type.filter(Boolean) : [];
  const minSize = String(filters.minSize || "").trim();
  const maxSize = String(filters.maxSize || "").trim();
  const teamSize = String(filters.teamSize || "").trim();
  const minBudget = String(filters.minBudget || "").trim();
  const maxBudget = String(filters.maxBudget || "").trim();

  if (aiPrompt) details.push({ label: "AI-sök", value: aiPrompt });
  if (query || keyword) details.push({ label: "Söktext", value: query || keyword });
  if (district && district !== "Alla") details.push({ label: "Område", value: district });
  if (typeArray.length > 0) details.push({ label: "Typ", value: typeArray.join(", ") });
  if (teamSize) details.push({ label: "Team", value: `${teamSize} platser` });
  if (minSize || maxSize) details.push({ label: "Yta", value: `${minSize || "0"}-${maxSize || "∞"} kvm` });
  if (minBudget || (maxBudget && Number(maxBudget) !== DEFAULT_MAX_BUDGET)) details.push({ label: "Budget", value: `${minBudget || "0"}-${maxBudget || "∞"} kr` });
  if (filters.moveInDate) details.push({ label: "Inflyttning", value: filters.moveInDate });
  if (filters.transitDistance) details.push({ label: "Kommunaltrafik", value: filters.transitDistance });

  return details.slice(0, 8);
}

export function buildRentSearchUrl(filters = {}, { aiPrompt = "" } = {}) {
  const params = new URLSearchParams();
  const query = String(filters.query || "").trim();
  const keyword = String(filters.keyword || "").trim();
  const district = String(filters.district || "").trim();
  const typeArray = Array.isArray(filters.type) ? filters.type.filter(Boolean) : [];
  const minSize = String(filters.minSize || "").trim();
  const maxSize = String(filters.maxSize || "").trim();
  const teamSize = String(filters.teamSize || "").trim();
  const minBudget = String(filters.minBudget || "").trim();
  const maxBudget = String(filters.maxBudget || "").trim();

  params.set("run", "1");
  if (query) params.set("query", query);
  else if (keyword) params.set("query", keyword);
  if (district && district !== "Alla") params.set("district", district);
  if (typeArray[0]) params.set("type", typeArray[0]);
  if (minSize) params.set("minSize", minSize);
  if (maxSize) params.set("maxSize", maxSize);
  if (teamSize) params.set("teamSize", teamSize);
  if (minBudget) params.set("minBudget", minBudget);
  if (maxBudget && Number(maxBudget) !== DEFAULT_MAX_BUDGET) params.set("maxBudget", maxBudget);
  if (filters.transitDistance) params.set("transitDistance", filters.transitDistance);
  if (filters.moveInDate) params.set("moveInDate", filters.moveInDate);
  if (filters.contractFlex) params.set("contractFlex", filters.contractFlex);
  if (filters.accessHours) params.set("accessHours", filters.accessHours);
  if (filters.parkingType) params.set("parkingType", filters.parkingType);
  if (filters.layoutType) params.set("layoutType", filters.layoutType);
  if (filters.advertiser && filters.advertiser !== "Alla") params.set("advertiser", filters.advertiser);
  if (filters.includeOperatingCosts) params.set("includeOperatingCosts", "1");
  if (filters.accessibilityAdapted) params.set("accessibilityAdapted", "1");
  if (filters.ecoCertified) params.set("ecoCertified", "1");
  if (filters.verified) params.set("verified", "1");
  if (filters.readyNow) params.set("readyNow", "1");
  if (aiPrompt) {
    params.set("ai", "1");
    params.set("aiPrompt", aiPrompt);
  }
  return `/app/rent?${params.toString()}`;
}

export function listFromDelimitedValue(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseDistrictSelection(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeAmenity(value) {
  return String(value || "").trim().toLowerCase();
}

export function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "-";
  return `${amount.toLocaleString("sv-SE")} kr`;
}

export function hasProgramInput(program = {}) {
  return [
    program.title,
    program.district,
    program.type,
    program.teamSize,
    program.minSize,
    program.maxSize,
    program.minBudget,
    program.maxBudget,
    program.moveInDate,
    program.contractFlex,
    program.transitDistance,
    program.accessHours,
    program.parkingType,
    program.layoutType,
    program.amenities,
    program.includeOperatingCosts,
    program.accessibilityAdapted,
    program.ecoCertified
  ].some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(String(value || "").trim() || value === true);
  });
}

export function normalizeProgram(program = {}, fallbackIndex = 0) {
  const type = Array.isArray(program.type) ? program.type.filter(Boolean) : listFromDelimitedValue(program.type);
  return {
    id: String(program.id || `program-${fallbackIndex + 1}`),
    title: String(program.title || "").trim() || `Lokalprogram ${fallbackIndex + 1}`,
    district: program.district || "Alla",
    type,
    teamSize: program.teamSize || "",
    minSize: program.minSize || "",
    maxSize: program.maxSize || "",
    minBudget: program.minBudget || "",
    maxBudget: program.maxBudget || "",
    moveInDate: program.moveInDate || "",
    contractFlex: program.contractFlex || "",
    transitDistance: program.transitDistance || "",
    accessHours: program.accessHours || "",
    parkingType: program.parkingType || "",
    layoutType: program.layoutType || "",
    includeOperatingCosts: Boolean(program.includeOperatingCosts),
    accessibilityAdapted: Boolean(program.accessibilityAdapted),
    ecoCertified: Boolean(program.ecoCertified),
    amenities: program.amenities || ""
  };
}

export function normalizeProgramList(profile = {}) {
  if (Array.isArray(profile.renterPrograms) && profile.renterPrograms.length > 0) {
    return profile.renterPrograms.map((program, index) => normalizeProgram(program, index));
  }
  if (profile.renterProgram && hasProgramInput(profile.renterProgram)) {
    return [normalizeProgram(profile.renterProgram, 0)];
  }
  return [];
}

export function createBlankProgram(index = 0) {
  return normalizeProgram({
    id: `program-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: `Lokalprogram ${index + 1}`,
    district: "Alla"
  }, index);
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Kunde inte läsa filen."));
    reader.readAsDataURL(file);
  });
}

export async function readOptimizedProfileImage(file) {
  const rawDataUrl = await readFileAsDataUrl(file);
  if (!rawDataUrl.startsWith("data:image/")) return rawDataUrl;

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const maxDimension = 1200;
      const sourceWidth = image.naturalWidth || image.width || maxDimension;
      const sourceHeight = image.naturalHeight || image.height || maxDimension;
      const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
      const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
      const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        resolve(rawDataUrl);
        return;
      }

      context.drawImage(image, 0, 0, targetWidth, targetHeight);
      const compressed = canvas.toDataURL("image/jpeg", 0.82);
      resolve(compressed || rawDataUrl);
    };
    image.onerror = () => resolve(rawDataUrl);
    image.src = rawDataUrl;
  });
}

export function isFilled(value, { disallowAll = false } = {}) {
  if (Array.isArray(value)) {
    const clean = value.map((item) => String(item || "").trim()).filter(Boolean);
    if (clean.length === 0) return false;
    return disallowAll ? !clean.every((item) => item.toLowerCase() === "alla") : true;
  }
  const text = String(value ?? "").trim();
  if (!text) return false;
  if (disallowAll && text.toLowerCase() === "alla") return false;
  return true;
}
