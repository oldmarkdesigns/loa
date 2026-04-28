import { useEffect, useMemo, useRef, useState } from "react";
import { navigateTo, routeMatches } from "../../lib/router";
import { deriveNavbarRoleState } from "../../lib/navbarRoles";
import { ArrowLeftIcon, ArrowUpIcon, BellIcon, MouseScrollIcon, SwitchHorizontalIcon } from "../icons/UiIcons";
import AppFooter from "./AppFooter";
import MarketingHeader from "./MarketingHeader";
import ProfileMenuDropdown from "./ProfileMenuDropdown";

const publisherWorkspaceItems = [
  { label: "Publicera annons", path: "/app/publish" },
  { label: "Dina objekt", path: "/app/my-listings" },
  { label: "Intresse och visningar", path: "/app/leads" }
];
const adminCompanies = [
  { id: "nordic-estate", name: "Nordic Estate", initials: "NE" },
  { id: "stockholm-kontor", name: "Stockholm Kontor AB", initials: "SK" },
  { id: "vasa-property", name: "Vasa Property Group", initials: "VP" }
];

function AppShell({ pathname, user, onSwitchRole, onLogout, onRequireAuth, isGuest = false, children }) {
  const isAdminContext = routeMatches(pathname, "/app/admin");
  const { activeRole, hasCompanyAdminRole, hasBrokerAccess: hasPublisherAccess } = deriveNavbarRoleState(user, { isGuest });
  const isPublisherWorkspacePath = (
    routeMatches(pathname, "/app/publish")
    || routeMatches(pathname, "/app/my-listings")
    || routeMatches(pathname, "/app/leads")
  );
  const deferPublisherWorkspaceNavToProfile = routeMatches(pathname, "/app/profile");
  const showPublisherWorkspaceNav = !isGuest && hasPublisherAccess && !isAdminContext && (isPublisherWorkspacePath || deferPublisherWorkspaceNavToProfile);
  const currentSearch = typeof window !== "undefined" ? window.location.search : "";
  const hasProfileSource = isPublisherWorkspacePath && new URLSearchParams(currentSearch).get("from") === "profile";

  function withProfileSource(path) {
    if (!hasProfileSource) return path;
    const [basePath, rawQuery = ""] = path.split("?");
    const params = new URLSearchParams(rawQuery);
    params.set("from", "profile");
    const nextQuery = params.toString();
    return nextQuery ? `${basePath}?${nextQuery}` : basePath;
  }
  const shouldShowStaticNavBorder = routeMatches(pathname, "/app/rent")
    || routeMatches(pathname, "/app/messages")
    || (routeMatches(pathname, "/app/settings") && activeRole !== "company_admin");
  const isAdminStatisticsPage = routeMatches(pathname, "/app/admin/statistik");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [showScrollToTopButton, setShowScrollToTopButton] = useState(false);
  const [showLeaveSearchConfirm, setShowLeaveSearchConfirm] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [adminCompanyOpen, setAdminCompanyOpen] = useState(false);
  const [activeAdminCompanyId, setActiveAdminCompanyId] = useState(adminCompanies[0].id);
  const profileMenuPanelRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const notificationPanelRef = useRef(null);
  const adminCompanyButtonRef = useRef(null);
  const adminCompanyPanelRef = useRef(null);
  const contentRef = useRef(null);

  const companyName = useMemo(
    () => String(user?.profile?.legalEntity || user?.profile?.companyName || "Företagsnamn"),
    [user?.profile?.companyName, user?.profile?.legalEntity]
  );
  const notificationItems = useMemo(
    () => [
      { id: "n1", title: "Ny förfrågan på Kontorslokal Södermalm", time: "12 min sedan" },
      { id: "n2", title: "Showroom Vasastan publicerad", time: "58 min sedan" },
      { id: "n3", title: "Anna Lind svarade på 6 förfrågningar", time: "3h sedan" }
    ],
    []
  );
  const activeAdminCompany = useMemo(
    () => adminCompanies.find((item) => item.id === activeAdminCompanyId) || adminCompanies[0],
    [activeAdminCompanyId]
  );

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
    <main className="flex h-screen flex-col overflow-hidden bg-[#fffffe] text-black">
      {isAdminContext ? (
        <header
          className={`navbar-enter sticky top-0 z-40 shrink-0 border-b px-4 py-3 will-change-[background-color,border-color,backdrop-filter] transition-[background-color,border-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6 ${
            isNavScrolled || shouldShowStaticNavBorder ? "border-black/10 bg-[#fffffe]/95 backdrop-blur-md" : "border-black/10 bg-[#fffffe]/0 backdrop-blur-0"
          }`}
        >
          <div className="grid w-full grid-cols-[1fr_auto] items-center gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div ref={adminCompanyButtonRef} className="relative inline-block max-w-full">
                <button
                  type="button"
                  className="inline-flex h-11 w-auto max-w-full items-center gap-2 rounded-full border border-black/10 bg-[#fffffe] pl-1.5 pr-3 text-left transition hover:border-[#0f1930]/25"
                  onClick={() => setAdminCompanyOpen((value) => !value)}
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0f1930] text-sm font-semibold text-white">
                    {activeAdminCompany.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-semibold text-ink-900">{activeAdminCompany.name}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`ui-chevron h-3.5 w-3.5 shrink-0 opacity-70 transition-transform ${adminCompanyOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {adminCompanyOpen ? (
                  <div ref={adminCompanyPanelRef} className="absolute left-0 top-[calc(100%+0.4rem)] z-[62] w-[280px] rounded-2xl border border-black/10 bg-[#fffffe] p-2 shadow-[0_10px_28px_rgba(15,25,48,0.12)]">
                    <div className="space-y-1">
                      {adminCompanies.map((company) => {
                        const selected = company.id === activeAdminCompanyId;
                        return (
                          <button
                            key={company.id}
                            type="button"
                            className={`menu-hover-row w-full px-2.5 py-2 text-left text-sm transition ${
                              selected ? "bg-[#eef2f8] font-semibold text-[#0f1930]" : "text-ink-700 hover:bg-black/5"
                            }`}
                            onClick={() => {
                              setActiveAdminCompanyId(company.id);
                              setAdminCompanyOpen(false);
                            }}
                          >
                            {company.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-center justify-self-end gap-4">
                <button
                  type="button"
                  className="btn-primary inline-flex h-11 items-center gap-1.5 px-4 text-xs"
                  onClick={() => navigateTo("/app/admin/annonser")}
                >
                  <span aria-hidden="true" className="text-sm leading-none">+</span>
                  <span>Publicera annons</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary inline-flex h-11 items-center gap-1.5 px-4 text-xs"
                  onClick={() => {
                    navigateTo("/app/rent");
                    void onSwitchRole?.("broker");
                  }}
                >
                  <SwitchHorizontalIcon className="h-4 w-4" />
                  Växla till sökläge
                </button>
              <div ref={notificationButtonRef} className="relative inline-flex h-11 items-center self-center">
                <button
                  type="button"
                  aria-label="Notiser"
                  className="relative inline-flex h-full w-11 items-center justify-center rounded-full border border-black/20 bg-[#fffffe] text-ink-700"
                  onClick={() => setNotificationOpen((value) => !value)}
                >
                  <BellIcon className="h-4 w-4" />
                  <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0f1930] px-1 text-[10px] font-semibold text-white">
                    {notificationItems.length}
                  </span>
                </button>
              </div>
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
          companyName={companyName}
          onBrandClick={() => navigateTo("/")}
          onPrimaryNavClick={handlePrimaryNavClick}
          onSwitchRole={onSwitchRole}
          onLogout={onLogout}
          onRequireAuth={onRequireAuth}
        />
      )}

      {menuOpen && isAdminContext ? (
        <ProfileMenuDropdown
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          profileMenuPanelRef={profileMenuPanelRef}
          user={user}
          onSwitchRole={onSwitchRole}
          onLogout={onLogout}
        />
      ) : null}

      {notificationOpen && !isGuest ? (
        <div ref={notificationPanelRef} className="fixed right-4 top-[72px] z-[60] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-black/10 bg-[#fffffe] p-3 shadow-[0_10px_28px_rgba(15,25,48,0.10)]">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-900">Notiser</p>
            <span className="rounded-full border border-black/10 bg-[#f7f7f7] px-2 py-0.5 text-xs font-semibold text-ink-700">
              {notificationItems.length}
            </span>
          </div>
          <div className="space-y-2">
            {notificationItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-black/10 bg-[#fffffe] px-3 py-2">
                <p className="text-sm font-semibold text-ink-800">{item.title}</p>
                <p className="mt-1 text-xs text-ink-500">{item.time}</p>
              </div>
            ))}
          </div>
          {isAdminContext ? (
            <button
              type="button"
              className="btn-secondary mt-3 w-full min-h-0 justify-center py-2 text-xs"
              onClick={() => {
                setNotificationOpen(false);
                navigateTo("/app/admin/notifikationer");
              }}
            >
              Visa alla notifikationer
            </button>
          ) : null}
        </div>
      ) : null}

      {showPublisherWorkspaceNav && !deferPublisherWorkspaceNavToProfile ? (
        <>
          {hasProfileSource ? (
            <div className="shrink-0 border-b border-black/10 bg-[#fffffe] px-4 py-2 sm:px-6">
              <div className="mx-auto flex w-full max-w-[1240px] items-center justify-start">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-[#fffffe] px-3 py-2 text-xs font-semibold text-ink-800 hover:bg-[#f8fafc]"
                  onClick={() => navigateTo("/app/profile")}
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5" />
                  Tillbaka till profil
                </button>
              </div>
            </div>
          ) : null}
          <div className="shrink-0 border-b border-black/10 bg-[#fffffe] px-4 py-2 sm:px-6">
            <nav className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-start gap-5">
              {publisherWorkspaceItems.map((item) => {
                const active = routeMatches(pathname, item.path);
                return (
                  <button
                    key={item.path}
                    type="button"
                    className={`tab-underline-button border-b-2 pb-0.5 text-sm font-semibold transition ${
                      active
                        ? "border-[#0f1930] text-[#0f1930]"
                        : "border-transparent text-[#0f1930]/85 hover:text-[#0f1930]"
                    }`}
                    onClick={() => navigateTo(withProfileSource(item.path))}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </>
      ) : null}

      <section ref={contentRef} className="min-h-0 flex-1 overflow-hidden">{children}</section>
      <AppFooter />

      <button
        type="button"
        aria-label="Scrolla till toppen"
        onClick={handleScrollToTop}
        className={`fixed bottom-6 z-30 inline-flex min-h-0 flex-col items-center justify-center gap-0.5 rounded-full border border-black/20 bg-[#fffffe]/25 p-3 text-[#0f1930] shadow-[0_8px_24px_rgba(15,25,48,0.18)] backdrop-blur-md transition-all duration-250 ${
          showScrollToTopButton
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        } ${isAdminStatisticsPage ? "right-6 xl:right-[max(1.5rem,calc((100vw-296px-1600px)/2+1.5rem))]" : "right-6"} hover:bg-[#fffffe]/35`}
      >
        <ArrowUpIcon className="h-4 w-4" />
        <MouseScrollIcon className="h-4 w-4" />
      </button>

      {showLeaveSearchConfirm ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-transparent p-4"
          onClick={() => setShowLeaveSearchConfirm(false)}
        >
          <article
            className="w-full max-w-lg rounded-2xl border border-black/10 bg-[#fffffe] p-5 shadow-[0_24px_64px_rgba(15,25,48,0.28)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-ink-900">Byt till Lediga lokaler?</h3>
            <p className="mt-2 text-sm text-ink-700">
              Din nuvarande sökning försvinner om du går vidare till Lediga lokaler-flödet.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-black/10 bg-[#fffffe] px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-[#fffffe]"
                onClick={() => setShowLeaveSearchConfirm(false)}
              >
                Avbryt
              </button>
              <button
                type="button"
                className="rounded-xl border border-[#0f1930] bg-[#0f1930] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16233f]"
                onClick={() => {
                  setShowLeaveSearchConfirm(false);
                  navigateTo("/app/rent?view=available");
                }}
              >
                Fortsätt
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </main>
  );
}

export default AppShell;
