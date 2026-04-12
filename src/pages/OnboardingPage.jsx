import { useEffect, useMemo, useState } from "react";
import { navigateTo } from "../lib/router";
import AuthFlowNav from "../components/layout/AuthFlowNav";

const RENTER_STEPS = ["program-core", "program-details", "review"];
const PUBLISHER_STEPS = ["publisher-profile", "review"];

const districtOptions = ["Alla", "Norrmalm", "Södermalm", "Vasastan", "Östermalm", "Kungsholmen", "Solna", "Sundbyberg"];
const typeOptions = ["Kontor", "Coworking", "Kontorshotell", "Butik", "Lager", "Showroom", "Ateljé", "Klinik", "Restaurang"];
const contractOptions = ["Alla", "Kort (0-6 mån)", "Mellan (6-12 mån)", "Lång (12+ mån)"];
const transitOptions = ["Alla", "0-300 meter", "0-600 meter", "0-1000 meter", "0-1100 meter"];
const parkingOptions = ["Alla", "Ingen preferens", "Bilparkering", "Laddplats", "Garage"];
const layoutOptions = ["Alla", "Öppet landskap", "Mixat", "Cellkontor", "Flexibelt"];
const accessOptions = ["Alla", "Kontorstid", "Utökad access", "24/7"];

function parseInitialTypes(rawTypes) {
  if (Array.isArray(rawTypes)) return rawTypes.filter(Boolean);
  if (typeof rawTypes === "string" && rawTypes.trim()) {
    return rawTypes.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function OnboardingPage({ user, onComplete, pathname = "/onboarding" }) {
  const [primaryRole, setPrimaryRole] = useState(user?.role === "publisher" ? "publisher" : "renter");
  const [account, setAccount] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || ""
  });
  const [renterProgram, setRenterProgram] = useState({
    district: user?.profile?.renterProgram?.district || user?.profile?.preferredAreas || "Alla",
    type: parseInitialTypes(user?.profile?.renterProgram?.type),
    teamSize: user?.profile?.renterProgram?.teamSize || "",
    minSize: user?.profile?.renterProgram?.minSize || "",
    maxSize: user?.profile?.renterProgram?.maxSize || "",
    minBudget: user?.profile?.renterProgram?.minBudget || "",
    maxBudget: user?.profile?.renterProgram?.maxBudget || "",
    moveInDate: user?.profile?.renterProgram?.moveInDate || "",
    contractFlex: user?.profile?.renterProgram?.contractFlex || "",
    transitDistance: user?.profile?.renterProgram?.transitDistance || "",
    accessHours: user?.profile?.renterProgram?.accessHours || "",
    parkingType: user?.profile?.renterProgram?.parkingType || "",
    layoutType: user?.profile?.renterProgram?.layoutType || "",
    includeOperatingCosts: Boolean(user?.profile?.renterProgram?.includeOperatingCosts),
    accessibilityAdapted: Boolean(user?.profile?.renterProgram?.accessibilityAdapted),
    ecoCertified: Boolean(user?.profile?.renterProgram?.ecoCertified),
    amenities: user?.profile?.renterProgram?.amenities || ""
  });
  const [publisherProfile, setPublisherProfile] = useState({
    propertyType: user?.profile?.propertyType || "",
    legalEntity: user?.profile?.legalEntity || "",
    contactRole: user?.profile?.contactRole || "",
    portfolioSize: user?.profile?.portfolioSize || ""
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const draftStorageKey = useMemo(() => `office_rental_onboarding_draft_${user?.id || "guest"}`, [user?.id]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft?.primaryRole) setPrimaryRole(draft.primaryRole);
      if (draft?.account) setAccount((previous) => ({ ...previous, ...draft.account }));
      if (draft?.renterProgram) setRenterProgram((previous) => ({ ...previous, ...draft.renterProgram }));
      if (draft?.publisherProfile) setPublisherProfile((previous) => ({ ...previous, ...draft.publisherProfile }));
    } catch (_error) {
      // ignore invalid local draft
    }
  }, [draftStorageKey]);

  useEffect(() => {
    const payload = {
      primaryRole,
      account,
      renterProgram,
      publisherProfile
    };
    window.localStorage.setItem(draftStorageKey, JSON.stringify(payload));
  }, [draftStorageKey, primaryRole, account, renterProgram, publisherProfile]);

  useEffect(() => {
    if (pathname === "/onboarding") {
      const firstStep = primaryRole === "publisher" ? "publisher-profile" : "program-core";
      navigateTo(`/onboarding/${firstStep}`, { replace: true });
    }
  }, [pathname, primaryRole]);

  const routeStep = useMemo(() => {
    const parts = String(pathname || "").split("/").filter(Boolean);
    return parts[1] || (primaryRole === "publisher" ? "publisher-profile" : "program-core");
  }, [pathname, primaryRole]);

  const activeSteps = primaryRole === "publisher" ? PUBLISHER_STEPS : RENTER_STEPS;
  const stepIndex = Math.max(0, activeSteps.indexOf(routeStep));
  const currentStep = activeSteps[stepIndex] || activeSteps[0];

  useEffect(() => {
    if (!activeSteps.includes(routeStep)) {
      navigateTo(`/onboarding/${activeSteps[0]}`, { replace: true });
    }
  }, [routeStep, activeSteps]);

  function gotoStep(step) {
    navigateTo(`/onboarding/${step}`);
  }

  function goNext() {
    const nextIndex = Math.min(activeSteps.length - 1, stepIndex + 1);
    gotoStep(activeSteps[nextIndex]);
  }

  function goBack() {
    const prevIndex = Math.max(0, stepIndex - 1);
    gotoStep(activeSteps[prevIndex]);
  }

  async function finish() {
    setPending(true);
    setError("");

    try {
      const profilePayload =
        primaryRole === "renter"
          ? {
              renterProgram: {
                ...renterProgram,
                district: renterProgram.district || "Alla",
                type: renterProgram.type,
                teamSize: String(renterProgram.teamSize || "").trim(),
                minSize: String(renterProgram.minSize || "").trim(),
                maxSize: String(renterProgram.maxSize || "").trim(),
                minBudget: String(renterProgram.minBudget || "").trim(),
                maxBudget: String(renterProgram.maxBudget || "").trim(),
                moveInDate: renterProgram.moveInDate || "",
                contractFlex: renterProgram.contractFlex || "",
                transitDistance: renterProgram.transitDistance || "",
                accessHours: renterProgram.accessHours || "",
                parkingType: renterProgram.parkingType || "",
                layoutType: renterProgram.layoutType || "",
                amenities: renterProgram.amenities || ""
              },
              companySize: String(renterProgram.teamSize || "").trim(),
              budgetRange: `${renterProgram.minBudget || 0}-${renterProgram.maxBudget || ""}`,
              preferredAreas: renterProgram.district || "Alla",
              moveInTimeline: renterProgram.moveInDate || ""
            }
          : {
              ...publisherProfile
            };

      const nextUser = await onComplete({
        primaryRole,
        account,
        profile: profilePayload
      });

      window.localStorage.removeItem(draftStorageKey);
      navigateTo("/app/profile");
    } catch (submitError) {
      setError(submitError.message || "Kunde inte slutföra introduktionen.");
    } finally {
      setPending(false);
    }
  }

  const stepMeta = {
    "program-core": { title: "Lokalprogram", subtitle: "Grundkrav för vad ni söker." },
    "program-details": { title: "Lokalprogram", subtitle: "Detaljer och preferenser för matchning." },
    "publisher-profile": { title: "Profil", subtitle: "Berätta mer om din publicering." },
    review: { title: "Klar", subtitle: "Granska innan du slutför." }
  };

  const currentMeta = stepMeta[currentStep] || stepMeta["program-core"];

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f8] px-4 pb-8 pt-28">
      <AuthFlowNav />
      <div className="w-full max-w-[560px]">
        <section className="rounded-[30px] border border-black/10 bg-white px-6 py-7 sm:px-7 sm:py-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Steg {stepIndex + 1} av {activeSteps.length}</p>
          <h1 className="mt-2 text-[1.95rem] font-semibold leading-tight text-[#0f1930]">{currentMeta.title}</h1>
          <p className="mt-1 text-sm text-ink-600">{currentMeta.subtitle}</p>

          <div className="mt-5 space-y-3">
            {currentStep === "program-core" ? (
              <div className="space-y-3">
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-ink-600">Område</span>
                  <select className="field select-chevron" value={renterProgram.district} onChange={(event) => setRenterProgram((prev) => ({ ...prev, district: event.target.value }))}>
                    {districtOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-ink-600">Typ av lokal</span>
                  <select
                    className="field select-chevron"
                    value={Array.isArray(renterProgram.type) && renterProgram.type.length ? renterProgram.type[0] : "Alla"}
                    onChange={(event) =>
                      setRenterProgram((prev) => ({
                        ...prev,
                        type: event.target.value === "Alla" ? [] : [event.target.value]
                      }))
                    }
                  >
                    <option value="Alla">Alla typer</option>
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-ink-600">Minst platser</span>
                    <input className="field" type="number" min="0" value={renterProgram.teamSize} onChange={(event) => setRenterProgram((prev) => ({ ...prev, teamSize: event.target.value }))} placeholder="T.ex. 12" />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-ink-600">Min yta (kvm)</span>
                    <input className="field" type="number" min="0" value={renterProgram.minSize} onChange={(event) => setRenterProgram((prev) => ({ ...prev, minSize: event.target.value }))} placeholder="T.ex. 120" />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-ink-600">Max yta (kvm)</span>
                    <input className="field" type="number" min="0" value={renterProgram.maxSize} onChange={(event) => setRenterProgram((prev) => ({ ...prev, maxSize: event.target.value }))} placeholder="T.ex. 450" />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-ink-600">Max budget / mån</span>
                    <input className="field" type="number" min="0" value={renterProgram.maxBudget} onChange={(event) => setRenterProgram((prev) => ({ ...prev, maxBudget: event.target.value }))} placeholder="T.ex. 90000" />
                  </label>
                </div>
              </div>
            ) : null}

            {currentStep === "program-details" ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-ink-600">Inflyttning</span>
                    <input className="field" type="date" value={renterProgram.moveInDate} onChange={(event) => setRenterProgram((prev) => ({ ...prev, moveInDate: event.target.value }))} />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-ink-600">Avtalsflexibilitet</span>
                    <select className="field select-chevron" value={renterProgram.contractFlex || "Alla"} onChange={(event) => setRenterProgram((prev) => ({ ...prev, contractFlex: event.target.value === "Alla" ? "" : event.target.value }))}>
                      {contractOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-ink-600">Kollektivtrafik</span>
                    <select className="field select-chevron" value={renterProgram.transitDistance || "Alla"} onChange={(event) => setRenterProgram((prev) => ({ ...prev, transitDistance: event.target.value === "Alla" ? "" : event.target.value }))}>
                      {transitOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-ink-600">Tillgång</span>
                    <select className="field select-chevron" value={renterProgram.accessHours || "Alla"} onChange={(event) => setRenterProgram((prev) => ({ ...prev, accessHours: event.target.value === "Alla" ? "" : event.target.value }))}>
                      {accessOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-ink-600">Parkering</span>
                    <select className="field select-chevron" value={renterProgram.parkingType || "Alla"} onChange={(event) => setRenterProgram((prev) => ({ ...prev, parkingType: event.target.value === "Alla" ? "" : event.target.value }))}>
                      {parkingOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-ink-600">Planlösning</span>
                    <select className="field select-chevron" value={renterProgram.layoutType || "Alla"} onChange={(event) => setRenterProgram((prev) => ({ ...prev, layoutType: event.target.value === "Alla" ? "" : event.target.value }))}>
                      {layoutOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                </div>

                <div className="grid gap-2">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-ink-700">
                    <input type="checkbox" checked={renterProgram.includeOperatingCosts} onChange={(event) => setRenterProgram((prev) => ({ ...prev, includeOperatingCosts: event.target.checked }))} />
                    Inkludera driftkostnader
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-ink-700">
                    <input type="checkbox" checked={renterProgram.accessibilityAdapted} onChange={(event) => setRenterProgram((prev) => ({ ...prev, accessibilityAdapted: event.target.checked }))} />
                    Tillgänglighetsanpassat
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-ink-700">
                    <input type="checkbox" checked={renterProgram.ecoCertified} onChange={(event) => setRenterProgram((prev) => ({ ...prev, ecoCertified: event.target.checked }))} />
                    Miljöcertifierat
                  </label>
                </div>

                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-ink-600">Bekvämligheter (kommaseparerat)</span>
                  <input className="field" value={renterProgram.amenities} onChange={(event) => setRenterProgram((prev) => ({ ...prev, amenities: event.target.value }))} placeholder="T.ex. Mötesrum, Telefonbås, Kaffezon" />
                </label>
              </div>
            ) : null}

            {currentStep === "publisher-profile" ? (
              <div className="grid gap-3">
                <input className="field" value={publisherProfile.propertyType} onChange={(event) => setPublisherProfile((prev) => ({ ...prev, propertyType: event.target.value }))} placeholder="Fastighetstyp" />
                <input className="field" value={publisherProfile.legalEntity} onChange={(event) => setPublisherProfile((prev) => ({ ...prev, legalEntity: event.target.value }))} placeholder="Juridisk enhet" />
                <input className="field" value={publisherProfile.contactRole} onChange={(event) => setPublisherProfile((prev) => ({ ...prev, contactRole: event.target.value }))} placeholder="Din roll" />
                <input className="field" value={publisherProfile.portfolioSize} onChange={(event) => setPublisherProfile((prev) => ({ ...prev, portfolioSize: event.target.value }))} placeholder="Portföljstorlek" />
              </div>
            ) : null}

            {currentStep === "review" ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-black/10 bg-[#f8fafc] px-4 py-4">
                  <p className="text-base font-semibold text-[#0f1930]">Kontoinformation</p>
                  <div className="mt-3 space-y-2 text-[1rem]">
                    <p><span className="font-semibold">Roll:</span> {primaryRole === "publisher" ? "Hyresvärd" : "Hyresgäst"}</p>
                    <p><span className="font-semibold">Namn:</span> {account.name || "-"}</p>
                    <p><span className="font-semibold">E-post:</span> {account.email || "-"}</p>
                  </div>
                </div>

                {primaryRole === "renter" ? (
                  <div className="rounded-2xl border border-black/10 bg-white px-4 py-4">
                    <p className="text-base font-semibold text-[#0f1930]">Ditt Lokalprogram</p>
                    <div className="mt-3 space-y-2 text-[1rem]">
                      <p><span className="font-semibold">Område:</span> {renterProgram.district || "Alla"}</p>
                      <p><span className="font-semibold">Platser:</span> {renterProgram.teamSize || "-"}</p>
                    </div>
                    <p className="mt-3 text-sm text-ink-600">Lokalprogrammet sparas och används direkt i sök, filter och rekommendationer.</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {error ? <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              className="inline-flex min-h-0 items-center justify-center rounded-full border border-black/20 bg-white px-4 py-2 text-xs font-semibold text-ink-700 disabled:opacity-50"
              onClick={goBack}
              disabled={stepIndex === 0 || pending}
            >
              Föregående
            </button>

            {currentStep === "review" ? (
              <button
                type="button"
                className="inline-flex min-h-0 items-center justify-center rounded-full border border-[#0f1930] bg-[#0f1930] px-4 py-2 text-xs font-semibold text-white"
                onClick={finish}
                disabled={pending}
              >
                {pending ? "Sparar..." : "Gå till din profil"}
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex min-h-0 items-center justify-center rounded-full border border-[#0f1930] bg-[#0f1930] px-4 py-2 text-xs font-semibold text-white"
                onClick={goNext}
                disabled={pending}
              >
                Nästa
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default OnboardingPage;
