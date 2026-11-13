import LocalProgramWorkspace from "../../components/app/LocalProgramWorkspace";
import LocalProgramFlow from "../../components/app/LocalProgramFlow";
import { AccountPage, AccountRow, AccountSection } from "../../components/account/AccountLayout";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useEffect, useMemo, useRef, useState } from "react";
import { SavedListingsCard, SavedSearchesCard } from "../../components/app/ProfileSavedCards";
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
  UserIcon,
} from "../../components/icons/UiIcons";
import { navigateTo, normalizeAppRole } from "../../lib/router";
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

function PanelProfileSection({ app, page = "profil" }) {
  const {
    user,
    favorites = [],
    filterPresets = [],
    resendBrokerVerificationRequest,
    updateProfile,
    deleteSavedFilter
  } = app;

  const [showProgramOverlay, setShowProgramOverlay] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
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
      contextNotes: selectedProgram.contextNotes || {},
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

  // Links such as /app/broker/profil#sparade-objekt land on the card they name, also when the profile is already open.
  useEffect(() => {
    function scrollToHash() {
      const id = window.location.hash.slice(1);
      if (id) window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "smooth" }), 300);
    }
    scrollToHash();
    window.addEventListener("app:navigate", scrollToHash);
    window.addEventListener("hashchange", scrollToHash);
    return () => {
      window.removeEventListener("app:navigate", scrollToHash);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);

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
      setEditingProfile(false);
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

  // `draftOverride` is a program that has only just been finished (the new-program flow keeps its own draft); without one the
  // editor's draft is saved. `keepOpen` leaves the window open for the flow's own "done" screen. Resolves to the saved program.
  async function saveProgramChanges(draftOverride, { keepOpen = false, message = "Lokalprogram uppdaterat." } = {}) {
    const source = draftOverride && typeof draftOverride.title === "string" ? draftOverride : programDraft;
    if (!updateProfile) {
      app.pushToast?.("Kunde inte spara ändringarna just nu.", "error");
      return null;
    }
    setSavingProgram(true);
    try {
      const nextProgram = {
        ...source,
        id: source.id || `program-${Date.now()}`,
        title: String(source.title || "").trim() || `Lokalprogram ${renterPrograms.length + 1}`,
        type: Array.isArray(source.type) ? source.type.filter(Boolean) : [],
        teamSize: String(source.teamSize || "").trim(),
        minSize: String(source.minSize || "").trim(),
        maxSize: String(source.maxSize || "").trim(),
        minBudget: String(source.minBudget || "").trim(),
        maxBudget: String(source.maxBudget || "").trim(),
        moveInDate: source.moveInDate || "",
        contractFlex: source.contractFlex || "",
        transitDistance: source.transitDistance || "",
        accessHours: source.accessHours || "",
        parkingType: source.parkingType || "",
        layoutType: source.layoutType || "",
        amenities: source.amenities || ""
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
      app.pushToast?.(message, "success");
      if (!keepOpen) {
        setShowProgramOverlay(false);
        setEditingProgramId(null);
      }
      return nextProgram;
    } catch (error) {
      app.pushToast?.(error.message || "Kunde inte spara lokalprogrammet.", "error");
      return null;
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

  const startEditingProfile = () => {
    setProfileDraft({ name: user?.name || "", phone: user?.phone || "", avatarUrl: user?.profile?.avatarUrl || "" });
    setEditingProfile(true);
  };
  const shownAvatar = editingProfile ? profileDraft.avatarUrl : user?.profile?.avatarUrl;
  const initials = (user?.name || user?.email || "A").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const roleText = brokerVerificationApproved
    ? "Verifierad mäklare"
    : hasPendingBrokerVerification
      ? "Verifiering pågår"
      : normalizeAppRole(user?.role) === "company_admin"
        ? "Bolagsadmin"
        : "Mäklare";
  const company = user?.profile?.companyName || user?.profile?.legalEntity;
  const verificationCompany = `${brokerVerificationCompanyName}${brokerVerificationOrganizationNumber ? ` (${brokerVerificationOrganizationNumber})` : ""}`;
  const showVerification = hasPendingBrokerVerification || (brokerVerificationApproved && !dismissedBrokerApprovalCard) || brokerVerificationRejected;

  return (
    <>
      {page === "profil" ? (
        <AccountPage title="Profil" description="Dina personuppgifter, profilbild och verifiering.">
          <AccountSection
            title="Personuppgifter"
            action={
              editingProfile ? null : (
                <Button type="button" variant="outline" size="sm" className="min-h-0 !rounded-md" onClick={startEditingProfile}>
                  <PencilIcon className="h-3.5 w-3.5" />
                  Redigera
                </Button>
              )
            }
          >
            <AccountRow label="Profilbild" description="Visas vid ditt namn i appen.">
              <div className="flex items-center gap-3 sm:justify-end">
                <Avatar className="size-12 shrink-0">
                  <AvatarImage src={shownAvatar} alt={user?.name || "Profilbild"} />
                  <AvatarFallback className="bg-tint-2 text-base font-semibold text-ink-700">{initials}</AvatarFallback>
                </Avatar>
                {editingProfile ? (
                  <>
                    <Button type="button" variant="outline" size="sm" className="min-h-0 !rounded-md" onClick={() => profileAvatarInputRef.current?.click()}>
                      <CameraIcon className="h-3.5 w-3.5" />
                      {profileDraft.avatarUrl ? "Byt foto" : "Lägg till"}
                    </Button>
                    {profileDraft.avatarUrl ? (
                      <Button type="button" variant="ghost" size="sm" className="min-h-0 !rounded-md text-ink-600" onClick={() => setProfileDraft((prev) => ({ ...prev, avatarUrl: "" }))}>
                        Ta bort
                      </Button>
                    ) : null}
                    <input
                      ref={profileAvatarInputRef}
                      className="hidden"
                      type="file"
                      accept="image/*"
                      aria-label="Välj profilbild"
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
                  </>
                ) : null}
              </div>
            </AccountRow>
            <AccountRow label="Namn" htmlFor="profile-name" field={editingProfile}>
              {editingProfile ? (
                <Input id="profile-name" value={profileDraft.name} onChange={(event) => setProfileDraft((prev) => ({ ...prev, name: event.target.value }))} />
              ) : (
                <span className="font-medium text-strong">{user?.name || "Inte angivet"}</span>
              )}
            </AccountRow>
            <AccountRow label="E-post" description="Det du loggar in med. Kan inte ändras här." htmlFor="profile-email" field={editingProfile}>
              {editingProfile ? <Input id="profile-email" value={user?.email || ""} disabled /> : <span className="break-all">{user?.email || "Inte angivet"}</span>}
            </AccountRow>
            <AccountRow label="Telefon" htmlFor="profile-phone" field={editingProfile}>
              {editingProfile ? (
                <Input id="profile-phone" value={profileDraft.phone} onChange={(event) => setProfileDraft((prev) => ({ ...prev, phone: event.target.value }))} />
              ) : (
                <span className={user?.phone ? "" : "text-ink-500"}>{user?.phone || "Inte angivet"}</span>
              )}
            </AccountRow>
            <AccountRow label="Företag">
              <span className={company ? "" : "text-ink-500"}>{company || "Inte angivet"}</span>
            </AccountRow>
            <AccountRow label="Roll">
              <Badge variant="secondary" className="gap-1.5">
                {brokerVerificationApproved ? <CheckBadgeIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> : null}
                {roleText}
              </Badge>
            </AccountRow>
          </AccountSection>
          {editingProfile ? (
            <div className="-mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" className="min-h-0" onClick={() => setEditingProfile(false)}>
                Avbryt
              </Button>
              <Button type="button" className="min-h-0" onClick={saveProfileChanges} disabled={savingProfile}>
                {savingProfile ? "Sparar..." : "Spara ändringar"}
              </Button>
            </div>
          ) : null}

          {showProfileSetupCard ? (
            <AccountSection title="Slutför din profil" description={`${profileSetupProgress.done} av ${profileSetupProgress.total} steg klara`}>
              <div className="py-4">
                <p className="text-sm font-medium text-strong">{profileSetupProgress.percent}% klart</p>
                <Progress
                  value={profileSetupProgress.percent}
                  className="mt-2 [&_[data-slot=progress-track]]:h-2.5 [&_[data-slot=progress-track]]:border [&_[data-slot=progress-track]]:border-veil/10 [&_[data-slot=progress-track]]:bg-tint-2 [&_[data-slot=progress-indicator]]:bg-strong"
                />
              </div>
              {profileSetupTasks.map((task) => (
                <AccountRow key={task.id} label={task.label}>
                  {task.done ? (
                    <span className="inline-flex items-center gap-1.5 text-ink-500">
                      <CheckBadgeIcon aria-hidden="true" className="h-4 w-4" />
                      Klart
                    </span>
                  ) : (
                    <Button type="button" variant="outline" size="sm" className="min-h-0 !rounded-md" onClick={startEditingProfile}>
                      Fyll i
                    </Button>
                  )}
                </AccountRow>
              ))}
            </AccountSection>
          ) : null}

          {showVerification ? (
            <AccountSection title="Verifiering som mäklare">
              {hasPendingBrokerVerification ? (
                <AccountRow align="start" label="Verifiering skickad" description={`Din förfrågan om att bli mäklare hos ${verificationCompany} väntar på godkännande.`}>
                  <Button type="button" variant="outline" size="sm" className="min-h-0 !rounded-md" onClick={() => navigateTo("/onboarding/publisher-profile?role=broker&intent=add-role")}>
                    <ShieldIcon className="h-3.5 w-3.5" />
                    Visa verifiering
                  </Button>
                </AccountRow>
              ) : null}
              {!hasPendingBrokerVerification && brokerVerificationApproved && !dismissedBrokerApprovalCard ? (
                <AccountRow
                  align="start"
                  label="Verifiering godkänd"
                  description={`Du är verifierad som mäklare för ${verificationCompany}.${brokerApprovalNotification?.createdAt ? ` Godkänd ${new Date(brokerApprovalNotification.createdAt).toLocaleString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}.` : ""}`}
                >
                  <Button type="button" variant="ghost" size="sm" className="min-h-0 !rounded-md text-ink-600" aria-label="Dölj verifieringskort" onClick={() => setDismissedBrokerApprovalCard(true)}>
                    Dölj
                  </Button>
                </AccountRow>
              ) : null}
              {brokerVerificationRejected ? (
                <AccountRow align="start" label="Verifiering nekad" description={`Bolagsadmin för ${verificationCompany} nekade din förfrågan om att bli verifierad som mäklare.`}>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <Button type="button" size="sm" className="min-h-0 !rounded-md" disabled={resendingBrokerVerification} onClick={resendRejectedBrokerVerification}>
                      {resendingBrokerVerification ? "Skickar..." : "Skicka förfrågan igen"}
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="min-h-0 !rounded-md" onClick={() => navigateTo("/onboarding/publisher-profile?role=broker&intent=add-role")}>
                      Ändra organisationsnummer
                    </Button>
                  </div>
                </AccountRow>
              ) : null}
            </AccountSection>
          ) : null}

          <AccountSection title="Lokalflöde Premium">
            <AccountRow align="start" label="Stick ut med Lokalflöde Premium" description="Premiumprofiler får i snitt fler relevanta förfrågningar och snabbare återkoppling.">
              <Button type="button" variant="outline" size="sm" className="min-h-0 !rounded-md">
                Uppgradera (demo)
              </Button>
            </AccountRow>
          </AccountSection>
        </AccountPage>
      ) : null}

      {page === "lokalprogram" ? (
        <AccountPage title="Lokalprogram" description="Dina sökprofiler och de hyresgäster som matchar dem.">
          <LocalProgramModule
            title="Dina lokalprogram"
            programs={renterPrograms}
            canEdit
            onAddProgram={openNewProgramEditor}
            onEditProgram={openExistingProgramEditor}
            onDeleteProgram={deleteProgram}
          />
          <AccountSection title="Hyresgäster som matchar dina lokaler" description="Kuraterade profiler med tydlig matchning mot ditt utbud.">
            {mockRenterMatches.map((renter) => (
              <div key={renter.id} className="flex items-start gap-3 border-b border-veil/10 py-4 last:border-b-0">
                <Avatar className="size-10 shrink-0">
                  <AvatarFallback className="bg-tint-2 text-sm font-semibold text-strong">{renter.logo}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-semibold text-strong">{renter.name}</p>
                    {renter.verified ? (
                      <Badge variant="secondary" className="h-auto gap-1 px-2 py-0.5 text-[11px]">
                        <CheckBadgeIcon aria-hidden="true" className="h-3 w-3" />
                        Verifierad organisation
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[11px] font-semibold  tracking-[0.1em] text-ink-500">{renter.title}</p>
                  <p className="mt-1 text-sm leading-5 text-ink-700">{renter.summary}</p>
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-600">
                    <li className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" />{renter.timeline}</li>
                    <li className="flex items-center gap-1.5"><CoinsIcon className="h-3.5 w-3.5" />{renter.budget}</li>
                    <li className="flex items-center gap-1.5"><LoungeIcon className="h-3.5 w-3.5" />{renter.furnishing}</li>
                    <li className="flex items-center gap-1.5"><UserIcon className="h-3.5 w-3.5" />{renter.people}</li>
                  </ul>
                </div>
                <Badge variant="outline" className="h-auto shrink-0 rounded-full bg-control px-2.5 py-1 text-sm font-semibold text-strong">
                  {renter.matchPercent}%
                </Badge>
              </div>
            ))}
          </AccountSection>
        </AccountPage>
      ) : null}

      {page === "sparat" ? (
        <AccountPage title="Sparat" description="Objekt och sökningar du har sparat.">
          <SavedListingsCard
            listings={favoriteListings}
            onOpen={(listing) => navigateTo(`/app/listings/${encodeURIComponent(listing.id)}`)}
            onBook={(listing) => setBookingListing(listing)}
            onRemove={(listingId) => app.toggleFavorite?.(listingId)}
            onBrowse={() => navigateTo("/app/rent")}
          />
          <SavedSearchesCard
            presets={filterPresets}
            onSearch={(preset) => navigateTo(buildRentSearchUrl(preset.filters))}
            onDelete={(presetId) => deleteSavedFilter?.(presetId)}
            onBrowse={() => navigateTo("/app/rent")}
          />
        </AccountPage>
      ) : null}

      {showProgramOverlay && !editingProgramId ? (
        <LocalProgramFlow
          existingCount={renterPrograms.length}
          onCreate={(program) => saveProgramChanges(program, { keepOpen: true, message: "Lokalprogram skapat." })}
          onShowMatches={(program) => navigateTo(buildRentSearchUrl(program))}
          onClose={() => { setShowProgramOverlay(false); setEditingProgramId(null); }}
        />
      ) : null}

      {showProgramOverlay && editingProgramId ? (
        <LocalProgramWorkspace onContextChange={(contextNotes) => setProgramDraft((prev) => ({ ...prev, contextNotes }))} draft={programDraft} editing={Boolean(editingProgramId)} busy={savingProgram} onSave={saveProgramChanges} onClose={() => { setShowProgramOverlay(false); setEditingProgramId(null); }}>
          {(close, programStep) => (
            <Card className={programStep === null ? "gap-0 py-0 mx-auto w-full border-0 bg-surface p-0 shadow-none" : "gap-0 overflow-visible border-0 bg-transparent p-0 shadow-none"} onClick={(event) => event.stopPropagation()}>
              <div className={programStep === null ? "flex items-start justify-between gap-3 pr-2" : "hidden"}>
                <div>
                  <h3 className="text-lg font-semibold text-strong">{editingProgramId ? "Redigera lokalprogram" : "Nytt lokalprogram"}</h3>
                  <p className="mt-1 text-sm text-ink-600">Justera preferenser som används i matchning och sök.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="close-circle-button mr-1 rounded-md border-veil/15 text-xl leading-none text-ink-700 hover:bg-transparent"
                  onClick={close}
                  aria-label="Stäng"
                >
                  ×
                </Button>
              </div>

              {(programStep === null || programStep === 0) && <div className={`${programStep === null ? "mt-4" : ""} grid gap-3 sm:grid-cols-2 lg:grid-cols-12`}><h4 hidden={programStep !== null} className="border-b border-border pb-1.5 pt-1 text-xs font-semibold text-ink-600 sm:col-span-2 lg:col-span-12">Grunduppgifter</h4>
<label className="flex min-w-0 flex-col justify-end gap-1.5 lg:col-span-4">
                  <span className="text-xs font-semibold text-ink-600">{programStep === null ? "Namn på lokalprogram" : "Vad vill du kalla lokalprogrammet?"}</span>
                  <Input
                    value={programDraft.title}
                    onChange={(event) => setProgramDraft((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Ex. Stockholm huvudkontor"
                  />
                </label>

                <label className="flex min-w-0 flex-col justify-end gap-1.5 lg:col-span-4">
                  <span className="text-xs font-semibold text-ink-600">{programStep === null ? "Område" : "Var vill ni sitta?"}</span>
                  <Select value={programDraft.district} onValueChange={(value) => setProgramDraft((prev) => ({ ...prev, district: value }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {districtOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </label>

                <label className="flex min-w-0 flex-col justify-end gap-1.5 lg:col-span-4">
                  <span className="text-xs font-semibold text-ink-600">{programStep === null ? "Typ av lokal" : "Vilken typ av lokal söker ni?"}</span>
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

                </div>}
{(programStep === null || programStep === 1) && <div className={`${programStep === null ? "mt-4" : ""} grid gap-3 sm:grid-cols-2 lg:grid-cols-12`}><h4 hidden={programStep !== null} className="border-b border-border pb-1.5 pt-1 text-xs font-semibold text-ink-600 sm:col-span-2 lg:col-span-12">Storlek och budget</h4>
<label className="flex min-w-0 flex-col justify-end gap-1.5 lg:col-span-3">
                  <span className="text-xs font-semibold text-ink-600">{programStep === null ? "Minst platser" : "Hur många platser behövs?"}</span>
                  <Input type="number" min="0" value={programDraft.teamSize} onChange={(event) => setProgramDraft((prev) => ({ ...prev, teamSize: event.target.value }))} />
                </label>

                <label className="flex min-w-0 flex-col justify-end gap-1.5 lg:col-span-3">
                  <span className="text-xs font-semibold text-ink-600">{programStep === null ? "Min yta (kvm)" : "Minsta yta i kvm?"}</span>
                  <Input type="number" min="0" value={programDraft.minSize} onChange={(event) => setProgramDraft((prev) => ({ ...prev, minSize: event.target.value }))} />
                </label>

                <label className="flex min-w-0 flex-col justify-end gap-1.5 lg:col-span-3">
                  <span className="text-xs font-semibold text-ink-600">{programStep === null ? "Max yta (kvm)" : "Största yta i kvm?"}</span>
                  <Input type="number" min="0" value={programDraft.maxSize} onChange={(event) => setProgramDraft((prev) => ({ ...prev, maxSize: event.target.value }))} />
                </label>

                <label className="flex min-w-0 flex-col justify-end gap-1.5 lg:col-span-3">
                  <span className="text-xs font-semibold text-ink-600">{programStep === null ? "Max budget / mån" : "Maxbudget per månad?"}</span>
                  <Input type="number" min="0" value={programDraft.maxBudget} onChange={(event) => setProgramDraft((prev) => ({ ...prev, maxBudget: event.target.value }))} />
                </label>

                </div>}
{(programStep === null || programStep === 2) && <div className={`${programStep === null ? "mt-4" : ""} grid gap-3 sm:grid-cols-2 lg:grid-cols-12`}><h4 hidden={programStep !== null} className="border-b border-border pb-1.5 pt-1 text-xs font-semibold text-ink-600 sm:col-span-2 lg:col-span-12">Tid och avtal</h4>
<label className="flex min-w-0 flex-col justify-end gap-1.5 lg:col-span-6">
                  <span className="text-xs font-semibold text-ink-600">{programStep === null ? "Inflyttning" : "När vill ni flytta in?"}</span>
                  <Input type="date" value={programDraft.moveInDate} onChange={(event) => setProgramDraft((prev) => ({ ...prev, moveInDate: event.target.value }))} />
                </label>

                <label className="flex min-w-0 flex-col justify-end gap-1.5 lg:col-span-6">
                  <span className="text-xs font-semibold text-ink-600">{programStep === null ? "Avtalsflexibilitet" : "Hur långt avtal passar er?"}</span>
                  <Select value={programDraft.contractFlex || "Alla"} onValueChange={(value) => setProgramDraft((prev) => ({ ...prev, contractFlex: value === "Alla" ? "" : value }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {contractOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </label>

                </div>}
{(programStep === null || programStep === 3) && <div className={`${programStep === null ? "mt-4" : ""} grid gap-3 sm:grid-cols-2 lg:grid-cols-12`}><h4 hidden={programStep !== null} className="border-b border-border pb-1.5 pt-1 text-xs font-semibold text-ink-600 sm:col-span-2 lg:col-span-12">Läge och tillgång</h4>
<label className="flex min-w-0 flex-col justify-end gap-1.5 lg:col-span-3">
                  <span className="text-xs font-semibold text-ink-600">{programStep === null ? "Kollektivtrafik" : "Hur nära kollektivtrafik?"}</span>
                  <Select value={programDraft.transitDistance || "Alla"} onValueChange={(value) => setProgramDraft((prev) => ({ ...prev, transitDistance: value === "Alla" ? "" : value }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {transitOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </label>

                <label className="flex min-w-0 flex-col justify-end gap-1.5 lg:col-span-3">
                  <span className="text-xs font-semibold text-ink-600">{programStep === null ? "Tillgång" : "När behöver ni tillgång?"}</span>
                  <Select value={programDraft.accessHours || "Alla"} onValueChange={(value) => setProgramDraft((prev) => ({ ...prev, accessHours: value === "Alla" ? "" : value }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {accessOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </label>

                <label className="flex min-w-0 flex-col justify-end gap-1.5 lg:col-span-3">
                  <span className="text-xs font-semibold text-ink-600">{programStep === null ? "Parkering" : "Vilken parkering behövs?"}</span>
                  <Select value={programDraft.parkingType || "Alla"} onValueChange={(value) => setProgramDraft((prev) => ({ ...prev, parkingType: value === "Alla" ? "" : value }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {parkingOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </label>

                <label className="flex min-w-0 flex-col justify-end gap-1.5 lg:col-span-3">
                  <span className="text-xs font-semibold text-ink-600">{programStep === null ? "Planlösning" : "Vilken planlösning passar?"}</span>
                  <Select value={programDraft.layoutType || "Alla"} onValueChange={(value) => setProgramDraft((prev) => ({ ...prev, layoutType: value === "Alla" ? "" : value }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {layoutOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </label>
              </div>}
              <div hidden={programStep !== null && programStep !== 4} className="mt-4 border-b border-veil/10 pb-4">
                <Card className="w-fit max-w-full gap-0 py-0 rounded-lg p-3">
                  <p className="text-[11px] font-semibold text-ink-700">Särskilda krav</p>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                      <Checkbox
                        checked={Boolean(programDraft.includeOperatingCosts)}
                        onCheckedChange={(checked) => setProgramDraft((prev) => ({ ...prev, includeOperatingCosts: Boolean(checked) }))}
                      />
                      {programStep === null ? "Driftkostnad ingår" : "Ska driftkostnader ingå?"}
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                      <Checkbox
                        checked={Boolean(programDraft.accessibilityAdapted)}
                        onCheckedChange={(checked) => setProgramDraft((prev) => ({ ...prev, accessibilityAdapted: Boolean(checked) }))}
                      />
                      {programStep === null ? "Tillgänglighetsanpassad" : "Behöver lokalen vara tillgänglighetsanpassad?"}
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                      <Checkbox
                        checked={Boolean(programDraft.ecoCertified)}
                        onCheckedChange={(checked) => setProgramDraft((prev) => ({ ...prev, ecoCertified: Boolean(checked) }))}
                      />
                      {programStep === null ? "Miljöcertifierad" : "Behöver lokalen vara miljöcertifierad?"}
                    </label>
                  </div>
                </Card>
              </div>

              <div hidden={programStep !== null && programStep !== 5} className="mt-3">
                <p className="mb-2 text-xs font-semibold text-ink-600">{programStep === null ? "Bekvämligheter" : "Vilka bekvämligheter vill ni ha?"}</p>
                <div className="flex flex-wrap gap-2">
                  {amenityOptions.map((option) => {
                    const Icon = option.icon;
                    const active = selectedProgramAmenities.some((item) => normalizeAmenity(item) === normalizeAmenity(option.value));
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant="outline"
                          className={`h-auto shrink-0 gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold ${
                          active ? "border-strong bg-strong text-on-strong hover:bg-strong/90" : "border-veil/10 text-ink-700"
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

            </Card>
          )}
        </LocalProgramWorkspace>
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
    </>
  );
}

export default PanelProfileSection;
