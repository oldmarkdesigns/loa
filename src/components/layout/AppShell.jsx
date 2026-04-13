import { useEffect, useMemo, useRef, useState } from "react";
import { navigateTo, routeMatches } from "../../lib/router";
import { ArrowLeftIcon, ArrowUpIcon, BuildingIcon, HistoryIcon, MouseScrollIcon, UserIcon } from "../icons/UiIcons";
import AppFooter from "./AppFooter";
import MarketingNavLinks from "./MarketingNavLinks";
import companyLogo from "../../../Assets/Logo/68D028A1-E148-495B-BD8C-A9B789FFD8C3.PNG.png";

const publisherWorkspaceItems = [
  { label: "Publicera annons", path: "/app/publish" },
  { label: "Dina objekt", path: "/app/my-listings" },
  { label: "Intresse och visningar", path: "/app/leads" }
];

function AppShell({ pathname, user, onSwitchRole, onLogout, onRequireAuth, isGuest = false, children }) {
  const activeRole = user?.role === "publisher" ? "publisher" : "renter";
  const rawRoles = isGuest ? ["renter"] : (Array.isArray(user?.roles) ? user.roles : [activeRole]);
  const roleSet = new Set(rawRoles.filter((item) => item === "renter" || item === "publisher"));
  const hasPublisherAccess = roleSet.has("publisher");
  const isPublisherWorkspacePath = (
    routeMatches(pathname, "/app/publish")
    || routeMatches(pathname, "/app/my-listings")
    || routeMatches(pathname, "/app/leads")
  );
  const showPublisherWorkspaceNav = !isGuest && hasPublisherAccess && (activeRole === "publisher" || isPublisherWorkspacePath);
  const deferPublisherWorkspaceNavToProfile = routeMatches(pathname, "/app/profile");
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
  const shouldShowStaticNavBorder = routeMatches(pathname, "/app/rent");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [showScrollToTopButton, setShowScrollToTopButton] = useState(false);
  const [showLeaveSearchConfirm, setShowLeaveSearchConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const profileMenuPanelRef = useRef(null);
  const contentRef = useRef(null);

  const initials = useMemo(() => {
    const source = (user?.name || (isGuest ? "Gäst" : "AA")).trim();
    const words = source.split(" ").filter(Boolean);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
  }, [isGuest, user?.name]);

  useEffect(() => {
    function onPointerDown(event) {
      if (
        menuRef.current
        && !menuRef.current.contains(event.target)
        && profileMenuPanelRef.current
        && !profileMenuPanelRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
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
    <main className="flex h-screen flex-col overflow-hidden bg-white text-black">
      <header
        className={`navbar-enter sticky top-0 z-40 shrink-0 border-b px-4 py-3 will-change-[background-color,border-color,backdrop-filter] transition-[background-color,border-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6 ${
          isNavScrolled || shouldShowStaticNavBorder ? "border-black/10 bg-white/95 backdrop-blur-md" : "border-black/0 bg-white/0 backdrop-blur-0"
        }`}
      >
        <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <button type="button" className="justify-self-start text-left" onClick={() => navigateTo("/")}>
              <span className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-2.5 py-1.5">
                <img src={companyLogo} alt="Företagslogga" className="h-8 w-8 rounded-lg object-contain" />
                <span className="text-sm font-semibold text-ink-800">Företagsnamn</span>
              </span>
            </button>
          </div>

          <nav className="hidden items-center justify-self-center gap-7 lg:flex">
            <MarketingNavLinks
              hrefPrefix="/"
              onPrimaryNavClick={handlePrimaryNavClick}
              showPublish={false}
            />
          </nav>

          {!isGuest ? (
          <div className="flex items-center justify-self-end gap-4">
            <button
              type="button"
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[#0f1930] px-3 text-xs font-semibold text-[#0f1930] transition hover:bg-[#0f1930] hover:text-white"
              onClick={() => navigateTo("/app/publish")}
            >
              <span aria-hidden="true" className="text-sm leading-none">+</span>
              <span>Publicera annons</span>
            </button>
            <div ref={menuRef} className="relative inline-flex h-11 items-center self-center">
              <button
                type="button"
                className="inline-flex h-full w-11 items-center justify-center overflow-hidden rounded-full border border-black/20 bg-white text-sm font-semibold text-ink-700"
                onClick={() => setMenuOpen((value) => !value)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                {user?.profile?.avatarUrl ? (
                  <img
                    src={user.profile.avatarUrl}
                    alt={user?.name || "Profil"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </button>

            </div>
            <button
              type="button"
              aria-label="Öppna meny"
              className="inline-flex h-11 items-center justify-center text-[#0f1930] lg:hidden"
              onClick={() => {
                setMenuOpen(false);
                setMobileMenuOpen((value) => !value);
              }}
            >
              <span className="inline-flex flex-col items-end gap-1.5">
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-4 rounded-full bg-current" />
                <span className="block h-0.5 w-3 rounded-full bg-current" />
              </span>
            </button>
          </div>
          ) : (
            <div className="flex items-center justify-self-end gap-4">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-[#0f1930] bg-[#0f1930] px-4 py-2 text-xs font-semibold text-white hover:bg-[#16233f]"
                onClick={() => onRequireAuth?.("signup", "renter")}
              >
                Skapa konto
              </button>
              <button
                type="button"
                className="inline-flex items-center bg-transparent px-1 py-2 text-xs font-semibold text-ink-700"
                onClick={() => onRequireAuth?.("login")}
              >
                Logga in
              </button>
              <button
                type="button"
                aria-label="Öppna meny"
                className="inline-flex h-11 items-center justify-center text-[#0f1930] lg:hidden"
                onClick={() => setMobileMenuOpen((value) => !value)}
              >
                <span className="inline-flex flex-col items-end gap-1.5">
                  <span className="block h-0.5 w-5 rounded-full bg-current" />
                  <span className="block h-0.5 w-4 rounded-full bg-current" />
                  <span className="block h-0.5 w-3 rounded-full bg-current" />
                </span>
              </button>
            </div>
          )}
        </div>

      </header>

      {menuOpen ? (
        <>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setMenuOpen(false)} />
          <div ref={profileMenuPanelRef} className="fixed right-4 top-[72px] z-[60] w-[min(320px,calc(100vw-2rem))] rounded-2xl bg-white p-3">
            <div className="space-y-1 text-sm">
              {isGuest ? (
                <>
                  <button
                    type="button"
                    className="menu-hover-row inline-flex w-full items-center rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
                    onClick={() => onRequireAuth?.("login")}
                  >
                    Logga in
                  </button>
                  <button
                    type="button"
                    className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
                    onClick={() => onRequireAuth?.("signup", "renter")}
                  >
                    <BuildingIcon className="h-4 w-4" />
                    Skapa konto
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5" onClick={() => navigateTo("/app/profile")}>
                    <UserIcon className="h-4 w-4" />
                    <span>Profil</span>
                  </button>
                  {roleSet.has("publisher") ? (
                    <button type="button" className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5" onClick={() => navigateTo("/app/my-listings")}>
                      <BuildingIcon className="h-4 w-4" />
                      <span>Dina objekt</span>
                    </button>
                  ) : null}
                  <div className="my-1 h-px bg-black/10" />
                  <button
                    type="button"
                    className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
                    onClick={async () => {
                      setMenuOpen(false);
                      await onLogout();
                      navigateTo("/", { replace: true });
                    }}
                  >
                    <HistoryIcon className="h-4 w-4" />
                    <span>Logga ut</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      ) : null}

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/20 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-4 top-[72px] w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-black/10 bg-white p-3" onClick={(event) => event.stopPropagation()}>
            <div className="space-y-1">
              <button type="button" className="menu-hover-row inline-flex w-full items-center rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5" onClick={() => { setMobileMenuOpen(false); navigateTo("/app/rent?view=available"); }}>
                Lediga lokaler
              </button>
              {!isGuest ? (
                <>
                  <button
                    type="button"
                    className="menu-hover-row inline-flex w-full items-center rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
                    onClick={() => { setMobileMenuOpen(false); navigateTo("/app/publish"); }}
                  >
                    Publicera annons
                  </button>
                  <div className="my-1 h-px bg-black/10" />
                </>
              ) : null}
              <button type="button" className="menu-hover-row inline-flex w-full items-center rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5" onClick={() => { setMobileMenuOpen(false); navigateTo("/#funktioner"); }}>
                Funktioner
              </button>
              <button type="button" className="menu-hover-row inline-flex w-full items-center rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5" onClick={() => { setMobileMenuOpen(false); navigateTo("/#sa-fungerar-det"); }}>
                Så fungerar det
              </button>
              <button type="button" className="menu-hover-row inline-flex w-full items-center rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5" onClick={() => { setMobileMenuOpen(false); navigateTo("/#priser"); }}>
                Priser
              </button>
              <button type="button" className="menu-hover-row inline-flex w-full items-center rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5" onClick={() => { setMobileMenuOpen(false); navigateTo("/#faq"); }}>
                FAQ
              </button>
              <button type="button" className="menu-hover-row inline-flex w-full items-center rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5" onClick={() => { setMobileMenuOpen(false); navigateTo("/#kontakt"); }}>
                Kontakt
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPublisherWorkspaceNav && !deferPublisherWorkspaceNavToProfile ? (
        <>
          {hasProfileSource ? (
            <div className="shrink-0 border-b border-black/10 bg-white px-4 py-2 sm:px-6">
              <div className="mx-auto flex w-full max-w-[1240px] items-center justify-start">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold text-ink-800 hover:bg-[#f8fafc]"
                  onClick={() => navigateTo("/app/profile")}
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5" />
                  Tillbaka till profil
                </button>
              </div>
            </div>
          ) : null}
          <div className="shrink-0 border-b border-black/10 bg-white px-4 py-2 sm:px-6">
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
        className={`fixed bottom-6 right-6 z-30 inline-flex min-h-0 flex-col items-center justify-center gap-0.5 rounded-full border border-black/20 bg-white/25 p-3 text-[#0f1930] shadow-[0_8px_24px_rgba(15,25,48,0.18)] backdrop-blur-md transition-all duration-250 ${
          showScrollToTopButton
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        } hover:bg-white/35`}
      >
        <ArrowUpIcon className="h-4 w-4" />
        <MouseScrollIcon className="h-4 w-4" />
      </button>

      {showLeaveSearchConfirm ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowLeaveSearchConfirm(false)}
        >
          <article
            className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-5 shadow-[0_24px_64px_rgba(15,25,48,0.28)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-ink-900">Byt till Lediga lokaler?</h3>
            <p className="mt-2 text-sm text-ink-700">
              Din nuvarande sökning försvinner om du går vidare till Lediga lokaler-flödet.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-white"
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
