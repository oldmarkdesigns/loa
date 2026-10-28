import { useEffect, useMemo, useState } from "react";
import { cn } from "cn";
import { navigateTo, routeMatches } from "../../lib/router";
import { deriveNavbarRoleState } from "../../lib/navbarRoles";
import { LockIcon, MessageSquareIcon, UserIcon } from "../icons/UiIcons";
import MarketingNavLinks, { marketingPrimaryItems, marketingSectionItems } from "./MarketingNavLinks";
import ProfileMenuDropdown from "./ProfileMenuDropdown";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function MarketingHeader({
  pathname,
  user,
  isGuest = false,
  isNavScrolled = false,
  showStaticBorder = false,
  fadeWithScroll = false,
  overHero = false,
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
  // `overHero`: the bar is over a dark image, so its text and buttons are light. `fadeWithScroll`: its white background
  // follows --nav-progress (0 to 1), set on an element above it by the page, instead of switching on once the page has
  // scrolled. There is no transition then, since the scroll itself is the motion.
  const onHero = overHero;
  const { hasBrokerAccess } = deriveNavbarRoleState(user, { isGuest });
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const initials = useMemo(() => {
    const source = (user?.name || (isGuest ? "Gäst" : "AA")).trim();
    const words = source.split(" ").filter(Boolean);
    if (words.length === 1) return (words[0] || "AA").slice(0, 2).toUpperCase();
    return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase() || "AA";
  }, [isGuest, user?.name]);
  const activeHref = routeMatches(pathname, "/app/rent") ? marketingPrimaryItems[0].href : null;

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
        className={cn(
          "navbar-enter sticky top-0 z-40 shrink-0 px-4 py-3",
          fadeWithScroll
            ? "will-change-[background-color]"
            : cn(
                "will-change-[background-color,backdrop-filter] transition-[background-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                isNavScrolled || showStaticBorder ? "bg-page/95 backdrop-blur-md" : "bg-page/0 backdrop-blur-0"
              )
        )}
        style={
          fadeWithScroll
            ? { backgroundColor: "rgb(var(--page) / var(--nav-progress, 0))", backdropFilter: "blur(calc(var(--nav-progress, 0) * 10px))" }
            : undefined
        }
      >
        <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Button type="button" variant="ghost" className="h-auto justify-self-start p-0 text-left hover:bg-transparent" onClick={onBrandClick || (() => navigateTo("/"))}>
              <span className="inline-flex items-center gap-2 rounded-xl border border-veil/10 bg-surface px-2.5 py-1.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-veil/30 bg-surface text-[9px] font-semibold uppercase tracking-wide text-ink-500">
                  LOGGA
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink-800">LOA</span>
                </span>
              </span>
            </Button>
          </div>

          <nav className="hidden items-center justify-self-center gap-9 lg:flex">
            <MarketingNavLinks
              hrefPrefix="/"
              activeHref={activeHref}
              light={onHero}
              onPrimaryNavClick={onPrimaryNavClick}
              onSectionLinkClick={onSectionLinkClick}
              showPublish={false}
            />
          </nav>

          {!shouldShowGuestActions ? (
            <div className="flex items-center justify-self-end gap-4">
              {!hasBrokerAccess ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Meddelanden"
                  className="h-11 w-11 rounded-full text-ink-700"
                  onClick={onMessagesClick || (() => navigateTo("/app/messages"))}
                >
                  <MessageSquareIcon className="h-4 w-4" />
                </Button>
              ) : null}
              <div className="relative inline-flex h-11 items-center self-center">
                <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                  <DropdownMenuTrigger
                    render={
                      // The avatar is the whole button: no card around it, only the circle (`!` beats the platform's rounded
                      // square for buttons, so the focus ring is a circle too). Hovering or opening the menu dims it a little.
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-11 w-11 shrink-0 border-0 bg-transparent p-0 !rounded-full hover:bg-transparent hover:opacity-85 aria-expanded:bg-transparent aria-expanded:opacity-85"
                        aria-label="Öppna profilmeny"
                      />
                    }
                  >
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user?.profile?.avatarUrl} alt={user?.name || "Profil"} />
                      <AvatarFallback className="bg-control text-sm font-semibold text-ink-700">{initials}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={8} className="w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-veil/10 p-3 shadow-[0_10px_28px_rgba(15,25,48,0.10)]">
                    <ProfileMenuDropdown
                      setMenuOpen={setMenuOpen}
                      user={user}
                      onSwitchRole={onSwitchRole}
                      onLogout={onLogout}
                      onHelp={onHelp}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button
                type="button"
                variant="ghost"
                aria-label="Öppna meny"
                className={cn("h-11 hover:bg-transparent lg:hidden", onHero ? "text-white hover:text-white" : "text-strong")}
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
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-self-end gap-2">
              <Button
                type="button"
                className={cn("h-auto gap-2 rounded-full px-3 text-sm font-semibold sm:px-5", onHero && "bg-white text-[#0b0a0e] hover:bg-white/90")}
                onClick={() => onRequireAuth?.("signup", "renter")}
              >
                Skapa konto
                <UserIcon className="hidden h-3.5 w-3.5 sm:block" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                className={cn(
                  "h-auto gap-2 rounded-full px-3 text-sm font-semibold sm:px-5",
                  onHero ? "bg-white/15 text-white hover:bg-white/25" : "bg-veil/5 text-ink-800 hover:bg-veil/10"
                )}
                onClick={() => onRequireAuth?.("login", "renter")}
              >
                Logga in
                <LockIcon className="hidden h-3.5 w-3.5 sm:block" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-label="Öppna meny"
                className={cn("h-11 hover:bg-transparent lg:hidden", onHero ? "text-white hover:text-white" : "text-strong")}
                onClick={() => setMobileMenuOpen((value) => !value)}
              >
                <span className="inline-flex flex-col items-end gap-1.5">
                  <span className="block h-0.5 w-5 rounded-full bg-current" />
                  <span className="block h-0.5 w-4 rounded-full bg-current" />
                  <span className="block h-0.5 w-3 rounded-full bg-current" />
                </span>
              </Button>
            </div>
          )}
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[60] bg-transparent lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-4 top-[72px] w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-veil/10 bg-surface p-3" onClick={(event) => event.stopPropagation()}>
            <div className="space-y-1">
              {[...marketingPrimaryItems, ...marketingSectionItems].map((item) => (
                <Button
                  key={item.href || item.hash}
                  type="button"
                  variant="ghost"
                  className="menu-hover-row h-auto w-full justify-start rounded-xl px-3 py-2 text-left font-semibold text-ink-700 hover:bg-veil/5"
                  onClick={() => handleMobileNavItemClick(item)}
                >
                  {item.label}
                </Button>
              ))}
              {!shouldShowGuestActions ? (
                <>
                  <div className="my-1 h-px bg-veil/10" />
                  <Button
                    type="button"
                    variant="ghost"
                    className="menu-hover-row h-auto w-full justify-start rounded-xl px-3 py-2 text-left font-semibold text-ink-700 hover:bg-veil/5"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo("/app/publish");
                    }}
                  >
                    Publicera annons
                  </Button>
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
