import { useEffect, useRef, useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { defaultAppPathForUser, navigateTo } from "../lib/router";
import { hasConvexConfig, hasWorkosConfig } from "../lib/convex";
import { AccountLayout, Arrow, Field, SiteFrame } from "../site/SiteChrome";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SIGNUP_DRAFT_STORAGE_KEY = "office_rental_signup_draft";
const STEP_INTENT = 2;
const STEP_ROLE = 3;
const STEP_PROFILE_EXTRA = 4;

function normalizeOrganizationNumber(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

function formatOrganizationNumber(value) {
  const digits = normalizeOrganizationNumber(value);
  if (digits.length <= 6) return digits;
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

function validateOrganizationNumber(value, isRequired) {
  const digits = normalizeOrganizationNumber(value);
  if (!digits.length) {
    return isRequired ? "Ange ett organisationsnummer." : "";
  }
  if (digits.length !== 10) {
    return "Organisationsnumret måste vara 10 siffror.";
  }
  return "";
}

function readSignupDraft() {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SIGNUP_DRAFT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_error) {
    return null;
  }
}

function writeSignupDraft(draft) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SIGNUP_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

function clearSignupDraft() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SIGNUP_DRAFT_STORAGE_KEY);
}

function sanitizeReturnTo(value) {
  return typeof value === "string" && value.startsWith("/") ? value : "/onboarding";
}

function profileExtraPath(returnTo) {
  return `/signup?step=profile-extra&returnTo=${encodeURIComponent(sanitizeReturnTo(returnTo))}`;
}

function stepFromSearch(search) {
  const params = new URLSearchParams(search);
  const step = params.get("step");
  if (step === "profile-extra" || step === "details") return STEP_PROFILE_EXTRA;
  if (step === "role") return STEP_ROLE;
  return STEP_INTENT;
}

function SignupPage({ onCheckCompanyByOrganizationNumber, onCompleteSignup, currentUser }) {
  const { isLoading, user, signIn, signUp } = useAuth();
  // `user` from useAuth() can be silently restored from a persisted WorkOS session on page
  // load (devMode keeps tokens in localStorage), even though this app never confirmed the
  // person as signed in this tab. Only trust it for THIS mount if a real redirect completed
  // right before it (set by onRedirectCallback in main.jsx) - captured once here, then
  // consumed below, since the flag itself stays "1" until onboarding fully finishes and
  // would otherwise keep matching on every later, unrelated visit to this page.
  const [trustAuthUserThisMount] = useState(
    () => typeof window !== "undefined" && window.sessionStorage.getItem("office_auth_just_completed") === "1"
  );
  const signupUser = currentUser || (trustAuthUserThisMount ? user : null);
  const isConfigured = hasConvexConfig && hasWorkosConfig;
  const countryCodeOptions = [
    { label: "Sverige (+46)", value: "+46" },
    { label: "Norge (+47)", value: "+47" },
    { label: "Danmark (+45)", value: "+45" },
    { label: "Finland (+358)", value: "+358" },
    { label: "Tyskland (+49)", value: "+49" },
    { label: "Storbritannien (+44)", value: "+44" },
    { label: "USA (+1)", value: "+1" }
  ];

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organizationNumber: "",
    roles: ["renter"],
    role: "renter",
    roleSelection: "renter",
    intentSelection: "rent",
    onboardingFlow: "renter"
  });
  const [phoneCountryCode, setPhoneCountryCode] = useState("+46");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [organizationNumberError, setOrganizationNumberError] = useState("");
  const [matchedCompany, setMatchedCompany] = useState(null);
  const [companyConfirmPromptOpen, setCompanyConfirmPromptOpen] = useState(false);
  const [pendingCompanyLookup, setPendingCompanyLookup] = useState(null);
  const [pendingFormattedOrganizationNumber, setPendingFormattedOrganizationNumber] = useState("");
  const [companySetupPromptOpen, setCompanySetupPromptOpen] = useState(false);
  const [pendingOnboardingPath, setPendingOnboardingPath] = useState("");
  const [detailsStep, setDetailsStep] = useState(() => {
    const value = stepFromSearch(window.location.search || "");
    // TEMP DIAGNOSTIC - remove once the role-selection bounce is confirmed fixed.
    console.warn("[DIAG SignupPage mount]", {
      href: window.location.href,
      search: window.location.search,
      resolvedStep: value,
      draftRaw: window.sessionStorage.getItem("office_rental_signup_draft"),
      authJustCompletedFlag: window.sessionStorage.getItem("office_auth_just_completed")
    });
    return value;
  });
  const cardWrapRef = useRef(null);
  const skipAutoAdvanceRef = useRef(false);
  const [cardWidth, setCardWidth] = useState(null);
  const [search, setSearch] = useState(window.location.search || "");

  const roleFromUrl = (() => {
    const params = new URLSearchParams(search);
    const requestedRole = params.get("role");
    return requestedRole === "broker" || requestedRole === "company_admin" ? requestedRole : "renter";
  })();

  const intentFromUrl = (() => {
    const params = new URLSearchParams(search);
    return params.get("intentSelection") === "lease-out" ? "lease-out" : "rent";
  })();

  const onboardingFlowFromUrl = (() => {
    const params = new URLSearchParams(search);
    const requestedFlow = params.get("onboardingFlow");
    return requestedFlow === "broker-with-program" || requestedFlow === "broker" || requestedFlow === "company_admin"
      ? requestedFlow
      : "renter";
  })();

  const returnTo = (() => {
    const params = new URLSearchParams(search);
    const draft = readSignupDraft();
    return sanitizeReturnTo(params.get("returnTo") || draft?.returnTo || "/onboarding");
  })();

  const shouldShowNameFields = !form.firstName || !form.lastName;
  const signupDraft = readSignupDraft();
  const requiresOrganizationNumber =
    form.intentSelection === "lease-out" ||
    signupDraft?.intentSelection === "lease-out" ||
    form.role === "company_admin" ||
    form.role === "broker";

  useEffect(() => {
    if (trustAuthUserThisMount && typeof window !== "undefined") {
      window.sessionStorage.removeItem("office_auth_just_completed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function syncSearch() {
      setSearch(window.location.search || "");
    }

    syncSearch();
    window.addEventListener("popstate", syncSearch);
    window.addEventListener("app:navigate", syncSearch);
    return () => {
      window.removeEventListener("popstate", syncSearch);
      window.removeEventListener("app:navigate", syncSearch);
    };
  }, []);

  useEffect(() => {
    setDetailsStep(stepFromSearch(search));
  }, [search]);

  useEffect(() => {
    // TEMP DIAGNOSTIC - remove once the role-selection bounce is confirmed fixed.
    console.warn("[DIAG auto-advance effect]", {
      detailsStep,
      skip: skipAutoAdvanceRef.current,
      draftPresent: Boolean(readSignupDraft()),
      currentSearch: window.location.search
    });
    if (skipAutoAdvanceRef.current) {
      skipAutoAdvanceRef.current = false;
      return;
    }
    if (detailsStep === STEP_PROFILE_EXTRA) return;
    // A saved draft only ever exists after startSignup() wrote it, right before leaving for
    // WorkOS - so its presence alone (role/intent already chosen) is reason enough to land
    // back on profile-extra. Deliberately NOT gated on signupUser/authUser: that value only
    // becomes available once the WorkOS SDK's own async token exchange resolves, which can
    // land a render or two after this effect first runs post-redirect, so waiting on it here
    // was the actual cause of bouncing back to role selection instead of going straight to
    // "Berätta om dig själv".
    if (!readSignupDraft()) return;
    navigateTo(profileExtraPath(returnTo), { replace: true });
  }, [detailsStep, returnTo]);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const isProfileExtraStep = params.get("step") === "profile-extra" || params.get("step") === "details";
    const draft = isProfileExtraStep ? readSignupDraft() : null;

    if (draft) {
      setForm((previous) => ({
        ...previous,
        firstName: previous.firstName || draft.firstName || "",
        lastName: previous.lastName || draft.lastName || "",
        email: previous.email || draft.email || "",
        phone: draft.phone || previous.phone || "",
        organizationNumber: draft.organizationNumber || previous.organizationNumber || "",
        role: draft.role || "renter",
        roles: Array.isArray(draft.roles) && draft.roles.length ? draft.roles : [draft.role || "renter"],
        roleSelection: draft.roleSelection || draft.role || "renter",
        intentSelection: draft.intentSelection === "lease-out" ? "lease-out" : "rent",
        onboardingFlow: draft.onboardingFlow || "renter"
      }));
      if (draft.phoneCountryCode) {
        setPhoneCountryCode(draft.phoneCountryCode);
      }
      return;
    }

    setForm((previous) => ({
      ...previous,
      role: roleFromUrl,
      roles: [roleFromUrl],
      roleSelection: roleFromUrl,
      intentSelection: intentFromUrl,
      onboardingFlow: onboardingFlowFromUrl
    }));
  }, [intentFromUrl, onboardingFlowFromUrl, roleFromUrl, search]);

  useEffect(() => {
    if (!signupUser) return;
    setForm((current) => ({
      ...current,
      firstName: current.firstName || signupUser.firstName || signupUser.profile?.firstName || "",
      lastName: current.lastName || signupUser.lastName || signupUser.profile?.lastName || "",
      email: signupUser.email || current.email
    }));
  }, [signupUser]);

  useEffect(() => {
    const wrap = cardWrapRef.current;
    if (!wrap) return undefined;

    const resolveCardWidth = () => setCardWidth(Math.round(wrap.getBoundingClientRect().width));
    resolveCardWidth();
    const observer = new ResizeObserver(resolveCardWidth);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  function applySelection(intentSelection, selection) {
    const onboardingFlow =
      intentSelection === "rent"
        ? selection === "broker"
          ? "broker-with-program"
          : "renter"
        : selection === "company_admin"
          ? "company_admin"
          : "broker";

    setError("");
    setForm((previous) => ({
      ...previous,
      intentSelection,
      role: selection,
      roles: [selection],
      roleSelection: selection,
      onboardingFlow
    }));
  }

  function applyIntentSelection(intentSelection) {
    applySelection(intentSelection, intentSelection === "rent" ? "renter" : "company_admin");
  }

  function onboardingPathForSelection(role, onboardingFlow) {
    if (onboardingFlow === "broker-with-program") return "/onboarding/program-core?role=broker&onboardingFlow=broker-with-program";
    if (role === "broker") return "/onboarding/publisher-profile?role=broker&onboardingFlow=broker";
    if (role === "company_admin") return "/onboarding/company-admin-profile?role=company_admin&onboardingFlow=company_admin";
    return "/onboarding/program-core?role=renter&onboardingFlow=renter";
  }

  function currentDraft() {
    return {
      returnTo,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      phoneCountryCode,
      organizationNumber: form.organizationNumber,
      role: form.role,
      roles: form.roles,
      roleSelection: form.roleSelection,
      intentSelection: form.intentSelection,
      onboardingFlow: form.onboardingFlow
    };
  }

  async function startSignup() {
    if (signupUser) {
      writeSignupDraft(currentDraft());
      navigateTo(profileExtraPath(returnTo), { replace: true });
      return;
    }

    if (!isConfigured) {
      setError("Backend-auth saknar miljövariabler.");
      return;
    }

    setPending(true);
    setError("");
    const draft = currentDraft();
    writeSignupDraft(draft);
    try {
      await signUp({
        state: {
          returnTo: profileExtraPath(returnTo),
          signupDraft: draft
        }
      });
    } catch (submitError) {
      setError(submitError.message || "Kunde inte starta registreringen.");
      setPending(false);
    }
  }

  function startLoginFromSignup() {
    const draft = currentDraft();
    writeSignupDraft(draft);
    const signupReturnTo = profileExtraPath(returnTo);
    signIn({ state: { returnTo: signupReturnTo, signupDraft: draft } }).catch(() => {
      navigateTo("/");
    });
  }

  async function completeProfileExtra(companyLookup, formattedOrganizationNumber) {
    const fullName = `${form.firstName} ${form.lastName}`.trim();
    const normalizedPhone = String(form.phone || "").trim();
    const companyProfile = companyLookup?.exists && companyLookup?.company
        ? {
            companyId: companyLookup.company.id || "",
            companyName: companyLookup.company.name,
            legalEntity: companyLookup.company.name,
            companyOrganizationNumber: companyLookup.company.organizationNumber || formattedOrganizationNumber,
            companyProfileLocked: true,
            companyProfileSource: "registered_company",
            companyType: companyLookup.company.companyType || "",
            companyPhone: companyLookup.company.phone || "",
            streetAddress: companyLookup.company.streetAddress || "",
            postalCode: companyLookup.company.postalCode || "",
            city: companyLookup.company.city || "",
            parentCompany: companyLookup.company.parentCompany || "",
            websiteUrl: companyLookup.company.websiteUrl || ""
          }
        : {};

    const nextUser = await onCompleteSignup({
      name: fullName || [signupUser.firstName, signupUser.lastName].filter(Boolean).join(" ").trim() || signupUser.email,
      phone: normalizedPhone ? `${phoneCountryCode} ${normalizedPhone}` : "",
      profile: {
        firstName: form.firstName,
        lastName: form.lastName,
        organizationNumber: formattedOrganizationNumber,
        signupRoleIntent: form.role,
        signupIntentSelection: form.intentSelection,
        signupOnboardingFlow: form.onboardingFlow,
        ...companyProfile
      },
      role: form.role,
      roles: form.roles
    });

    clearSignupDraft();
    if (requiresOrganizationNumber && formattedOrganizationNumber && !companyLookup?.exists) {
      setPendingOnboardingPath(onboardingPathForSelection(form.role, form.onboardingFlow));
      setCompanySetupPromptOpen(true);
      return;
    }

    const setupPath = onboardingPathForSelection(form.role, form.onboardingFlow);
    navigateTo(form.intentSelection === "lease-out" || form.role === "broker" || form.role === "company_admin"
      ? setupPath
      : defaultAppPathForUser(nextUser));
  }

  async function submitProfileExtra() {
    const normalizedOrganizationNumber = normalizeOrganizationNumber(form.organizationNumber);
    const nextOrganizationNumberError = validateOrganizationNumber(
      normalizedOrganizationNumber,
      requiresOrganizationNumber
    );
    setOrganizationNumberError(nextOrganizationNumberError);
    if (nextOrganizationNumberError) {
      return;
    }

    if (!signupUser) {
      setError("Skapa konto med WorkOS först.");
      return;
    }

    setPending(true);
    setError("");

    try {
      const formattedOrganizationNumber = normalizedOrganizationNumber ? formatOrganizationNumber(normalizedOrganizationNumber) : "";
      let companyLookup = null;

      if (requiresOrganizationNumber && formattedOrganizationNumber && onCheckCompanyByOrganizationNumber) {
        companyLookup = await onCheckCompanyByOrganizationNumber(formattedOrganizationNumber, signupUser?.id);
        setMatchedCompany(companyLookup?.company || null);
      }

      if (companyLookup?.exists && companyLookup?.company) {
        setPendingCompanyLookup(companyLookup);
        setPendingFormattedOrganizationNumber(formattedOrganizationNumber);
        setCompanyConfirmPromptOpen(true);
        return;
      }

      await completeProfileExtra(companyLookup, formattedOrganizationNumber);
    } catch (submitError) {
      setError(submitError.message || "Kunde inte skapa konto.");
    } finally {
      setPending(false);
    }
  }

  async function submit(event) {
    event.preventDefault();

    if (detailsStep === STEP_INTENT) {
      if (form.intentSelection === "lease-out") {
        navigateTo(`/signup?step=role&returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
        return;
      }
      await startSignup();
      return;
    }

    if (detailsStep === STEP_ROLE) {
      await startSignup();
      return;
    }

    await submitProfileExtra();
  }

  function confirmCompanySetup() {
    setCompanySetupPromptOpen(false);
    navigateTo(pendingOnboardingPath || onboardingPathForSelection(form.role, form.onboardingFlow));
  }

  function cancelCompanySetup() {
    setCompanySetupPromptOpen(false);
    setPendingOnboardingPath("");
  }

  async function confirmMatchedCompany() {
    setCompanyConfirmPromptOpen(false);
    setPending(true);
    setError("");
    try {
      await completeProfileExtra(pendingCompanyLookup, pendingFormattedOrganizationNumber);
    } catch (submitError) {
      setError(submitError.message || "Kunde inte skapa konto.");
    } finally {
      setPending(false);
    }
  }

  function rejectMatchedCompany() {
    setCompanyConfirmPromptOpen(false);
    setPendingCompanyLookup(null);
    setPendingFormattedOrganizationNumber("");
    setMatchedCompany(null);
    setForm((previous) => ({ ...previous, organizationNumber: "" }));
    setOrganizationNumberError("Ange rätt organisationsnummer.");
  }

  function goBackFromDetails() {
    if (detailsStep === STEP_PROFILE_EXTRA) {
      skipAutoAdvanceRef.current = true;
      if (form.intentSelection === "lease-out") {
        navigateTo(`/signup?step=role&returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
      } else {
        navigateTo("/signup", { replace: true });
      }
      return;
    }
    if (detailsStep === STEP_ROLE) {
      navigateTo("/signup", { replace: true });
      return;
    }
    navigateTo("/", { replace: true });
  }

  function renderChoices(name, value, options, onChange) {
    return (
      <div className="lo-choices" role="radiogroup" aria-label={name}>
        {options.map((option) => (
          <label key={option.value} className="lo-choice">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="lo-choice-name">{option.label}</span>
            <span className="lo-choice-desc">{option.desc}</span>
            <span className="lo-choice-mark" aria-hidden="true" />
          </label>
        ))}
      </div>
    );
  }

  function renderIntentStep() {
    return renderChoices("Vad vill du göra?", form.intentSelection, [
      { value: "rent", label: "Jag vill hyra", desc: "Hitta lokal, skapa ett lokalprogram och boka visningar." },
      { value: "lease-out", label: "Jag vill hyra ut", desc: "Publicera lokaler och hantera förfrågningar och visningar." }
    ], applyIntentSelection);
  }

  function renderRoleStep() {
    return renderChoices("Välj roll", form.roleSelection, [
      { value: "company_admin", label: "Hyresvärd", desc: "Ni äger eller förvaltar lokalerna och administrerar bolagets konto." },
      { value: "broker", label: "Mäklare", desc: "Du publicerar och förmedlar lokaler åt en eller flera hyresvärdar." }
    ], (value) => applySelection(form.intentSelection, value));
  }

  function renderProfileExtraStep() {
    return (
      <>
        {shouldShowNameFields ? (
          <div className="lo-form-row">
            <Field label="Förnamn">
              <input value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} autoComplete="given-name" required />
            </Field>
            <Field label="Efternamn">
              <input value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} autoComplete="family-name" required />
            </Field>
          </div>
        ) : null}
        <Field label="E-post" hint="Från inloggningen. Ändras i kontoinställningarna.">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            readOnly
            required
          />
        </Field>
        <Field
          label={`Organisationsnummer${requiresOrganizationNumber ? "" : " (valfritt)"}`}
          error={organizationNumberError}
          hint={matchedCompany ? `${matchedCompany.name} finns registrerat och fylls i automatiskt.` : undefined}
        >
          <input
            inputMode="numeric"
            value={form.organizationNumber}
            onChange={(e) => {
              const formatted = formatOrganizationNumber(e.target.value);
              setForm((p) => ({ ...p, organizationNumber: formatted }));
              setMatchedCompany(null);
              if (organizationNumberError) {
                setOrganizationNumberError(
                  validateOrganizationNumber(formatted, requiresOrganizationNumber)
                );
              }
            }}
            onBlur={() => {
              setOrganizationNumberError(
                validateOrganizationNumber(form.organizationNumber, requiresOrganizationNumber)
              );
            }}
            placeholder="556123-4567"
            required={requiresOrganizationNumber}
          />
        </Field>
        <div className="lo-form-row" style={{ gridTemplateColumns: "minmax(0, 0.8fr) minmax(0, 1.2fr)" }}>
          <Field label="Landsnummer">
            <select value={phoneCountryCode} onChange={(e) => setPhoneCountryCode(e.target.value)}>
              {countryCodeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Telefon (valfritt)">
            <input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="70 123 45 67" autoComplete="tel-national" />
          </Field>
        </div>
      </>
    );
  }

  const isLeaseOut = form.intentSelection === "lease-out";
  const stepCount = isLeaseOut ? 3 : 2;
  const stepCurrent = detailsStep === STEP_INTENT ? 1 : detailsStep === STEP_ROLE ? 2 : stepCount;
  const heading =
    detailsStep === STEP_INTENT
      ? "Välkommen till LOA."
      : detailsStep === STEP_ROLE
        ? "Vilken roll har du?"
        : "Berätta om dig själv.";
  const subheading =
    detailsStep === STEP_INTENT
      ? "Vad vill du göra? Samma konto rymmer flera roller, så du kan lägga till fler senare."
      : detailsStep === STEP_ROLE
        ? "För att hyra ut behöver vi veta hur du representerar lokalerna."
        : isLeaseOut
          ? "De sista uppgifterna. Organisationsnumret kopplar kontot till ert bolag."
          : "De sista uppgifterna till din profil.";
  const submitLabel =
    pending
      ? detailsStep === STEP_PROFILE_EXTRA ? "Sparar…" : "Skapar konto"
      : detailsStep === STEP_PROFILE_EXTRA ? "Klar" : "Fortsätt";
  const showSubmitLoadingDots = pending && detailsStep !== STEP_PROFILE_EXTRA;

  return (
    <SiteFrame slim navActions={false}>
      <Dialog open={companyConfirmPromptOpen && Boolean(pendingCompanyLookup?.company)} onOpenChange={(open) => { if (!open) rejectMatchedCompany(); }}>
        <DialogContent showCloseButton={false} className="max-w-[520px] rounded-2xl border-0 bg-white p-8 font-['Geist',sans-serif]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-[1.75rem] font-normal leading-tight tracking-[-0.035em] text-[#141a2b]">Bekräfta företaget</DialogTitle>
            <DialogDescription className="text-[0.9375rem] leading-relaxed text-[#5b6070]">
              Vi hittade ett registrerat företag för organisationsnumret. Kontrollera att uppgifterna stämmer innan du går vidare.
            </DialogDescription>
          </DialogHeader>
          <div className="border-y border-[#141a2b]/10 py-4">
            <p className="text-[0.8125rem] text-[#8b8f9a]">Företag</p>
            <p className="mt-1 text-xl tracking-[-0.03em] text-[#141a2b]">{pendingCompanyLookup?.company?.name}</p>
            <p className="mt-1 text-[0.9375rem] tabular-nums text-[#5b6070]">
              {pendingCompanyLookup?.company?.organizationNumber || pendingFormattedOrganizationNumber}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="h-auto !rounded-full px-5 py-3 text-sm font-medium text-[#141a2b]" onClick={rejectMatchedCompany}>
              Nej, ändra orgnummer
            </Button>
            <Button type="button" className="h-auto !rounded-full bg-[#141a2b] px-5 py-3 text-sm font-medium text-white hover:bg-[#2a3146]" onClick={confirmMatchedCompany}>
              Ja, fortsätt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={companySetupPromptOpen} onOpenChange={(open) => { if (!open) cancelCompanySetup(); }}>
        <DialogContent showCloseButton={false} className="max-w-[520px] rounded-2xl border-0 bg-white p-8 font-['Geist',sans-serif]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-[1.75rem] font-normal leading-tight tracking-[-0.035em] text-[#141a2b]">Företaget finns inte registrerat</DialogTitle>
            <DialogDescription className="text-[0.9375rem] leading-relaxed text-[#5b6070]">
              Organisationsnumret finns inte på plattformen. Vill du sätta upp ett nytt företag nu?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="h-auto !rounded-full px-5 py-3 text-sm font-medium text-[#141a2b]" onClick={cancelCompanySetup}>
              Inte nu
            </Button>
            <Button type="button" className="h-auto !rounded-full bg-[#141a2b] px-5 py-3 text-sm font-medium text-white hover:bg-[#2a3146]" onClick={confirmCompanySetup}>
              Sätt upp nytt företag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AccountLayout
        label="Skapa konto"
        title={heading}
        lede={subheading}
        steps={{ count: stepCount, current: stepCurrent }}
      >
        <div ref={cardWrapRef}>
          {!isConfigured ? (
            <p className="lo-note is-error">
              WorkOS saknar miljövariabler. Lägg till <code>VITE_CONVEX_URL</code>, <code>VITE_WORKOS_CLIENT_ID</code> och <code>VITE_WORKOS_REDIRECT_URI</code>.
            </p>
          ) : (
            <form className="lo-form" onSubmit={submit}>
              {detailsStep === STEP_INTENT ? renderIntentStep() : detailsStep === STEP_ROLE ? renderRoleStep() : renderProfileExtraStep()}

              {error ? <p className="lo-note is-error" role="alert">{error}</p> : null}

              <div className="lo-actions">
                <button type="submit" className="lo-btn" disabled={pending || isLoading}>
                  {submitLabel}
                  {showSubmitLoadingDots ? (
                    <span className="button-loading-dots inline-flex items-center gap-0.5" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                  ) : (
                    <Arrow />
                  )}
                </button>
                <button
                  type="button"
                  className="lo-text-btn"
                  onClick={goBackFromDetails}
                  disabled={pending}
                >
                  {detailsStep === STEP_INTENT ? "Till startsidan" : "Tillbaka"}
                </button>
              </div>

              {detailsStep !== STEP_PROFILE_EXTRA ? (
                <p className="lo-account-alt">
                  Har du redan ett konto?
                  <button type="button" className="lo-text-btn" onClick={startLoginFromSignup} disabled={pending}>
                    Logga in
                  </button>
                </p>
              ) : null}
            </form>
          )}
        </div>
        <p className="lo-fine" style={cardWidth ? { maxWidth: `${cardWidth}px` } : undefined}>
          Genom att fortsätta godkänner du LOA:s användarvillkor och integritetspolicy.
        </p>
      </AccountLayout>
    </SiteFrame>
  );
}

export default SignupPage;
