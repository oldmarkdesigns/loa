import { useEffect, useMemo, useRef, useState } from "react";
import { SignUp, useUser } from "@clerk/react";
import { defaultAppPathForRole, navigateTo } from "../lib/router";
import { CameraIcon } from "../components/icons/UiIcons";
import AuthFlowNav from "../components/layout/AuthFlowNav";

function SignupPage({ onClerkContinue, onDemoLogin, onTestSignup, onUpdateProfile }) {
  const { isLoaded, isSignedIn: isClerkSignedIn } = useUser();
  const hasClerkKey = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
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
    password: "",
    roles: ["renter"],
    role: "renter",
    roleSelection: "renter"
  });
  const [phoneCountryCode, setPhoneCountryCode] = useState("+46");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [detailsStep, setDetailsStep] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("step") === "details" ? 2 : 1;
  });
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const avatarInputRef = useRef(null);
  const clerkCardWrapRef = useRef(null);
  const [clerkCardWidth, setClerkCardWidth] = useState(null);
  const [clerkInitTimedOut, setClerkInitTimedOut] = useState(false);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const roleFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedRole = params.get("role");
    return requestedRole === "publisher" || requestedRole === "company_admin" ? requestedRole : "renter";
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDetailsStep(params.get("step") === "details" ? 2 : 1);
  }, []);

  useEffect(() => {
    if (isClerkSignedIn) {
      setDetailsStep(2);
    }
  }, [isClerkSignedIn]);

  useEffect(() => {
    if (isLoaded) {
      setClerkInitTimedOut(false);
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setClerkInitTimedOut(true), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [isLoaded]);

  useEffect(() => {
    setForm((previous) => ({ ...previous, role: roleFromUrl, roles: [roleFromUrl], roleSelection: roleFromUrl }));
  }, [roleFromUrl]);

  useEffect(() => {
    const wrap = clerkCardWrapRef.current;
    if (!wrap) return undefined;

    const resolveCardWidth = () => {
      const card = wrap.querySelector(".cl-card");
      setClerkCardWidth(card ? Math.round(card.getBoundingClientRect().width) : null);
    };

    resolveCardWidth();
    const observer = new ResizeObserver(resolveCardWidth);
    observer.observe(wrap);

    return () => observer.disconnect();
  }, []);

  function setRoleSelection(selection) {
    const role = selection;
    setForm((previous) => ({ ...previous, role, roles: [role], roleSelection: selection }));
  }

  async function submit(event) {
    event.preventDefault();
    if (detailsStep < 3) {
      if (detailsStep === 2) {
        setDetailsStep(3);
        return;
      }
      setError("Skapa konto med Clerk först.");
      return;
    }

    setPending(true);
    setError("");

    try {
      const fullName = `${form.firstName} ${form.lastName}`.trim();
      const normalizedPhone = String(form.phone || "").trim();
      const payload = {
        ...form,
        name: fullName,
        phone: normalizedPhone ? `${phoneCountryCode} ${normalizedPhone}` : ""
      };
      const nextUser = isClerkSignedIn
        ? await onClerkContinue(payload)
        : await onUpdateProfile({
          name: payload.name,
          phone: payload.phone,
          role: form.role,
          roles: form.roles,
          profile: avatarPreviewUrl ? { avatarUrl: avatarPreviewUrl } : {}
        });
      navigateTo(nextUser.onboardingCompleted ? defaultAppPathForRole(nextUser.role) : "/onboarding");
    } catch (submitError) {
      setError(submitError.message || "Kunde inte skapa konto.");
    } finally {
      setPending(false);
    }
  }

  async function handleSkip() {
    if (pending) return;

    if (detailsStep < 3) {
      setError("Skapa konto med Clerk först.");
      return;
    }

    setPending(true);
    setError("");
    try {
      const payload = {
        ...form,
        firstName: "Test",
        lastName: "Användare",
        name: "Test Användare",
        phone: "",
        role: form.role,
        roles: form.roles
      };
      const nextUser = isClerkSignedIn
        ? await onClerkContinue(payload)
        : await onUpdateProfile({
          name: payload.name,
          phone: payload.phone,
          role: payload.role,
          roles: payload.roles
        });
      navigateTo(nextUser.onboardingCompleted ? defaultAppPathForRole(nextUser.role) : "/onboarding");
    } catch (submitError) {
      setError(submitError.message || "Kunde inte hoppa över steget.");
    } finally {
      setPending(false);
    }
  }

  const avatarInitial = String(form.firstName || form.email || "A").trim().charAt(0).toUpperCase();

  if (detailsStep === 1) {
    return (
      <main className="grid min-h-screen place-items-center bg-white px-4 pb-8 pt-20">
        <AuthFlowNav />
        <div className="mx-auto w-full">
          <div ref={clerkCardWrapRef} className="mx-auto w-fit max-w-full">
            {!hasClerkKey ? (
              <div className="w-[430px] max-w-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Clerk saknar publishable key i denna build. Lägg till <code>VITE_CLERK_PUBLISHABLE_KEY</code> i deploy-miljön och bygg om.
              </div>
            ) : !isLoaded && clerkInitTimedOut ? (
              <div className="w-[430px] max-w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Clerk kunde inte initieras. Kontrollera deploy-miljövariabeln och att din deploy-domän är tillåten i Clerk dashboard.
              </div>
            ) : !isLoaded ? (
              <div className="h-[580px] w-[430px] max-w-full rounded-xl border border-black/10 bg-white" aria-hidden="true" />
            ) : !isClerkSignedIn ? (
              <SignUp
                routing="virtual"
                signInUrl="/login"
                fallbackRedirectUrl="/signup?step=details"
              />
            ) : null}
          </div>

          <div className="mx-auto mt-4 text-center" style={clerkCardWidth ? { width: `${clerkCardWidth}px`, maxWidth: "100%" } : undefined}>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-black/20 bg-white px-6 py-3 text-sm font-semibold text-ink-800 hover:bg-[#f8fafc]"
              disabled={pending}
              onClick={async () => {
                setPending(true);
                setError("");
                try {
                  const unique = Date.now();
                  await onTestSignup({
                    firstName: "Test",
                    lastName: "Användare",
                    name: "Test Användare",
                    email: `test+${unique}@lokalflode.demo`,
                    password: `Demo${unique}`,
                    phone: "",
                    role: form.role,
                    roles: form.roles
                  });
                  setDetailsStep(2);
                  navigateTo("/signup?step=details", { replace: true });
                } catch (submitError) {
                  setError(submitError.message || "Kunde inte skapa testkonto.");
                } finally {
                  setPending(false);
                }
              }}
            >
              {pending ? "Skapar..." : "Test: Skapa konto"}
            </button>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-500">
              Genom att fortsätta godkänner du Lokalflödes användarvillkor och integritetspolicy.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-white px-4 pb-8 pt-20">
      <AuthFlowNav />
      <div className="w-full max-w-[460px]">
        <div className="rounded-[30px] border border-black/10 bg-white px-6 py-7 sm:px-7 sm:py-8">
          <h1 className="text-[1.95rem] font-semibold leading-tight text-[#0f1930]">
            {detailsStep === 2 ? "Välkommen!" : detailsStep === 3 ? "Berätta om dig själv" : "Skapa konto"}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {detailsStep === 1
              ? "Skapa konto med Clerk för att fortsätta."
              : detailsStep === 2
                ? "Välj vilken roll som passar dig bäst."
                : "Fyll i dina personuppgifter."}
          </p>

          <form className="mt-5 space-y-3" onSubmit={submit}>
            {detailsStep === 2 ? (
              <div className="mt-1">
                <p className="mb-2 text-sm font-semibold text-ink-700">Jag vill</p>
                <div className="grid grid-cols-1 gap-2.5" role="radiogroup" aria-label="Välj kontotyp">
                  {[
                    { value: "renter", label: "Hyra en lokal" },
                    { value: "publisher", label: "Hyra ut en lokal" },
                    { value: "company_admin", label: "Bolagsadmin" }
                  ].map((option) => {
                    const selected = form.roleSelection === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setRoleSelection(option.value)}
                        className={`role-option-button flex w-full items-center justify-between border px-4 py-3 text-left transition ${
                          selected ? "border-[#0f1930] bg-white text-[#0f1930] shadow-[0_0_0_1px_rgba(15,25,48,0.2)]" : "border-black/15 bg-white text-ink-700"
                        }`}
                      >
                        <span className="text-sm font-medium leading-tight">{option.label}</span>
                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-[#0f1930]" : "border-black/20"}`}>
                          <span className={`h-2 w-2 rounded-full ${selected ? "bg-[#0f1930]" : "bg-transparent"}`} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {detailsStep === 3 ? (
              <>
                <div className="mt-1 flex flex-col items-center">
                  <div className="relative mb-8">
                    {avatarPreviewUrl ? (
                      <img src={avatarPreviewUrl} alt="Förhandsvisning profilbild" className="h-28 w-28 rounded-full border border-black/10 object-cover" />
                    ) : (
                      <div className="inline-flex h-28 w-28 items-center justify-center rounded-full bg-black/5 text-4xl font-semibold text-ink-500">
                        {avatarInitial || "A"}
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute left-1/2 top-full inline-flex min-h-0 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-black/15 bg-[#0f1930] px-4 py-2 text-xs font-semibold text-white"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <CameraIcon className="h-4 w-4" />
                      Lägg till foto (frivilligt)
                    </button>
                  </div>
                  <input
                    ref={avatarInputRef}
                    className="hidden"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setAvatarPreviewUrl((previous) => {
                        if (previous) URL.revokeObjectURL(previous);
                        return URL.createObjectURL(file);
                      });
                    }}
                  />
                </div>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-ink-700">Förnamn</span>
                  <input className="field" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} required />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-ink-700">Efternamn</span>
                  <input className="field" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} required />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-ink-700">Telefon (valfritt)</span>
                  <div className="grid grid-cols-[152px_1fr] gap-2">
                    <select className="field select-chevron" value={phoneCountryCode} onChange={(e) => setPhoneCountryCode(e.target.value)}>
                      {countryCodeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      className="field"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="70 123 45 67"
                    />
                  </div>
                </label>
              </>
            ) : null}

            {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-full bg-[#0f1930] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#16233f]"
                disabled={pending}
              >
                {pending ? "Skapar konto..." : detailsStep === 2 ? "Fortsätt" : "Fortsätt"}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-ink-700">Har du redan konto?</p>
            <button
              type="button"
              className="mt-2 inline-flex items-center justify-center rounded-full border border-black/20 bg-white px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-[#f8fafc]"
              onClick={() => navigateTo("/login")}
            >
              Logga in
            </button>
          </div>
        </div>

        {detailsStep >= 2 ? (
          <div className="mt-3 flex items-center justify-between px-1">
            <button
              type="button"
              className="inline-flex min-h-0 items-center justify-center rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-[#f8fafc] disabled:opacity-50"
              onClick={() => setDetailsStep((current) => Math.max(1, current - 1))}
              disabled={pending}
            >
              Föregående
            </button>
            <button
              type="button"
              className="inline-flex min-h-0 items-center justify-center rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-[#f8fafc] disabled:opacity-50"
              onClick={handleSkip}
              disabled={pending}
            >
              Hoppa över (test)
            </button>
          </div>
        ) : null}

        <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-500">
          Genom att fortsätta godkänner du Lokalflödes användarvillkor och integritetspolicy.
        </p>
      </div>
    </main>
  );
}

export default SignupPage;
