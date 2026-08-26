import { useEffect, useMemo, useRef, useState } from "react";
import { navigateTo, routeMatches } from "../../lib/router";
import { deriveNavbarRoleState } from "../../lib/navbarRoles";
import { BuildingIcon, LockIcon, MessageSquareIcon, UserIcon } from "../icons/UiIcons";
import MarketingNavLinks, { marketingPrimaryItems, marketingSectionItems } from "./MarketingNavLinks";
import ProfileMenuDropdown from "./ProfileMenuDropdown";

function MarketingHeader({
  pathname,
  user,
  isGuest = false,
  isNavScrolled = false,
  showStaticBorder = false,
  onBrandClick,
  onPrimaryNavClick,
  onSectionLinkClick,
  onSwitchRole,
  onLogout,
  onRequireAuth,
  onHelp,
  onMessagesClick
}) {
  const shouldShowGuestActions = isGuest || !user?.id;
  const { activeRole, hasCompanyAdminRole, hasBrokerAccess } = deriveNavbarRoleState(user, { isGuest });
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const profileMenuPanelRef = useRef(null);
  const initials = useMemo(() => {
    const source = (user?.name || (isGuest ? "Gäst" : "AA")).trim();
    const words = source.split(" ").filter(Boolean);
    if (words.length === 1) return (words[0] || "AA").slice(0, 2).toUpperCase();
    return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase() || "AA";
  }, [isGuest, user?.name]);
  const activeHref = routeMatches(pathname, "/app/rent") ? marketingPrimaryItems[0].href : null;

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
    if (!mobileMenuOpen) return undefined;
    function onEscape(event) {
      if (event.key === "Escape") setMobileMenuOpen(false);
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [mobileMenuOpen]);

  function handleMobileNavItemClick(item) {
    setMobileMenuOpen(false);
    if (item.href) {
      navigateTo(item.href);
      return;
    }
    if (pathname === "/") {
      onSectionLinkClick?.({ preventDefault() {} }, item.hash);
      return;
    }
    navigateTo(`/${item.hash}`);
  }

  return (
    <>
      <header
        className={`navbar-enter sticky top-0 z-40 shrink-0 px-4 py-3 will-change-[background-color,backdrop-filter] transition-[background-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isNavScrolled || showStaticBorder ? "bg-[#ffffff]/95 backdrop-blur-md" : "bg-[#ffffff]/0 backdrop-blur-0"
        }`}
      >
        <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <button type="button" className="justify-self-start text-left" onClick={onBrandClick || (() => navigateTo("/"))}>
              <span className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-[#ffffff] px-2.5 py-1.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-black/30 bg-[#ffffff] text-[9px] font-semibold uppercase tracking-wide text-ink-500">
                  LOGGA
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink-800">LOA</span>
                </span>
              </span>
            </button>
          </div>

          <nav className="hidden items-center justify-self-center gap-9 lg:flex">
            <MarketingNavLinks
              hrefPrefix="/"
              activeHref={activeHref}
              onPrimaryNavClick={onPrimaryNavClick}
              onSectionLinkClick={onSectionLinkClick}
              showPublish={false}
            />
          </nav>

          {!shouldShowGuestActions ? (
            <div className="flex items-center justify-self-end gap-4">
              {hasCompanyAdminRole ? (
                <button
                  type="button"
                  className="btn-secondary inline-flex h-11 items-center px-4 text-xs"
                  onClick={async () => {
                    await onSwitchRole?.("company_admin");
                    navigateTo("/app/admin");
                  }}
                >
                  Växla till adminläge
                </button>
              ) : null}
              {!hasCompanyAdminRole && hasBrokerAccess ? (
                <button
                  type="button"
                  className="btn-secondary inline-flex h-11 items-center px-4 text-xs"
                  onClick={async () => {
                    if (activeRole === "renter") {
                      await onSwitchRole?.("broker");
                    }
                    navigateTo("/app/broker");
                  }}
                >
                  Växla till adminläge
                </button>
              ) : null}
              {!hasBrokerAccess ? (
                <button
                  type="button"
                  aria-label="Meddelanden"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/20 bg-[#ffffff] text-ink-700"
                  onClick={onMessagesClick || (() => navigateTo("/app/messages"))}
                >
                  <MessageSquareIcon className="h-4 w-4" />
                </button>
              ) : null}
              {!hasCompanyAdminRole ? (
                <div ref={menuRef} className="relative inline-flex h-11 items-center self-center">
                  <button
                    type="button"
                    className="inline-flex h-full w-11 items-center justify-center overflow-hidden rounded-full border border-black/20 bg-[#ffffff] text-sm font-semibold text-ink-700"
                    onClick={() => setMenuOpen((value) => !value)}
                    aria-label="Öppna profilmeny"
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    title="Profil"
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
              ) : null}
              <button
                type="button"
                aria-label="Öppna meny"
                className="inline-flex h-11 items-center justify-center text-[#0b0a0e] lg:hidden"
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
            <div className="flex items-center justify-self-end gap-2">
              <button
                type="button"
                className="inline-flex h-6 items-center gap-2 rounded-full bg-[#0b0a0e] px-5 text-sm font-semibold text-white transition"
                onClick={() => onRequireAuth?.("signup", "renter")}
              >
                Skapa konto
                <UserIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="inline-flex h-6 items-center gap-2 rounded-full bg-black/5 px-5 text-sm font-semibold text-ink-800 transition hover:bg-black/10"
                onClick={() => onRequireAuth?.("login", "renter")}
              >
                Logga in
                <LockIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Öppna meny"
                className="inline-flex h-11 items-center justify-center text-[#0b0a0e] lg:hidden"
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
        <ProfileMenuDropdown
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          profileMenuPanelRef={profileMenuPanelRef}
          user={user}
          onSwitchRole={onSwitchRole}
          onLogout={onLogout}
          onHelp={onHelp}
        />
      ) : null}

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[60] bg-transparent lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-4 top-[72px] w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-black/10 bg-[#ffffff] p-3" onClick={(event) => event.stopPropagation()}>
            <div className="space-y-1">
              {[...marketingPrimaryItems, ...marketingSectionItems].map((item) => (
                <button
                  key={item.href || item.hash}
                  type="button"
                  className="menu-hover-row inline-flex w-full items-center rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
                  onClick={() => handleMobileNavItemClick(item)}
                >
                  {item.label}
                </button>
              ))}
              {!shouldShowGuestActions ? (
                <>
                  <div className="my-1 h-px bg-black/10" />
                  <button
                    type="button"
                    className="menu-hover-row inline-flex w-full items-center rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo("/app/publish");
                    }}
                  >
                    Publicera annons
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default MarketingHeader;
