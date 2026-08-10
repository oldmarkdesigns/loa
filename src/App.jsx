import { useEffect, useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import ViewingRequestModal from "./components/app/ViewingRequestModal";
import AppShell from "./components/layout/AppShell";
import ToastStack from "./components/layout/ToastStack";
import LandingPage from "./pages/LandingPage";
import CallbackPage from "./pages/CallbackPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import OnboardingPage from "./pages/OnboardingPage";
import SignupPage from "./pages/SignupPage";
import ListingDetailPage from "./pages/app/ListingDetailPage";
import ManageListingPage from "./pages/app/ManageListingPage";
import MessagesPage from "./pages/app/MessagesPage";
import AdminPanelPage from "./pages/app/AdminPanelPage";
import BrokerPanelPage from "./pages/app/BrokerPanelPage";
import ProfilePage from "./pages/app/ProfilePage";
import PublishPage from "./pages/app/PublishPage";
import RentPage from "./pages/app/RentPage";
import SettingsPage from "./pages/app/SettingsPage";
import ViewingsPage from "./pages/app/ViewingsPage";
import { defaultAppPathForRole, defaultAppPathForUser, navigateTo, normalizeAppRole, usePathname } from "./lib/router";
import { AppProvider, useAppState } from "./state/AppState";

function AppContent() {
  const pathname = usePathname();
  const routeAnimationKey = pathname.startsWith("/app/")
    ? "/app"
    : pathname.startsWith("/onboarding/")
      ? "/onboarding"
      : pathname;
  const app = useAppState();
  const { signIn } = useAuth();
  const [bookingListing, setBookingListing] = useState(null);

  function openAuthOverlay(mode = "login") {
    if (mode === "signup") {
      navigateTo("/signup");
      return;
    }

    const isProtectedAppPath = pathname.startsWith("/app") && pathname !== "/app/rent" && !pathname.startsWith("/app/listings/");
    const returnTo = isProtectedAppPath ? pathname : "/app/rent";

    signIn({ state: { returnTo } }).catch(() => {
      navigateTo("/");
    });
  }

  useEffect(() => {
    if (app.isBootstrapping || app.isAuthPending) {
      return;
    }

    const search = typeof window !== "undefined" ? window.location.search : "";
    const searchParams = new URLSearchParams(search);
    const isAdminAliasPath = pathname === "/admin" || pathname.startsWith("/admin/");
    if (isAdminAliasPath) {
      navigateTo(pathname.replace(/^\/admin/, "/app/admin"), { replace: true });
      return;
    }

    if (pathname === "/login") {
      navigateTo("/", { replace: true });
      return;
    }

    const isAuthenticated = Boolean(app.user);
    const isOnboardingPath = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
    const isAppPath = pathname === "/app" || pathname.startsWith("/app/");
    const isAdminPath = pathname === "/app/admin" || pathname.startsWith("/app/admin/");
    const isBrokerPath = pathname === "/app/broker" || pathname.startsWith("/app/broker/");
    const isPublicRentPath = pathname === "/app/rent";
    const isPublicListingPath = pathname.startsWith("/app/listings/");
    const isCallbackPath = pathname === "/callback";
    const isAuthPath = pathname === "/signup" || pathname === "/forgot-password" || isCallbackPath;
    const normalizedRoles = Array.isArray(app.user?.roles)
      ? app.user.roles.map(normalizeAppRole)
      : [normalizeAppRole(app.user?.role)];
    const hasCompanyAdminRole = normalizedRoles.includes("company_admin");
    const hasPendingBrokerVerification =
      app.user?.profile?.requestedRole === "broker" &&
      app.user?.profile?.roleRequestStatus === "pending";
    const userReadyForApp = Boolean(app.user?.onboardingCompleted || hasPendingBrokerVerification);
    const userNeedsOnboarding = isAuthenticated && !userReadyForApp;
    const isAddBrokerIntent = isOnboardingPath && searchParams.get("intent") === "add-role" && searchParams.get("role") === "broker";
    const isExplicitRoleSetupOnboarding =
      isOnboardingPath
      && (
        (searchParams.get("role") === "company_admin" && searchParams.get("onboardingFlow") === "company_admin")
        || (searchParams.get("role") === "broker" && (searchParams.get("onboardingFlow") === "broker" || searchParams.get("onboardingFlow") === "broker-with-program"))
      );
    const canAddBrokerRole = isAuthenticated && !normalizedRoles.includes("broker") && !normalizedRoles.includes("company_admin");
    const authJustCompleted = typeof window !== "undefined" && window.sessionStorage.getItem("office_auth_just_completed") === "1";
    const logoutInProgress = typeof window !== "undefined" && window.sessionStorage.getItem("office_auth_logout_in_progress") === "1";
    const hasSignupDraft = typeof window !== "undefined" && Boolean(window.sessionStorage.getItem("office_rental_signup_draft"));
    const onboardingCompletionScreen = typeof window !== "undefined" ? window.sessionStorage.getItem("office_onboarding_completion_screen") : "";

    if (logoutInProgress && pathname !== "/") {
      navigateTo("/", { replace: true });
      return;
    }

    if (isAuthenticated && hasSignupDraft) {
      const isSignupProfileExtraPath = pathname === "/signup" && searchParams.get("step") === "profile-extra";
      if (!isSignupProfileExtraPath) {
        navigateTo("/signup?step=profile-extra", { replace: true });
      }
      return;
    }

    if (!isAuthenticated && pathname === "/app") {
      navigateTo("/", { replace: true });
      signIn({ state: { returnTo: "/app" } }).catch(() => {});
      return;
    }

    if (!isAuthenticated && isAppPath && !isPublicRentPath && !isPublicListingPath) {
      navigateTo("/", { replace: true });
      signIn({ state: { returnTo: pathname } }).catch(() => {});
      return;
    }

    if (!isAuthenticated && isOnboardingPath) {
      navigateTo("/signup", { replace: true });
      return;
    }

    if (userNeedsOnboarding && !isOnboardingPath && (pathname === "/app" || pathname.startsWith("/app/"))) {
      navigateTo("/onboarding", { replace: true });
      return;
    }

    if (userNeedsOnboarding && isCallbackPath) {
      navigateTo(hasSignupDraft ? "/signup?step=profile-extra" : "/signup", { replace: true });
      return;
    }

    if (
      isAuthenticated
      && userReadyForApp
      && hasCompanyAdminRole
      && authJustCompleted
      && !onboardingCompletionScreen
      && !isExplicitRoleSetupOnboarding
      && !isAdminPath
    ) {
      window.sessionStorage.removeItem("office_auth_just_completed");
      navigateTo("/app/admin", { replace: true });
      return;
    }

    if (
      isAuthenticated
      && userReadyForApp
      && (
        isAuthPath ||
        (isOnboardingPath && !onboardingCompletionScreen && !isExplicitRoleSetupOnboarding && !(isAddBrokerIntent && canAddBrokerRole))
      )
    ) {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("office_auth_just_completed");
      }
      navigateTo(defaultAppPathForUser(app.user), { replace: true });
      return;
    }

    if (isAuthenticated && pathname === "/app") {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("office_auth_just_completed");
      }
      navigateTo(defaultAppPathForUser(app.user), { replace: true });
      return;
    }

    if (isAuthenticated && userReadyForApp) {
      const normalizedRole = normalizeAppRole(app.user.role);
      const fallbackRole = normalizedRole === "broker" || normalizedRole === "company_admin" ? normalizedRole : "renter";
      const rawRoles = Array.isArray(app.user.roles) ? app.user.roles.map(normalizeAppRole) : [fallbackRole];
      const roleSet = new Set(rawRoles.filter((item) => item === "renter" || item === "broker" || item === "company_admin"));
      const role = roleSet.has("company_admin")
        ? "company_admin"
        : fallbackRole;
      const hasPublisherRole = roleSet.has("broker") || roleSet.has("company_admin");
      const renterAllowed = ["/app/rent", "/app/viewings", "/app/messages", "/app/profile", "/app/settings", "/app/listings"];
      const brokerAllowed = ["/app/broker", "/app/my-listings", "/app/publish", "/app/messages", "/app/settings", "/app/rent", "/app/listings"];
      const companyAdminAllowed = ["/app/admin", "/app/publish", "/app/messages", "/app/settings", "/app/rent", "/app/listings"];
      const extraForPublisherMembers = hasPublisherRole ? ["/app/broker", "/app/my-listings", "/app/publish"] : [];
      const allowedBases = role === "company_admin"
        ? companyAdminAllowed
        : role === "broker"
          ? brokerAllowed
          : [...renterAllowed, ...extraForPublisherMembers];
      const pathnameAllowed = allowedBases.some((base) => pathname === base || pathname.startsWith(`${base}/`));

      if (role === "renter" && pathname.startsWith("/app/") && !pathnameAllowed) {
        navigateTo("/app/rent", { replace: true });
        return;
      }

      if (isAdminPath && role !== "company_admin") {
        navigateTo(defaultAppPathForRole(role), { replace: true });
        return;
      }

      if (isBrokerPath && role !== "broker") {
        navigateTo(defaultAppPathForRole(role), { replace: true });
        return;
      }

      if (pathname === "/app/favorites") {
        const favoritesTarget = role === "company_admin"
          ? "/app/admin/profil?tab=favorites"
          : role === "broker"
            ? "/app/broker/profil?tab=favorites"
            : "/app/profile?tab=favorites";
        navigateTo(favoritesTarget, { replace: true });
        return;
      }

      if (role === "broker" && pathname === "/app/viewings") {
        navigateTo("/app/broker/leads", { replace: true });
        return;
      }

      if (role === "company_admin" && pathname === "/app/viewings") {
        navigateTo("/app/admin/leads", { replace: true });
        return;
      }

      if (role === "company_admin" && pathname.startsWith("/app/") && !pathnameAllowed) {
        navigateTo("/app/admin", { replace: true });
        return;
      }

      if (role === "broker" && pathname.startsWith("/app/") && !pathnameAllowed) {
        navigateTo("/app/broker", { replace: true });
      }
    }
  }, [app.isAuthPending, app.isBootstrapping, app.user, pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const targets = Array.from(
      document.querySelectorAll("h1, h2, h3, article, .surface, [data-reveal]")
    ).filter((element) => !element.closest("header") && !element.closest("[data-no-reveal]"));

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
      <main className="min-h-screen bg-[#ffffff]" aria-hidden="true">
        <div className="h-screen w-full" />
      </main>
    );
  }

  let content = null;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    content = null;
  } else if (pathname === "/") {
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
  } else if (pathname === "/signup") {
    content = (
      <SignupPage
        onCheckCompanyByOrganizationNumber={app.findCompanyByOrganizationNumber}
        onCompleteSignup={app.completeSignup}
        currentUser={app.user}
      />
    );
  } else if (pathname === "/callback") {
    content = <CallbackPage />;
  } else if (pathname === "/forgot-password") {
    content = <ForgotPasswordPage />;
  } else if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
    content = (
      <OnboardingPage
        user={app.user}
        onComplete={app.completeOnboarding}
        onCheckCompanyByOrganizationNumber={app.findCompanyByOrganizationNumber}
        onSwitchRole={app.switchRole}
        onLogout={app.logout}
        pathname={pathname}
      />
    );
  } else if (pathname.startsWith("/app")) {
    const listingDetailMatch = pathname.match(/^\/app\/listings\/([^/]+)(?:\/gallery)?$/);
    const manageListingMatch = pathname.match(/^\/app\/my-listings\/([^/]+)$/);
    const listingId = listingDetailMatch ? decodeURIComponent(listingDetailMatch[1]) : null;
    const isListingGalleryPath = Boolean(pathname.match(/^\/app\/listings\/[^/]+\/gallery$/));
    const managedListingId = manageListingMatch ? decodeURIComponent(manageListingMatch[1]) : null;
    const isAdminPath = pathname === "/app/admin" || pathname.startsWith("/app/admin/");
    const isBrokerPath = pathname === "/app/broker" || pathname.startsWith("/app/broker/");

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
    const activeRole = normalizeAppRole(app.user?.role);

    if (isAdminPath) {
      appRouteContent = <AdminPanelPage app={app} pathname={pathname} />;
    } else if (isBrokerPath) {
      appRouteContent = <BrokerPanelPage app={app} pathname={pathname} />;
    } else if (pathname === "/app/rent") {
      appRouteContent = <RentPage app={app} onRequireAuth={openAuthOverlay} />;
    } else if (listingId) {
      appRouteContent = <ListingDetailPage app={app} listingId={listingId} initialView={isListingGalleryPath ? "gallery" : "detail"} />;
    } else if (managedListingId) {
      appRouteContent = <ManageListingPage app={app} listingId={managedListingId} />;
    } else if (pathname === "/app/viewings") {
      appRouteContent = <ViewingsPage app={app} />;
    } else if (pathname === "/app/messages") {
      appRouteContent = <MessagesPage app={app} />;
    } else if (pathname === "/app/profile") {
      appRouteContent = <ProfilePage app={app} />;
    } else if (pathname === "/app/settings") {
      appRouteContent = <SettingsPage app={app} />;
    } else if (pathname === "/app/publish") {
      appRouteContent = <PublishPage app={app} pathname={pathname} />;
    } else {
      appRouteContent = activeRole === "company_admin"
        ? <AdminPanelPage app={app} pathname="/app/admin" />
        : activeRole === "broker"
          ? <BrokerPanelPage app={app} pathname="/app/broker" />
          : <RentPage app={app} />;
    }

      content = (
        <AppShell
          pathname={pathname}
          user={app.user}
          listings={app.listings}
          notifications={app.notifications}
          companyBrokers={app.companyBrokers}
          onSwitchRole={app.switchRole}
          onLogout={app.logout}
        >
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
