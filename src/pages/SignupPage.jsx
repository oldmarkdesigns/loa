import { useEffect, useRef, useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { defaultAppPathForUser, navigateTo } from "../lib/router";
import { Icon } from "../components/icons/Icon";
import AuthFlowNav from "../components/layout/AuthFlowNav";
import { hasConvexConfig, hasWorkosConfig } from "../lib/convex";

function SignupPage({ onCompleteSignup, onTestSignup, currentUser }) {
  const { isLoading, user, signIn, signUp } = useAuth();
  const signupUser = user || (currentUser?.authProvider === "test" ? currentUser : null);
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
  const cardWrapRef = useRef(null);
  const [cardWidth, setCardWidth] = useState(null);
  const [search, setSearch] = useState(window.location.search || "");

  const roleFromUrl = (() => {
    const params = new URLSearchParams(search);
    const requestedRole = params.get("role");
    return requestedRole === "broker" || requestedRole === "company_admin" ? requestedRole : "renter";
  })();

  const signupMode = (() => {
    const params = new URLSearchParams(search);
    return params.get("mode") === "test" ? "test" : "workos";
  })();

  const returnTo = (() => {
    const params = new URLSearchParams(search);
    return params.get("returnTo") || "/onboarding";
  })();

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

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
    const params = new URLSearchParams(search);
    setDetailsStep(params.get("step") === "details" ? 2 : 1);
  }, [search]);

  useEffect(() => {
    setForm((previous) => ({ ...previous, role: roleFromUrl, roles: [roleFromUrl], roleSelection: roleFromUrl }));
  }, [roleFromUrl]);

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

  function setRoleSelection(selection) {
    setForm((previous) => ({ ...previous, role: selection, roles: [selection], roleSelection: selection }));
  }

  function onboardingPathForRole(role) {
    if (role === "broker") return "/onboarding/publisher-profile?role=broker";
    if (role === "company_admin") return "/onboarding/company-admin-profile?role=company_admin";
    return "/onboarding/program-core?role=renter";
  }

  async function startSignup() {
    if (signupUser) {
      setDetailsStep(2);
      navigateTo(`/signup?step=details&returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
      return;
    }

    if (signupMode === "test") {
      await handleTestSignup();
      return;
    }

    if (!isConfigured) {
      setError("Backend-auth saknar miljövariabler.");
      return;
    }

    setPending(true);
    setError("");
    try {
      await signUp({
        state: {
          returnTo: `/signup?step=details&returnTo=${encodeURIComponent(returnTo)}`
        }
      });
    } catch (submitError) {
      setError(submitError.message || "Kunde inte starta registreringen.");
      setPending(false);
    }
  }

  function startLoginFromSignup() {
    const signupReturnTo = `/signup?step=details&returnTo=${encodeURIComponent(returnTo)}`;
    signIn({ state: { returnTo: signupReturnTo } }).catch(() => {
      navigateTo(`/login?returnTo=${encodeURIComponent(signupReturnTo)}`);
    });
  }

  async function handleTestSignup() {
    if (!onTestSignup) return;
    setPending(true);
    setError("");
    try {
      await onTestSignup(form.role);
      setDetailsStep(2);
      navigateTo(`/signup?step=details&mode=test&role=${encodeURIComponent(form.role)}`, { replace: true });
    } catch (submitError) {
      setError(submitError.message || "Kunde inte skapa testkonto.");
    } finally {
      setPending(false);
    }
  }

  async function submit(event) {
    event.preventDefault();

    if (detailsStep < 3) {
      if (detailsStep === 2) {
        setDetailsStep(3);
        return;
      }
      setError("Skapa konto först.");
      return;
    }

    if (!signupUser) {
      setError("Skapa konto med WorkOS först.");
      return;
    }

    setPending(true);
    setError("");

    try {
      const fullName = `${form.firstName} ${form.lastName}`.trim();
      const normalizedPhone = String(form.phone || "").trim();
      const nextUser = await onCompleteSignup({
        name: fullName || [signupUser.firstName, signupUser.lastName].filter(Boolean).join(" ").trim() || signupUser.email,
        phone: normalizedPhone ? `${phoneCountryCode} ${normalizedPhone}` : "",
        profile: {
          firstName: form.firstName,
          lastName: form.lastName,
          ...(avatarPreviewUrl ? { avatarUrl: avatarPreviewUrl } : {})
        },
        role: form.role,
        roles: form.roles
      });
      navigateTo(nextUser.onboardingCompleted ? defaultAppPathForUser(nextUser) : onboardingPathForRole(form.role));
    } catch (submitError) {
      setError(submitError.message || "Kunde inte skapa konto.");
    } finally {
      setPending(false);
    }
  }

  const avatarInitial = String(form.firstName || form.email || "A").trim().charAt(0).toUpperCase();

  if (detailsStep === 1) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fffffe] px-4 pb-8 pt-20">
        <AuthFlowNav />
        <div className="mx-auto w-full">
          <div ref={cardWrapRef} className="mx-auto w-full max-w-[430px] rounded-[30px] border border-black/10 bg-[#fffffe] px-6 py-7 sm:px-7 sm:py-8">
            <h1 className="text-[1.95rem] font-semibold leading-tight text-[#0f1930]">Skapa konto</h1>
            <p className="mt-1 text-sm text-ink-600">WorkOS hanterar registreringen. Du väljer roll i nästa steg.</p>

            {!isConfigured && signupMode !== "test" ? (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                WorkOS saknar miljövariabler. Lägg till <code>VITE_CONVEX_URL</code>, <code>VITE_WORKOS_CLIENT_ID</code> och <code>VITE_WORKOS_REDIRECT_URI</code>.
              </div>
            ) : (
              <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-[#0f1930] bg-[#0f1930] px-6 py-3 text-sm font-semibold text-white hover:bg-[#16213b]"
                disabled={pending || isLoading}
                onClick={startSignup}
              >
                {pending ? "Startar..." : signupMode === "test" ? "Skapa konto (test)" : "Skapa konto"}
              </button>
                <p className="text-center text-sm text-ink-600">
                  Har du redan ett konto?{" "}
                  <button
                    type="button"
                    className="font-semibold text-[#0f1930] underline decoration-black/20 underline-offset-4"
                    onClick={startLoginFromSignup}
                  >
                    Logga in
                  </button>
                </p>
              </div>
            )}
          </div>

          <div className="mx-auto mt-4 text-center" style={cardWidth ? { width: `${cardWidth}px`, maxWidth: "100%" } : undefined}>
            <div className="inline-flex w-full items-center justify-between rounded-2xl border border-black/10 bg-[#f8fafc] px-4 py-3 text-left">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink-800">Testläge</p>
                </div>
                <p className="mt-0.5 text-xs text-ink-600">
                  {signupMode === "test" ? "Primärknappen skapar testkonto." : "Primärknappen skickar vidare till WorkOS."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={signupMode === "test"}
                aria-label="Växla mellan testläge och WorkOS"
                className={`relative inline-flex h-6 w-10 min-h-0 items-center rounded-full p-0.5 transition-colors ${
                  signupMode === "test" ? "justify-end bg-[#0f1930]" : "justify-start bg-[#a8adb3]"
                }`}
                disabled={pending}
                onClick={() => {
                  const params = new URLSearchParams(window.location.search);
                  params.set("mode", signupMode === "test" ? "workos" : "test");
                  params.set("role", form.role);
                  const nextQuery = params.toString();
                  navigateTo(`/signup${nextQuery ? `?${nextQuery}` : ""}`, { replace: true });
                }}
              >
                <span aria-hidden="true" className="h-5 w-5 rounded-full bg-[#fffffe] shadow-[0_1px_2px_rgba(15,25,48,0.35)]" />
              </button>
            </div>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-500">
              Genom att fortsätta godkänner du Lokalflödes användarvillkor och integritetspolicy.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#fffffe] px-4 pb-8 pt-20">
      <AuthFlowNav />
      <div className="w-full max-w-[460px]">
        <div className="rounded-[30px] border border-black/10 bg-[#fffffe] px-6 py-7 sm:px-7 sm:py-8">
          <h1 className="text-[1.95rem] font-semibold leading-tight text-[#0f1930]">
            {detailsStep === 2 ? "Välkommen!" : "Berätta om dig själv"}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {detailsStep === 2 ? "Välj vilken roll som passar dig bäst." : "Fyll i dina personuppgifter."}
          </p>

          <form className="mt-5 space-y-3" onSubmit={submit}>
            {detailsStep === 2 ? (
              <div className="mt-1">
                <p className="mb-2 text-sm font-semibold text-ink-700">Jag vill</p>
                <div className="grid grid-cols-1 gap-2.5" role="radiogroup" aria-label="Välj kontotyp">
                  {[
                    { value: "renter", label: "Hyresgäst" },
                    { value: "broker", label: "Mäklare" },
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
                          selected ? "border-[#0f1930] bg-[#fffffe] text-[#0f1930] shadow-[0_0_0_1px_rgba(15,25,48,0.2)]" : "border-black/15 bg-[#fffffe] text-ink-700"
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
            ) : (
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
                      <Icon name="camera" className="h-4 w-4" />
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
                    <input className="field" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="70 123 45 67" />
                  </div>
                </label>
              </>
            )}

            {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}

            <div className={`flex flex-col gap-3 ${detailsStep === 3 ? "pt-2" : "mt-6"}`}>
              <button type="submit" className="rounded-full border border-[#0f1930] bg-[#0f1930] px-5 py-3 text-sm font-semibold text-white" disabled={pending}>
                {pending ? "Sparar..." : detailsStep === 2 ? "Fortsätt" : "Fortsätt"}
              </button>

              {detailsStep === 3 ? (
                <>
                  <p className="text-center text-xs text-ink-600">Har du redan konto?</p>
                  <button type="button" className="mx-auto inline-flex items-center justify-center rounded-full border border-black/15 bg-[#fffffe] px-5 py-3 text-sm font-semibold text-ink-800 hover:bg-[#f8fafc]" onClick={() => navigateTo("/login")}>
                    Logga in
                  </button>
                </>
              ) : null}

            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default SignupPage;
