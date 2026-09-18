import { useEffect, useMemo, useRef, useState } from "react";
import ListingVisualCard from "../../components/app/ListingVisualCard";
import LocalProgramModule from "../../components/app/LocalProgramModule";
import ViewingRequestModal from "../../components/app/ViewingRequestModal";
import {
  BuildingIcon,
  CalendarIcon,
  CarIcon,
  CameraIcon,
  CheckBadgeIcon,
  ClockIcon,
  CoinsIcon,
  LightbulbIcon,
  LoungeIcon,
  MapIcon,
  PencilIcon,
  PinIcon,
  RulerIcon,
  ShieldIcon,
  TrashIcon,
  UserIcon,
  XIcon
} from "../../components/icons/UiIcons";
import PremiumPromoCard from "../../components/shared/PremiumPromoCard";
import { navigateTo } from "../../lib/router";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  districtOptions,
  typeOptions,
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
  normalizeAmenity,
  formatMoney,
  normalizeProgramList,
  createBlankProgram,
  readOptimizedProfileImage,
  isFilled
} from "../../lib/profileHelpers";

const mockRenterMatches = [
  {
    id: "renter-match-1",
    matchPercent: 91,
    name: "Nordic Growth AB",
    verified: true,
    title: "SCALEUP · MARKNAD",
    summary: "Växande marknadsteam söker kontor nära tunnelbana.",
    timeline: "Nu → 3 månader",
    budget: "Max SEK 28,000/mån",
    furnishing: "Möblerat eller flex",
    people: "6 arbetsplatser",
    logo: "NG"
  },
  {
    id: "renter-match-2",
    matchPercent: 87,
    name: "BASIC Studio Group",
    verified: true,
    title: "TECH · KONSULT",
    summary: "Två bolag som vill samlokalisera i Söderläge.",
    timeline: "Nu → Tills vidare",
    budget: "Max SEK 42,000/mån",
    furnishing: "Omöblerat",
    people: "12 arbetsplatser",
    logo: "BS"
  },
  {
    id: "renter-match-3",
    matchPercent: 84,
    name: "Lind & Partners",
    verified: true,
    title: "KREATIV BYRÅ",
    summary: "Etablerad byrå med stabil ekonomi och lång horisont.",
    timeline: "1-2 månader → 24 månader",
    budget: "Max SEK 36,000/mån",
    furnishing: "Flexibelt",
    people: "8 arbetsplatser",
    logo: "LP"
  }
];

function PanelProfileSection({ app, basePath, forcedTab }) {
  const {
    user,
    favorites = [],
    filterPresets = [],
    resendBrokerVerificationRequest,
    updateProfile,
    deleteSavedFilter
  } = app;

  const activeTab = forcedTab || "profile";
  const [showProgramOverlay, setShowProgramOverlay] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState(null);
  const [showEditOverlay, setShowEditOverlay] = useState(false);
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

  const favoriteIds = useMemo(() => new Set(favorites.map((entry) => String(entry.listingId))), [favorites]);
  const favoriteListings = useMemo(() => (app.listings || []).filter((listing) => favoriteIds.has(String(listing.id))), [app.listings, favoriteIds]);

  const profileSetupTasks = useMemo(() => {
    return [
      { id: "profile-photo", label: "Lägg till profilbild", done: isFilled(user?.profile?.avatarUrl) },
      { id: "profile-name", label: "Kontrollera namn", done: isFilled(user?.name) },
      { id: "profile-phone", label: "Lägg till telefon", done: isFilled(user?.phone) },
      { id: "profile-email", label: "E-post registrerad", done: isFilled(user?.email) }
    ];
  }, [user?.email, user?.name, user?.phone, user?.profile?.avatarUrl]);

  const profileSetupProgress = useMemo(() => {
    const done = profileSetupTasks.filter((item) => item.done).length;
    const total = profileSetupTasks.length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, percent };
  }, [profileSetupTasks]);
  const showProfileSetupCard = profileSetupProgress.done < profileSetupProgress.total;

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
      setShowEditOverlay(false);
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
      {activeTab === "profile" ? (
        <div className="space-y-4">
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
                    onClick={() => setShowEditOverlay(true)}
                  >
                    <CameraIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#0b0a0e]">{user?.name || "Användare"}</p>
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
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto gap-1.5 rounded-full border-black/20 px-4 py-2 text-xs font-semibold text-ink-700 hover:border-[#0b0a0e] hover:bg-transparent hover:text-[#0b0a0e]"
                  onClick={() => setShowEditOverlay(true)}
                >
                  <PencilIcon className="h-4 w-4" />
                  Hantera profil
                </Button>
              </div>
            </div>
            <div className="hidden lg:block" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              {showProfileSetupCard ? (
                <article className="rounded-3xl border border-black/10 bg-[#ffffff] p-5 sm:p-6">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-between gap-3 text-left font-normal hover:bg-transparent"
                    onClick={() => setIsProfileSetupCollapsed((prev) => !prev)}
                    aria-expanded={!isProfileSetupCollapsed}
                  >
                    <h2 className="text-2xl font-semibold text-[#0b0a0e]">Slutför din profil</h2>
                    <Badge variant="outline" className="h-auto gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-ink-700 hover:border-[#0b0a0e] hover:text-[#0b0a0e]">
                      {isProfileSetupCollapsed ? "Visa" : "Dölj"}
                    </Badge>
                  </Button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isProfileSetupCollapsed ? "max-h-0 opacity-0" : "max-h-[700px] opacity-100"
                    }`}
                  >
                    <p className="mt-1 text-sm text-ink-600">Komplettera dina profiluppgifter.</p>

                    <div className="mt-4">
                      <p className="text-sm font-semibold text-ink-700">{profileSetupProgress.percent}% klart</p>
                      <Progress
                        value={profileSetupProgress.percent}
                        className="mt-2 [&_[data-slot=progress-track]]:h-3 [&_[data-slot=progress-track]]:border [&_[data-slot=progress-track]]:border-black/10 [&_[data-slot=progress-track]]:bg-[#eef2f8] [&_[data-slot=progress-indicator]]:bg-[#0b0a0e]"
                      />
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
                            onClick={() => setShowEditOverlay(true)}
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

              <div className="mb-4">
                <LocalProgramModule
                  programs={renterPrograms}
                  canEdit
                  onAddProgram={openNewProgramEditor}
                  onEditProgram={openExistingProgramEditor}
                  onDeleteProgram={deleteProgram}
                />
              </div>

              <section className="pt-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#0b0a0e]">Hyresgäster som matchar dina lokaler</h2>
                    <p className="mt-1 text-sm text-ink-600">Kuraterade profiler med tydlig matchning mot ditt utbud.</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {mockRenterMatches.map((renter) => (
                    <article key={renter.id} className="relative rounded-3xl border border-black/10 bg-[#ffffff] p-4 sm:p-5">
                      <Badge variant="outline" className="h-auto absolute right-3.5 top-3.5 rounded-full border-[#0b0a0e]/20 bg-[#f8fafc] px-3 py-1 text-sm font-semibold text-[#0b0a0e]">
                        {renter.matchPercent}%
                      </Badge>
                      <div className="h-5" />
                      <div className="mx-auto mt-3 flex h-28 w-28 items-center justify-center rounded-2xl border border-[#0b0a0e]/15 bg-[#f8fafc] text-3xl font-semibold tracking-wide text-[#0b0a0e]">
                        {renter.logo}
                      </div>
                      <div className="mt-3 text-center">
                        <p className="text-[20px] font-semibold leading-[1.15] text-[#241d1a]">{renter.name}</p>
                        {renter.verified ? (
                          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700">
                            <span className="inline-flex h-4 w-4 items-center justify-center bg-[#0b0a0e] text-white" style={{ clipPath: "polygon(50% 1%,58% 4%,66% 2%,73% 8%,81% 8%,88% 15%,96% 19%,99% 28%,97% 36%,99% 44%,94% 51%,95% 59%,89% 66%,86% 75%,78% 79%,71% 86%,62% 87%,55% 94%,47% 92%,39% 97%,32% 91%,23% 91%,18% 83%,9% 81%,6% 72%,1% 65%,3% 56%,0% 48%,6% 41%,4% 33%,10% 26%,11% 17%,20% 13%,25% 5%,34% 5%,42% 1%)" }}>
                              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3">
                                <path d="M5.5 12.5l4 4 9-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            Verifierad organisation
                          </p>
                        ) : null}
                        <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">{renter.title}</p>
                        <p className="mt-1.5 text-center text-base font-medium leading-snug text-[#241d1a]">{renter.summary}</p>
                      </div>
                      <ul className="mt-4 space-y-2.5 text-[#241d1a]">
                        <li className="flex items-center gap-2.5 text-sm"><CalendarIcon className="h-4 w-4 text-ink-700" /><span>{renter.timeline}</span></li>
                        <li className="flex items-center gap-2.5 text-sm"><CoinsIcon className="h-4 w-4 text-ink-700" /><span>{renter.budget}</span></li>
                        <li className="flex items-center gap-2.5 text-sm"><LoungeIcon className="h-4 w-4 text-ink-700" /><span>{renter.furnishing}</span></li>
                        <li className="flex items-center gap-2.5 text-sm"><UserIcon className="h-4 w-4 text-ink-700" /><span>{renter.people}</span></li>
                      </ul>
                    </article>
                  ))}
                </div>
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
            <Badge variant="outline" className="h-auto rounded-full bg-[#ffffff] px-3 py-1 text-xs font-semibold text-ink-700">
              {favoriteListings.length} sparade
            </Badge>
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
                  onToggleShortlist={(listingId) => app.toggleFavorite?.(listingId)}
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
            <Badge variant="outline" className="h-auto rounded-full bg-[#ffffff] px-3 py-1 text-xs font-semibold text-ink-700">
              {filterPresets.length} sparade
            </Badge>
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

      {showEditOverlay ? (
        <div className="fixed inset-0 z-[90] h-dvh overflow-hidden bg-[#ffffff]">
          <div className="h-full overflow-y-auto overscroll-none bg-[#ffffff] p-4 sm:p-6">
            <div className="mx-auto w-full max-w-[1240px] rounded-3xl border border-black/10 bg-[#ffffff] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-semibold text-[#0b0a0e]">Hantera profil</h3>
                  <p className="mt-1 text-sm text-ink-600">Redigera profilbild och kontaktuppgifter.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="close-circle-button rounded-full border-black/15 text-xl leading-none text-ink-700 hover:bg-transparent"
                  onClick={() => setShowEditOverlay(false)}
                  aria-label="Stäng"
                >
                  ×
                </Button>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[220px_minmax(0,680px)] lg:items-start">
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

              <div className="mt-5 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto rounded-full border-black/20 px-5 py-2.5 text-sm font-semibold text-ink-700"
                  onClick={() => setShowEditOverlay(false)}
                >
                  Avbryt
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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

export default PanelProfileSection;
