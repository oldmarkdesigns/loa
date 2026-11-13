import { lazy, Suspense, useEffect } from "react";
import { AppProvider, useAppState } from "./state/AppState";
import { TooltipProvider } from "./components/ui/tooltip";
import ToastStack from "./components/layout/ToastStack";
import LandingPage from "./pages/LandingPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import CallbackPage from "./pages/CallbackPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import OnboardingPage from "./pages/OnboardingPage";
import ProspectGuestPage from "./pages/ProspectGuestPage";
import ListingsPage from "./site/ListingsPage";
import ListingPage from "./site/ListingPage";
import LandlordsPage from "./site/LandlordsPage";
import { SiteFrame, AccountLayout } from "./site/SiteChrome";
const WorkspacePage = lazy(() => import("./pages/WorkspacePage"));
import { canAccessWorkspace, defaultAppPathForUser, isWorkspacePath, navigateTo, usePathname } from "./lib/router";
import { clearBootTheme } from "./lib/theme";

function AppContent() {
  const pathname = usePathname();
  const app = useAppState();
  const onboarding = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  const workspace = isWorkspacePath(pathname);
  const allowed = canAccessWorkspace(app.user, pathname);
  useEffect(() => {
    if (app.isBootstrapping || app.isAuthPending) return;
    if (pathname === "/app" || pathname === "/app/rent") {
      navigateTo(pathname === "/app/rent" ? "/lokaler" : app.user ? defaultAppPathForUser(app.user) : "/login", { replace: true });
    } else if (/^\/app\/listings\/[^/]+(?:\/gallery)?$/.test(pathname)) {
      navigateTo("/lokaler/" + pathname.split("/")[3], { replace: true });
    } else if (workspace) {
      if (!app.user) navigateTo(`/login?returnTo=${encodeURIComponent(pathname)}`, { replace: true });
      else if (!app.user.onboardingCompleted) navigateTo("/onboarding", { replace: true });
      else if (!allowed) navigateTo(defaultAppPathForUser(app.user), { replace: true });
    }
  }, [app.isBootstrapping, app.isAuthPending, app.user, pathname, workspace, allowed]);
  useEffect(() => {
    if (!app.isBootstrapping) clearBootTheme();
    if (!app.isBootstrapping && !app.isAuthPending && onboarding && !app.user) {
      navigateTo("/signup", { replace: true });
    }
  }, [app.isBootstrapping, app.isAuthPending, app.user, onboarding]);
  if (app.isBootstrapping) return <main role="status" aria-label="Laddar LOA" />;
  const shared = { user: app.user, listings: app.listings };
  let content;
  if (workspace) content = allowed && app.user.onboardingCompleted ? <Suspense fallback={<main role="status" aria-label="Laddar konto" />}><WorkspacePage app={app} pathname={pathname} /></Suspense> : <main role="status" aria-label="Laddar konto" />;
  else if (pathname === "/") content = <LandingPage {...shared} />;
  else if (pathname === "/lokaler") content = <ListingsPage {...shared} />;
  else if (/^\/lokaler\/[^/]+$/.test(pathname)) {
    let id;
    try { id = decodeURIComponent(pathname.slice("/lokaler/".length)); } catch { id = ""; }
    content = <ListingPage key={id} {...shared} listingId={id} />;
  }
  else if (pathname === "/hyresvardar") content = <LandlordsPage {...shared} />;
  else if (pathname === "/login") content = <LoginPage user={app.user} onLogout={app.logout} />;
  else if (pathname === "/signup") content = <SignupPage currentUser={app.user} onCheckCompanyByOrganizationNumber={app.findCompanyByOrganizationNumber} onCompleteSignup={app.completeSignup} />;
  else if (pathname === "/callback") content = <CallbackPage />;
  else if (pathname === "/forgot-password") content = <ForgotPasswordPage />;
  else if (onboarding) content = app.user ? <OnboardingPage user={app.user} onComplete={app.completeOnboarding} onCheckCompanyByOrganizationNumber={app.findCompanyByOrganizationNumber} onSwitchRole={app.switchRole} onLogout={app.logout} pathname={pathname} /> : null;
  else if (pathname.startsWith("/prospekt/dela/")) content = <ProspectGuestPage token={pathname.slice("/prospekt/dela/".length)} />;
  else content = <SiteFrame {...shared}><AccountLayout label="404" title="Sidan finns inte." lede="Gå till lediga lokaler för att fortsätta."><a className="lo-btn" href="/lokaler">Se lediga lokaler</a></AccountLayout></SiteFrame>;
  return <>{content}<ToastStack toasts={app.toasts} /></>;
}
export default function App() {
  return <AppProvider><TooltipProvider><AppContent /></TooltipProvider></AppProvider>;
}
