import { useEffect } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import AuthFlowNav from "../components/layout/AuthFlowNav";
import { defaultAppPathForUser, navigateTo } from "../lib/router";
import { useAppState } from "../state/AppState";

function signupFallbackPath() {
  const hasSignupDraft = typeof window !== "undefined" && Boolean(window.sessionStorage.getItem("office_rental_signup_draft"));
  return hasSignupDraft ? "/signup?step=profile-extra" : "/signup";
}

function CallbackLoadingMockup() {
  return (
    <div className="w-full max-w-[190px]" role="status" aria-live="polite" aria-label="Laddar">
      <div className="callback-loading-card space-y-2 rounded-2xl border border-black/10 bg-white p-3.5 shadow-sm">
        <div className="callback-loading-bar h-2 w-3/4 rounded-full" />
        <div className="callback-loading-bar h-2 w-1/2 rounded-full" />
      </div>
      <div className="callback-loading-card mt-2.5 space-y-2 rounded-2xl border border-black/10 bg-white p-3.5 shadow-sm">
        <div className="callback-loading-bar h-2 w-full rounded-full" />
        <div className="callback-loading-bar h-2 w-2/3 rounded-full" />
      </div>
      <div className="callback-loading-card mt-2.5 space-y-2 rounded-2xl border border-black/10 bg-white p-3.5 shadow-sm">
        <div className="callback-loading-bar h-2 w-1/2 rounded-full" />
        <div className="callback-loading-bar h-2 w-2/3 rounded-full" />
      </div>
    </div>
  );
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
      navigateTo(signupFallbackPath(), { replace: true });
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [app.isAuthPending, app.isBootstrapping, app.user, authUser, isAuthLoading]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#ffffff] px-4 pb-8 pt-20">
      <AuthFlowNav />
      <div className="flex w-full max-w-[460px] items-center justify-center rounded-[30px] border border-black/10 bg-[#ffffff] px-6 py-14 sm:px-7">
        <CallbackLoadingMockup />
      </div>
    </main>
  );
}

export default CallbackPage;
