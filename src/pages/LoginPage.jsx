import { useEffect, useRef, useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { authApi } from "../api";
import AuthFlowNav from "../components/layout/AuthFlowNav";
import { navigateTo } from "../lib/router";
import { hasConvexConfig, hasWorkosConfig } from "../lib/convex";
import loginImage from "../../Assets/Hero Images/stockholm-landing.jpg";

const SIGNUP_DRAFT_STORAGE_KEY = "office_rental_signup_draft";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function writeSignupDraft(draft) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SIGNUP_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

function LoginPage() {
  const { isLoading, user, signIn, signUp } = useAuth();
  const cardWrapRef = useRef(null);
  const [cardWidth, setCardWidth] = useState(null);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo") || "/app/rent";
  const isConfigured = hasConvexConfig && hasWorkosConfig;
  const logoutInProgress = typeof window !== "undefined" && window.sessionStorage.getItem("office_auth_logout_in_progress") === "1";

  useEffect(() => {
    const wrap = cardWrapRef.current;
    if (!wrap) return undefined;

    const resolveCardWidth = () => {
      setCardWidth(Math.round(wrap.getBoundingClientRect().width));
    };

    resolveCardWidth();
    const observer = new ResizeObserver(resolveCardWidth);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (logoutInProgress) {
      navigateTo("/", { replace: true });
    }
  }, [logoutInProgress]);

  async function continueWithEmail(event) {
    event.preventDefault();
    if (!isConfigured || pending) return;

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      setError("Ange e-postadress.");
      return;
    }

    setPending(true);
    setError("");

    try {
      const result = await authApi.checkEmailRegistered(normalizedEmail);
      if (result.exists) {
        await signIn({ loginHint: normalizedEmail, state: { returnTo } });
        return;
      }

      const signupDraft = {
        returnTo,
        email: normalizedEmail,
        firstName: "",
        lastName: "",
        phone: "",
        phoneCountryCode: "+46",
        organizationNumber: "",
        role: "renter",
        roles: ["renter"],
        roleSelection: "renter",
        intentSelection: "rent",
        onboardingFlow: "renter"
      };
      writeSignupDraft(signupDraft);
      await signUp({
        loginHint: normalizedEmail,
        state: {
          returnTo: "/signup?step=profile-extra",
          signupDraft
        }
      });
    } catch (submitError) {
      setError(submitError.message || "Kunde inte fortsätta.");
      setPending(false);
    }
  }

  if (logoutInProgress) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#ffffff]">
      <AuthFlowNav />
      <div className="grid min-h-screen pt-20 lg:grid-cols-2">
        <img
          src={loginImage}
          alt="Stockholm"
          className="hidden h-full w-full object-cover lg:block"
        />

        <div className="flex flex-col items-center justify-center px-4 pb-8">
          <div className="w-full">
            <div ref={cardWrapRef} className="mx-auto w-full max-w-[430px] rounded-[30px] border border-black/10 bg-[#ffffff] px-6 py-7 sm:px-7 sm:py-8">
              <h1 className="text-[1.95rem] font-semibold leading-tight text-[#0b0a0e]">Logga in</h1>
              <p className="mt-1 text-sm text-ink-600">
                WorkOS hanterar inloggning, lösenord och återställning. Du skickas vidare automatiskt.
              </p>

              {!isConfigured ? (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  WorkOS saknar miljövariabler. Lägg till <code>VITE_CONVEX_URL</code>, <code>VITE_WORKOS_CLIENT_ID</code> och <code>VITE_WORKOS_REDIRECT_URI</code>.
                </div>
              ) : (
                <>
                  <form className="mt-5 flex flex-col gap-3" onSubmit={continueWithEmail}>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-ink-700">E-post</span>
                      <input
                        className="field"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="namn@foretag.se"
                        autoComplete="email"
                        required
                      />
                    </label>
                    {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-full border border-[#0b0a0e] bg-[#0b0a0e] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      disabled={pending || isLoading}
                    >
                      {pending || user ? "Kontrollerar..." : "Fortsätt"}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full border border-black/10 bg-[#f8fafc] px-6 py-3 text-sm font-semibold text-ink-700 hover:bg-[#ffffff]"
                      onClick={() => navigateTo(`/signup?returnTo=${encodeURIComponent(returnTo)}`)}
                      disabled={pending}
                    >
                      Skapa konto
                    </button>
                  </form>
                </>
              )}
            </div>

            <div className="mx-auto mt-4 text-center" style={cardWidth ? { width: `${cardWidth}px`, maxWidth: "100%" } : undefined}>
              <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-500">
                Genom att fortsätta godkänner du Lokalflödes användarvillkor och integritetspolicy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
