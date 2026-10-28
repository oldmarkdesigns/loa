import { createContext, useCallback, useContext, useEffect, useInsertionEffect, useMemo, useState } from "react";

/**
 * The theme of the app (light, dark or the system's), in the way shadcn/ui does themes: the `dark` class on <html> swaps the CSS
 * variables defined in src/index.css and tailwind.palettes.js, and every component reads its colours from those variables.
 * Popups (menus, selects, dialogs) are rendered under <body>, outside the page, which is why the class is on <html> and not on
 * the page: it is set while the app shell is open (`enabled`: the workspace panels and search mode, the same look in both) and
 * taken off again when the person leaves for the landing and sign-in pages, which stay light.
 *
 * The choice is kept in this browser (like the layout of the overview). Light is the default: dark is something to switch on.
 */

export const THEME_STORAGE_KEY = "office_rental_admin_theme";
export const THEMES = ["light", "dark", "system"];

const query = () => (typeof window !== "undefined" ? window.matchMedia?.("(prefers-color-scheme: dark)") : undefined);

export function readTheme(storage = globalThis.localStorage, key = THEME_STORAGE_KEY) {
  try {
    const value = storage?.getItem(key);
    return THEMES.includes(value) ? value : "light";
  } catch {
    return "light";
  }
}

function writeTheme(theme, storage = globalThis.localStorage, key = THEME_STORAGE_KEY) {
  try {
    storage?.setItem(key, theme);
  } catch {
    // Private windows and blocked site data: the choice then lasts until the page is closed.
  }
}

/** "light" or "dark" for a choice that may be "system". */
export const resolveTheme = (theme, systemDark) => (theme === "system" ? (systemDark ? "dark" : "light") : theme);

/**
 * Runs a change of the theme with the transitions of the page switched off for that moment, so that everything changes at once
 * (otherwise the buttons, which ease their colours, would fade while the cards switch, and a panel opened in dark mode would
 * start out light and fade to dark).
 */
export function withoutTransitions(change) {
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(style);
  change();
  void window.getComputedStyle(document.body).opacity; // the change is styled while the transitions are off
  window.setTimeout(() => style.remove(), 1);
}

/** Puts a theme on <html> (the class swaps the CSS variables) or takes it off. */
export function setRootTheme(resolved) {
  const root = document.documentElement;
  const dark = resolved === "dark";
  if (root.classList.contains("dark") === dark && (resolved ? root.dataset.theme === resolved : !root.dataset.theme)) return;
  withoutTransitions(() => {
    root.classList.toggle("dark", dark);
    if (resolved) root.dataset.theme = resolved;
    else delete root.dataset.theme;
  });
}

/** Takes off what the script in index.html painted the page with before the app started (the class of the provider replaces it). */
export function clearBootTheme() {
  const root = document.documentElement;
  if (!root.hasAttribute("data-boot-theme")) return;
  root.style.removeProperty("background-color");
  root.style.removeProperty("color-scheme");
  root.removeAttribute("data-boot-theme");
}

const ThemeContext = createContext(null);

export function ThemeProvider({ enabled = true, storageKey = THEME_STORAGE_KEY, children }) {
  const [theme, setThemeState] = useState(() => readTheme(globalThis.localStorage, storageKey));
  const [systemDark, setSystemDark] = useState(() => Boolean(query()?.matches));
  const resolvedTheme = resolveTheme(theme, systemDark);

  // Follow the system while the choice is "system".
  useEffect(() => {
    const media = query();
    if (!media) return undefined;
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  // A change made in another tab of this browser.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === storageKey || event.key === null) setThemeState(readTheme(globalThis.localStorage, storageKey));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  // The class goes on before anything of the panel is styled (an insertion effect runs before the layout effects of the tree,
  // some of which measure, and so style, the page), so opening a panel in dark mode never starts out light.
  useInsertionEffect(() => {
    if (enabled) setRootTheme(resolvedTheme);
  }, [enabled, resolvedTheme]);
  // And it comes off when the person leaves the app shell: the landing and sign-in pages are light.
  useInsertionEffect(() => {
    if (!enabled) return undefined;
    return () => setRootTheme(null);
  }, [enabled]);

  const setTheme = useCallback(
    (next) => {
      if (!THEMES.includes(next)) return;
      setThemeState(next);
      writeTheme(next, globalThis.localStorage, storageKey);
    },
    [storageKey]
  );

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme, available: enabled }), [theme, resolvedTheme, setTheme, enabled]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** `{ theme, resolvedTheme, setTheme, available }`. Outside a provider the theme is light and cannot be changed (`available` is false: no switch to show). */
export function useTheme() {
  return useContext(ThemeContext) ?? { theme: "light", resolvedTheme: "light", setTheme: () => {}, available: false };
}

/** Whether the page is dark now, wherever the class was put (a provider, or Storybook's toolbar). */
export function useIsDark() {
  const { resolvedTheme } = useTheme();
  const [classDark, setClassDark] = useState(() => typeof document !== "undefined" && document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setClassDark(root.classList.contains("dark")));
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    setClassDark(root.classList.contains("dark"));
    return () => observer.disconnect();
  }, [resolvedTheme]);
  return classDark;
}
