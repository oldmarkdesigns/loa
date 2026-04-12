import { useEffect, useMemo, useRef, useState } from "react";
import ListingVisualCard from "../../components/app/ListingVisualCard";
import {
  ArrowLeftIcon,
  BalconyIcon,
  BikeIcon,
  BuildingIcon,
  CalendarIcon,
  CarIcon,
  ClockIcon,
  CoinsIcon,
  DumbbellIcon,
  EyeIcon,
  LockerIcon,
  LightbulbIcon,
  LoungeIcon,
  MapIcon,
  PenthouseIcon,
  PencilIcon,
  PinIcon,
  RooftopIcon,
  RulerIcon,
  ShieldIcon,
  SnowflakeIcon,
  SwitchHorizontalIcon,
  TrashIcon,
  CameraIcon,
  UserIcon,
  UtensilsIcon,
  WifiIcon
} from "../../components/icons/UiIcons";
import { navigateTo } from "../../lib/router";

const DEFAULT_MAX_BUDGET = 250000;
const typeOptions = ["Kontor", "Coworking", "Kontorshotell", "Butik", "Lager", "Showroom", "Ateljé", "Klinik", "Restaurang"];
const districtOptions = ["Alla", "Norrmalm", "Södermalm", "Vasastan", "Östermalm", "Kungsholmen", "Solna", "Sundbyberg"];
const contractOptions = ["Alla", "Kort (0-6 mån)", "Mellan (6-12 mån)", "Lång (12+ mån)"];
const transitOptions = ["Alla", "0-300 meter", "0-600 meter", "0-1000 meter", "0-1100 meter"];
const parkingOptions = ["Alla", "Ingen preferens", "Bilparkering", "Laddplats", "Garage"];
const layoutOptions = ["Alla", "Öppet landskap", "Mixat", "Cellkontor", "Flexibelt"];
const accessOptions = ["Alla", "Kontorstid", "Utökad access", "24/7"];
const amenityOptions = [
  { value: "Cykelförråd", label: "Cykelförråd", icon: BikeIcon },
  { value: "Garage", label: "Garage", icon: CarIcon },
  { value: "Kök", label: "Kök", icon: UtensilsIcon },
  { value: "Mötesrum", label: "Mötesrum", icon: BuildingIcon },
  { value: "Fiber", label: "Fiber", icon: WifiIcon },
  { value: "Reception", label: "Reception", icon: UserIcon },
  { value: "Balkong", label: "Balkong", icon: BalconyIcon },
  { value: "Takterrass", label: "Takterrass", icon: RooftopIcon },
  { value: "Takvåning", label: "Takvåning", icon: PenthouseIcon },
  { value: "Gym", label: "Gym", icon: DumbbellIcon },
  { value: "Omklädningsrum", label: "Omklädningsrum", icon: LockerIcon },
  { value: "Air condition", label: "Air condition", icon: SnowflakeIcon },
  { value: "Lounge", label: "Lounge", icon: LoungeIcon },
  { value: "Förråd", label: "Förråd", icon: LockerIcon },
  { value: "Lastzon", label: "Lastzon", icon: CarIcon },
  { value: "Telefonbås", label: "Telefonbås", icon: BuildingIcon },
  { value: "Väntrum", label: "Väntrum", icon: UserIcon },
  { value: "Pentry", label: "Pentry", icon: UtensilsIcon },
  { value: "Skyltfönster", label: "Skyltfönster", icon: BuildingIcon },
  { value: "Säkerhetsdörr", label: "Säkerhetsdörr", icon: ShieldIcon }
];

function formatTimestamp(value) {
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

function buildHistoryChips(filters = {}, aiPrompt = "") {
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

function buildHistoryDetails(filters = {}, aiPrompt = "") {
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

function buildRentSearchUrl(filters = {}, { aiPrompt = "" } = {}) {
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

function listFromDelimitedValue(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeAmenity(value) {
  return String(value || "").trim().toLowerCase();
}

function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "-";
  return `${amount.toLocaleString("sv-SE")} kr`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Kunde inte läsa filen."));
    reader.readAsDataURL(file);
  });
}

async function readOptimizedProfileImage(file) {
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

function isFilled(value, { disallowAll = false } = {}) {
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

function preferenceMatchScore(listing, renterProgram = {}) {
  const preferredTypes = listFromDelimitedValue(renterProgram.type);
  const desiredAmenities = listFromDelimitedValue(renterProgram.amenities).map((item) => item.toLowerCase());
  const listingAmenities = Array.isArray(listing.amenities) ? listing.amenities.map((item) => String(item || "").toLowerCase()) : [];

  let score = 0;
  let max = 0;

  if (renterProgram.district && renterProgram.district !== "Alla") {
    max += 22;
    if (listing.district === renterProgram.district) score += 22;
  }

  if (preferredTypes.length > 0) {
    max += 20;
    if (preferredTypes.includes(listing.type)) score += 20;
  }

  const teamSize = Number(renterProgram.teamSize || 0);
  if (teamSize > 0) {
    max += 12;
    const capacity = Number(listing.capacity || 0);
    if (capacity >= teamSize) score += 12;
    else score += Math.max(0, 12 - (teamSize - capacity) * 2);
  }

  const minSize = Number(renterProgram.minSize || 0);
  if (minSize > 0) {
    max += 10;
    const size = Number(listing.sizeSqm || 0);
    if (size >= minSize) score += 10;
    else score += Math.max(0, 10 - Math.round((minSize - size) / 10));
  }

  const maxSize = Number(renterProgram.maxSize || 0);
  if (maxSize > 0) {
    max += 8;
    const size = Number(listing.sizeSqm || 0);
    if (size <= maxSize) score += 8;
    else score += Math.max(0, 8 - Math.round((size - maxSize) / 20));
  }

  const maxBudget = Number(renterProgram.maxBudget || 0);
  if (maxBudget > 0) {
    max += 22;
    const price = Number(listing.priceMonthly || 0);
    if (price <= maxBudget) score += 22;
    else score += Math.max(0, 22 - Math.round((price - maxBudget) / Math.max(1, maxBudget * 0.08)));
  }

  if (desiredAmenities.length > 0) {
    const amenityWeight = Math.min(6, desiredAmenities.length) * 3;
    max += amenityWeight;
    const amenityHits = desiredAmenities.filter((amenity) => listingAmenities.some((listingAmenity) => listingAmenity.includes(amenity))).length;
    if (desiredAmenities.length > 0) {
      score += Math.round((amenityHits / desiredAmenities.length) * amenityWeight);
    }
  }

  const baseComputed = max > 0 ? Math.round((score / max) * 100) : Number(listing.score || 0);
  const blended = Math.round((baseComputed * 0.7) + (Number(listing.score || 75) * 0.3));
  return Math.max(1, Math.min(99, blended));
}

function buildMatchReasons(listing, renterProgram = {}) {
  const reasons = [];
  const preferredTypes = listFromDelimitedValue(renterProgram.type);

  const maxBudget = Number(renterProgram.maxBudget || 0);
  if (maxBudget > 0 && Number(listing.priceMonthly || 0) <= maxBudget) {
    reasons.push(`Pris inom budget (${formatMoney(listing.priceMonthly)})`);
  }

  const minSize = Number(renterProgram.minSize || 0);
  if (minSize > 0 && Number(listing.sizeSqm || 0) >= minSize) {
    reasons.push(`Yta matchar (${listing.sizeSqm} kvm)`);
  }

  if (renterProgram.district && renterProgram.district !== "Alla" && listing.district === renterProgram.district) {
    reasons.push(`Läge: ${listing.district}`);
  }

  if (preferredTypes.length > 0 && preferredTypes.includes(listing.type)) {
    reasons.push(`Typ: ${listing.type}`);
  }

  return reasons.slice(0, 3);
}

function buildMissingAmenities(listing, renterProgram = {}) {
  const desiredAmenities = listFromDelimitedValue(renterProgram.amenities);
  if (desiredAmenities.length === 0) return [];
  const listingAmenities = Array.isArray(listing.amenities)
    ? listing.amenities.map((item) => String(item || "").toLowerCase())
    : [];
  return desiredAmenities.filter((amenity) => {
    const normalizedAmenity = String(amenity || "").toLowerCase();
    return !listingAmenities.some((listingAmenity) => listingAmenity.includes(normalizedAmenity));
  });
}

function ProfilePage({ app }) {
  const {
    user,
    listings = [],
    favorites = [],
    filterPresets = [],
    switchRole,
    toggleFavorite,
    deleteSavedFilter,
    updateProfile
  } = app;

  const [pendingRole, setPendingRole] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showProgramOverlay, setShowProgramOverlay] = useState(false);
  const [showTeamOverlay, setShowTeamOverlay] = useState(false);
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);
  const [isProfileSetupCollapsed, setIsProfileSetupCollapsed] = useState(false);
  const [savingProgram, setSavingProgram] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    avatarUrl: user?.profile?.avatarUrl || ""
  });
  const profileAvatarInputRef = useRef(null);
  const [teamInvite, setTeamInvite] = useState({ email: "", firstName: "", lastName: "" });
  const [teamMembers, setTeamMembers] = useState(() => {
    const seeded = Array.isArray(user?.teamMembers) ? user.teamMembers : [];
    if (seeded.length > 0) return seeded;
    return [
      {
        id: "team-owner",
        email: user?.email || "konto@foretag.se",
        firstName: (user?.name || "").split(" ")[0] || "Kontoinnehavare",
        lastName: (user?.name || "").split(" ").slice(1).join(" ") || "",
        phone: user?.phone || "",
        avatarUrl: user?.profile?.avatarUrl || "",
        status: "Aktiv"
      }
    ];
  });

  const roleSet = useMemo(() => new Set(Array.isArray(user?.roles) ? user.roles : [user?.role || "renter"]), [user?.role, user?.roles]);
  const hasRenter = roleSet.has("renter");
  const hasPublisher = roleSet.has("publisher");
  const canSwitchRoles = hasRenter && hasPublisher;
  const currentRoleLabel = useMemo(() => (user?.role === "publisher" ? "Hyresvärd" : "Hyresgäst"), [user?.role]);
  const showPublisherWorkspaceTabs = hasPublisher && user?.role === "publisher";

  const renterProgram = useMemo(() => user?.profile?.renterProgram || {}, [user?.profile?.renterProgram]);
  const preferredTypes = useMemo(() => listFromDelimitedValue(renterProgram.type), [renterProgram.type]);
  const desiredAmenities = useMemo(() => listFromDelimitedValue(renterProgram.amenities), [renterProgram.amenities]);

  const [programDraft, setProgramDraft] = useState(() => ({
    district: renterProgram.district || "Alla",
    type: preferredTypes,
    teamSize: renterProgram.teamSize || "",
    minSize: renterProgram.minSize || "",
    maxSize: renterProgram.maxSize || "",
    minBudget: renterProgram.minBudget || "",
    maxBudget: renterProgram.maxBudget || "",
    moveInDate: renterProgram.moveInDate || "",
    contractFlex: renterProgram.contractFlex || "",
    transitDistance: renterProgram.transitDistance || "",
    accessHours: renterProgram.accessHours || "",
    parkingType: renterProgram.parkingType || "",
    layoutType: renterProgram.layoutType || "",
    includeOperatingCosts: Boolean(renterProgram.includeOperatingCosts),
    accessibilityAdapted: Boolean(renterProgram.accessibilityAdapted),
    ecoCertified: Boolean(renterProgram.ecoCertified),
    amenities: renterProgram.amenities || ""
  }));
  const selectedProgramAmenities = useMemo(() => listFromDelimitedValue(programDraft.amenities), [programDraft.amenities]);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "profile" || tab === "favorites" || tab === "history") {
      setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    if (!showProgramOverlay) return;
    setProgramDraft({
      district: renterProgram.district || "Alla",
      type: preferredTypes,
      teamSize: renterProgram.teamSize || "",
      minSize: renterProgram.minSize || "",
      maxSize: renterProgram.maxSize || "",
      minBudget: renterProgram.minBudget || "",
      maxBudget: renterProgram.maxBudget || "",
      moveInDate: renterProgram.moveInDate || "",
      contractFlex: renterProgram.contractFlex || "",
      transitDistance: renterProgram.transitDistance || "",
      accessHours: renterProgram.accessHours || "",
      parkingType: renterProgram.parkingType || "",
      layoutType: renterProgram.layoutType || "",
      includeOperatingCosts: Boolean(renterProgram.includeOperatingCosts),
      accessibilityAdapted: Boolean(renterProgram.accessibilityAdapted),
      ecoCertified: Boolean(renterProgram.ecoCertified),
      amenities: renterProgram.amenities || ""
    });
  }, [showProgramOverlay, renterProgram, preferredTypes]);

  useEffect(() => {
    if (!showProfileOverlay) return;
    setProfileDraft({
      name: user?.name || "",
      phone: user?.phone || "",
      avatarUrl: user?.profile?.avatarUrl || ""
    });
  }, [showProfileOverlay, user?.name, user?.phone, user?.profile?.avatarUrl]);

  const preferenceMatches = useMemo(() => {
    if (!hasRenter || listings.length === 0) return [];
    const scored = listings.map((listing) => ({
      listing,
      matchPercent: preferenceMatchScore(listing, renterProgram),
      reasons: buildMatchReasons(listing, renterProgram),
      missingAmenities: buildMissingAmenities(listing, renterProgram)
    }));
    const ranked = scored.sort((a, b) => b.matchPercent - a.matchPercent).slice(0, 6);
    const highMatches = ranked.filter((item) => item.matchPercent >= 65);
    return highMatches.length >= 3 ? highMatches : ranked;
  }, [hasRenter, listings, renterProgram]);

  const favoriteIds = useMemo(() => new Set(favorites.map((entry) => String(entry.listingId))), [favorites]);
  const favoriteListings = useMemo(() => listings.filter((listing) => favoriteIds.has(String(listing.id))), [favoriteIds, listings]);

  const localProgramSummary = useMemo(() => {
    return [
      { key: "district", label: "Område", value: renterProgram.district || "Alla", Icon: PinIcon },
      { key: "type", label: "Typ av lokal", value: preferredTypes.length ? preferredTypes.join(", ") : "Alla typer", Icon: BuildingIcon },
      { key: "teamSize", label: "Platser", value: renterProgram.teamSize || "-", Icon: UserIcon },
      {
        key: "size",
        label: "Yta",
        value: renterProgram.minSize || renterProgram.maxSize
          ? `${renterProgram.minSize || 0}-${renterProgram.maxSize || "∞"} kvm`
          : "-",
        Icon: RulerIcon
      },
      {
        key: "budget",
        label: "Budget",
        value: renterProgram.maxBudget ? `Upp till ${formatMoney(renterProgram.maxBudget)}` : "-",
        Icon: CoinsIcon
      },
      { key: "moveInDate", label: "Inflyttning", value: renterProgram.moveInDate || "-", Icon: CalendarIcon },
      { key: "contractFlex", label: "Avtal", value: renterProgram.contractFlex || "Alla", Icon: ClockIcon },
      { key: "transit", label: "Kollektivtrafik", value: renterProgram.transitDistance || "Alla", Icon: MapIcon },
      { key: "parking", label: "Parkering", value: renterProgram.parkingType || "Alla", Icon: CarIcon },
      {
        key: "prefs",
        label: "Preferenser",
        value: [
          renterProgram.includeOperatingCosts ? "Driftkostnader" : null,
          renterProgram.accessibilityAdapted ? "Tillgänglighet" : null,
          renterProgram.ecoCertified ? "Miljöcertifierat" : null
        ].filter(Boolean).join(" · ") || "-",
        Icon: LightbulbIcon
      }
    ];
  }, [preferredTypes, renterProgram]);

  const profileSetupTasks = useMemo(() => {
    return [
      { id: "profile-photo", label: "Lägg till profilbild", done: isFilled(user?.profile?.avatarUrl), target: "profile" },
      { id: "profile-name", label: "Kontrollera namn", done: isFilled(user?.name), target: "profile" },
      { id: "profile-phone", label: "Lägg till telefon", done: isFilled(user?.phone), target: "profile" },
      { id: "profile-email", label: "E-post registrerad", done: isFilled(user?.email), target: "profile" }
    ];
  }, [user?.email, user?.name, user?.phone, user?.profile?.avatarUrl]);

  const profileSetupProgress = useMemo(() => {
    const done = profileSetupTasks.filter((item) => item.done).length;
    const total = profileSetupTasks.length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, percent };
  }, [profileSetupTasks]);
  const showProfileSetupCard = profileSetupProgress.done < profileSetupProgress.total;

  const localProgramProgress = useMemo(() => {
    if (!hasRenter) return { done: 0, total: 0, percent: 0 };
    const checks = [
      isFilled(renterProgram.district, { disallowAll: true }),
      isFilled(preferredTypes, { disallowAll: true }),
      isFilled(renterProgram.teamSize),
      isFilled(renterProgram.maxBudget) || isFilled(renterProgram.minBudget),
      isFilled(renterProgram.moveInDate),
      isFilled(renterProgram.transitDistance),
      desiredAmenities.length > 0
    ];
    const done = checks.filter(Boolean).length;
    const total = checks.length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, percent };
  }, [desiredAmenities.length, hasRenter, preferredTypes, renterProgram]);

  function activateTab(tabKey) {
    setActiveTab(tabKey);
    const params = new URLSearchParams(window.location.search);
    if (tabKey === "profile") params.delete("tab");
    else params.set("tab", tabKey);
    const nextSearch = params.toString();
    const basePath = window.location.pathname;
    window.history.replaceState(window.history.state, "", nextSearch ? `${basePath}?${nextSearch}` : basePath);
  }

  function inviteTeamMember(event) {
    event.preventDefault();
    const email = teamInvite.email.trim().toLowerCase();
    const firstName = teamInvite.firstName.trim();
    const lastName = teamInvite.lastName.trim();
    if (!email || !firstName) {
      app.pushToast?.("Fyll i e-post och förnamn för att bjuda in en användare.", "error");
      return;
    }
    const alreadyExists = teamMembers.some((member) => member.email.toLowerCase() === email);
    if (alreadyExists) {
      app.pushToast?.("Den här användaren finns redan i teamet.", "error");
      return;
    }
    setTeamMembers((prev) => [
      ...prev,
      { id: `team-${Date.now()}`, email, firstName, lastName, phone: "", avatarUrl: "", status: "Inbjuden" }
    ]);
    setTeamInvite({ email: "", firstName: "", lastName: "" });
    app.pushToast?.(`Inbjudan skickad till ${email}.`, "success");
  }

  function removeTeamMember(memberId) {
    setTeamMembers((prev) => prev.filter((member) => member.id !== memberId));
    app.pushToast?.("Användaren har tagits bort från teamet.", "success");
  }

  function updateTeamMember(memberId, patch) {
    setTeamMembers((prev) => prev.map((member) => (
      member.id === memberId ? { ...member, ...patch } : member
    )));
  }

  function openTaskEditor(target) {
    if (target === "program") {
      setShowProgramOverlay(true);
      return;
    }
    setShowTeamOverlay(true);
  }

  async function saveProfileChanges() {
    if (!updateProfile) {
      app.pushToast?.("Kunde inte spara profiländringar just nu.", "error");
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({
        name: String(profileDraft.name || "").trim(),
        phone: String(profileDraft.phone || "").trim(),
        profile: {
          ...user?.profile,
          avatarUrl: profileDraft.avatarUrl || ""
        }
      });
      app.pushToast?.("Profilen är uppdaterad.", "success");
      setShowProfileOverlay(false);
    } catch (error) {
      app.pushToast?.(error.message || "Kunde inte spara profilen.", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveProgramChanges() {
    if (!updateProfile) {
      app.pushToast?.("Kunde inte spara ändringarna just nu.", "error");
      return;
    }
    setSavingProgram(true);
    try {
      const nextProgram = {
        ...programDraft,
        type: Array.isArray(programDraft.type) ? programDraft.type.filter(Boolean) : [],
        teamSize: String(programDraft.teamSize || "").trim(),
        minSize: String(programDraft.minSize || "").trim(),
        maxSize: String(programDraft.maxSize || "").trim(),
        minBudget: String(programDraft.minBudget || "").trim(),
        maxBudget: String(programDraft.maxBudget || "").trim(),
        moveInDate: programDraft.moveInDate || "",
        contractFlex: programDraft.contractFlex || "",
        transitDistance: programDraft.transitDistance || "",
        accessHours: programDraft.accessHours || "",
        parkingType: programDraft.parkingType || "",
        layoutType: programDraft.layoutType || "",
        amenities: programDraft.amenities || ""
      };

      await updateProfile({
        profile: {
          ...user?.profile,
          renterProgram: nextProgram,
          companySize: nextProgram.teamSize,
          budgetRange: `${nextProgram.minBudget || 0}-${nextProgram.maxBudget || ""}`,
          preferredAreas: nextProgram.district || "Alla",
          moveInTimeline: nextProgram.moveInDate || ""
        }
      });
      app.pushToast?.("Lokalprogram uppdaterat.", "success");
      setShowProgramOverlay(false);
    } catch (error) {
      app.pushToast?.(error.message || "Kunde inte spara lokalprogrammet.", "error");
    } finally {
      setSavingProgram(false);
    }
  }

  function toggleProgramAmenity(amenityValue) {
    setProgramDraft((prev) => {
      const currentList = listFromDelimitedValue(prev.amenities);
      const normalizedTarget = normalizeAmenity(amenityValue);
      const hasAmenity = currentList.some((item) => normalizeAmenity(item) === normalizedTarget);
      const nextList = hasAmenity
        ? currentList.filter((item) => normalizeAmenity(item) !== normalizedTarget)
        : [...currentList, amenityValue];
      return {
        ...prev,
        amenities: nextList.join(", ")
      };
    });
  }

  return (
    <section className="relative flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-black/10 bg-white px-4 py-2 sm:px-6">
        <nav className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-start gap-5">
          {[
            { key: "profile", label: "Profil" },
            { key: "favorites", label: "Sparade objekt" },
            { key: "history", label: "Sparade sökningar" }
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`tab-underline-button border-b-2 pb-0.5 text-sm font-semibold transition ${
                  active ? "border-[#0f1930] text-[#0f1930]" : "border-transparent text-ink-600 hover:text-black"
                }`}
                onClick={() => activateTab(tab.key)}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      {showPublisherWorkspaceTabs ? (
        <div className="shrink-0 border-b border-black/10 bg-white px-4 py-2 sm:px-6">
          <nav className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-start gap-5">
            {[
              { label: "Publicera annons", path: "/app/publish" },
              { label: "Dina objekt", path: "/app/my-listings" },
              { label: "Intresse och visningar", path: "/app/leads" }
            ].map((item) => (
              <button
                key={item.path}
                type="button"
                className="tab-underline-button border-b-2 border-transparent pb-0.5 text-sm font-semibold text-[#0f1930]/85 transition hover:text-[#0f1930]"
                onClick={() => navigateTo(`${item.path}?from=profile`)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-[1240px]">
          {activeTab === "profile" ? (
            <div className="space-y-5">
              <div className="px-1 py-2 sm:px-2">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        {user?.profile?.avatarUrl ? (
                          <img
                            src={user.profile.avatarUrl}
                            alt={user?.name || "Profilbild"}
                            className="h-32 w-32 rounded-full border border-black/10 object-cover"
                          />
                        ) : (
                          <div className="inline-flex h-32 w-32 items-center justify-center rounded-full border border-black/10 bg-[#eef2f8] text-3xl font-semibold text-ink-700">
                            {(user?.name || "AA")
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase() || "")
                              .join("")}
                          </div>
                        )}
                        <button
                          type="button"
                          className="absolute right-1 top-1 inline-flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-full border border-black/20 bg-white p-0 text-ink-700 transition hover:border-[#0f1930] hover:text-[#0f1930]"
                          aria-label="Redigera profilbild"
                          onClick={() => setShowTeamOverlay(true)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-2xl font-semibold text-[#0f1930]">{user?.name || "Användare"}</p>
                        </div>
                        <p className="mt-2 text-sm text-ink-600">{user?.email || "-"} · {user?.phone || "-"}</p>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#241d1a]">
                          <span
                            className="inline-flex h-5 w-5 items-center justify-center bg-[#0f1930] text-white"
                            style={{ clipPath: "polygon(50% 1%,58% 4%,66% 2%,73% 8%,81% 8%,88% 15%,96% 19%,99% 28%,97% 36%,99% 44%,94% 51%,95% 59%,89% 66%,86% 75%,78% 79%,71% 86%,62% 87%,55% 94%,47% 92%,39% 97%,32% 91%,23% 91%,18% 83%,9% 81%,6% 72%,1% 65%,3% 56%,0% 48%,6% 41%,4% 33%,10% 26%,11% 17%,20% 13%,25% 5%,34% 5%,42% 1%)" }}
                          >
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5">
                              <path d="M5.5 12.5l4 4 9-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          ID verifierad
                        </div>
                      </div>
                    </div>

                    <div className="ml-5 flex flex-wrap items-center justify-end gap-2 self-start">
                      {!hasRenter ? (
                        <button
                          type="button"
                          className="rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold"
                          disabled={pendingRole}
                          onClick={async () => {
                            setPendingRole(true);
                            try {
                              await switchRole("renter");
                            } finally {
                              setPendingRole(false);
                            }
                          }}
                        >
                          Lägg till Hyresgäst
                        </button>
                      ) : null}
                      {!hasPublisher ? (
                        <button
                          type="button"
                          className="rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold"
                          disabled={pendingRole}
                          onClick={async () => {
                            setPendingRole(true);
                            try {
                              await switchRole("publisher");
                            } finally {
                              setPendingRole(false);
                            }
                          }}
                        >
                          Lägg till Hyresvärd
                        </button>
                      ) : null}
                      {canSwitchRoles ? (
                        <>
                          {user?.role === "renter" ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-[#0f1930] hover:text-[#0f1930]"
                              disabled={pendingRole}
                              onClick={async () => {
                                setPendingRole(true);
                                try {
                                  await switchRole("publisher");
                                } finally {
                                  setPendingRole(false);
                                }
                              }}
                            >
                              <SwitchHorizontalIcon className="h-4 w-4" />
                              Växla till Hyresvärd
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-[#0f1930] hover:text-[#0f1930]"
                              disabled={pendingRole}
                              onClick={async () => {
                                setPendingRole(true);
                                try {
                                  await switchRole("renter");
                                } finally {
                                  setPendingRole(false);
                                }
                              }}
                            >
                              <SwitchHorizontalIcon className="h-4 w-4" />
                              Växla till Hyresgäst
                            </button>
                          )}
                        </>
                      ) : null}
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-white px-4 py-2 text-xs font-semibold text-ink-700 transition hover:border-[#0f1930] hover:text-[#0f1930]"
                        onClick={() => setShowTeamOverlay(true)}
                      >
                      <PencilIcon className="h-4 w-4" />
                      Hantera profil
                    </button>
                    </div>
                  </div>
                  <div className="hidden lg:block" />
                </div>

              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-5">
                  {showProfileSetupCard ? (
                  <article className="rounded-3xl border border-black/10 bg-white p-5 sm:p-6">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 text-left"
                      onClick={() => setIsProfileSetupCollapsed((prev) => !prev)}
                      aria-expanded={!isProfileSetupCollapsed}
                    >
                      <h2 className="text-2xl font-semibold text-[#0f1930]">Slutför din profil</h2>
                      {isProfileSetupCollapsed ? (
                        <span className="text-2xl leading-none text-ink-700 transition-transform duration-300">›</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-white px-4 py-2 text-xs font-semibold text-ink-700 transition hover:border-[#0f1930] hover:text-[#0f1930]">
                          <EyeIcon className="h-4 w-4" />
                          Dölj
                        </span>
                      )}
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isProfileSetupCollapsed ? "max-h-0 opacity-0" : "max-h-[700px] opacity-100"
                      }`}
                    >
                      <p className="mt-1 text-sm text-ink-600">Komplettera dina profiluppgifter.</p>

                      <div className="mt-4">
                        <p className="text-sm font-semibold text-ink-700">{profileSetupProgress.percent}% klart</p>
                        <div className="mt-2 h-3 overflow-hidden rounded-full border border-black/10 bg-[#eef2f8]">
                          <div
                            className="h-full rounded-full bg-[#0f1930] transition-all"
                            style={{ width: `${profileSetupProgress.percent}%` }}
                          />
                        </div>
                      </div>

                      <p className="mt-3 text-sm text-ink-600">
                        {profileSetupProgress.done} av {profileSetupProgress.total} steg klara
                      </p>

                      <div className="mt-4 border-t border-black/10 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Saker kvar att göra</p>
                        <div className="mt-2 grid gap-1.5">
                          {profileSetupTasks.map((task) => (
                            <button
                              key={task.id}
                              type="button"
                              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-[15px] text-ink-500 transition hover:bg-black/5"
                              onClick={() => openTaskEditor(task.target)}
                            >
                              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                                task.done
                                  ? "border-transparent bg-[#0f1930] text-white"
                                  : "border-black/20 bg-white text-ink-500"
                              }`}>
                                {task.done ? (
                                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                                    <path d="M5.5 12.5l4 4 9-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : <PencilIcon className="h-3.5 w-3.5" />}
                              </span>
                              <span>{task.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                  ) : null}

                  <article className="rounded-3xl border border-black/10 bg-white p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-semibold text-[#0f1930]">Lokalprogram</h2>
                        <p className="mt-1 text-sm text-ink-600">Det här används för bättre matchning i sök och rekommendationer.</p>
                      </div>
                      {hasRenter ? (
                        <button
                          type="button"
                          className="inline-flex h-10 w-10 min-h-10 min-w-10 items-center justify-center rounded-full border border-black/20 bg-white p-0 text-xs font-semibold text-ink-700 transition hover:border-[#0f1930] hover:text-[#0f1930]"
                          onClick={() => setShowProgramOverlay(true)}
                          aria-label="Ändra lokalprogram"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>

                    {hasRenter ? (
                      <div className="mt-6 space-y-6">
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-ink-700">{localProgramProgress.percent}% klart</p>
                          </div>
                          <div className="mt-2 h-3 overflow-hidden rounded-full border border-black/10 bg-[#eef2f8]">
                            <div
                              className="h-full rounded-full bg-[#0f1930] transition-all"
                              style={{ width: `${localProgramProgress.percent}%` }}
                            />
                          </div>
                          <p className="mt-3 text-sm text-ink-600">
                            {localProgramProgress.done} av {localProgramProgress.total} steg klara
                          </p>
                        </div>

                        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                          {localProgramSummary.map(({ key, label, value, Icon }) => (
                            <div key={key} className="flex items-start gap-2.5">
                              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#0f1930]">
                                <Icon className="h-3.5 w-3.5" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
                                <p className="mt-0.5 truncate text-[15px] font-semibold text-ink-900">{value}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {desiredAmenities.length > 0 ? (
                          <div className="border-t border-black/10 py-5">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-700">Bekvämligheter</p>
                            <div className="flex flex-wrap gap-2">
                              {desiredAmenities.map((amenity) => {
                                const amenityMatch = amenityOptions.find((option) => normalizeAmenity(option.value) === normalizeAmenity(amenity));
                                const AmenityIcon = amenityMatch?.icon || BuildingIcon;
                                return (
                                  <span
                                    key={amenity}
                                    className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-black/10 bg-white px-3.5 py-2.5 text-sm font-semibold text-ink-700"
                                  >
                                    <AmenityIcon className="h-[18px] w-[18px] shrink-0 text-ink-700" />
                                    {amenity}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-4 rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm text-ink-600">Ingen lokalprogramsdata ännu.</p>
                    )}
                  </article>

                  <section className="pt-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="text-2xl font-semibold text-[#0f1930]">Lokaler som matchar dina preferenser</h2>
                        <p className="mt-1 text-sm text-ink-600">Matchningar med tydlig motivering utifrån ditt lokalprogram.</p>
                      </div>
                    </div>

                    {preferenceMatches.length === 0 ? (
                      <p className="rounded-2xl border border-black/10 bg-white px-4 py-4 text-sm text-ink-600">
                        Inga matchningar ännu. Fyll i fler preferenser i lokalprogrammet.
                      </p>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {preferenceMatches.map((item) => (
                          <ListingVisualCard
                            key={item.listing.id}
                            listing={{ ...item.listing, score: item.matchPercent }}
                            shortlisted={favoriteIds.has(String(item.listing.id))}
                            onOpenListing={(selected) => navigateTo(`/app/listings/${encodeURIComponent(selected.id)}`)}
                            onToggleShortlist={(listingId) => toggleFavorite?.(listingId)}
                            showMatchChip
                            highlightAmenities={desiredAmenities}
                            missingAmenities={item.missingAmenities}
                            comparedAmenitiesOnly
                          />
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                <aside className="lg:sticky lg:top-6 lg:self-start">
                  <div className="space-y-4">
                    <article className="overflow-hidden rounded-3xl border border-black/10 bg-white">
                      <div className="px-5 py-4">
                        <p className="text-lg font-semibold text-[#0f1930]">Publicera din profil</p>
                        <p className="mt-1 text-sm text-ink-600">Öka chansen att bli kontaktad av relevanta hyresvärder.</p>
                      </div>
                      <div className="border-t border-black/10 px-5 py-4">
                        <button type="button" className="w-full rounded-full bg-[#0f1930] px-4 py-2.5 text-sm font-semibold text-white">
                          Publicera profil
                        </button>
                      </div>
                    </article>

                    <article className="rounded-3xl border border-black/10 bg-white p-5">
                      <p className="text-[34px] font-semibold leading-[1.05] text-[#0f1930]">
                        Stick ut med
                        <span className="mt-1 block w-fit rounded-2xl bg-[#f3d571] px-2 py-1 text-[34px] leading-none text-[#352922]">
                          Lokalflöde Premium
                        </span>
                      </p>
                      <p className="mt-3 text-sm text-ink-600">Premiumprofiler får i snitt fler relevanta förfrågningar och snabbare återkoppling.</p>
                      <button type="button" className="mt-4 rounded-full border border-[#0f1930] bg-white px-4 py-2.5 text-sm font-semibold text-[#0f1930]">
                        Uppgradera (demo)
                      </button>
                    </article>
                  </div>
                </aside>
              </div>
            </div>
          ) : null}

          {activeTab === "favorites" ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-semibold">Sparade objekt</h2>
                  <p className="mt-1 text-sm text-ink-600">Objekt du har sparat för uppföljning.</p>
                </div>
                <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-ink-700">
                  {favoriteListings.length} sparade
                </span>
              </div>
              {favoriteListings.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-black/10 bg-[#fafafa] px-3 py-3 text-sm text-ink-600">Inga sparade objekt ännu.</p>
              ) : (
                <div className="mt-3 grid gap-4 lg:grid-cols-3">
                  {favoriteListings.map((listing) => (
                    <ListingVisualCard
                      key={listing.id}
                      listing={listing}
                      shortlisted={favoriteIds.has(String(listing.id))}
                      onOpenListing={(selected) => navigateTo(`/app/listings/${encodeURIComponent(selected.id)}`)}
                      onToggleShortlist={(listingId) => toggleFavorite?.(listingId)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "history" ? (
            <div>
              <article className="rounded-3xl border border-black/10 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-semibold">Sparade filter</h2>
                    <p className="mt-1 text-sm text-ink-600">Välj ett filter för att öppna sökresultat med samma inställningar.</p>
                  </div>
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-ink-700">
                    {filterPresets.length} sparade
                  </span>
                </div>
                {filterPresets.length === 0 ? (
                  <p className="mt-3 rounded-2xl border border-black/10 bg-[#fafafa] px-3 py-3 text-sm text-ink-600">Inga sparade filter ännu.</p>
                ) : (
                  <div className="mt-3 grid gap-3">
                    {filterPresets.map((preset) => {
                      const chips = buildHistoryChips(preset.filters);
                      const details = buildHistoryDetails(preset.filters);
                      const targetUrl = buildRentSearchUrl(preset.filters);
                      return (
                        <article
                          key={preset.id}
                          className="cursor-pointer rounded-2xl border border-black/10 bg-white p-3 transition hover:border-[#0f1930]/35"
                          onClick={() => navigateTo(targetUrl)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              navigateTo(targetUrl);
                            }
                          }}
                          tabIndex={0}
                          role="button"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-black">{preset.title || "Sparat filter"}</p>
                              <p className="text-xs text-ink-500">Uppdaterad {formatTimestamp(preset.updatedAt || preset.createdAt)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="rounded-xl border border-black/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-white"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  navigateTo(targetUrl);
                                }}
                              >
                                Sök igen
                              </button>
                              <button
                                type="button"
                                className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deleteSavedFilter?.(preset.id);
                                }}
                              >
                                Radera
                              </button>
                            </div>
                          </div>
                          {details.length > 0 ? (
                            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                              {details.map((item) => (
                                <div key={`${preset.id}-${item.label}-${item.value}`} className="rounded-xl border border-black/10 bg-white px-2.5 py-2">
                                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">{item.label}</dt>
                                  <dd className="mt-0.5 text-xs font-medium text-ink-800">{item.value}</dd>
                                </div>
                              ))}
                            </dl>
                          ) : null}
                          {chips.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {chips.map((chip) => (
                                <span key={`${preset.id}-${chip}`} className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-700">
                                  {chip}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                )}
              </article>
            </div>
          ) : null}
        </div>
      </div>

      {showProfileOverlay ? (
        <div className="absolute inset-0 z-[90] overflow-y-auto bg-white p-4 sm:p-6" onClick={() => setShowProfileOverlay(false)}>
          <div className="mx-auto w-full max-w-[1240px] rounded-3xl border border-black/10 bg-white p-5 sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold text-[#0f1930]">Redigera profil</h3>
                <p className="mt-1 text-sm text-ink-600">Uppdatera profilbild och kontaktuppgifter.</p>
              </div>
              <button
                type="button"
                className="close-circle-button inline-flex items-center justify-center rounded-full border border-black/15 bg-white text-xl leading-none text-ink-700"
                onClick={() => setShowProfileOverlay(false)}
                aria-label="Stäng"
              >
                ×
              </button>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
              <div className="flex flex-col items-center gap-3">
                {profileDraft.avatarUrl ? (
                  <img src={profileDraft.avatarUrl} alt="Profilbild" className="h-28 w-28 rounded-full border border-black/10 object-cover" />
                ) : (
                  <div className="inline-flex h-28 w-28 items-center justify-center rounded-full border border-black/10 bg-[#eef2f8] text-3xl font-semibold text-ink-700">
                    {(profileDraft.name || user?.email || "A").trim().charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-ink-800"
                  onClick={() => profileAvatarInputRef.current?.click()}
                >
                  <CameraIcon className="h-4 w-4" />
                  Lägg till foto
                </button>
                <input
                  ref={profileAvatarInputRef}
                  className="hidden"
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      const dataUrl = await readOptimizedProfileImage(file);
                      setProfileDraft((prev) => ({ ...prev, avatarUrl: dataUrl }));
                    } catch (_error) {
                      app.pushToast?.("Kunde inte läsa bilden.", "error");
                    }
                  }}
                />
              </div>

              <div className="grid gap-3 sm:max-w-xl">
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-ink-600">Namn</span>
                  <input
                    className="field"
                    value={profileDraft.name}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-ink-600">Telefon</span>
                  <input
                    className="field"
                    value={profileDraft.phone}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, phone: event.target.value }))}
                    placeholder="+46 70 123 45 67"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-ink-600">E-post</span>
                  <input className="field" value={user?.email || ""} disabled />
                </label>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-black/20 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700"
                onClick={() => setShowProfileOverlay(false)}
              >
                Avbryt
              </button>
              <button
                type="button"
                className="rounded-full border border-[#0f1930] bg-[#0f1930] px-5 py-2.5 text-sm font-semibold text-white"
                onClick={saveProfileChanges}
                disabled={savingProfile}
              >
                {savingProfile ? "Sparar..." : "Spara ändringar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showProgramOverlay ? (
        <div className="absolute inset-0 z-[90] overflow-y-auto bg-white p-4 sm:p-6" onClick={() => setShowProgramOverlay(false)}>
          <div className="mx-auto w-full max-w-[1240px] rounded-3xl border border-black/10 bg-white p-5 sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold text-[#0f1930]">Redigera lokalprogram</h3>
                <p className="mt-1 text-sm text-ink-600">Justera preferenser som används i matchning och sök.</p>
              </div>
              <button
                type="button"
                className="close-circle-button inline-flex items-center justify-center rounded-full border border-black/15 bg-white text-xl leading-none text-ink-700"
                onClick={() => setShowProgramOverlay(false)}
                aria-label="Stäng"
              >
                ×
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Område</span>
                <select className="field select-chevron" value={programDraft.district} onChange={(event) => setProgramDraft((prev) => ({ ...prev, district: event.target.value }))}>
                  {districtOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Typ av lokal</span>
                <select
                  className="field select-chevron"
                  value={Array.isArray(programDraft.type) && programDraft.type.length ? programDraft.type[0] : "Alla"}
                  onChange={(event) => setProgramDraft((prev) => ({ ...prev, type: event.target.value === "Alla" ? [] : [event.target.value] }))}
                >
                  <option value="Alla">Alla typer</option>
                  {typeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Minst platser</span>
                <input className="field" type="number" min="0" value={programDraft.teamSize} onChange={(event) => setProgramDraft((prev) => ({ ...prev, teamSize: event.target.value }))} />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Min yta (kvm)</span>
                <input className="field" type="number" min="0" value={programDraft.minSize} onChange={(event) => setProgramDraft((prev) => ({ ...prev, minSize: event.target.value }))} />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Max yta (kvm)</span>
                <input className="field" type="number" min="0" value={programDraft.maxSize} onChange={(event) => setProgramDraft((prev) => ({ ...prev, maxSize: event.target.value }))} />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Max budget / mån</span>
                <input className="field" type="number" min="0" value={programDraft.maxBudget} onChange={(event) => setProgramDraft((prev) => ({ ...prev, maxBudget: event.target.value }))} />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Inflyttning</span>
                <input className="field" type="date" value={programDraft.moveInDate} onChange={(event) => setProgramDraft((prev) => ({ ...prev, moveInDate: event.target.value }))} />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Avtalsflexibilitet</span>
                <select className="field select-chevron" value={programDraft.contractFlex || "Alla"} onChange={(event) => setProgramDraft((prev) => ({ ...prev, contractFlex: event.target.value === "Alla" ? "" : event.target.value }))}>
                  {contractOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Kollektivtrafik</span>
                <select className="field select-chevron" value={programDraft.transitDistance || "Alla"} onChange={(event) => setProgramDraft((prev) => ({ ...prev, transitDistance: event.target.value === "Alla" ? "" : event.target.value }))}>
                  {transitOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Tillgång</span>
                <select className="field select-chevron" value={programDraft.accessHours || "Alla"} onChange={(event) => setProgramDraft((prev) => ({ ...prev, accessHours: event.target.value === "Alla" ? "" : event.target.value }))}>
                  {accessOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Parkering</span>
                <select className="field select-chevron" value={programDraft.parkingType || "Alla"} onChange={(event) => setProgramDraft((prev) => ({ ...prev, parkingType: event.target.value === "Alla" ? "" : event.target.value }))}>
                  {parkingOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Planlösning</span>
                <select className="field select-chevron" value={programDraft.layoutType || "Alla"} onChange={(event) => setProgramDraft((prev) => ({ ...prev, layoutType: event.target.value === "Alla" ? "" : event.target.value }))}>
                  {layoutOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-4 border-b border-black/10 pb-4">
              <div className="rounded-2xl border border-black/10 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Särskilda krav</p>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                    <input
                      type="checkbox"
                      checked={Boolean(programDraft.includeOperatingCosts)}
                      onChange={(event) => setProgramDraft((prev) => ({ ...prev, includeOperatingCosts: event.target.checked }))}
                      className="h-4 w-4 rounded border-black/20"
                    />
                    Driftkostnad ingår
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                    <input
                      type="checkbox"
                      checked={Boolean(programDraft.accessibilityAdapted)}
                      onChange={(event) => setProgramDraft((prev) => ({ ...prev, accessibilityAdapted: event.target.checked }))}
                      className="h-4 w-4 rounded border-black/20"
                    />
                    Tillgänglighetsanpassad
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                    <input
                      type="checkbox"
                      checked={Boolean(programDraft.ecoCertified)}
                      onChange={(event) => setProgramDraft((prev) => ({ ...prev, ecoCertified: event.target.checked }))}
                      className="h-4 w-4 rounded border-black/20"
                    />
                    Miljöcertifierad
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <p className="mb-2 text-xs font-semibold text-ink-600">Bekvämligheter</p>
              <div className="flex flex-wrap gap-2">
                {amenityOptions.map((option) => {
                  const Icon = option.icon;
                  const active = selectedProgramAmenities.some((item) => normalizeAmenity(item) === normalizeAmenity(option.value));
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2.5 text-sm font-semibold transition ${
                        active ? "border-[#0f1930] bg-[#0f1930] text-white" : "border-black/10 bg-white text-ink-700 hover:bg-white"
                      }`}
                      onClick={() => toggleProgramAmenity(option.value)}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-black/20 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700"
                onClick={() => setShowProgramOverlay(false)}
              >
                Avbryt
              </button>
              <button
                type="button"
                className="rounded-full border border-[#0f1930] bg-[#0f1930] px-5 py-2.5 text-sm font-semibold text-white"
                onClick={saveProgramChanges}
                disabled={savingProgram}
              >
                {savingProgram ? "Sparar..." : "Spara ändringar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showTeamOverlay ? (
        <div className="absolute inset-0 z-[90] overflow-y-auto bg-white p-4 sm:p-6">
          <div className="mx-auto w-full max-w-[1240px]">
            <button
              type="button"
              className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-[#0f1930] hover:text-[#0f1930]"
              onClick={() => setShowTeamOverlay(false)}
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Tillbaka till profil
            </button>
          </div>
          <div className="mx-auto w-full max-w-[1240px] rounded-3xl border border-black/10 bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold text-[#0f1930]">Hantera profil</h3>
                <p className="mt-1 text-sm text-ink-600">Redigera administratörsprofil och hantera teamets uppgifter.</p>
              </div>
            </div>

            <div className="mt-4 p-1">
              <p className="text-sm font-semibold text-[#0f1930]">Administratör</p>
              <div className="mt-4 grid gap-5 lg:grid-cols-[220px_minmax(0,680px)] lg:items-start">
                <div className="flex items-start justify-center">
                  <div className="relative flex flex-col items-center gap-2">
                    {profileDraft.avatarUrl ? (
                      <img src={profileDraft.avatarUrl} alt="Profilbild" className="h-[220px] w-[220px] rounded-full border border-black/10 object-cover" />
                    ) : (
                      <div className="inline-flex h-[220px] w-[220px] items-center justify-center rounded-full border border-black/10 bg-[#eef2f8] text-6xl font-semibold text-ink-700">
                        {(profileDraft.name || user?.email || "A").trim().charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute right-2 top-2 inline-flex h-10 w-10 min-h-10 min-w-10 items-center justify-center rounded-full border border-black/20 bg-white p-0 text-ink-700 transition hover:border-[#0f1930] hover:text-[#0f1930]"
                      onClick={() => profileAvatarInputRef.current?.click()}
                      aria-label="Byt foto"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <input
                      ref={profileAvatarInputRef}
                      className="hidden"
                      type="file"
                      accept="image/*"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        try {
                          const dataUrl = await readOptimizedProfileImage(file);
                          setProfileDraft((prev) => ({ ...prev, avatarUrl: dataUrl }));
                        } catch (_error) {
                          app.pushToast?.("Kunde inte läsa bilden.", "error");
                        }
                      }}
                    />
                    {profileDraft.avatarUrl ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-[#0f1930] hover:text-[#0f1930]"
                        onClick={() => setProfileDraft((prev) => ({ ...prev, avatarUrl: "" }))}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Ta bort foto
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 sm:col-span-2">
                    <span className="text-xs font-semibold text-ink-600">Namn</span>
                    <input className="field" value={profileDraft.name} onChange={(event) => setProfileDraft((prev) => ({ ...prev, name: event.target.value }))} />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-ink-600">Telefon</span>
                    <input className="field" value={profileDraft.phone} onChange={(event) => setProfileDraft((prev) => ({ ...prev, phone: event.target.value }))} />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-ink-600">E-post</span>
                    <input className="field" value={user?.email || ""} disabled />
                  </label>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      className="rounded-full border border-[#0f1930] bg-[#0f1930] px-4 py-2 text-xs font-semibold text-white"
                      onClick={saveProfileChanges}
                      disabled={savingProfile}
                    >
                      {savingProfile ? "Sparar..." : "Spara ändringar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-black/10 pt-5">
              <p className="text-2xl font-semibold text-[#0f1930]">Hantera team</p>
            </div>
            <form className="mt-4 grid gap-2 sm:grid-cols-[1.3fr_1fr_1fr_auto]" onSubmit={inviteTeamMember}>
              <input
                className="field w-full"
                value={teamInvite.email}
                onChange={(event) => setTeamInvite((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="E-post"
                type="email"
              />
              <input
                className="field w-full"
                value={teamInvite.firstName}
                onChange={(event) => setTeamInvite((prev) => ({ ...prev, firstName: event.target.value }))}
                placeholder="Förnamn"
              />
              <input
                className="field w-full"
                value={teamInvite.lastName}
                onChange={(event) => setTeamInvite((prev) => ({ ...prev, lastName: event.target.value }))}
                placeholder="Efternamn"
              />
              <button type="submit" className="rounded-xl border border-[#0f1930] bg-[#0f1930] px-3 py-2 text-xs font-semibold text-white hover:bg-[#16233f]">
                Bjud in
              </button>
            </form>

            <p className="mt-5 text-sm font-semibold text-[#0f1930]">Teammedlemmar</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-black/10">
              <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-2 border-b border-black/10 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                <span>E-post</span>
                <span>Förnamn</span>
                <span>Efternamn</span>
                <span>Telefon</span>
                <span className="text-right">Status</span>
              </div>
              <div className="divide-y divide-black/10">
                {teamMembers.map((member) => (
                  <div key={member.id} className="grid grid-cols-[1.2fr_1fr_1fr_1fr_auto] items-center gap-2 px-3 py-2 text-sm text-ink-700">
                    <input
                      className="field w-full"
                      value={member.email}
                      onChange={(event) => updateTeamMember(member.id, { email: event.target.value })}
                    />
                    <input
                      className="field w-full"
                      value={member.firstName || ""}
                      onChange={(event) => updateTeamMember(member.id, { firstName: event.target.value })}
                    />
                    <input
                      className="field w-full"
                      value={member.lastName || ""}
                      onChange={(event) => updateTeamMember(member.id, { lastName: event.target.value })}
                    />
                    <input
                      className="field w-full"
                      value={member.phone || ""}
                      onChange={(event) => updateTeamMember(member.id, { phone: event.target.value })}
                    />
                    <div className="inline-flex items-center justify-end gap-2">
                      <select
                        className="field select-chevron w-full min-w-[140px]"
                        value={member.status}
                        onChange={(event) => updateTeamMember(member.id, { status: event.target.value })}
                      >
                        <option value="Aktiv">Aktiv</option>
                        <option value="Inbjuden">Inbjuden</option>
                      </select>
                      {member.id !== "team-owner" ? (
                        <button
                          type="button"
                          className="rounded-lg border border-black/10 bg-white px-2 py-1 text-[11px] font-semibold text-ink-700 hover:bg-white"
                          onClick={() => removeTeamMember(member.id)}
                        >
                          Ta bort
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="rounded-full border border-black/20 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700"
                onClick={() => setShowTeamOverlay(false)}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default ProfilePage;
