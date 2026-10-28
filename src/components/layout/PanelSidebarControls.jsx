import { cn } from "cn";
import { shortcutLabel } from "../../lib/shortcuts";
import { XIcon } from "../icons/UiIcons";
import { PanelCompanySwitcher, usePanelChrome } from "./PanelChrome";
import PanelSidebarModeMenu from "./PanelSidebarModeMenu";
import { PanelToggleButton } from "./PanelToggleButton";
import { menuIcon, menuQuietButton, menuSquare } from "./menuScale";
import { Button } from "@/components/ui/button";

/**
 * The header of the side menu: the company selector, the button that folds the menu, and the chevron beside it that opens the
 * choice of how the menu is shown (expanded, collapsed, or expanded when the pointer is on it).
 *
 * - Open menu: one row. The company selector takes the room there is, then the fold button, which names itself in a tooltip
 *   together with its shortcut, ⌘B, and the chevron of the display menu. The chevron is only there (it keeps its place) while the
 *   pointer is on the fold button or it, or the keyboard is, or its menu is open; on a screen without a pointer it is always there.
 * - Rail (the menu at rest as the narrow column): the fold button first, above the company, whose mark is all there is of the
 *   selector. There is no room for the display menu there; it is in the open menu.
 * - Drawer (no fold button, and touch rather than hover): the row again, with a button that closes the drawer at its end.
 *
 * `collapsed` is how the menu looks: the fold button folds an open menu and opens a rail, and does nothing else. (`mode` is only
 * what the display menu shows as chosen.)
 */

function PanelCloseButton({ onClose }) {
  return (
    <Button type="button" variant="ghost" aria-label="Stäng meny" className={cn(menuQuietButton, menuSquare)} onClick={onClose}>
      <XIcon aria-hidden="true" className={menuIcon} />
    </Button>
  );
}

// The chevron of the display menu shows only with the fold button: `group/fold` is the wrapper of the two. It also stays while its
// menu is open, for the keyboard (`:focus-visible`, not any focus, so it does not stay after a click), and where there is no pointer.
const revealedWithTheFoldButton =
  "opacity-0 transition-opacity group-hover/fold:opacity-100 group-has-[:focus-visible]/fold:opacity-100 aria-expanded:opacity-100 [@media(hover:none)]:opacity-100";

export default function PanelSidebarControls({
  collapsed = false,
  onToggleCollapsed,
  mode = collapsed ? "collapsed" : "expanded",
  onModeChange,
  onMenuOpenChange,
  companySettingsPath,
  onNavigate,
  onClose
}) {
  const chrome = usePanelChrome();
  if (!chrome && !onToggleCollapsed && !onClose) return null;

  const rail = collapsed && Boolean(onToggleCollapsed);
  const toggle = onToggleCollapsed ? (
    <PanelToggleButton
      side="left"
      open={!rail}
      label={rail ? "Expandera meny" : "Fäll ihop meny"}
      shortcut={shortcutLabel("B")}
      tooltipSide={rail ? "right" : "bottom"}
      aria-keyshortcuts="Control+B Meta+B"
      className={cn(menuSquare, rail && "mx-auto")}
      onClick={onToggleCollapsed}
    />
  ) : onClose ? (
    <PanelCloseButton onClose={onClose} />
  ) : null;
  const switcher = chrome ? <PanelCompanySwitcher collapsed={rail} settingsPath={companySettingsPath} onNavigate={onNavigate} onOpenChange={onMenuOpenChange} /> : null;

  if (rail) {
    return (
      <div className="flex flex-col gap-2">
        {toggle}
        {switcher}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {switcher ?? <span className="flex-1" />}
      <div className="group/fold flex shrink-0 items-center">
        {toggle}
        {onToggleCollapsed && onModeChange ? (
          <PanelSidebarModeMenu mode={mode} onModeChange={onModeChange} onOpenChange={onMenuOpenChange} className={revealedWithTheFoldButton} />
        ) : null}
      </div>
    </div>
  );
}
