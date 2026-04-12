import { useState } from "react";
import { defaultAppPathForRole, navigateTo } from "../lib/router";
import { EyeIcon } from "../components/icons/UiIcons";
import AuthFlowNav from "../components/layout/AuthFlowNav";

function LoginPage({ onLogin }) {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const user = await onLogin(form);
      navigateTo(user.onboardingCompleted ? defaultAppPathForRole(user.role) : "/onboarding");
    } catch (submitError) {
      setError(submitError.message || "Inloggning misslyckades.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f8] px-4 pb-8 pt-28">
      <AuthFlowNav />
      <div className="w-full max-w-[460px]">
        <div className="rounded-[30px] border border-black/10 bg-white px-6 py-7 sm:px-7 sm:py-8">
          <h1 className="text-[1.95rem] font-semibold leading-tight text-[#0f1930]">Välkommen tillbaka</h1>
          <p className="mt-1 text-sm text-ink-600">
            Logga in för att hantera dina annonser eller hitta din nästa lokal.
          </p>

          <button
            type="button"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink-800"
            onClick={() => {
              const emailInput = document.getElementById("login-email");
              if (emailInput instanceof HTMLElement) emailInput.focus();
            }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-1.9 3l3.1 2.4c1.8-1.7 2.8-4.1 2.8-6.9 0-.7-.1-1.4-.2-2.1H12z" />
              <path fill="#34A853" d="M12 21.8c2.7 0 4.9-.9 6.5-2.4l-3.1-2.4c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.2l-3.2 2.5c1.6 3.2 4.9 5.6 8.8 5.6z" />
              <path fill="#FBBC05" d="M6.4 13.7c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9L3.2 7.4C2.5 8.8 2 10.2 2 11.8s.5 3.1 1.2 4.4l3.2-2.5z" />
              <path fill="#4285F4" d="M12 5.7c1.5 0 2.9.5 3.9 1.5l2.9-2.9C17 2.7 14.7 1.8 12 1.8 8.1 1.8 4.8 4.1 3.2 7.4l3.2 2.5C7.2 7.5 9.4 5.7 12 5.7z" />
            </svg>
            <span>Fortsätt med Google</span>
            <span className="text-xs font-medium text-ink-500">(Demo)</span>
          </button>

          <div className="mt-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-black/10" />
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">eller</span>
            <span className="h-px flex-1 bg-black/10" />
          </div>

          <form className="mt-5 space-y-3" onSubmit={submit}>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink-700">E-post</span>
              <input
                id="login-email"
                className="field"
                type="email"
                value={form.email}
                onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink-700">Lösenord</span>
              <div className="relative">
                <input
                  className="field pr-16"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))}
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

            {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#0f1930] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#16233f]"
              disabled={pending}
            >
              {pending ? "Loggar in..." : "Fortsätt"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-ink-700">Har du inget konto?</p>
            <button
              type="button"
              className="mt-2 inline-flex items-center justify-center rounded-full border border-black/20 bg-white px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-[#f8fafc]"
              onClick={() => navigateTo("/signup")}
            >
              Skapa konto
            </button>
          </div>

          <div className="mt-3 text-center text-xs">
            <button type="button" className="text-ink-600 underline" onClick={() => navigateTo("/forgot-password")}>
              Glömt lösenord
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-500">
          Genom att fortsätta godkänner du Lokalflödes användarvillkor och integritetspolicy.
        </p>
      </div>
    </main>
  );
}

export default LoginPage;
