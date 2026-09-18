import { useEffect, useMemo, useRef, useState } from "react";
import { navigateTo, routeMatches } from "../../lib/router";
import { deriveNavbarRoleState } from "../../lib/navbarRoles";
import { ArrowUpIcon, BellIcon, MouseScrollIcon, SwitchHorizontalIcon } from "../icons/UiIcons";
import AppFooter from "./AppFooter";
import MarketingHeader from "./MarketingHeader";
import ProfileMenuDropdown from "./ProfileMenuDropdown";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import companyLogo from "../../../Assets/Logo/LOA-Logo.png";

function initialsForName(name = "") {
  const parts = String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return (parts.map((part) => part[0]).join("") || "B").toUpperCase();
}

function companyNameForUser(user) {
  return (
    user?.profile?.legalEntity ||
    user?.profile?.companyName ||
    user?.profile?.company ||
    user?.profile?.organizationName ||
    "Ditt bolag"
  );
}

function AppShell({
  pathname,
  user,
  listings = [],
  notifications = [],
  companyBrokers = [],
  myCompanies = [],
  onSwitchRole,
  onSwitchCompany,
  onLogout,
  onRequireAuth,
  isGuest = false,
  children
}) {
  const isAdminContext = routeMatches(pathname, "/app/admin");
  const { activeRole, hasCompanyAdminRole, hasBrokerAccess: hasPublisherAccess } = deriveNavbarRoleState(user, { isGuest });
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [showScrollToTopButton, setShowScrollToTopButton] = useState(false);
  const [showLeaveSearchConfirm, setShowLeaveSearchConfirm] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [seenNotificationIds, setSeenNotificationIds] = useState([]);
  const [adminCompanyOpen, setAdminCompanyOpen] = useState(false);
  const notificationButtonRef = useRef(null);
  const notificationPanelRef = useRef(null);
  const adminCompanyButtonRef = useRef(null);
  const adminCompanyPanelRef = useRef(null);
  const contentRef = useRef(null);

  const notificationItems = useMemo(() => {
    const backendItems = (Array.isArray(notifications) ? notifications : [])
      .filter((item) => item.status !== "handled")
      .map((item) => ({
        id: item.id,
        dedupeKey: item.type === "broker_verification_requested" && item.metadata?.brokerUserId
          ? `broker-request-${item.metadata.brokerUserId}-${item.metadata.companyId || ""}`
          : `notification-${item.id}`,
        title: item.type === "broker_verification_requested" ? "Mäklarförfrågan" : item.title,
        body: item.type === "broker_verification_requested"
          ? String(item.body || "").replace(/^(.+?) vill bli verifierad.*$/, "$1").trim()
          : item.body,
        time: item.createdAt ? new Date(item.createdAt).toLocaleString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Nyss",
        actionPath: item.type === "broker_verification_requested"
          ? "/app/admin/maklare"
          : isAdminContext
            ? "/app/admin/notifikationer"
            : isBrokerPanelContext
              ? "/app/broker/profil"
              : "/app/profile"
    }));
    const pendingBrokerItems = isAdminContext
      ? (Array.isArray(companyBrokers) ? companyBrokers : [])
        .filter((broker) => broker.status === "pending")
        .map((broker) => ({
          id: `broker-request-${broker.userId}`,
          dedupeKey: `broker-request-${broker.userId}-${broker.companyId || ""}`,
          title: "Mäklarförfrågan",
          body: broker.name || broker.email,
          time: broker.requestedAt ? new Date(broker.requestedAt).toLocaleString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Nyss",
          actionPath: "/app/admin/maklare",
          unread: true
        }))
      : [];
    const combinedItems = [...pendingBrokerItems, ...backendItems]
      .filter((item, index, list) => (
        list.findIndex((candidate) => candidate.dedupeKey === item.dedupeKey) === index
      ));

    return combinedItems;
  }, [companyBrokers, isAdminContext, notifications]);
  const unreadNotificationItems = useMemo(
    () => notificationItems.filter((item) => !seenNotificationIds.includes(item.id)),
    [notificationItems, seenNotificationIds]
  );
  const activeCompany = useMemo(() => {
    const name = companyNameForUser(user);
    return {
      id: user?.profile?.companyId || user?.id || "company",
      name,
      initials: initialsForName(name)
    };
  }, [user]);
  const myCompanyOptions = useMemo(() => (Array.isArray(myCompanies) ? myCompanies : []), [myCompanies]);

  useEffect(() => {
    function onPointerDown(event) {
      if (
        notificationButtonRef.current
        && !notificationButtonRef.current.contains(event.target)
        && notificationPanelRef.current
        && !notificationPanelRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
      if (
        adminCompanyButtonRef.current
        && !adminCompanyButtonRef.current.contains(event.target)
        && adminCompanyPanelRef.current
        && !adminCompanyPanelRef.current.contains(event.target)
      ) {
        setAdminCompanyOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setNotificationOpen(false);
    setAdminCompanyOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!notificationOpen || notificationItems.length === 0) return;
    setSeenNotificationIds((current) => (
      Array.from(new Set([...current, ...notificationItems.map((item) => item.id)]))
    ));
  }, [notificationOpen, notificationItems]);

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
    <main className="flex h-screen flex-col overflow-hidden bg-[#ffffff] text-black">
      {isPanelContext ? (
        <header
          className={`navbar-enter sticky top-0 z-40 shrink-0 border-b px-4 py-3 will-change-[background-color,border-color,backdrop-filter] transition-[background-color,border-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6 ${
            isNavScrolled || shouldShowStaticNavBorder ? "border-black/10 bg-[#ffffff]/95 backdrop-blur-md" : "border-black/10 bg-[#ffffff]/0 backdrop-blur-0"
          }`}
        >
          <div className="grid w-full grid-cols-[1fr_auto] items-center gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {isAdminContext || isBrokerPanelContext ? (
                <div ref={adminCompanyButtonRef} className="relative inline-block max-w-full">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-auto max-w-full gap-2 rounded-full pl-1.5 pr-3 text-left hover:border-[#0b0a0e]/25"
                    onClick={() => setAdminCompanyOpen((value) => !value)}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-[#0b0a0e] text-sm font-semibold text-white">{activeCompany.initials}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-semibold text-ink-900">{activeCompany.name}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`ui-chevron h-3.5 w-3.5 shrink-0 opacity-70 transition-transform ${adminCompanyOpen ? "rotate-180" : ""}`}
                    />
                  </Button>

                  {adminCompanyOpen ? (
                    <div ref={adminCompanyPanelRef} className="absolute left-0 top-[calc(100%+0.4rem)] z-[62] w-[280px] rounded-2xl border border-black/10 bg-[#ffffff] p-2 shadow-[0_10px_28px_rgba(15,25,48,0.12)]">
                      <div className="space-y-1">
                        {myCompanyOptions.length > 0 ? (
                          myCompanyOptions.map((company) => {
                            const isActive = String(company.companyId) === String(user?.profile?.companyId || "");
                            return (
                              <Button
                                key={company.companyId}
                                type="button"
                                variant="ghost"
                                className={`menu-hover-row h-auto w-full justify-start gap-2.5 px-2.5 py-2 text-left text-sm font-semibold ${
                                  isActive ? "bg-[#eef2f8] text-[#0b0a0e] hover:bg-[#eef2f8]" : "text-ink-700 hover:bg-black/5"
                                }`}
                                onClick={async () => {
                                  setAdminCompanyOpen(false);
                                  if (!isActive) {
                                    await onSwitchCompany?.(company.companyId);
                                  }
                                }}
                              >
                                <Avatar className="h-8 w-8 shrink-0">
                                  <AvatarFallback className="bg-[#0b0a0e] text-xs font-semibold text-white">{initialsForName(company.name)}</AvatarFallback>
                                </Avatar>
                                <span className="min-w-0 flex-1 truncate">{company.name}</span>
                              </Button>
                            );
                          })
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            className="menu-hover-row h-auto w-full justify-start bg-[#eef2f8] px-2.5 py-2 text-left text-sm font-semibold text-[#0b0a0e] hover:bg-[#eef2f8]"
                            onClick={() => setAdminCompanyOpen(false)}
                          >
                            {activeCompany.name}
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 gap-2 rounded-full pl-2 pr-4 text-left hover:border-[#0b0a0e]/25"
                  onClick={() => navigateTo("/")}
                >
                  <img src={companyLogo} alt="LOA" className="h-7 w-7 rounded-full object-contain ring-4 ring-[#eef2f8]" />
                  <span className="text-base font-semibold text-ink-900">LOA</span>
                </Button>
              )}
            </div>
            <div className="flex items-center justify-self-end gap-4">
              {isPanelContext ? (
                <Button
                  type="button"
                  className="h-11 gap-1.5 px-4 text-xs"
                  onClick={() => navigateTo(isAdminContext ? "/app/admin/annonser" : "/app/broker/objekt")}
                >
                  <span aria-hidden="true" className="text-sm leading-none">+</span>
                  <span>Publicera annons</span>
                </Button>
              ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 gap-1.5 px-4 text-xs"
                  onClick={() => {
                    navigateTo("/app/rent");
                    void onSwitchRole?.("broker");
                  }}
                >
                  <SwitchHorizontalIcon className="h-4 w-4" />
                  Växla till sökläge
                </Button>
              <div ref={notificationButtonRef} className="relative inline-flex h-11 items-center self-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Notiser"
                  className="relative h-full w-11 rounded-full text-ink-700"
                  onClick={() => setNotificationOpen((value) => !value)}
                >
                  <BellIcon className="h-4 w-4" />
                  {!notificationOpen && unreadNotificationItems.length > 0 ? (
                    <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full bg-[#0b0a0e] px-1 text-[10px] font-semibold text-white">
                      {unreadNotificationItems.length}
                    </Badge>
                  ) : null}
                </Button>
              </div>
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      aria-label="Profilmeny"
                      className="h-11 w-11 rounded-full p-0 text-sm font-semibold text-[#0b0a0e] hover:border-[#0b0a0e]/25"
                    />
                  }
                >
                  <Avatar className="h-full w-full">
                    <AvatarFallback className="bg-transparent text-sm font-semibold text-[#0b0a0e]">
                      {initialsForName(user?.name || user?.email || "Profil")}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-black/10 p-3 shadow-[0_10px_28px_rgba(15,25,48,0.10)]">
                  <ProfileMenuDropdown
                    setMenuOpen={setMenuOpen}
                    user={user}
                    onSwitchRole={onSwitchRole}
                    onLogout={onLogout}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
      ) : (
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

      {notificationOpen && !isGuest ? (
        <div ref={notificationPanelRef} className="fixed right-4 top-[72px] z-[60] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-black/10 bg-[#ffffff] p-3 shadow-[0_10px_28px_rgba(15,25,48,0.10)]">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-900">Notiser</p>
            <Badge variant="outline" className="h-auto rounded-full bg-[#f7f7f7] px-2 py-0.5 text-xs font-semibold text-ink-700">
              {notificationItems.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {notificationItems.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant="outline"
                className="notification-card-button h-auto block w-full px-3 py-2 text-left font-normal hover:border-[#0b0a0e]/25 hover:bg-[#f8fafc]"
                onClick={() => {
                  setNotificationOpen(false);
                  navigateTo(item.actionPath || (isAdminContext ? "/app/admin/notifikationer" : isBrokerPanelContext ? "/app/broker/profil" : "/app/profile"));
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-800">{item.title}</p>
                    {item.body ? <p className="mt-0.5 truncate text-xs leading-snug text-ink-600">{item.body}</p> : null}
                  </div>
                  <p className="shrink-0 whitespace-nowrap text-[11px] font-medium text-ink-500">{item.time}</p>
                </div>
              </Button>
            ))}
          </div>
          {isAdminContext ? (
            <Button
              type="button"
              variant="secondary"
              className="h-auto mt-3 w-full justify-center py-2 text-xs"
              onClick={() => {
                setNotificationOpen(false);
                navigateTo("/app/admin/notifikationer");
              }}
            >
              Visa alla notifikationer
            </Button>
          ) : null}
        </div>
      ) : null}

      <section ref={contentRef} className="min-h-0 flex-1 overflow-hidden">{children}</section>
      <AppFooter />

      <Button
        type="button"
        variant="outline"
        aria-label="Scrolla till toppen"
        onClick={handleScrollToTop}
        className={`h-auto fixed bottom-6 z-30 flex-col gap-0.5 rounded-full border-black/20 bg-[#ffffff]/25 p-3 text-[#0b0a0e] shadow-[0_8px_24px_rgba(15,25,48,0.18)] backdrop-blur-md transition-all duration-250 ${
          showScrollToTopButton
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        } ${isAdminStatisticsPage ? "right-6 xl:right-[max(1.5rem,calc((100vw-296px-1600px)/2+1.5rem))]" : "right-6"} hover:bg-[#ffffff]/35`}
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
            <AlertDialogCancel className="h-auto rounded-xl px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-[#ffffff]">
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
  );
}

export default AppShell;
