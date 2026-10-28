import { useCallback, useEffect, useState } from "react";

/**
 * How the workspace's side menu is shown, the choice of the dropdown next to its fold button:
 *
 *  - "expanded": the menu is open.
 *  - "collapsed": the menu is the narrow rail.
 *  - "hover": the menu is the narrow rail until the pointer is on it, and opens over the page while it is.
 *
 * Only the dropdown chooses "hover". The fold button (and ⌘B) only fold and expand the menu as it looks: a menu that is open
 * becomes "collapsed", and one that is a rail becomes "expanded", whatever it was set to before. The choice is kept in this
 * browser (like the theme, see src/lib/theme.jsx) so it is the same on every page of the panels and the next time the panels are
 * opened. It starts expanded.
 */

export const SIDEBAR_DISPLAY_KEY = "office_rental_sidebar_display";
export const SIDEBAR_MODES = ["expanded", "collapsed", "hover"];
// Told to every user of the hook in this window when one of them chooses (the side menu, and the settings page of the account window).
const CHANGE_EVENT = "office_rental_sidebar_display_change";

const DEFAULT_MODE = "expanded";

/** The stored mode, or "expanded" when nothing valid is stored. */
export function readSidebarMode(storage = globalThis.localStorage, key = SIDEBAR_DISPLAY_KEY) {
  try {
    const value = storage?.getItem(key);
    if (SIDEBAR_MODES.includes(value)) return value;
    // The first version of this kept `{ pinned, rest }`: pinned open, or how it rested when it was not.
    const earlier = JSON.parse(value ?? "null");
    if (earlier && typeof earlier.pinned === "boolean") return earlier.pinned ? "expanded" : earlier.rest === "hover" ? "hover" : "collapsed";
  } catch {
    // Nothing stored, something that is not JSON, or blocked site data: the default.
  }
  return DEFAULT_MODE;
}

function writeSidebarMode(mode, storage = globalThis.localStorage, key = SIDEBAR_DISPLAY_KEY) {
  try {
    storage?.setItem(key, mode);
  } catch {
    // Private windows and blocked site data: the choice then lasts until the page is closed.
  }
}

/** The mode of the side menu, and `setMode` to change it (the dropdown, the fold button through the dock, and the settings page). */
export function useSidebarMode() {
  const [mode, setModeState] = useState(() => readSidebarMode());
  // Every use of the hook shows the same mode: a choice made in one is heard by the others (also when nothing can be stored).
  useEffect(() => {
    const onChange = (event) => {
      if (SIDEBAR_MODES.includes(event.detail)) setModeState(event.detail);
    };
    const onStorage = (event) => {
      if (event.key === SIDEBAR_DISPLAY_KEY || event.key === null) setModeState(readSidebarMode());
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  const setMode = useCallback((next) => {
    if (!SIDEBAR_MODES.includes(next)) return;
    setModeState(next);
    writeSidebarMode(next);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  }, []);
  return { mode, setMode };
}
