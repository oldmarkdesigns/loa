import { useLayoutEffect } from "react";
import "../src/index.css";
import "../src/radius.css";
import { SIDEBAR_DISPLAY_KEY } from "../src/lib/sidebarDisplay";
import { THEME_STORAGE_KEY, ThemeProvider, withoutTransitions } from "../src/lib/theme";

/**
 * The theme of a story. The toolbar's "Tema" (Ljust / Mörkt) is the starting point: it is written to localStorage under the key of
 * the app's ThemeProvider, which every story is wrapped in, so a story with a theme toggle (the side menu of a panel) starts on
 * the toolbar's choice and can switch the theme itself. The provider puts the `dark` class on <html>, the way the workspace
 * panels do in the app (src/lib/theme.jsx); a change of the toolbar is passed on with a storage event.
 * Open a story in dark mode directly with `&globals=theme:dark`.
 */
function ThemeFrame({ theme, children }) {
  // Written while rendering, so that a provider inside the story reads it at its first render.
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // No storage: the toolbar still sets the class below.
  }
  useLayoutEffect(() => {
    withoutTransitions(() => document.documentElement.classList.toggle("dark", theme === "dark"));
    window.dispatchEvent(new StorageEvent("storage", { key: THEME_STORAGE_KEY, newValue: theme }));
  }, [theme]);
  return <ThemeProvider>{children}</ThemeProvider>;
}

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo"
    }
  },

  globalTypes: {
    theme: {
      description: "Tema för arbetsytan",
      toolbar: {
        title: "Tema",
        icon: "circlehollow",
        dynamicTitle: true,
        items: [
          { value: "light", title: "Ljust" },
          { value: "dark", title: "Mörkt" }
        ]
      }
    }
  },

  initialGlobals: { theme: "light" },

  // The side menu keeps how it is shown (expanded, collapsed, opened by hover) in localStorage, which stories share: every story starts
  // from the default, and one that needs another display sets it in its own `beforeEach`, which runs after this.
  beforeEach: () => {
    try {
      window.localStorage.removeItem(SIDEBAR_DISPLAY_KEY);
    } catch {
      // No storage: the display then starts from the default anyway.
    }
  },

  decorators: [
    // A story that tests the theme itself (`parameters.themeFrame: false`) brings its own provider and its own storage.
    (Story, context) =>
      context.parameters.themeFrame === false ? (
        <Story />
      ) : (
        <ThemeFrame theme={context.globals.theme === "dark" ? "dark" : "light"}>
          <Story />
        </ThemeFrame>
      )
  ]
};

export default preview;
