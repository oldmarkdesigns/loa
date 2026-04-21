import { useEffect, useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import AuthFlowNav from "../components/layout/AuthFlowNav";
import { trackSignupStarted } from "../lib/analytics";
import { hasConvexConfig, hasWorkosConfig } from "../lib/convex";
import { defaultAppPathForRole, navigateTo } from "../lib/router";

const countryCodeOptions = [
  { label: "Sverige (+46)", value: "+46" },
  { label: "Norge (+47)", value: "+47" },
  { label: "Danmark (+45)", value: "+45" },
  { label: "Finland (+358)", value: "+358" },
  { label: "Tyskland (+49)", value: "+49" },
  { label: "Storbritannien (+44)", value: "+44" },
  { label: "USA (+1)", value: "+1" }
];

function SignupPage({ onCompleteSignup }) {
  const { isLoading, user, signUp } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const roleFromUrl = params.get("role") === "publisher" ? "publisher" : "renter";
  const returnTo = params.get("returnTo") || "/onboarding";
  const isConfigured = hasConvexConfig && hasWorkosConfig;

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    role: roleFromUrl,
    roles: [roleFromUrl]
  });
  const [phoneCountryCode, setPhoneCountryCode] = useState("+46");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm((current) => ({
      ...current,
      role: roleFromUrl,
      roles: [roleFromUrl]
    }));
  }, [roleFromUrl]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm((current) => ({
      ...current,
      firstName: current.firstName || user.firstName || "",
      lastName: current.lastName || user.lastName || ""
    }));
  }, [user]);

  async function startSignup() {
    if (!isConfigured) {
      setError("Backend-auth saknar miljövariabler.");
      return;
    }

    setPending(true);
    setError("");
    trackSignupStarted({ role: form.role });

    try {
      await signUp({
        state: {
          returnTo: `/signup?step=details&role=${form.role}&returnTo=${encodeURIComponent(returnTo)}`
        }
      });
    } catch (submitError) {
      setPending(false);
      setError(submitError.message || "Kunde inte starta registreringen.");
    }
  }

  async function submit(event) {
    event.preventDefault();

    if (!user) {
      setError("Skapa konto med WorkOS först.");
      return;
    }

    setPending(true);
    setError("");

    try {
      const fullName = `${form.firstName} ${form.lastName}`.trim();
      const phone = String(form.phone || "").trim();
      const nextUser = await onCompleteSignup({
        name: fullName || [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email,
        phone: phone ? `${phoneCountryCode} ${phone}` : "",
        role: form.role,
        roles: [form.role]
      });

      navigateTo(nextUser.onboardingCompleted ? defaultAppPathForRole(nextUser.role) : returnTo);
    } catch (submitError) {
      setError(submitError.message || "Kunde inte slutföra kontot.");
    } finally {
      setPending(false);
    }
  }

  async function handleSkip() {
    if (!user || pending) {
      return;
    }

    setPending(true);
    setError("");

    try {
      const nextUser = await onCompleteSignup({
        name: [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email,
        phone: "",
        role: form.role,
        roles: [form.role]
      });

      navigateTo(nextUser.onboardingCompleted ? defaultAppPathForRole(nextUser.role) : returnTo);
    } catch (submitError) {
      setError(submitError.message || "Kunde inte hoppa över steget.");
    } finally {
      setPending(false);
    }
  }

  const isDetailsStep = Boolean(user);

  if (!isDetailsStep) {
    return (
      <main className="grid min-h-screen place-items-center bg-white px-4 pb-8 pt-20">
        <AuthFlowNav />
        <div className="w-full max-w-[460px] rounded-[30px] border border-black/10 bg-white px-6 py-7 sm:px-7 sm:py-8">
          <h1 className="text-[1.95rem] font-semibold leading-tight text-[#0f1930]">Skapa konto</h1>
          <p className="mt-1 text-sm text-ink-600">
            WorkOS hanterar själva registreringen. Välj kontoform först, sedan skickas du vidare.
          </p>

          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-ink-700">Jag vill</p>
            <div className="grid grid-cols-1 gap-2.5" role="radiogroup" aria-label="Välj kontotyp">
              {[
                { value: "renter", label: "Hyra en lokal" },
                { value: "publisher", label: "Hyra ut en lokal" }
              ].map((option) => {
                const selected = form.role === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      selected
                        ? "border-brand-400 bg-brand-50 text-brand-700"
                        : "border-black/10 bg-white text-ink-700 hover:border-black/20"
                    }`}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        role: option.value,
                        roles: [option.value]
                      }))
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {!isConfigured ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Backend-auth saknar miljövariabler. Lägg till <code>VITE_CONVEX_URL</code>, <code>VITE_WORKOS_CLIENT_ID</code>
              {" "}
              och <code>VITE_WORKOS_REDIRECT_URI</code>.
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-black/20 bg-white px-6 py-3 text-sm font-semibold text-ink-800 hover:bg-[#f8fafc]"
                disabled={pending || isLoading}
                onClick={startSignup}
              >
                {pending ? "Startar..." : "Skapa konto i WorkOS"}
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-[#f8fafc] px-6 py-3 text-sm font-semibold text-ink-700 hover:bg-white"
                onClick={() =>
                  navigateTo(
                    `/login?returnTo=${encodeURIComponent(`/signup?step=details&role=${form.role}&returnTo=${encodeURIComponent(returnTo)}`)}`
                  )
                }
              >
                Jag har redan konto
              </button>
            </div>
          )}

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-white px-4 pb-8 pt-20">
      <AuthFlowNav />
      <div className="w-full max-w-[460px] rounded-[30px] border border-black/10 bg-white px-6 py-7 sm:px-7 sm:py-8">
        <h1 className="text-[1.95rem] font-semibold leading-tight text-[#0f1930]">Välkommen</h1>
        <p className="mt-1 text-sm text-ink-600">Komplettera några uppgifter innan onboarding startar.</p>

        <form className="mt-5 space-y-3" onSubmit={submit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-ink-700">Förnamn</span>
              <input
                className="field"
                value={form.firstName}
                onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-ink-700">Efternamn</span>
              <input
                className="field"
                value={form.lastName}
                onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
              />
            </label>
          </div>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ink-700">E-post</span>
            <input className="field bg-[#f8fafc]" value={user.email} disabled />
          </label>

          <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-ink-700">Landskod</span>
              <select className="field" value={phoneCountryCode} onChange={(event) => setPhoneCountryCode(event.target.value)}>
                {countryCodeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-ink-700">Telefon</span>
              <input
                className="field"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </label>
          </div>

          <div className="mt-1">
            <p className="mb-2 text-sm font-semibold text-ink-700">Primär roll</p>
            <div className="grid grid-cols-1 gap-2.5" role="radiogroup" aria-label="Välj kontotyp">
              {[
                { value: "renter", label: "Hyra en lokal" },
                { value: "publisher", label: "Hyra ut en lokal" }
              ].map((option) => {
                const selected = form.role === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      selected
                        ? "border-brand-400 bg-brand-50 text-brand-700"
                        : "border-black/10 bg-white text-ink-700 hover:border-black/20"
                    }`}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        role: option.value,
                        roles: [option.value]
                      }))
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button type="button" className="btn-secondary px-5 py-3 text-sm" disabled={pending} onClick={handleSkip}>
              Hoppa över
            </button>
            <button type="submit" className="btn-primary px-5 py-3 text-sm" disabled={pending}>
              {pending ? "Sparar..." : "Fortsätt"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default SignupPage;
