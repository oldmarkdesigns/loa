import { useEffect, useMemo, useState } from "react";
import { cn } from "cn";
import { navigateTo, routeMatches } from "../../lib/router";
import { deriveNavbarRoleState } from "../../lib/navbarRoles";
import loaLogo from "../../site/assets/loa-logo.png";
import ProfileMenuDropdown from "./ProfileMenuDropdown";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

  const appLinks = shouldShowGuestActions
    ? [
        { label: "Lediga lokaler", href: "/app/rent" },
        { label: "Hyresvärdar", href: "/hyresvardar" },
        { label: "Lokalprogram", href: "/#lokalprogram" }
      ]
    : [
        { label: "Sök lokaler", href: "/app/rent" },
        ...(hasBrokerAccess ? [] : [{ label: "Visningar", href: "/app/viewings" }]),
        { label: "Meddelanden", href: "/app/messages" }
      ];
  const isActive = (href) => !href.includes("#") && routeMatches(pathname, href.split("?")[0]);
  const go = (href) => (event) => {
    if (onPrimaryNavClick?.(event, { href }) === true) return;
    event.preventDefault();
    setMobileMenuOpen(false);
    navigateTo(href);
  };
  const linkTone = onHero ? "text-white/70 hover:text-white" : "text-ink-600 hover:text-strong";
  const activeTone = onHero ? "text-white" : "text-strong";

  return (
    <>
      <header
        className={cn(
          "navbar-enter sticky top-0 z-40 shrink-0 px-4 sm:px-6",
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
        <div className="grid h-16 w-full grid-cols-[auto_1fr_auto] items-center gap-4">
          <a
            href="/"
            aria-label="LOA, till startsidan"
            className="inline-flex items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
            onClick={(event) => {
              event.preventDefault();
              (onBrandClick || (() => navigateTo("/")))();
            }}
          >
            <img src={loaLogo} alt="LOA" width="120" height="71" className={cn("h-[22px] w-auto", onHero ? "brightness-0 invert" : "dark:brightness-0 dark:invert")} />
          </a>

          <nav aria-label="Huvudmeny" className="hidden items-center justify-self-center gap-1 lg:flex">
            {appLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                onClick={go(item.href)}
                className={cn(
                  "relative rounded-full px-3.5 py-2 text-[0.9375rem] font-normal tracking-[-0.01em] transition-colors duration-300",
                  isActive(item.href) ? activeTone : linkTone
                )}
              >
                {item.label}
                {isActive(item.href) ? (
                  <span aria-hidden="true" className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-current" />
                ) : null}
              </a>
            ))}
          </nav>

          {!shouldShowGuestActions ? (
            <div className="flex items-center justify-self-end gap-2">
              <div className="relative inline-flex h-10 items-center self-center">
                <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className="h-10 w-10 shrink-0 overflow-hidden !rounded-full p-0 transition-opacity hover:opacity-85 aria-expanded:opacity-85 !min-h-0"
                        aria-label="Öppna profilmeny"
                      />
                    }
                  >
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user?.profile?.avatarUrl} alt={user?.name || "Profil"} />
                      <AvatarFallback className="bg-control text-[0.8125rem] font-medium text-ink-700">{initials}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={10} className="w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-veil/10 p-2 shadow-[0_24px_48px_-20px_rgba(15,20,34,0.35)]">
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
              <Burger onHero={onHero} open={mobileMenuOpen} onClick={() => { setMenuOpen(false); setMobileMenuOpen((value) => !value); }} />
            </div>
          ) : (
            <div className="flex items-center justify-self-end gap-1">
              <button
                type="button"
                className={cn("hidden !min-h-0 rounded-full px-4 py-2 text-[0.9375rem] transition-colors sm:inline-flex", linkTone)}
                onClick={() => onRequireAuth?.("login", "renter")}
              >
                Logga in
              </button>
              <button
                type="button"
                className={cn(
                  "inline-flex h-10 !min-h-0 items-center !rounded-full px-5 text-[0.9375rem] font-medium transition-colors",
                  onHero ? "bg-white text-[#141a2b] hover:bg-white/90" : "bg-strong text-on-strong hover:bg-strong/90"
                )}
                onClick={() => onRequireAuth?.("signup", "renter")}
              >
                Skapa konto
              </button>
              <Burger onHero={onHero} open={mobileMenuOpen} onClick={() => setMobileMenuOpen((value) => !value)} />
            </div>
          )}
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[60] bg-transparent lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <nav
            aria-label="Meny"
            className="absolute right-4 top-[68px] grid w-[min(300px,calc(100vw-2rem))] gap-0.5 rounded-2xl border border-veil/10 bg-surface p-2 shadow-[0_24px_48px_-20px_rgba(15,20,34,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            {appLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={go(item.href)}
                className={cn("rounded-xl px-3 py-2.5 text-[0.9375rem] transition-colors hover:bg-veil/5", isActive(item.href) ? "text-strong" : "text-ink-600")}
              >
                {item.label}
              </a>
            ))}
            {shouldShowGuestActions ? (
              <>
                <div className="my-1 h-px bg-veil/10" />
                <button type="button" className="!min-h-0 rounded-xl px-3 py-2.5 text-left text-[0.9375rem] text-ink-600 hover:bg-veil/5" onClick={() => { setMobileMenuOpen(false); onRequireAuth?.("login", "renter"); }}>
                  Logga in
                </button>
              </>
            ) : null}
          </nav>
        </div>
      ) : null}
    </>
  );
}

function Burger({ onHero, open, onClick }) {
  return (
    <button
      type="button"
      aria-label={open ? "Stäng meny" : "Öppna meny"}
      aria-expanded={open}
      className={cn("grid h-10 w-10 !min-h-0 place-items-center !rounded-full lg:hidden", onHero ? "text-white" : "text-strong")}
      onClick={onClick}
    >
      <span className="grid gap-[5px]">
        <span className={cn("block h-[1.5px] w-[18px] bg-current transition-transform duration-300", open && "translate-y-[3.25px] rotate-45")} />
        <span className={cn("block h-[1.5px] w-[18px] bg-current transition-transform duration-300", open && "-translate-y-[3.25px] -rotate-45")} />
      </span>
    </button>
  );
}

export default MarketingHeader;
