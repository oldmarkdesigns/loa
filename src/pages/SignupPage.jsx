import { useEffect, useRef, useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { defaultAppPathForUser, navigateTo } from "../lib/router";
import AuthFlowNav from "../components/layout/AuthFlowNav";
import { BuildingIcon, UserIcon } from "../components/icons/UiIcons";
import { hasConvexConfig, hasWorkosConfig } from "../lib/convex";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  function renderIntentStep() {
    return (
      <div className="mt-1">
        <RadioGroupPrimitive
          value={form.intentSelection}
          onValueChange={applyIntentSelection}
          aria-label="Välj riktning"
          className="grid grid-cols-2 gap-3"
        >
          {[
            { value: "rent", label: "Jag vill hyra", Icon: UserIcon },
            { value: "lease-out", label: "Jag vill hyra ut", Icon: BuildingIcon }
          ].map((option) => {
            const selected = form.intentSelection === option.value;
            const Icon = option.Icon;
            return (
              <RadioPrimitive.Root
                key={option.value}
                value={option.value}
                className={`flex flex-col items-center gap-3 rounded-xl border px-4 py-6 text-center outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50 ${
                  selected ? "border-[#0b0a0e] bg-[#ffffff] text-[#0b0a0e] shadow-[0_0_0_1px_rgba(15,25,48,0.2)]" : "border-black/15 bg-[#ffffff] text-ink-700"
                }`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    selected ? "bg-[#0b0a0e] text-white ring-4 ring-[#0b0a0e]/10" : "border border-black/15 text-ink-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium leading-tight">{option.label}</span>
              </RadioPrimitive.Root>
            );
          })}
        </RadioGroupPrimitive>
      </div>
    );
  }

  function renderRoleStep() {
    return (
      <div className="mt-1">
        <p className="mb-2 text-sm font-semibold text-ink-700">
          För att hyra ut
        </p>
        <RadioGroupPrimitive
          value={form.roleSelection}
          onValueChange={(value) => applySelection(form.intentSelection, value)}
          aria-label="Välj roll"
          className="grid grid-cols-1 gap-2.5"
        >
          {[
            { value: "company_admin", label: "Hyresvärd" },
            { value: "broker", label: "Mäklare" }
          ].map((option) => {
            const selected = form.roleSelection === option.value;
            return (
              <RadioPrimitive.Root
                key={option.value}
                value={option.value}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50 ${
                  selected ? "border-[#0b0a0e] bg-[#ffffff] text-[#0b0a0e] shadow-[0_0_0_1px_rgba(15,25,48,0.2)]" : "border-black/15 bg-[#ffffff] text-ink-700"
                }`}
              >
                <span className="text-sm font-medium leading-tight">{option.label}</span>
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-[#0b0a0e]" : "border-black/20"}`}>
                  <RadioPrimitive.Indicator className="h-2 w-2 rounded-full bg-[#0b0a0e]" />
                </span>
              </RadioPrimitive.Root>
            );
          })}
        </RadioGroupPrimitive>
      </div>
    );
  }

  function renderProfileExtraStep() {
    return (
      <>
        {shouldShowNameFields ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink-700">Förnamn</span>
              <Input value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} required />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink-700">Efternamn</span>
              <Input value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} required />
            </label>
          </div>
        ) : null}
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-700">E-post</span>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            readOnly
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-700">
            Organisationsnummer {requiresOrganizationNumber ? "" : "(valfritt)"}
          </span>
          <Input
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
          {organizationNumberError ? (
            <span className="mt-1 block text-xs text-rose-700">{organizationNumberError}</span>
          ) : matchedCompany ? (
            <span className="mt-1 block text-xs text-emerald-700">
              {matchedCompany.name} finns registrerat och fylls i automatiskt.
            </span>
          ) : null}
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-700">Telefon (valfritt)</span>
          <div className="grid grid-cols-[152px_1fr] gap-2">
            <Select value={phoneCountryCode} onValueChange={setPhoneCountryCode}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {countryCodeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="70 123 45 67" />
          </div>
        </label>
      </>
    );
  }

  const heading =
    detailsStep === STEP_INTENT
      ? "Välkommen!"
      : detailsStep === STEP_ROLE
        ? "Välj roll"
        : "Berätta om dig själv";
  const subheading =
    detailsStep === STEP_INTENT
      ? "Välj vad du vill göra."
      : detailsStep === STEP_ROLE
        ? "Välj vilken roll som passar."
        : "Fyll i de sista uppgifterna för din profil.";
  const submitLabel =
    pending
      ? detailsStep === STEP_PROFILE_EXTRA ? "Sparar..." : "Skapar konto"
      : "Fortsätt";
  const showSubmitLoadingDots = pending && detailsStep !== STEP_PROFILE_EXTRA;

  return (
    <main className="grid min-h-screen place-items-center bg-[#ffffff] px-4 pb-8 pt-20">
      <AuthFlowNav />
      <Dialog open={companyConfirmPromptOpen && Boolean(pendingCompanyLookup?.company)} onOpenChange={(open) => { if (!open) rejectMatchedCompany(); }}>
        <DialogContent showCloseButton={false} className="max-w-[520px] rounded-[28px] border border-black/10 bg-[#ffffff] p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-[1.5rem] font-semibold leading-tight text-[#0b0a0e]">Bekräfta företaget</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-ink-600">
              Vi hittade ett registrerat företag för organisationsnumret. Kontrollera att uppgifterna stämmer innan du går vidare.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-[#d7e2ee] bg-[#f8fafc] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Företag</p>
            <p className="mt-1 text-lg font-semibold text-[#0b0a0e]">{pendingCompanyLookup?.company?.name}</p>
            <p className="mt-1 text-sm font-semibold text-[#0b0a0e]">
              {pendingCompanyLookup?.company?.organizationNumber || pendingFormattedOrganizationNumber}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="h-auto rounded-full px-5 py-3 text-sm font-semibold text-ink-800" onClick={rejectMatchedCompany}>
              Nej, ändra orgnummer
            </Button>
            <Button type="button" className="h-auto rounded-full px-5 py-3 text-sm font-semibold" onClick={confirmMatchedCompany}>
              Ja, fortsätt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={companySetupPromptOpen} onOpenChange={(open) => { if (!open) cancelCompanySetup(); }}>
        <DialogContent showCloseButton={false} className="max-w-[520px] rounded-[28px] border border-black/10 bg-[#ffffff] p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-[1.5rem] font-semibold leading-tight text-[#0b0a0e]">Företaget finns inte registrerat</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-ink-600">
              Organisationsnumret finns inte på plattformen. Vill du sätta upp ett nytt företag nu?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="h-auto rounded-full px-5 py-3 text-sm font-semibold text-ink-800" onClick={cancelCompanySetup}>
              Inte nu
            </Button>
            <Button type="button" className="h-auto rounded-full px-5 py-3 text-sm font-semibold" onClick={confirmCompanySetup}>
              Sätt upp nytt företag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="mx-auto w-full">
        <div ref={cardWrapRef} className="mx-auto w-full max-w-[460px] rounded-[30px] border border-black/10 bg-[#ffffff] px-6 py-7 sm:px-7 sm:py-8">
          <h1 className="text-[1.95rem] font-semibold leading-tight text-[#0b0a0e]">
            {heading}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {subheading}
          </p>

          {!isConfigured ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              WorkOS saknar miljövariabler. Lägg till <code>VITE_CONVEX_URL</code>, <code>VITE_WORKOS_CLIENT_ID</code> och <code>VITE_WORKOS_REDIRECT_URI</code>.
            </div>
          ) : (
            <form className="mt-5 space-y-3" onSubmit={submit}>
              {detailsStep === STEP_INTENT ? renderIntentStep() : detailsStep === STEP_ROLE ? renderRoleStep() : renderProfileExtraStep()}

              {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}

              <div className={`flex flex-col gap-3 ${detailsStep === STEP_PROFILE_EXTRA ? "pt-2" : "mt-6"}`}>
                <Button type="submit" className="h-auto gap-1.5 rounded-full px-5 py-3 text-sm font-semibold" disabled={pending || isLoading}>
                  {submitLabel}
                  {showSubmitLoadingDots ? (
                    <span className="button-loading-dots inline-flex items-center gap-0.5" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                  ) : null}
                </Button>
                {detailsStep !== STEP_INTENT ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto rounded-full px-5 py-3 text-sm font-semibold text-ink-800 hover:bg-[#f8fafc]"
                    onClick={goBackFromDetails}
                    disabled={pending}
                  >
                    Tillbaka
                  </Button>
                ) : null}

                {detailsStep !== STEP_PROFILE_EXTRA ? (
                  <>
                    <p className="text-center text-xs text-ink-600">Har du redan konto?</p>
                    <Button type="button" variant="outline" className="mx-auto h-auto rounded-full px-5 py-3 text-sm font-semibold text-ink-800 hover:bg-[#f8fafc]" onClick={startLoginFromSignup} disabled={pending}>
                      Logga in
                    </Button>
                  </>
                ) : null}
              </div>
            </form>
          )}
        </div>
        <div className="mx-auto mt-4 text-center" style={cardWidth ? { width: `${cardWidth}px`, maxWidth: "100%" } : undefined}>
          <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-500">
            Genom att fortsätta godkänner du Lokalflödes användarvillkor och integritetspolicy.
          </p>
        </div>
      </div>
    </main>
  );
}

export default SignupPage;
