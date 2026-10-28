import { useState } from "react";
import { expect, waitFor, within } from "storybook/test";
import { Button } from "@/components/ui/button";
import { THEME_STORAGE_KEY, ThemeProvider, useTheme } from "../../lib/theme";
import { ThemeToggle } from "./ThemeToggle";

const meta = {
  component: ThemeToggle,
  tags: ["ai-generated", "needs-work"],
  // The stories here bring their own ThemeProvider and storage (see .storybook/preview.jsx).
  parameters: { layout: "centered", themeFrame: false }
};

export default meta;

const root = () => document.documentElement;
const isDark = () => root().classList.contains("dark");

/** What the provider knows, next to the toggle. */
function Probe() {
  const { theme, resolvedTheme } = useTheme();
  return (
    <p data-testid="probe" className="mt-3 text-xs text-ink-500">
      valt: {theme}, visas: {resolvedTheme}
    </p>
  );
}

function Panel() {
  return (
    <div className="w-[248px] rounded-xl border border-veil/10 bg-surface p-2 text-strong">
      <div className="flex items-center justify-between gap-3 px-2 py-1">
        <span className="text-[13px] font-medium text-ink-600">Tema</span>
        <ThemeToggle />
      </div>
      <Probe />
    </div>
  );
}

const choice = (label) => within(document.body).getByRole("button", { name: label });
const chooseTheme = async (userEvent, label) => {
  await userEvent.click(choice(label));
};

// A stand-in for the system's setting that a test can flip.
function controllableSystem(initialDark) {
  const original = window.matchMedia;
  const listeners = new Set();
  const state = { matches: initialDark };
  window.matchMedia = (query) =>
    /prefers-color-scheme/.test(query)
      ? {
          get matches() {
            return state.matches;
          },
          media: query,
          addEventListener: (_, listener) => listeners.add(listener),
          removeEventListener: (_, listener) => listeners.delete(listener)
        }
      : original.call(window, query);
  return {
    flip(matches) {
      state.matches = matches;
      listeners.forEach((listener) => listener({ matches }));
    },
    restore() {
      window.matchMedia = original;
    }
  };
}

// The switch of the profile menu: light is where it starts, and the choice is kept.
export const Default = {
  render: () => (
    <ThemeProvider>
      <Panel />
    </ThemeProvider>
  ),
  beforeEach: () => {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
    root().classList.remove("dark");
    return () => {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      root().classList.remove("dark");
    };
  },
  play: async ({ canvas, userEvent }) => {
    // Three icon buttons named for a screen reader, one choice at all times, and the one in use is pressed.
    await expect(canvas.getByRole("group", { name: "Tema" })).toBeInTheDocument();
    await expect(canvas.getAllByRole("button")).toHaveLength(3);
    await expect(choice("Ljust")).toHaveAttribute("aria-pressed", "true");
    await expect(choice("Mörkt")).toHaveAttribute("aria-pressed", "false");
    await expect(isDark()).toBe(false);

    await chooseTheme(userEvent, "Mörkt");
    await expect(isDark()).toBe(true);
    await expect(root().dataset.theme).toBe("dark");
    await expect(root().style.colorScheme || getComputedStyle(root()).colorScheme).toBe("dark");
    await expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    await expect(canvas.getByTestId("probe")).toHaveTextContent("valt: dark, visas: dark");
    await expect(choice("Mörkt")).toHaveAttribute("aria-pressed", "true");
    await expect(choice("Ljust")).toHaveAttribute("aria-pressed", "false");
    // The page and the shadcn tokens follow: the page is the dark canvas, and a card takes the dark surface.
    await expect(getComputedStyle(document.body).backgroundColor).toBe("rgb(5, 6, 8)");
    await expect(getComputedStyle(canvas.getByTestId("probe").parentElement).backgroundColor).toBe("rgb(15, 17, 21)");

    await chooseTheme(userEvent, "Ljust");
    await expect(isDark()).toBe(false);
    await expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    await expect(getComputedStyle(canvas.getByTestId("probe").parentElement).backgroundColor).toBe("rgb(255, 255, 255)");
  }
};

// A choice made earlier is what the panel opens with, and one that is not a theme is ignored.
export const RemembersTheChoice = {
  render: () => (
    <ThemeProvider>
      <Panel />
    </ThemeProvider>
  ),
  beforeEach: () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    return () => {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      root().classList.remove("dark");
    };
  },
  play: async ({ canvas }) => {
    await expect(isDark()).toBe(true);
    await expect(canvas.getByRole("button", { name: "Mörkt" })).toHaveAttribute("aria-pressed", "true");
    window.localStorage.setItem(THEME_STORAGE_KEY, "sepia");
    window.dispatchEvent(new StorageEvent("storage", { key: THEME_STORAGE_KEY, newValue: "sepia" }));
    await waitFor(() => expect(canvas.getByTestId("probe")).toHaveTextContent("valt: light"));
    await expect(isDark()).toBe(false);
  }
};

// "Som systemet" follows the setting of the system, live.
export const FollowsTheSystem = {
  render: () => (
    <ThemeProvider>
      <Panel />
    </ThemeProvider>
  ),
  beforeEach: () => {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
    const system = controllableSystem(true);
    window.__system = system;
    return () => {
      system.restore();
      delete window.__system;
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      root().classList.remove("dark");
    };
  },
  play: async ({ canvas, userEvent }) => {
    await expect(isDark()).toBe(false);
    await chooseTheme(userEvent, "Som systemet");
    await expect(canvas.getByTestId("probe")).toHaveTextContent("valt: system, visas: dark");
    await expect(isDark()).toBe(true);
    window.__system.flip(false);
    await waitFor(() => expect(canvas.getByTestId("probe")).toHaveTextContent("valt: system, visas: light"));
    await expect(isDark()).toBe(false);
    window.__system.flip(true);
    await waitFor(() => expect(isDark()).toBe(true));
    // An explicit choice ignores the system.
    await chooseTheme(userEvent, "Ljust");
    window.__system.flip(true);
    await expect(isDark()).toBe(false);
  }
};

function LeavingTheApp() {
  const [inApp, setInApp] = useState(true);
  return (
    <div>
      <ThemeProvider enabled={inApp}>
        <Panel />
      </ThemeProvider>
      <Button className="mt-4" onClick={() => setInApp((value) => !value)}>
        {inApp ? "Gå till startsidan" : "Tillbaka till appen"}
      </Button>
    </div>
  );
}

// The landing and sign-in pages stay light: the class is on <html> only while the app shell (the panels and search mode) is open.
export const LeavingTheAppIsLight = {
  render: () => <LeavingTheApp />,
  beforeEach: () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    return () => {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      root().classList.remove("dark");
    };
  },
  play: async ({ canvas, userEvent }) => {
    await expect(isDark()).toBe(true);
    await userEvent.click(canvas.getByRole("button", { name: "Gå till startsidan" }));
    await expect(isDark()).toBe(false);
    await expect(root().dataset.theme).toBeUndefined();
    await userEvent.click(canvas.getByRole("button", { name: "Tillbaka till appen" }));
    await expect(isDark()).toBe(true);
  }
};
