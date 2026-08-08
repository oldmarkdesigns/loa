import { useEffect } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import AuthFlowNav from "../components/layout/AuthFlowNav";
import { defaultAppPathForUser, navigateTo } from "../lib/router";
import { useAppState } from "../state/AppState";

function signupFallbackPath() {
  const hasSignupDraft = typeof window !== "undefined" && Boolean(window.sessionStorage.getItem("office_rental_signup_draft"));
  return hasSignupDraft ? "/signup?step=profile-extra" : "/signup";
}

function CallbackPage() {
  const app = useAppState();
  const { user: authUser, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (app.isBootstrapping || app.isAuthPending || isAuthLoading) {
      return;
    }

    if (app.user) {
      navigateTo(app.user.onboardingCompleted ? defaultAppPathForUser(app.user) : signupFallbackPath(), { replace: true });
      return;
    }

    if (authUser) {
      navigateTo(signupFallbackPath(), { replace: true });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      navigateTo("/login", { replace: true });
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [app.isAuthPending, app.isBootstrapping, app.user, authUser, isAuthLoading]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#ffffff] px-4 pb-8 pt-20">
      <AuthFlowNav />
      <div className="w-full max-w-[460px] rounded-[30px] border border-black/10 bg-[#ffffff] px-6 py-7 text-center sm:px-7 sm:py-8">
        <h1 className="text-[1.95rem] font-semibold leading-tight text-[#0b0a0e]">Slutför inloggning</h1>
        <p className="mt-2 text-sm text-ink-600">Bygger sessionen mot Convex och WorkOS.</p>
        <div className="mt-5 rounded-2xl border border-black/10 bg-[#f8fafc] p-4 text-sm text-ink-700">
          {app.isBootstrapping || app.isAuthPending
            ? "Väntar på att autentisering och session ska bli klara..."
            : app.user
              ? "Inloggning klar. Skickar dig vidare..."
              : authUser
                ? "Kontot saknas i appen. Skickar dig till registrering..."
              : "Ingen aktiv session hittades. Skickar tillbaka till inloggning..."}
        </div>
      </div>
    </main>
  );
}

export default CallbackPage;
