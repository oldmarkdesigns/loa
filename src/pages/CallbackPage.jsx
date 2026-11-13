import { useEffect } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { AccountLayout, SiteFrame } from "../site/SiteChrome";
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
      navigateTo(signupFallbackPath(), { replace: true });
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [app.isAuthPending, app.isBootstrapping, app.user, authUser, isAuthLoading]);

  return (
    <SiteFrame slim navActions={false}>
      <AccountLayout label="Inloggning" title="Ett ögonblick." lede="Vi loggar in dig och hämtar ditt konto.">
        <div role="status" aria-live="polite" style={{ paddingTop: 12 }}>
          <span className="lo-sr">Laddar</span>
          <div className="lo-progress" />
        </div>
      </AccountLayout>
    </SiteFrame>
  );
}

export default CallbackPage;
