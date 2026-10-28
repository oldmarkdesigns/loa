import { useEffect, useMemo, useRef, useState } from "react";
import { navigateTo, routeMatches } from "../../lib/router";
import { deriveNavbarRoleState } from "../../lib/navbarRoles";
import { ArrowUpIcon, MouseScrollIcon } from "../icons/UiIcons";
import MarketingHeader from "./MarketingHeader";
import { PanelChromeProvider } from "./PanelChrome";
import { ThemeProvider } from "../../lib/theme";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";

function AppShell({
  pathname,
  user,
  listings = [],
  myCompanies = [],
  onSwitchRole,
  onSwitchCompany,
  onLogout,
  onRequireAuth,
  isGuest = false,
  children
}) {
  const isAdminContext = routeMatches(pathname, "/app/admin");
  const { activeRole, hasBrokerAccess: hasPublisherAccess } = deriveNavbarRoleState(user, { isGuest });
  const isPublisherWorkspacePath = (
    routeMatches(pathname, "/app/publish")
    || routeMatches(pathname, "/app/broker")
    || routeMatches(pathname, "/app/my-listings")
  );
  const isBrokerPanelContext = !isGuest && hasPublisherAccess && !isAdminContext && isPublisherWorkspacePath;
  const isPanelContext = isAdminContext || isBrokerPanelContext;
  const shouldShowStaticNavBorder = routeMatches(pathname, "/app/rent")
    || routeMatches(pathname, "/app/messages")
    || (routeMatches(pathname, "/app/settings") && activeRole !== "company_admin");
  const isAdminStatisticsPage = routeMatches(pathname, "/app/admin/statistik");
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [showScrollToTopButton, setShowScrollToTopButton] = useState(false);
  const [showLeaveSearchConfirm, setShowLeaveSearchConfirm] = useState(false);
  const contentRef = useRef(null);

  // The panels have no top bar: their side menu places the company switcher and the mode switch (see PanelChrome).
  const panelChrome = useMemo(
    () => ({ user, myCompanies, onSwitchRole, onSwitchCompany }),
    [user, myCompanies, onSwitchRole, onSwitchCompany]
  );

  useEffect(() => {
    const scrollContainer = contentRef.current;
    const activeScrollable = (
      scrollContainer?.querySelector("[data-scroll-top-scope='results']") ||
      scrollContainer?.querySelector("section.h-full.overflow-y-auto")
    );

    const handleScroll = () => {
      const scrollTop = activeScrollable ? activeScrollable.scrollTop : window.scrollY;
      setIsNavScrolled(scrollTop > 0);
      setShowScrollToTopButton(scrollTop > 12);
    };

    handleScroll();

    if (activeScrollable) {
      activeScrollable.addEventListener("scroll", handleScroll, { passive: true });
      return () => activeScrollable.removeEventListener("scroll", handleScroll);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  function handleScrollToTop() {
    const scrollContainer = contentRef.current;
    const activeScrollable = (
      scrollContainer?.querySelector("[data-scroll-top-scope='results']") ||
      scrollContainer?.querySelector("section.h-full.overflow-y-auto")
    );
    if (activeScrollable) {
      activeScrollable.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePrimaryNavClick(event, item) {
    if (!item?.href) return false;
    if (item.href !== "/app/rent?view=available") return false;
    if (pathname !== "/app/rent") return false;

    const params = new URLSearchParams(window.location.search);
    const hasActiveSearch = params.get("run") === "1";
    if (!hasActiveSearch) return false;

    event.preventDefault();
    setShowLeaveSearchConfirm(true);
    return true;
  }

  return (
    // The theme (light, dark or the system's) is one for the whole shell: the workspace panels and search mode look the same in it,
    // and the header of search mode is inside it, so the switch in its profile menu can reach it.
    <ThemeProvider>
      <main className={`flex h-screen flex-col overflow-hidden text-strong ${isPanelContext ? "bg-canvas" : "bg-page"}`}>
        {isPanelContext ? null : (
          <MarketingHeader
            pathname={pathname}
            user={user}
            isGuest={isGuest}
            isNavScrolled={isNavScrolled}
            showStaticBorder={shouldShowStaticNavBorder}
            onBrandClick={() => navigateTo("/")}
            onPrimaryNavClick={handlePrimaryNavClick}
            onSwitchRole={onSwitchRole}
            onLogout={onLogout}
            onRequireAuth={onRequireAuth}
          />
        )}

        <PanelChromeProvider value={isPanelContext ? panelChrome : null}>
          <section ref={contentRef} className="min-h-0 flex-1 overflow-hidden">{children}</section>
        </PanelChromeProvider>

        <Button
          type="button"
          variant="outline"
          aria-label="Scrolla till toppen"
          onClick={handleScrollToTop}
          className={`h-auto fixed bottom-6 z-30 flex-col gap-0.5 rounded-full border-veil/20 bg-on-strong/25 p-3 text-strong shadow-[0_8px_24px_rgba(15,25,48,0.18)] backdrop-blur-md transition-all duration-250 ${
            showScrollToTopButton
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-3 opacity-0"
          } ${isAdminStatisticsPage ? "right-6 xl:right-[max(1.5rem,calc((100vw-296px-1600px)/2+1.5rem))]" : "right-6"} hover:bg-on-strong/35`}
        >
          <ArrowUpIcon className="h-4 w-4" />
          <MouseScrollIcon className="h-4 w-4" />
        </Button>

        <AlertDialog open={showLeaveSearchConfirm} onOpenChange={setShowLeaveSearchConfirm}>
          <AlertDialogContent className="max-w-lg rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Byt till Lediga lokaler?</AlertDialogTitle>
              <AlertDialogDescription>
                Din nuvarande sökning försvinner om du går vidare till Lediga lokaler-flödet.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-auto rounded-xl px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-control">
                Avbryt
              </AlertDialogCancel>
              <AlertDialogAction
                className="h-auto rounded-xl px-4 py-2 text-sm font-semibold"
                onClick={() => {
                  setShowLeaveSearchConfirm(false);
                  navigateTo("/app/rent?view=available");
                }}
              >
                Fortsätt
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </ThemeProvider>
  );
}

export default AppShell;
