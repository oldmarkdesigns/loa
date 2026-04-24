import { useEffect, useState } from "react";
import { navigateTo } from "../../lib/router";

function AuthOverlay({ open, mode = "login", preferredRole = "renter", onClose, onLogin, onSignup }) {
  const [activeForm, setActiveForm] = useState(mode === "signup" ? "signup" : "login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    roles: [preferredRole === "publisher" ? "publisher" : "renter"],
    role: preferredRole === "publisher" ? "publisher" : "renter"
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }
    setActiveForm(mode === "signup" ? "signup" : "login");
    setError("");
  }, [open, mode]);

  useEffect(() => {
    if (!open || activeForm !== "signup") {
      return;
    }
    const role = preferredRole === "publisher" ? "publisher" : "renter";
    setSignupForm((current) => ({
      ...current,
      role,
      roles: [role]
    }));
  }, [open, activeForm, preferredRole]);

  function setRoleSelection(selection) {
    if (selection === "both") {
      setSignupForm((current) => ({ ...current, role: "renter", roles: ["renter", "publisher"] }));
      return;
    }
    const role = selection === "publisher" ? "publisher" : "renter";
    setSignupForm((current) => ({ ...current, role, roles: [role] }));
  }

  async function submitLogin(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await onLogin(loginForm);
      onClose?.();
    } catch (submitError) {
      setError(submitError.message || "Inloggning misslyckades.");
    } finally {
      setPending(false);
    }
  }

  async function submitSignup(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await onSignup(signupForm);
      onClose?.();
      navigateTo("/onboarding");
    } catch (submitError) {
      setError(submitError.message || "Kunde inte skapa konto.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-transparent p-4 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Konto</p>
            <h2 className="text-2xl font-semibold">Fortsätt med inloggning</h2>
            <p className="text-sm text-ink-600">Logga in eller skapa konto för att spara, boka visning och publicera.</p>
          </div>
          <button type="button" className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700" onClick={onClose}>
            Stäng
          </button>
        </div>

        <div className="my-2 flex items-center gap-2">
          <span className="h-px flex-1 bg-black/10" />
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Fyll i dina uppgifter</span>
          <span className="h-px flex-1 bg-black/10" />
        </div>

        <div className="mb-3 inline-flex rounded-2xl border border-black/10 bg-white p-1 text-xs">
          <button type="button" onClick={() => setActiveForm("login")} className={`rounded-xl px-3 py-2 font-semibold ${activeForm === "login" ? "bg-[#0f1930] text-white" : "text-ink-600"}`}>
            Logga in
          </button>
          <button type="button" onClick={() => setActiveForm("signup")} className={`rounded-xl px-3 py-2 font-semibold ${activeForm === "signup" ? "bg-[#0f1930] text-white" : "text-ink-600"}`}>
            Skapa konto
          </button>
        </div>

        {activeForm === "login" ? (
          <form className="space-y-3" onSubmit={submitLogin}>
            <input className="field" type="email" placeholder="E-post" value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} required />
            <input className="field" type="password" placeholder="Lösenord" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} required />
            {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}
            <button type="submit" className="btn-primary w-full" disabled={pending}>
              {pending ? "Loggar in..." : "Logga in"}
            </button>
            <div className="rounded-2xl border border-black/10 bg-white p-3 text-xs text-ink-600">
              Demo-konton:
              <br />
              Hyresgäst: hyresgast@demo.se / demo123
              <br />
              Hyresvärd: annonsor@demo.se / demo123
              <br />
              Kombi: kombi@demo.se / demo123
            </div>
          </form>
        ) : (
          <form className="space-y-3" onSubmit={submitSignup}>
            <input className="field" placeholder="Namn" value={signupForm.name} onChange={(event) => setSignupForm((current) => ({ ...current, name: event.target.value }))} required />
            <input className="field" type="email" placeholder="E-post" value={signupForm.email} onChange={(event) => setSignupForm((current) => ({ ...current, email: event.target.value }))} required />
            <input className="field" placeholder="Telefon (valfritt)" value={signupForm.phone} onChange={(event) => setSignupForm((current) => ({ ...current, phone: event.target.value }))} />
            <input className="field" type="password" placeholder="Lösenord" value={signupForm.password} onChange={(event) => setSignupForm((current) => ({ ...current, password: event.target.value }))} required />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Välj kontotyp">
              <button
                type="button"
                role="radio"
                aria-checked={signupForm.roles.length === 1 && signupForm.roles[0] === "renter"}
                onClick={() => setRoleSelection("renter")}
                className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold ${
                  signupForm.roles.length === 1 && signupForm.roles[0] === "renter"
                    ? "border-[#0f1930] bg-white text-[#0f1930]"
                    : "border-black/20 bg-white text-ink-700"
                }`}
              >
                <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${signupForm.roles.length === 1 && signupForm.roles[0] === "renter" ? "border-[#0f1930]" : "border-ink-400"}`}>
                  {signupForm.roles.length === 1 && signupForm.roles[0] === "renter" ? <span className="h-2 w-2 rounded-full bg-[#0f1930]" /> : null}
                </span>
                Hyresgäst
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={signupForm.roles.length === 1 && signupForm.roles[0] === "publisher"}
                onClick={() => setRoleSelection("publisher")}
                className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold ${
                  signupForm.roles.length === 1 && signupForm.roles[0] === "publisher"
                    ? "border-[#0f1930] bg-white text-[#0f1930]"
                    : "border-black/20 bg-white text-ink-700"
                }`}
              >
                <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${signupForm.roles.length === 1 && signupForm.roles[0] === "publisher" ? "border-[#0f1930]" : "border-ink-400"}`}>
                  {signupForm.roles.length === 1 && signupForm.roles[0] === "publisher" ? <span className="h-2 w-2 rounded-full bg-[#0f1930]" /> : null}
                </span>
                Hyresvärd
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={signupForm.roles.length === 2}
                onClick={() => setRoleSelection("both")}
                className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold ${
                  signupForm.roles.length === 2
                    ? "border-[#0f1930] bg-white text-[#0f1930]"
                    : "border-black/20 bg-white text-ink-700"
                }`}
              >
                <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${signupForm.roles.length === 2 ? "border-[#0f1930]" : "border-ink-400"}`}>
                  {signupForm.roles.length === 2 ? <span className="h-2 w-2 rounded-full bg-[#0f1930]" /> : null}
                </span>
                Båda roller
              </button>
            </div>

            {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}
            <button type="submit" className="btn-primary w-full" disabled={pending}>
              {pending ? "Skapar konto..." : "Skapa konto"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthOverlay;
