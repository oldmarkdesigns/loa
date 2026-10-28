import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "cn";
import { hasShortcutModifier, isInsideDialog, isTypingTarget } from "../../lib/shortcuts";
import { useSidebarMode } from "../../lib/sidebarDisplay";
import { navigateTo, routeMatches } from "../../lib/router";
import { PanelLeftIcon, PlusIcon, SwitchModeIcon } from "../icons/UiIcons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { BrokerAssistantLauncher } from "../app/BrokerAssistant";
import { PanelCommandPalette, PanelSearchButton } from "./PanelCommandPalette";
import { PanelModeSwitch, switchToSearchMode, usePanelChrome } from "./PanelChrome";
import { PanelHint, PanelHintSettings } from "./PanelHint";
import { menuIcon, menuRow, menuRowIconOnly, menuRowInset } from "./menuScale";
import PanelProfileMenu from "./PanelProfileMenu";
import PanelSidebarControls from "./PanelSidebarControls";

// The first entry of the panel is its start page, which is only "here" on exactly that path.
const isActivePath = (pathname, path, rootPath) =>
  path === rootPath ? pathname === rootPath || pathname === `${rootPath}/` : routeMatches(pathname, path);

// The pages of the menu come in groups, each under a title of its own (`item.group`); items that name none make one group, "Arbetsyta".
const DEFAULT_GROUP = "Arbetsyta";
function groupNavItems(navItems) {
  const groups = [];
  for (const item of navItems) {
    const label = item.group ?? DEFAULT_GROUP;
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}

function PanelSidebarNav({ pathname, navItems, rootPath, onNavigate, badges, collapsed = false }) {
  const navRef = useRef(null);
  const hasAnimatedRef = useRef(false);
  const [indicator, setIndicator] = useState(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const activeEl = nav.querySelector('[data-active="true"]');
    if (!activeEl) {
      setIndicator((prev) => (prev ? { ...prev, visible: false } : prev));
      return;
    }
    setIndicator({
      top: activeEl.offsetTop,
      height: activeEl.offsetHeight,
      visible: true,
      animate: hasAnimatedRef.current,
    });
    hasAnimatedRef.current = true;
  }, [pathname, collapsed, navItems]);

  return (
    <nav ref={navRef} aria-label="Arbetsyta" className="relative">
      <span
        aria-hidden="true"
        className={`admin-nav-indicator ${indicator?.animate ? "is-animated" : ""}`}
        style={
          indicator?.visible
            ? { transform: `translateY(${indicator.top}px)`, height: `${indicator.height}px`, opacity: 1 }
            : { opacity: 0 }
        }
      />
      {groupNavItems(navItems).map((group, groupIndex) => (
        <div key={group.label} role="group" aria-label={group.label}>
          {collapsed ? (
            // The rail has no titles: a rule between the groups.
            <div aria-hidden="true" className={cn("mx-1 h-px bg-veil/10", groupIndex === 0 ? "mb-3 mt-2" : "my-3")} />
          ) : (
            <p aria-hidden="true" className={cn("mb-2 flex h-6 items-center px-[13px] text-[11.5px] font-medium uppercase tracking-[0.06em] text-ink-500", groupIndex === 0 ? "mt-3.5" : "mt-5")}>
              {group.label}
            </p>
          )}
          <div className="space-y-1.5">
            {group.items.map((item) => {
              const active = isActivePath(pathname, item.path, rootPath);
              const badgeValue = badges[item.key] > 0 ? badges[item.key] : null;
              const row = (
                <Button
                  key={item.key}
                  type="button"
                  variant="ghost"
                  data-active={active ? "true" : "false"}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={cn(
                    menuRow,
                    "admin-nav-row relative z-[1]",
                    collapsed ? menuRowIconOnly : menuRowInset,
                    active ? "text-on-strong hover:bg-transparent hover:text-on-strong" : "text-ink-700 hover:bg-veil/5 hover:text-strong"
                  )}
                  onClick={() => onNavigate(item.path)}
                >
                  <span className="relative inline-flex shrink-0">
                    <item.Icon aria-hidden="true" className={menuIcon} />
                    {collapsed && badgeValue ? (
                      <span aria-hidden="true" className="absolute -right-1 -top-1 size-2 rounded-full bg-[#e5484d] ring-2 ring-surface" />
                    ) : null}
                  </span>
                  {collapsed ? null : (
                    <>
                      <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                      {badgeValue ? (
                        <Badge className={cn("h-[22px] min-w-[22px] rounded-full px-1.5 py-0 text-xs font-semibold leading-none", active ? "bg-on-strong/20 text-on-strong" : "bg-veil/10 text-ink-700")}>
                          {badgeValue}
                        </Badge>
                      ) : null}
                    </>
                  )}
                </Button>
              );
              // The same button whether the menu is open or the rail; only the tooltip (the name of an icon) comes and goes, so a row under
              // the pointer is not rebuilt when the menu opens.
              return <PanelHint key={item.key} label={item.label} side="right" render={row} disabled={!collapsed} />;
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

/**
 * The side menu (in the floating card, and in the drawer below lg): the header with the company, the fold button and the choice of
 * how the menu is shown, the search, the pages of the panel, and at the foot the way over to searching for space and the person
 * with the profile menu. `collapsed` is how it looks (the narrow rail or not), and the fold button, `onToggleCollapsed`, folds what
 * is open and opens a rail; `mode` and `onModeChange` are the choice of display, which the fold button does not touch. `onClose` is
 * the drawer's way out (the drawer has no fold button). `onMenuOpenChange` hears when one of the menus that open from it does.
 * `companySettingsPath`, when there is one, is where the gear of a company in the company menu goes.
 */
export function PanelSidebar({
  pathname,
  navItems,
  bottomNavItems,
  onNavigate,
  onLogout,
  badges,
  collapsed = false,
  onToggleCollapsed,
  mode,
  onModeChange,
  onMenuOpenChange,
  companySettingsPath,
  onClose,
  onOpenSearch
}) {
  const rootPath = navItems[0]?.path;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-2.5 p-3">
        <PanelSidebarControls
          collapsed={collapsed}
          onToggleCollapsed={onToggleCollapsed}
          mode={mode}
          onModeChange={onModeChange}
          onMenuOpenChange={onMenuOpenChange}
          companySettingsPath={companySettingsPath}
          onNavigate={onNavigate}
          onClose={onClose}
        />
        <PanelSearchButton collapsed={collapsed} onOpen={onOpenSearch} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <PanelSidebarNav pathname={pathname} navItems={navItems} rootPath={rootPath} onNavigate={onNavigate} badges={badges} collapsed={collapsed} />
      </div>

      <div className="shrink-0 space-y-1.5 border-t border-veil/10 p-3">
        <PanelModeSwitch collapsed={collapsed} />
        <PanelProfileMenu collapsed={collapsed} pathname={pathname} items={bottomNavItems} onNavigate={onNavigate} onLogout={onLogout} onOpenChange={onMenuOpenChange} />
      </div>
    </div>
  );
}

// The side menu that opens when the pointer is on it waits a moment before it opens (a pointer sweeping across the rail on its way to
// somewhere else should not open it) and a moment before it folds again (one that slips off the edge and comes back should not make it
// flutter). The tooltips of the rail wait longer than the menu takes to open, so that an icon never shows its name just before the menu
// shows it in the row.
const HOVER_OPEN_DELAY = 110;
const HOVER_CLOSE_DELAY = 240;
const HOVER_TOOLTIP_DELAY = 700;

/**
 * The side menu's place in the layout, and the card that sits in it, for a `mode` of the display (see src/lib/sidebarDisplay.js).
 * Expanded, the place is as wide as the card, and collapsed, as narrow as the rail: the page moves over to make room, or takes it
 * back. As "hover" the place stays as narrow as the rail and only the card grows, over the page, while the pointer is on it, so
 * nothing on the page moves; the card folds again when the pointer leaves. All of it uses the width spring of the menu
 * (.admin-sidebar-panel).
 *
 * The card is fixed to the left, top and bottom of the panel, not a floating card with a margin: it fills the full height, flush
 * with the left edge, and a hairline on its right is what tells it apart from the page (no radius, no shadow, unlike the assistant
 * column, which stays a floating card).
 *
 * The fold button and ⌘B are the dock's `toggle`: it folds a card that looks open (whatever opened it) into "collapsed", and opens
 * one that looks like the rail into "expanded", by `onModeChange`. It never sets "hover": only the display menu does. (⌘B leaves the
 * letter to a field where text is typed, and does not reach over a dialog that is open.)
 *
 * The card stays open while one of its menus is (`onMenuOpenChange`), if it was open when the menu opened; touch does not open it
 * (there is no pointer to leave), and keyboard focus does not either: the rail works from the keyboard, with its names in tooltips.
 *
 * `children` is a function of `{ collapsed, toggle, onMenuOpenChange }`: whether the card looks like the rail, the fold action, and
 * what to tell the card about its menus.
 */
export function PanelSidebarDock({ className, mode, onModeChange, children }) {
  const cardRef = useRef(null);
  const timer = useRef(0);
  const [hovered, setHovered] = useState(false);
  const [held, setHeld] = useState(false);
  const pinned = mode === "expanded";
  const armed = mode === "hover";
  const expanded = pinned || (armed && (hovered || held));
  const expandedNow = useRef(expanded);
  expandedNow.current = expanded;

  // A menu that starts to open on hover starts from where the pointer is (one the pointer is on does not fold under it), and one
  // that stops being that lets go of what it held.
  useLayoutEffect(() => {
    window.clearTimeout(timer.current);
    setHovered(armed && Boolean(cardRef.current?.matches(":hover")));
    setHeld(false);
  }, [armed]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const lean = (open) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setHovered(open), open ? HOVER_OPEN_DELAY : HOVER_CLOSE_DELAY);
  };
  const onMenuOpenChange = useCallback((open) => setHeld(open && expandedNow.current), []);
  const toggle = useCallback(() => onModeChange(expandedNow.current ? "collapsed" : "expanded"), [onModeChange]);
  const hints = useMemo(() => ({ delay: armed ? HOVER_TOOLTIP_DELAY : undefined }), [armed]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.defaultPrevented || event.repeat || event.isComposing || !hasShortcutModifier(event) || event.key.toLowerCase() !== "b") return;
      if (isTypingTarget(event.target) || isInsideDialog(event.target)) return;
      event.preventDefault();
      toggle();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return (
    <div className={cn("admin-sidebar-slot relative h-full shrink-0", pinned ? "w-[272px]" : "w-[72px]", className)}>
      <aside
        ref={cardRef}
        aria-label="Sidomeny"
        data-display={mode}
        data-open={expanded ? "true" : "false"}
        className={cn(
          "admin-sidebar-panel absolute inset-y-0 left-0 z-30 overflow-hidden border-r border-veil/10 bg-surface",
          expanded ? "w-[272px]" : "w-[72px]"
        )}
        onPointerEnter={(event) => armed && event.pointerType !== "touch" && lean(true)}
        onPointerLeave={(event) => armed && event.pointerType !== "touch" && lean(false)}
      >
        <PanelHintSettings value={hints}>{children({ collapsed: !expanded, toggle, onMenuOpenChange })}</PanelHintSettings>
      </aside>
    </div>
  );
}

function AdminPanelShell({ pathname, navItems, bottomNavItems, sectionTitle, onLogout, badges = {}, fullBleedContent = false, hideAssistantLauncher = false, contentKey, children }) {
  const chrome = usePanelChrome();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { mode, setMode } = useSidebarMode();
  const rootPath = navItems[0]?.path;
  // The settings of a company are its profile, which only the company admin's panel has ("Adminprofil"): the gear of a company in
  // the company menu goes there.
  const companySettingsPath = bottomNavItems.find((item) => item.key === "adminprofil")?.path;

  // ⌘K opens the search (and closes it again), except over a dialog that is already open (an editor, a confirmation). ⌘B, which
  // folds the menu, is the dock's.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.defaultPrevented || event.repeat || event.isComposing || !hasShortcutModifier(event) || event.key.toLowerCase() !== "k") return;
      if (isInsideDialog(event.target) && !event.target.closest("[data-panel-palette]")) return;
      event.preventDefault();
      setPaletteOpen((open) => !open);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // What the search can reach: two quick actions, then every page of the panel and the account pages.
  const paletteItems = useMemo(
    () => [
      { id: "publish", group: "Snabbåtgärder", label: "Publicera annons", Icon: PlusIcon, keywords: "ny skapa lägg ut objekt lokal", onSelect: () => navigateTo("/app/publish") },
      ...(chrome
        ? [{ id: "search-mode", group: "Snabbåtgärder", label: "Växla till sökläge", Icon: SwitchModeIcon, keywords: "söka hyra lokaler sökning", onSelect: () => switchToSearchMode(chrome) }]
        : []),
      ...navItems.map((item) => ({
        id: `page-${item.key}`,
        group: "Sidor",
        label: item.label,
        Icon: item.Icon,
        hint: isActivePath(pathname, item.path, rootPath) ? "Här är du" : undefined,
        onSelect: () => navigateTo(item.path)
      })),
      ...bottomNavItems.map((item) => ({
        id: `account-${item.key}`,
        group: "Konto",
        label: item.label,
        Icon: item.Icon,
        hint: routeMatches(pathname, item.path) ? "Här är du" : undefined,
        onSelect: () => navigateTo(item.path)
      }))
    ],
    [chrome, navItems, bottomNavItems, pathname, rootPath]
  );

  return (
    <section className="admin-platform flex h-full min-h-0 bg-canvas">
      <PanelSidebarDock className="hidden lg:block" mode={mode} onModeChange={setMode}>
        {({ collapsed, toggle, onMenuOpenChange }) => (
          <PanelSidebar
            pathname={pathname}
            navItems={navItems}
            bottomNavItems={bottomNavItems}
            onNavigate={(nextPath) => navigateTo(nextPath)}
            onLogout={onLogout}
            badges={badges}
            collapsed={collapsed}
            onToggleCollapsed={toggle}
            mode={mode}
            onModeChange={setMode}
            onMenuOpenChange={onMenuOpenChange}
            companySettingsPath={companySettingsPath}
            onOpenSearch={() => setPaletteOpen(true)}
          />
        )}
      </PanelSidebarDock>

      <div
        data-admin-scroll-container="true"
        className={`flex min-h-0 min-w-0 flex-1 flex-col ${fullBleedContent ? "overflow-hidden" : "overflow-y-auto"}`}
      >
        {/* Below lg the side menu is a drawer, and this row holds the button that opens it. */}
        <div className="sticky top-0 z-10 shrink-0 bg-canvas lg:hidden">
          <div className="mx-auto flex w-full max-w-[1440px] items-center gap-3 px-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="h-auto gap-1.5 rounded-md border-veil/20 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-transparent"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <PanelLeftIcon className="h-4 w-4" />
              Meny
            </Button>
          </div>
        </div>

        {fullBleedContent ? (
          <div key={contentKey ?? pathname} className="admin-section-enter min-h-0 flex-1">{children}</div>
        ) : (
          <div key={contentKey ?? pathname} className="admin-section-enter--lift mx-auto w-full max-w-[1440px] p-4 pb-24">{children}</div>
        )}
      </div>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" showCloseButton={false} className="admin-workspace w-[min(88vw,304px)] max-w-none gap-0 bg-popover p-0">
          <SheetTitle className="sr-only">Arbetsyta</SheetTitle>
          <PanelSidebar
            pathname={pathname}
            navItems={navItems}
            bottomNavItems={bottomNavItems}
            onNavigate={(nextPath) => {
              setMobileSidebarOpen(false);
              navigateTo(nextPath);
            }}
            onLogout={onLogout}
            badges={badges}
            companySettingsPath={companySettingsPath}
            onClose={() => setMobileSidebarOpen(false)}
            onOpenSearch={() => {
              setMobileSidebarOpen(false);
              setPaletteOpen(true);
            }}
          />
        </SheetContent>
      </Sheet>

      <PanelCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} items={paletteItems} />
      <BrokerAssistantLauncher hidden={hideAssistantLauncher} />
    </section>
  );
}

export default AdminPanelShell;
