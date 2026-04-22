import { useEffect } from "react";
import AuthFlowNav from "../components/layout/AuthFlowNav";
import { defaultAppPathForRole, navigateTo } from "../lib/router";
import { useAppState } from "../state/AppState";

function CallbackPage() {
  const app = useAppState();

  useEffect(() => {
    if (app.isBootstrapping || app.isAuthPending) {
      return;
    }

    if (app.user) {
      navigateTo(app.user.onboardingCompleted ? defaultAppPathForRole(app.user.role) : "/onboarding", { replace: true });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      navigateTo("/login", { replace: true });
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [app.isAuthPending, app.isBootstrapping, app.user]);

  return (
    <main className="grid min-h-screen place-items-center bg-white px-4 pb-8 pt-20">
      <AuthFlowNav />
      <div className="w-full max-w-[460px] rounded-[30px] border border-black/10 bg-white px-6 py-7 text-center sm:px-7 sm:py-8">
        <h1 className="text-[1.95rem] font-semibold leading-tight text-[#0f1930]">Slutför inloggning</h1>
        <p className="mt-2 text-sm text-ink-600">Bygger sessionen mot Convex och WorkOS.</p>
        <div className="mt-5 rounded-2xl border border-black/10 bg-[#f8fafc] p-4 text-sm text-ink-700">
          {app.isBootstrapping || app.isAuthPending
            ? "Väntar på att autentisering och session ska bli klara..."
            : app.user
              ? "Inloggning klar. Skickar dig vidare..."
              : "Ingen aktiv session hittades. Skickar tillbaka till inloggning..."}
        </div>
      </div>
    </main>
  );
}

export default CallbackPage;
