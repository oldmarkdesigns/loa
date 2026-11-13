import plugin from "tailwindcss/plugin";
import tailwindcssAnimate from "tailwindcss-animate";
import { themeColors, themeVariables } from "./tailwind.palettes.js";

// shadcn's generated components use these `data-*:` variant shorthands (e.g.
// `data-open:fade-in-0`), which are Tailwind v4 `@custom-variant` aliases
// bundled in the `shadcn/tailwind.css` package this project doesn't import
// (see src/index.css for why). Re-register them as plain Tailwind v3
// variants so the enter/exit animation utilities actually apply — without
// this, Base UI popups mount with the "entering" animation's start-state
// classes applied but never transitioning, leaving them invisible.
const dataStateVariants = plugin(({ addVariant }) => {
  addVariant("data-open", ['&[data-state="open"]', "&[data-open]:not([data-open='false'])"]);
  addVariant("data-closed", ['&[data-state="closed"]', "&[data-closed]:not([data-closed='false'])"]);
  addVariant("data-checked", ['&[data-state="checked"]', "&[data-checked]:not([data-checked='false'])"]);
  addVariant("data-unchecked", ['&[data-state="unchecked"]', "&[data-unchecked]:not([data-unchecked='false'])"]);
  addVariant("data-selected", '&[data-selected="true"]');
  addVariant("data-disabled", ['&[data-disabled="true"]', "&[data-disabled]:not([data-disabled='false'])"]);
  addVariant("data-active", ['&[data-state="active"]', "&[data-active]:not([data-active='false'])"]);
  addVariant("data-horizontal", '&[data-orientation="horizontal"]');
  addVariant("data-vertical", '&[data-orientation="vertical"]');
  addVariant("data-placeholder", '&[data-placeholder]');
  addVariant("data-inset", '&[data-inset]');
  // Base UI sets these during enter/exit CSS transitions (not a v4
  // @custom-variant alias, but still unrecognized by v3 without registration).
  addVariant("data-starting-style", '&[data-starting-style]');
  addVariant("data-ending-style", '&[data-ending-style]');
  addVariant("supports-backdrop-filter", "@supports (backdrop-filter: blur(1px))");
});

// The variables behind the colours that change with the theme: today's values in :root, the dark ones under .dark (which is put on
// <html> while a workspace panel is open, see src/lib/theme.jsx). See tailwind.palettes.js.
const themeBase = plugin(({ addBase }) => {
  const { light, dark } = themeVariables();
  addBase({ ":root": light, ".dark": dark });
});

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Geist", "Helvetica Neue", "Arial", "sans-serif"],
        body: ["Geist", "Helvetica Neue", "Arial", "sans-serif"],
        sans: ["Geist", "Helvetica Neue", "Arial", "sans-serif"]
      },
      colors: {
        // shadcn/ui semantic tokens (see src/index.css for values) — used only
        // by shadcn-generated primitives, kept separate from brand/ink below.
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)"
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)"
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)"
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)"
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)"
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)"
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)"
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
          // Bklit UI chart tokens (src/components/charts): the classes the charts use for labels, tooltips and legends.
          background: "var(--chart-background)",
          foreground: "var(--chart-foreground)",
          "foreground-muted": "var(--chart-foreground-muted)",
          label: "var(--chart-label)",
          grid: "var(--chart-grid)",
          crosshair: "var(--chart-crosshair)",
          "tooltip-background": "var(--chart-tooltip-background)",
          "tooltip-foreground": "var(--chart-tooltip-foreground)",
          "tooltip-muted": "var(--chart-tooltip-muted)",
          "marker-background": "var(--chart-marker-background)",
          "marker-border": "var(--chart-marker-border)",
          "marker-foreground": "var(--chart-marker-foreground)"
        },
        legend: {
          DEFAULT: "var(--legend)",
          foreground: "var(--legend-foreground)",
          muted: "var(--legend-muted)",
          "muted-foreground": "var(--legend-muted-foreground)",
          track: "var(--legend-track)"
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)"
        },
        // The workspace's surfaces, lines and text, the ink and brand scales and the mirrored hues (see tailwind.palettes.js).
        ...themeColors(),
        brandAccent: {
          50: "#fff9ef",
          100: "#ffefcf",
          200: "#ffda98",
          300: "#ffc364",
          400: "#f7a53a",
          500: "#df8618",
          600: "#b96813",
          700: "#934d14",
          800: "#773f17",
          900: "#633616"
        }
      },
      // The weights and tracking of the public site: Geist is read lighter than Urbanist was, so the app's "semibold" is a firm
      // medium, and large sizes are set tight.
      fontWeight: {
        medium: "450",
        semibold: "510",
        bold: "580",
        extrabold: "680"
      },
      fontSize: {
        xl: ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.015em" }],
        "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.025em" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.03em" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.035em" }],
        "5xl": ["3rem", { lineHeight: "1.05", letterSpacing: "-0.04em" }],
        "6xl": ["3.75rem", { lineHeight: "1", letterSpacing: "-0.045em" }]
      },
      letterSpacing: {
        tight: "-0.025em",
        tighter: "-0.04em"
      },
      boxShadow: {
        surface: "0 24px 60px -36px rgba(15, 20, 34, 0.35)",
        focus: "0 0 0 3px rgba(20, 26, 43, 0.22)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)"
      },
      ringWidth: {
        3: "3px"
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.015)", opacity: "0.92" }
        }
      },
      animation: {
        rise: "rise 500ms ease-out both",
        pulseSoft: "pulseSoft 4s ease-in-out infinite"
      }
    }
  },
  plugins: [tailwindcssAnimate, dataStateVariants, themeBase]
};
