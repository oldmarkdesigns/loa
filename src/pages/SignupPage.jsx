import { useEffect, useMemo, useRef, useState } from "react";
import { navigateTo } from "../lib/router";
import { CameraIcon, EyeIcon } from "../components/icons/UiIcons";
import AuthFlowNav from "../components/layout/AuthFlowNav";

function SignupPage({ onSignup }) {
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
    role: "renter"
  });
  const [phoneCountryCode, setPhoneCountryCode] = useState("+46");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [detailsStep, setDetailsStep] = useState(1);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const roleFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("role") === "publisher" ? "publisher" : "renter";
  }, []);

  useEffect(() => {
    setForm((previous) => ({ ...previous, role: roleFromUrl, roles: [roleFromUrl] }));
  }, [roleFromUrl]);

  function setRoleSelection(selection) {
    const role = selection === "publisher" ? "publisher" : "renter";
    setForm((previous) => ({ ...previous, role, roles: [role] }));
  }

  async function submit(event) {
    event.preventDefault();
    if (detailsStep === 1) {
      setDetailsStep(2);
      return;
    }

    setPending(true);
    setError("");

    try {
      const fullName = `${form.firstName} ${form.lastName}`.trim();
      const normalizedPhone = String(form.phone || "").trim();
      await onSignup({
        ...form,
        name: fullName,
        phone: normalizedPhone ? `${phoneCountryCode} ${normalizedPhone}` : ""
      });
      navigateTo("/onboarding");
    } catch (submitError) {
      setError(submitError.message || "Kunde inte skapa konto.");
    } finally {
      setPending(false);
    }
  }

  async function handleSkip() {
    if (pending) return;

    if (detailsStep === 1) {
      setDetailsStep(2);
      return;
    }

    setPending(true);
    setError("");
    try {
      const unique = Date.now();
      await onSignup({
        ...form,
        firstName: "Test",
        lastName: "Användare",
        name: "Test Användare",
        email: form.email || `test+${unique}@lokalflode.demo`,
        password: form.password || `Demo${unique}`,
        phone: ""
      });
      navigateTo("/onboarding");
    } catch (submitError) {
      setError(submitError.message || "Kunde inte hoppa över steget.");
    } finally {
      setPending(false);
    }
  }

  const avatarInitial = String(form.firstName || form.email || "A").trim().charAt(0).toUpperCase();

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f8] px-4 pb-8 pt-28">
      <AuthFlowNav />
      <div className="w-full max-w-[460px]">
        <div className="rounded-[30px] border border-black/10 bg-white px-6 py-7 sm:px-7 sm:py-8">
          <h1 className="text-[1.95rem] font-semibold leading-tight text-[#0f1930]">
            {detailsStep === 2 ? "Välkommen!" : "Skapa konto"}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {detailsStep === 1 ? "Välj kontotyp och ange inloggningsuppgifter." : "Berätta om dig själv."}
          </p>

          {detailsStep === 1 ? (
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-ink-700">Jag vill</p>
              <div className="grid grid-cols-1 gap-2.5" role="radiogroup" aria-label="Välj kontotyp">
                {[
                  { value: "renter", label: "Hyra en lokal" },
                  { value: "publisher", label: "Hyra ut en lokal" }
                ].map((option) => {
                  const selected = form.roles.length === 1 && form.roles[0] === option.value;
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

          <form className="mt-5 space-y-3" onSubmit={submit}>
            {detailsStep === 1 ? (
              <>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-ink-700">E-post</span>
                  <input className="field" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-ink-700">Lösenord</span>
                  <div className="relative">
                    <input
                      className="field pr-16"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 min-h-0 -translate-y-1/2 rounded-full p-1.5 text-ink-600 hover:bg-black/5"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}
                    >
                      <span className="relative block">
                        <EyeIcon className="h-4 w-4" />
                        {!showPassword ? <span className="pointer-events-none absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 rotate-45 bg-current" /> : null}
                      </span>
                    </button>
                  </div>
                </label>
              </>
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
            )}

            {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-full bg-[#0f1930] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#16233f]"
                disabled={pending}
              >
                {detailsStep === 1 ? "Nästa" : pending ? "Skapar konto..." : "Fortsätt"}
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

        <div className="mt-3 flex items-center justify-between px-1">
          <button
            type="button"
            className="inline-flex min-h-0 items-center justify-center rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-[#f8fafc] disabled:opacity-50"
            onClick={() => setDetailsStep((current) => Math.max(1, current - 1))}
            disabled={pending || detailsStep === 1}
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

        <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-500">
          Genom att fortsätta godkänner du Lokalflödes användarvillkor och integritetspolicy.
        </p>
      </div>
    </main>
  );
}

export default SignupPage;
