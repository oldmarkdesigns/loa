import { useEffect, useMemo, useRef, useState } from "react";
import ListingVisualCard from "../../components/app/ListingVisualCard";
import LocalProgramModule from "../../components/app/LocalProgramModule";
import ViewingRequestModal from "../../components/app/ViewingRequestModal";
import {
  BuildingIcon,
  CalendarIcon,
  CarIcon,
  CheckBadgeIcon,
  ClockIcon,
  CoinsIcon,
  EyeIcon,
  LightbulbIcon,
  MapIcon,
  PencilIcon,
  PinIcon,
  RulerIcon,
  ShieldIcon,
  SwitchHorizontalIcon,
  CameraIcon,
  TrashIcon,
  UserIcon,
  XIcon,
} from "../../components/icons/UiIcons";
import PremiumPromoCard from "../../components/shared/PremiumPromoCard";
import { navigateTo, normalizeAppRole } from "../../lib/router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DEFAULT_MAX_BUDGET,
  typeOptions,
  districtOptions,
  contractOptions,
  transitOptions,
  parkingOptions,
  layoutOptions,
  accessOptions,
  amenityOptions,
  formatTimestamp,
  buildHistoryChips,
  buildHistoryDetails,
  buildRentSearchUrl,
  listFromDelimitedValue,
  parseDistrictSelection,
  normalizeAmenity,
  formatMoney,
  normalizeProgramList,
  createBlankProgram,
  readOptimizedProfileImage,
  isFilled
} from "../../lib/profileHelpers";

function preferenceMatchScore(listing, renterProgram = {}) {
  const preferredTypes = listFromDelimitedValue(renterProgram.type);
  const preferredDistricts = parseDistrictSelection(renterProgram.district).filter((item) => item !== "Alla");
  const desiredAmenities = listFromDelimitedValue(renterProgram.amenities).map((item) => item.toLowerCase());
  const listingAmenities = Array.isArray(listing.amenities) ? listing.amenities.map((item) => String(item || "").toLowerCase()) : [];

  let score = 0;
  let max = 0;

  if (preferredDistricts.length > 0) {
    max += 22;
    if (preferredDistricts.includes(listing.district)) score += 22;
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
  const preferredDistricts = parseDistrictSelection(renterProgram.district).filter((item) => item !== "Alla");

  const maxBudget = Number(renterProgram.maxBudget || 0);
  if (maxBudget > 0 && Number(listing.priceMonthly || 0) <= maxBudget) {
    reasons.push(`Pris inom budget (${formatMoney(listing.priceMonthly)})`);
  }

  const minSize = Number(renterProgram.minSize || 0);
  if (minSize > 0 && Number(listing.sizeSqm || 0) >= minSize) {
    reasons.push(`Yta matchar (${listing.sizeSqm} kvm)`);
  }

  if (preferredDistricts.length > 0 && preferredDistricts.includes(listing.district)) {
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
    resendBrokerVerificationRequest,
    updateProfile
  } = app;

  const [pendingRole, setPendingRole] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showProgramOverlay, setShowProgramOverlay] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState(null);
  const [showTeamOverlay, setShowTeamOverlay] = useState(false);
  const [isProfileSetupCollapsed, setIsProfileSetupCollapsed] = useState(false);
  const [dismissedBrokerApprovalCard, setDismissedBrokerApprovalCard] = useState(false);
  const [resendingBrokerVerification, setResendingBrokerVerification] = useState(false);
  const [savingProgram, setSavingProgram] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [bookingListing, setBookingListing] = useState(null);
  const [profileDraft, setProfileDraft] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    avatarUrl: user?.profile?.avatarUrl || ""
  });
  const profileAvatarInputRef = useRef(null);

  const roleSet = useMemo(() => {
    const merged = Array.from(new Set([...(Array.isArray(user?.roles) ? user.roles : []), user?.role].filter(Boolean)));
    return new Set(merged.map(normalizeAppRole));
  }, [user?.role, user?.roles]);
  const hasRenter = roleSet.has("renter");
  const hasCompanyAdmin = roleSet.has("company_admin");
  const hasBrokerRole = roleSet.has("broker");
  const canSwitchToCompany = hasRenter && hasCompanyAdmin;
  const canSwitchToBroker = hasRenter && hasBrokerRole && !hasCompanyAdmin;
  const activeRole = normalizeAppRole(user?.role);
  const hasPendingBrokerVerification =
    user?.profile?.requestedRole === "broker" &&
    user?.profile?.roleRequestStatus === "pending";
  const brokerVerificationApproved =
    user?.profile?.roleRequestStatus === "approved" ||
    (Array.isArray(user?.roles) && user.roles.includes("broker") && !user.roles.includes("company_admin"));
  const brokerVerificationRejected = user?.profile?.roleRequestStatus === "rejected";
  const brokerApprovalNotification = (Array.isArray(app?.notifications) ? app.notifications : [])
    .find((item) => item.type === "broker_verification_approved");
  const brokerVerificationCompanyName =
    user?.profile?.companyName ||
    user?.profile?.legalEntity ||
    "angivet företag";
  const brokerVerificationOrganizationNumber =
    user?.profile?.organizationNumber ||
    user?.profile?.companyOrganizationNumber ||
    "";

  const renterPrograms = useMemo(() => normalizeProgramList(user?.profile || {}), [user?.profile]);
  const renterProgram = useMemo(() => renterPrograms[0] || user?.profile?.renterProgram || {}, [renterPrograms, user?.profile?.renterProgram]);
  const preferredTypes = useMemo(() => listFromDelimitedValue(renterProgram.type), [renterProgram.type]);
  const desiredAmenities = useMemo(() => listFromDelimitedValue(renterProgram.amenities), [renterProgram.amenities]);

  const [programDraft, setProgramDraft] = useState(() => ({
    id: renterProgram.id || "",
    title: renterProgram.title || "Lokalprogram 1",
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

  function syncActiveTabFromLocation() {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "profile" || tab === "favorites" || tab === "history") {
      setActiveTab(tab);
      return;
    }
    setActiveTab("profile");
  }

  useEffect(() => {
    syncActiveTabFromLocation();
    window.addEventListener("popstate", syncActiveTabFromLocation);
    window.addEventListener("app:navigate", syncActiveTabFromLocation);
    return () => {
      window.removeEventListener("popstate", syncActiveTabFromLocation);
      window.removeEventListener("app:navigate", syncActiveTabFromLocation);
    };
  }, []);

  useEffect(() => {
    if (!showProgramOverlay) return;
    const selectedProgram = renterPrograms.find((program) => program.id === editingProgramId) || createBlankProgram(renterPrograms.length);
    setProgramDraft({
      id: selectedProgram.id || "",
      title: selectedProgram.title || `Lokalprogram ${renterPrograms.length + 1}`,
      district: selectedProgram.district || "Alla",
      type: listFromDelimitedValue(selectedProgram.type),
      teamSize: selectedProgram.teamSize || "",
      minSize: selectedProgram.minSize || "",
      maxSize: selectedProgram.maxSize || "",
      minBudget: selectedProgram.minBudget || "",
      maxBudget: selectedProgram.maxBudget || "",
      moveInDate: selectedProgram.moveInDate || "",
      contractFlex: selectedProgram.contractFlex || "",
      transitDistance: selectedProgram.transitDistance || "",
      accessHours: selectedProgram.accessHours || "",
      parkingType: selectedProgram.parkingType || "",
      layoutType: selectedProgram.layoutType || "",
      includeOperatingCosts: Boolean(selectedProgram.includeOperatingCosts),
      accessibilityAdapted: Boolean(selectedProgram.accessibilityAdapted),
      ecoCertified: Boolean(selectedProgram.ecoCertified),
      amenities: selectedProgram.amenities || ""
    });
  }, [editingProgramId, renterPrograms, showProgramOverlay]);

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
    if (!hasRenter && !hasBrokerRole) return { done: 0, total: 0, percent: 0 };
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
  }, [desiredAmenities.length, hasBrokerRole, hasRenter, preferredTypes, renterProgram]);
  const hasLocalProgramInput = useMemo(() => localProgramProgress.done > 0 || desiredAmenities.length > 0, [desiredAmenities.length, localProgramProgress.done]);
  const enteredLocalProgramSummary = useMemo(() => (
    localProgramSummary.filter((item) => !["-", "Alla", "Alla typer"].includes(String(item.value || "").trim()))
  ), [localProgramSummary]);

  function activateTab(tabKey) {
    setActiveTab(tabKey);
    navigateTo(tabKey === "profile" ? "/app/profile" : `/app/profile?tab=${tabKey}`);
  }

  function openTaskEditor(target) {
    if (target === "program") {
      setEditingProgramId(renterPrograms[0]?.id || null);
      setShowProgramOverlay(true);
      return;
    }
    setShowTeamOverlay(true);
  }

  function openNewProgramEditor() {
    setEditingProgramId(null);
    setShowProgramOverlay(true);
  }

  function openExistingProgramEditor(programId) {
    setEditingProgramId(programId);
    setShowProgramOverlay(true);
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
      setShowTeamOverlay(false);
    } catch (error) {
      app.pushToast?.(error.message || "Kunde inte spara profilen.", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function resendRejectedBrokerVerification() {
    if (!resendBrokerVerificationRequest) {
      app.pushToast?.("Kunde inte skicka förfrågan igen just nu.", "error");
      return;
    }

    setResendingBrokerVerification(true);
    try {
      await resendBrokerVerificationRequest();
    } catch (error) {
      app.pushToast?.(error.message || "Kunde inte skicka förfrågan igen.", "error");
    } finally {
      setResendingBrokerVerification(false);
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
        id: programDraft.id || `program-${Date.now()}`,
        title: String(programDraft.title || "").trim() || `Lokalprogram ${renterPrograms.length + 1}`,
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
      const nextPrograms = editingProgramId
        ? renterPrograms.map((program) => program.id === editingProgramId ? nextProgram : program)
        : [...renterPrograms, nextProgram];
      const syncedPrograms = nextPrograms.length > 0 ? nextPrograms : [nextProgram];
      const activeProgram = syncedPrograms[0] || nextProgram;

      await updateProfile({
        profile: {
          ...user?.profile,
          renterPrograms: syncedPrograms,
          renterProgram: activeProgram,
          companySize: activeProgram.teamSize,
          budgetRange: `${activeProgram.minBudget || 0}-${activeProgram.maxBudget || ""}`,
          preferredAreas: activeProgram.district || "Alla",
          moveInTimeline: activeProgram.moveInDate || ""
        }
      });
      app.pushToast?.("Lokalprogram uppdaterat.", "success");
      setShowProgramOverlay(false);
      setEditingProgramId(null);
    } catch (error) {
      app.pushToast?.(error.message || "Kunde inte spara lokalprogrammet.", "error");
    } finally {
      setSavingProgram(false);
    }
  }

  async function deleteProgram(programId) {
    if (!updateProfile || renterPrograms.length <= 1) return;
    setSavingProgram(true);
    try {
      const nextPrograms = renterPrograms.filter((program) => program.id !== programId);
      const activeProgram = nextPrograms[0] || {};
      await updateProfile({
        profile: {
          ...user?.profile,
          renterPrograms: nextPrograms,
          renterProgram: activeProgram,
          companySize: activeProgram.teamSize || "",
          budgetRange: `${activeProgram.minBudget || 0}-${activeProgram.maxBudget || ""}`,
          preferredAreas: activeProgram.district || "Alla",
          moveInTimeline: activeProgram.moveInDate || ""
        }
      });
      app.pushToast?.("Lokalprogram raderat.", "success");
    } catch (error) {
      app.pushToast?.(error.message || "Kunde inte radera lokalprogrammet.", "error");
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
      {activeTab === "favorites" || activeTab === "history" ? (
        <div className="shrink-0 border-b border-black/10 bg-[#ffffff] px-4 py-2 sm:px-6">
          <nav className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-start gap-5">
            {[
              { key: "favorites", label: "Sparade objekt" },
              { key: "history", label: "Sparade sökningar" }
            ].map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`tab-underline-button border-b-2 pb-0.5 text-sm font-semibold transition ${
                    active ? "border-[#0b0a0e] text-[#0b0a0e]" : "border-transparent text-[#0b0a0e]/85 hover:text-[#0b0a0e]"
                  }`}
                  onClick={() => activateTab(tab.key)}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-[1240px]">
          {activeTab === "profile" ? (
            <div className="space-y-4">
              <div className="px-1 pt-1 pb-0 sm:px-2">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {user?.profile?.avatarUrl ? (
                          <img
                            src={user.profile.avatarUrl}
                            alt={user?.name || "Profilbild"}
                            className="h-36 w-36 rounded-full border border-black/10 object-cover"
                          />
                        ) : (
                          <div className="inline-flex h-36 w-36 items-center justify-center rounded-full border border-black/10 bg-[#eef2f8] text-3xl font-semibold text-ink-700">
                            {(user?.name || "AA")
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase() || "")
                              .join("")}
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="absolute right-1 top-1 h-9 w-9 rounded-full border-black/20 text-ink-700 hover:border-[#0b0a0e] hover:bg-transparent hover:text-[#0b0a0e]"
                          aria-label="Redigera profilbild"
                          onClick={() => setShowTeamOverlay(true)}
                        >
                          <CameraIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-2xl font-semibold text-[#0b0a0e]">{user?.name || "Användare"}</p>
                        </div>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#ffffff] px-4 py-2 text-sm font-semibold text-[#241d1a]">
                          <span
                            className="inline-flex h-5 w-5 items-center justify-center bg-[#0b0a0e] text-white"
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

                    <div className="flex flex-wrap items-start justify-end gap-2 self-start lg:ml-auto">
                      {canSwitchToCompany && activeRole === "renter" ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto gap-1.5 rounded-full border-black/20 px-3 py-2 text-xs font-semibold text-ink-700 hover:border-[#0b0a0e] hover:bg-transparent hover:text-[#0b0a0e]"
                          disabled={pendingRole}
                          onClick={async () => {
                            setPendingRole(true);
                            try {
                              await switchRole("company_admin");
                              navigateTo("/app/admin");
                            } finally {
                              setPendingRole(false);
                            }
                          }}
                        >
                          <SwitchHorizontalIcon className="h-4 w-4" />
                          Växla till Företag
                        </Button>
                      ) : null}
                      {canSwitchToBroker && activeRole === "renter" ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto gap-1.5 rounded-full border-black/20 px-3 py-2 text-xs font-semibold text-ink-700 hover:border-[#0b0a0e] hover:bg-transparent hover:text-[#0b0a0e]"
                          disabled={pendingRole}
                          onClick={async () => {
                            setPendingRole(true);
                            try {
                              await switchRole("broker");
                            } finally {
                              setPendingRole(false);
                            }
                          }}
                        >
                          <SwitchHorizontalIcon className="h-4 w-4" />
                          Växla till Hyresvärd
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto gap-1.5 rounded-full border-black/20 px-4 py-2 text-xs font-semibold text-ink-700 hover:border-[#0b0a0e] hover:bg-transparent hover:text-[#0b0a0e]"
                        onClick={() => setShowTeamOverlay(true)}
                      >
                        <PencilIcon className="h-4 w-4" />
                        Hantera profil
                      </Button>
                    </div>
                  </div>
                  <div className="hidden lg:block" />
                </div>

              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-5">
                  {showProfileSetupCard ? (
                  <article className="rounded-3xl border border-black/10 bg-[#ffffff] p-5 sm:p-6">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 text-left"
                      onClick={() => setIsProfileSetupCollapsed((prev) => !prev)}
                      aria-expanded={!isProfileSetupCollapsed}
                    >
                      <h2 className="text-2xl font-semibold text-[#0b0a0e]">Slutför din profil</h2>
                      {isProfileSetupCollapsed ? (
                        <span className="text-2xl leading-none text-ink-700 transition-transform duration-300">›</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-[#ffffff] px-4 py-2 text-xs font-semibold text-ink-700 transition hover:border-[#0b0a0e] hover:text-[#0b0a0e]">
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
                            className="h-full rounded-full bg-[#0b0a0e] transition-all"
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
                            <Button
                              key={task.id}
                              type="button"
                              variant="ghost"
                              className="h-auto justify-start gap-2.5 rounded-xl px-2 py-1.5 text-left text-[15px] font-normal text-ink-500 hover:bg-black/5"
                              onClick={() => openTaskEditor(task.target)}
                            >
                              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                                task.done
                                  ? "border-transparent bg-[#0b0a0e] text-white"
                                  : "border-black/20 bg-[#ffffff] text-ink-500"
                              }`}>
                                {task.done ? (
                                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                                    <path d="M5.5 12.5l4 4 9-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : <PencilIcon className="h-3.5 w-3.5" />}
                              </span>
                              <span>{task.label}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                  ) : null}

                  <LocalProgramModule
                    programs={renterPrograms}
                    canEdit={hasRenter}
                    onAddProgram={openNewProgramEditor}
                    onEditProgram={openExistingProgramEditor}
                    onDeleteProgram={deleteProgram}
                  />

                  <section className="pt-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="text-2xl font-semibold text-[#0b0a0e]">Lokaler som matchar dina preferenser</h2>
                        <p className="mt-1 text-sm text-ink-600">Matchningar med tydlig motivering utifrån ditt lokalprogram.</p>
                      </div>
                    </div>
                    {preferenceMatches.length === 0 ? (
                      <p className="rounded-2xl border border-black/10 bg-[#ffffff] px-4 py-4 text-sm text-ink-600">
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
                            onBookViewing={(selected) => setBookingListing(selected)}
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

                <aside className="space-y-6 lg:sticky lg:top-0 lg:self-start">
                  <div className="space-y-6">
                    {hasPendingBrokerVerification ? (
                      <article className="rounded-3xl border border-[#0b0a0e]/15 bg-[#f8fafc] p-5">
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0b0a0e] text-white">
                            <ShieldIcon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-lg font-semibold text-[#0b0a0e]">Verifiering skickad</p>
                            <p className="mt-1 text-sm leading-relaxed text-ink-600">
                              Din förfrågan om att bli mäklare hos{" "}
                              <span className="font-semibold text-[#0b0a0e]">
                                {brokerVerificationCompanyName}
                                {brokerVerificationOrganizationNumber ? ` (${brokerVerificationOrganizationNumber})` : ""}
                              </span>{" "}
                              väntar på godkännande.
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-4 h-auto w-full gap-2 rounded-full border-black/10 px-4 py-2.5 text-sm font-semibold text-[#0b0a0e] shadow-[0_1px_0_rgba(15,25,48,0.04)] hover:bg-transparent"
                          onClick={() => navigateTo("/onboarding/publisher-profile?role=broker&intent=add-role")}
                        >
                          <ShieldIcon className="h-4 w-4" />
                          Visa verifiering
                        </Button>
                      </article>
                    ) : null}

                    {!hasPendingBrokerVerification && brokerVerificationApproved && !dismissedBrokerApprovalCard ? (
                      <article className="relative rounded-3xl border border-black/10 bg-[#ffffff] p-5 pr-12">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="absolute right-4 top-4 h-8 w-8 rounded-full border-black/10 text-ink-600 hover:border-[#0b0a0e] hover:bg-transparent hover:text-[#0b0a0e]"
                          aria-label="Dölj verifieringskort"
                          onClick={() => setDismissedBrokerApprovalCard(true)}
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </Button>
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                            <CheckBadgeIcon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-lg font-semibold text-[#0b0a0e]">Verifiering godkänd</p>
                            <p className="mt-1 text-sm leading-relaxed text-ink-700">
                              Du är verifierad som mäklare för{" "}
                              <span className="font-semibold text-[#0b0a0e]">
                                {brokerVerificationCompanyName}
                                {brokerVerificationOrganizationNumber ? ` (${brokerVerificationOrganizationNumber})` : ""}
                              </span>.
                            </p>
                            {brokerApprovalNotification?.createdAt ? (
                              <p className="mt-2 text-xs font-medium text-ink-600">
                                Godkänd {new Date(brokerApprovalNotification.createdAt).toLocaleString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ) : null}

                    {brokerVerificationRejected ? (
                      <article className="rounded-3xl border border-black/10 bg-[#ffffff] p-5">
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-700">
                            <ShieldIcon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-lg font-semibold text-[#0b0a0e]">Verifiering nekad</p>
                            <p className="mt-1 text-sm leading-relaxed text-ink-700">
                              Bolagsadmin för{" "}
                              <span className="font-semibold text-[#0b0a0e]">
                                {brokerVerificationCompanyName}
                                {brokerVerificationOrganizationNumber ? ` (${brokerVerificationOrganizationNumber})` : ""}
                              </span>{" "}
                              nekade din förfrågan om att bli verifierad som mäklare.
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          className="mt-4 h-auto w-full gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
                          disabled={resendingBrokerVerification}
                          onClick={resendRejectedBrokerVerification}
                        >
                          {resendingBrokerVerification ? "Skickar..." : "Skicka förfrågan igen"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-2 h-auto w-full gap-2 rounded-full border-black/15 px-4 py-2.5 text-sm font-semibold text-[#0b0a0e] hover:border-[#0b0a0e] hover:bg-transparent"
                          onClick={() => navigateTo("/onboarding/publisher-profile?role=broker&intent=add-role")}
                        >
                          Ändra organisationsnummer
                        </Button>
                      </article>
                    ) : null}

                    <PremiumPromoCard />
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
                <span className="rounded-full border border-black/10 bg-[#ffffff] px-3 py-1 text-xs font-semibold text-ink-700">
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
                      onBookViewing={(selected) => setBookingListing(selected)}
                      onToggleShortlist={(listingId) => toggleFavorite?.(listingId)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "history" ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-semibold">Sparade sökningar</h2>
                  <p className="mt-1 text-sm text-ink-600">Sökningar du har sparat för uppföljning.</p>
                </div>
                <span className="rounded-full border border-black/10 bg-[#ffffff] px-3 py-1 text-xs font-semibold text-ink-700">
                  {filterPresets.length} sparade
                </span>
              </div>
              {filterPresets.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-black/10 bg-[#fafafa] px-3 py-3 text-sm text-ink-600">Inga sparade sökningar ännu.</p>
              ) : (
                <div className="mt-3 grid gap-3">
                  {filterPresets.map((preset) => {
                    const chips = buildHistoryChips(preset.filters);
                    const details = buildHistoryDetails(preset.filters);
                    const targetUrl = buildRentSearchUrl(preset.filters);
                    return (
                      <article
                        key={preset.id}
                        className="cursor-pointer rounded-2xl border border-black/10 bg-[#ffffff] p-3 transition hover:border-[#0b0a0e]/35"
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
                            <p className="text-sm font-semibold text-black">{preset.title || "Sparad sökning"}</p>
                            <p className="text-xs text-ink-500">Uppdaterad {formatTimestamp(preset.updatedAt || preset.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-auto rounded-xl border-black/20 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-[#ffffff]"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigateTo(targetUrl);
                              }}
                            >
                              Sök igen
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-auto rounded-xl border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteSavedFilter?.(preset.id);
                              }}
                            >
                              Radera
                            </Button>
                          </div>
                        </div>
                        {details.length > 0 ? (
                          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                            {details.map((item) => (
                              <div key={`${preset.id}-${item.label}-${item.value}`} className="rounded-xl border border-black/10 bg-[#ffffff] px-2.5 py-2">
                                <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">{item.label}</dt>
                                <dd className="mt-0.5 text-xs font-medium text-ink-800">{item.value}</dd>
                              </div>
                            ))}
                          </dl>
                        ) : null}
                        {chips.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {chips.map((chip) => (
                              <span key={`${preset.id}-${chip}`} className="rounded-full border border-black/10 bg-[#ffffff] px-2.5 py-1 text-[11px] font-semibold text-ink-700">
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
            </div>
          ) : null}
        </div>
      </div>

      {showProgramOverlay ? (
        <div className="fixed inset-0 z-[90] h-dvh overflow-hidden bg-[#ffffff]">
        <div className="h-full overflow-y-auto overscroll-none bg-[#ffffff] p-4 sm:p-6" onClick={() => {
          setShowProgramOverlay(false);
          setEditingProgramId(null);
        }}>
          <div className="mx-auto w-full max-w-[1240px] rounded-3xl border border-black/10 bg-[#ffffff] p-5 sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold text-[#0b0a0e]">Redigera lokalprogram</h3>
                <p className="mt-1 text-sm text-ink-600">Justera preferenser som används i matchning och sök.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="close-circle-button rounded-full border-black/15 text-xl leading-none text-ink-700 hover:bg-transparent"
                onClick={() => {
                  setShowProgramOverlay(false);
                  setEditingProgramId(null);
                }}
                aria-label="Stäng"
              >
                ×
              </Button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="grid gap-1 sm:col-span-2 lg:col-span-3">
                <span className="text-xs font-semibold text-ink-600">Namn på lokalprogram</span>
                <Input
                  value={programDraft.title}
                  onChange={(event) => setProgramDraft((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Ex. Stockholm huvudkontor"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Område</span>
                <Select value={programDraft.district} onValueChange={(value) => setProgramDraft((prev) => ({ ...prev, district: value }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {districtOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Typ av lokal</span>
                <Select
                  value={Array.isArray(programDraft.type) && programDraft.type.length ? programDraft.type[0] : "Alla"}
                  onValueChange={(value) => setProgramDraft((prev) => ({ ...prev, type: value === "Alla" ? [] : [value] }))}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alla">Alla typer</SelectItem>
                    {typeOptions.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Minst platser</span>
                <Input type="number" min="0" value={programDraft.teamSize} onChange={(event) => setProgramDraft((prev) => ({ ...prev, teamSize: event.target.value }))} />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Min yta (kvm)</span>
                <Input type="number" min="0" value={programDraft.minSize} onChange={(event) => setProgramDraft((prev) => ({ ...prev, minSize: event.target.value }))} />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Max yta (kvm)</span>
                <Input type="number" min="0" value={programDraft.maxSize} onChange={(event) => setProgramDraft((prev) => ({ ...prev, maxSize: event.target.value }))} />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Max budget / mån</span>
                <Input type="number" min="0" value={programDraft.maxBudget} onChange={(event) => setProgramDraft((prev) => ({ ...prev, maxBudget: event.target.value }))} />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Inflyttning</span>
                <Input type="date" value={programDraft.moveInDate} onChange={(event) => setProgramDraft((prev) => ({ ...prev, moveInDate: event.target.value }))} />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Avtalsflexibilitet</span>
                <Select value={programDraft.contractFlex || "Alla"} onValueChange={(value) => setProgramDraft((prev) => ({ ...prev, contractFlex: value === "Alla" ? "" : value }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {contractOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Kollektivtrafik</span>
                <Select value={programDraft.transitDistance || "Alla"} onValueChange={(value) => setProgramDraft((prev) => ({ ...prev, transitDistance: value === "Alla" ? "" : value }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {transitOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Tillgång</span>
                <Select value={programDraft.accessHours || "Alla"} onValueChange={(value) => setProgramDraft((prev) => ({ ...prev, accessHours: value === "Alla" ? "" : value }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {accessOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Parkering</span>
                <Select value={programDraft.parkingType || "Alla"} onValueChange={(value) => setProgramDraft((prev) => ({ ...prev, parkingType: value === "Alla" ? "" : value }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {parkingOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-ink-600">Planlösning</span>
                <Select value={programDraft.layoutType || "Alla"} onValueChange={(value) => setProgramDraft((prev) => ({ ...prev, layoutType: value === "Alla" ? "" : value }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {layoutOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </label>
            </div>

            <div className="mt-4 border-b border-black/10 pb-4">
              <div className="rounded-2xl border border-black/10 bg-[#ffffff] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Särskilda krav</p>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                    <Checkbox
                      checked={Boolean(programDraft.includeOperatingCosts)}
                      onCheckedChange={(checked) => setProgramDraft((prev) => ({ ...prev, includeOperatingCosts: Boolean(checked) }))}
                    />
                    Driftkostnad ingår
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                    <Checkbox
                      checked={Boolean(programDraft.accessibilityAdapted)}
                      onCheckedChange={(checked) => setProgramDraft((prev) => ({ ...prev, accessibilityAdapted: Boolean(checked) }))}
                    />
                    Tillgänglighetsanpassad
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                    <Checkbox
                      checked={Boolean(programDraft.ecoCertified)}
                      onCheckedChange={(checked) => setProgramDraft((prev) => ({ ...prev, ecoCertified: Boolean(checked) }))}
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
                    <Button
                      key={option.value}
                      type="button"
                      variant="outline"
                      className={`h-auto shrink-0 gap-2 whitespace-nowrap rounded-full px-3.5 py-2.5 text-sm font-semibold ${
                        active ? "border-[#0b0a0e] bg-[#0b0a0e] text-white hover:bg-[#0b0a0e]/90" : "border-black/10 text-ink-700"
                      }`}
                      onClick={() => toggleProgramAmenity(option.value)}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-auto rounded-full border-black/20 px-5 py-2.5 text-sm font-semibold text-ink-700"
                onClick={() => {
                  setShowProgramOverlay(false);
                  setEditingProgramId(null);
                }}
              >
                Avbryt
              </Button>
              <Button
                type="button"
                className="h-auto rounded-full px-5 py-2.5 text-sm font-semibold"
                onClick={saveProgramChanges}
                disabled={savingProgram}
              >
                {savingProgram ? "Sparar..." : "Spara ändringar"}
              </Button>
            </div>
          </div>
        </div>
        </div>
      ) : null}

      {showTeamOverlay ? (
        <div className="fixed inset-0 z-[90] h-dvh overflow-hidden bg-[#ffffff]">
        <div className="h-full overflow-y-auto overscroll-none bg-[#ffffff] p-4 sm:p-6">
          <div className="mx-auto w-full max-w-[1240px] rounded-3xl border border-black/10 bg-[#ffffff] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold text-[#0b0a0e]">Hantera profil</h3>
                <p className="mt-1 text-sm text-ink-600">Redigera administratörsprofil och hantera teamets uppgifter.</p>
              </div>
            </div>

            <div className="mt-4 p-1">
              <p className="text-sm font-semibold text-[#0b0a0e]">Administratör</p>
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
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="absolute right-2 top-2 h-10 w-10 rounded-full border-black/20 text-ink-700 hover:border-[#0b0a0e] hover:bg-transparent hover:text-[#0b0a0e]"
                      onClick={() => profileAvatarInputRef.current?.click()}
                      aria-label="Byt foto"
                    >
                      <CameraIcon className="h-4 w-4" />
                    </Button>
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
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto gap-1.5 rounded-full border-black/20 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-[#0b0a0e] hover:bg-transparent hover:text-[#0b0a0e]"
                        onClick={() => setProfileDraft((prev) => ({ ...prev, avatarUrl: "" }))}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Ta bort foto
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 sm:col-span-2">
                    <span className="text-xs font-semibold text-ink-600">Namn</span>
                    <Input value={profileDraft.name} onChange={(event) => setProfileDraft((prev) => ({ ...prev, name: event.target.value }))} />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-ink-600">Telefon</span>
                    <Input value={profileDraft.phone} onChange={(event) => setProfileDraft((prev) => ({ ...prev, phone: event.target.value }))} />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-ink-600">E-post</span>
                    <Input value={user?.email || ""} disabled />
                  </label>
                  <div className="sm:col-span-2">
                    <Button
                      type="button"
                      className="h-auto rounded-full px-4 py-2 text-xs font-semibold"
                      onClick={saveProfileChanges}
                      disabled={savingProfile}
                    >
                      {savingProfile ? "Sparar..." : "Spara ändringar"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-auto rounded-full border-black/20 px-5 py-2.5 text-sm font-semibold text-ink-700"
                onClick={() => setShowTeamOverlay(false)}
              >
                Avbryt
              </Button>
            </div>
          </div>
        </div>
        </div>
      ) : null}

      <ViewingRequestModal
        listing={bookingListing}
        onClose={() => setBookingListing(null)}
        onSubmit={async (payload) => {
          if (typeof app.requestViewing === "function") {
            await app.requestViewing(payload);
          }
          setBookingListing(null);
        }}
      />
    </section>
  );
}

export default ProfilePage;
