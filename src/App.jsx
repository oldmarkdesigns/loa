import { useEffect, useState } from "react";
import ViewingRequestModal from "./components/app/ViewingRequestModal";
import AppShell from "./components/layout/AppShell";
import ToastStack from "./components/layout/ToastStack";
import LandingPage from "./pages/LandingPage";
import CallbackPage from "./pages/CallbackPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import OnboardingPage from "./pages/OnboardingPage";
import SignupPage from "./pages/SignupPage";
import LeadsPage from "./pages/app/LeadsPage";
import ListingDetailPage from "./pages/app/ListingDetailPage";
import ManageListingPage from "./pages/app/ManageListingPage";
import ProfilePage from "./pages/app/ProfilePage";
import PublishPage from "./pages/app/PublishPage";
import PublisherOverviewPage from "./pages/app/PublisherOverviewPage";
import RentPage from "./pages/app/RentPage";
import SettingsPage from "./pages/app/SettingsPage";
import ViewingsPage from "./pages/app/ViewingsPage";
import { defaultAppPathForRole, navigateTo, usePathname } from "./lib/router";
import { AppProvider, useAppState } from "./state/AppState";

function AppContent() {
  const pathname = usePathname();
  const routeAnimationKey = pathname.startsWith("/app/") ? "/app" : pathname;
  const app = useAppState();
  const [bookingListing, setBookingListing] = useState(null);

  function openAuthOverlay(mode = "login", preferredRole = "renter") {
    const target =
      mode === "signup"
        ? `/signup${preferredRole === "publisher" ? "?role=publisher" : ""}`
        : "/login";
    navigateTo(target);
  }

  useEffect(() => {
    if (app.isBootstrapping || app.isAuthPending) {
      return;
    }

    const isAuthenticated = Boolean(app.user);
    const isOnboardingPath = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
    const isAppPath = pathname === "/app" || pathname.startsWith("/app/");
    const isPublicRentPath = pathname === "/app/rent";
    const isPublicListingPath = pathname.startsWith("/app/listings/");
    const isCallbackPath = pathname === "/callback";
    const isAuthPath = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || isCallbackPath;

    if (!isAuthenticated && pathname === "/app") {
      navigateTo("/login?returnTo=/app", { replace: true });
      return;
    }

    if (!isAuthenticated && isAppPath && !isPublicRentPath && !isPublicListingPath) {
      navigateTo(`/login?returnTo=${encodeURIComponent(pathname)}`, { replace: true });
      return;
    }

    if (!isAuthenticated && isOnboardingPath) {
      navigateTo("/signup?role=renter", { replace: true });
      return;
    }

    if (!isAuthenticated && isCallbackPath) {
      navigateTo("/login", { replace: true });
      return;
    }

    if (isAuthenticated && !app.user.onboardingCompleted && !isOnboardingPath && (pathname === "/app" || pathname.startsWith("/app/"))) {
      navigateTo("/onboarding", { replace: true });
      return;
    }

    if (isAuthenticated && !app.user.onboardingCompleted && isCallbackPath) {
      navigateTo("/onboarding", { replace: true });
      return;
    }

    if (isAuthenticated && app.user.onboardingCompleted && (isAuthPath || isOnboardingPath)) {
      navigateTo(defaultAppPathForRole(app.user.role), { replace: true });
      return;
    }

    if (isAuthenticated && pathname === "/app") {
      navigateTo(defaultAppPathForRole(app.user.role), { replace: true });
      return;
    }

    if (isAuthenticated && app.user.onboardingCompleted) {
      const role = app.user.role === "publisher" ? "publisher" : "renter";
      const rawRoles = Array.isArray(app.user.roles) ? app.user.roles : [role];
      const roleSet = new Set(rawRoles.filter((item) => item === "renter" || item === "publisher"));
      const hasPublisherRole = roleSet.has("publisher");
      const renterAllowed = ["/app/rent", "/app/viewings", "/app/profile", "/app/settings", "/app/listings"];
      const publisherAllowed = ["/app/my-listings", "/app/publish", "/app/leads", "/app/profile", "/app/settings", "/app/rent", "/app/listings"];
      const extraForPublisherMembers = hasPublisherRole ? ["/app/my-listings", "/app/publish", "/app/leads"] : [];
      const allowedBases = role === "publisher" ? publisherAllowed : [...renterAllowed, ...extraForPublisherMembers];
      const pathnameAllowed = allowedBases.some((base) => pathname === base || pathname.startsWith(`${base}/`));

      if (role === "renter" && pathname.startsWith("/app/") && !pathnameAllowed) {
        navigateTo("/app/rent", { replace: true });
        return;
      }

      if (pathname === "/app/favorites") {
        navigateTo("/app/profile?tab=favorites", { replace: true });
        return;
      }

      if (role === "publisher" && pathname === "/app/viewings") {
        navigateTo("/app/leads", { replace: true });
        return;
      }

      if (role === "publisher" && pathname.startsWith("/app/") && !pathnameAllowed) {
        navigateTo("/app/my-listings", { replace: true });
      }
    }
  }, [app.isAuthPending, app.isBootstrapping, app.user, pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const targets = Array.from(
      document.querySelectorAll("h1, h2, h3, article, .surface, [data-reveal]")
    ).filter((element) => !element.closest("header"));

    targets.forEach((element) => {
      element.classList.remove("reveal-in");
      element.classList.add("reveal-init");
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    targets.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [pathname, app.isBootstrapping]);

  if (app.isBootstrapping) {
    return (
      <main className="min-h-screen bg-white" aria-hidden="true">
        <div className="h-screen w-full" />
      </main>
    );
  }

  let content = null;

  if (pathname === "/") {
    content = (
      <LandingPage
        user={app.user}
        listings={app.listings}
        favorites={app.favorites}
        onToggleFavorite={app.toggleFavorite}
        onOpenAuthOverlay={openAuthOverlay}
        onLogout={app.logout}
      />
    );
  } else if (pathname === "/login") {
    content = <LoginPage />;
  } else if (pathname === "/signup") {
    content = <SignupPage onCompleteSignup={app.completeSignup} />;
  } else if (pathname === "/callback") {
    content = <CallbackPage />;
  } else if (pathname === "/forgot-password") {
    content = <ForgotPasswordPage />;
  } else if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
    content = <OnboardingPage user={app.user} onComplete={app.completeOnboarding} pathname={pathname} />;
  } else if (pathname.startsWith("/app")) {
    const listingDetailMatch = pathname.match(/^\/app\/listings\/([^/]+)(?:\/gallery)?$/);
    const manageListingMatch = pathname.match(/^\/app\/my-listings\/([^/]+)$/);
    const listingId = listingDetailMatch ? decodeURIComponent(listingDetailMatch[1]) : null;
    const isListingGalleryPath = Boolean(pathname.match(/^\/app\/listings\/[^/]+\/gallery$/));
    const managedListingId = manageListingMatch ? decodeURIComponent(manageListingMatch[1]) : null;

    if (!app.user) {
      if (pathname === "/app/rent") {
        content = (
          <AppShell pathname={pathname} user={null} isGuest onRequireAuth={openAuthOverlay}>
            <RentPage app={app} isGuest onRequireAuth={openAuthOverlay} />
          </AppShell>
        );
      } else if (listingId) {
        content = (
          <AppShell pathname={pathname} user={null} isGuest onRequireAuth={openAuthOverlay}>
            <ListingDetailPage app={app} listingId={listingId} isGuest onRequireAuth={openAuthOverlay} initialView={isListingGalleryPath ? "gallery" : "detail"} />
          </AppShell>
        );
      } else {
        content = (
          <LandingPage
            user={app.user}
            listings={app.listings}
            favorites={app.favorites}
            onToggleFavorite={app.toggleFavorite}
            onOpenAuthOverlay={openAuthOverlay}
            onLogout={app.logout}
            onSwitchRole={app.switchRole}
          />
        );
      }
    } else {
    let appRouteContent = null;
    const activeRole = app.user?.role === "publisher" ? "publisher" : "renter";

    if (pathname === "/app/rent") {
      appRouteContent = <RentPage app={app} onRequireAuth={openAuthOverlay} />;
    } else if (listingId) {
      appRouteContent = <ListingDetailPage app={app} listingId={listingId} initialView={isListingGalleryPath ? "gallery" : "detail"} />;
    } else if (managedListingId) {
      appRouteContent = <ManageListingPage app={app} listingId={managedListingId} />;
    } else if (pathname === "/app/my-listings") {
      appRouteContent = <PublisherOverviewPage app={app} />;
    } else if (pathname === "/app/viewings") {
      appRouteContent = app.user?.role === "publisher" ? <LeadsPage app={app} /> : <ViewingsPage app={app} />;
    } else if (pathname === "/app/leads") {
      appRouteContent = <LeadsPage app={app} />;
    } else if (pathname === "/app/profile") {
      appRouteContent = <ProfilePage app={app} />;
    } else if (pathname === "/app/settings") {
      appRouteContent = <SettingsPage app={app} />;
    } else if (pathname === "/app/publish") {
      appRouteContent = <PublishPage app={app} />;
    } else {
      appRouteContent = activeRole === "publisher" ? <PublisherOverviewPage app={app} /> : <RentPage app={app} />;
    }

      content = (
        <AppShell pathname={pathname} user={app.user} onSwitchRole={app.switchRole} onLogout={app.logout}>
          {appRouteContent}
        </AppShell>
      );
    }
  } else {
    content = (
      <LandingPage
        user={app.user}
        listings={app.listings}
        favorites={app.favorites}
        onToggleFavorite={app.toggleFavorite}
        onOpenAuthOverlay={openAuthOverlay}
        onLogout={app.logout}
        onSwitchRole={app.switchRole}
      />
    );
  }

  return (
    <>
      <div key={routeAnimationKey} className="page-enter">
        {content}
      </div>

      <ViewingRequestModal
        listing={bookingListing}
        onClose={() => setBookingListing(null)}
        onSubmit={async (payload) => {
          await app.requestViewing(payload);
          setBookingListing(null);
        }}
      />

      <ToastStack toasts={app.toasts} />
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
