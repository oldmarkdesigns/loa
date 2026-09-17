import plugin from "tailwindcss/plugin";
import tailwindcssAnimate from "tailwindcss-animate";

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

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Urbanist", "Avenir Next", "Helvetica Neue", "sans-serif"],
        body: ["Urbanist", "Avenir Next", "Helvetica Neue", "sans-serif"]
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
          5: "var(--chart-5)"
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
        brand: {
          50: "#f3f7fb",
          100: "#e4ecf6",
          200: "#cad9ec",
          300: "#a7c0df",
          400: "#7ea1cc",
          500: "#5d84b8",
          600: "#476a99",
          700: "#3b557c",
          800: "#344867",
          900: "#2f3e56"
        },
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
        },
        ink: {
          50: "#f5f7f7",
          100: "#e6ebeb",
          200: "#cfd8d7",
          300: "#adbdbc",
          400: "#859b9a",
          500: "#68817f",
          600: "#536a69",
          700: "#465657",
          800: "#3c4949",
          900: "#343f3f"
        }
      },
      boxShadow: {
        surface: "0 20px 40px -20px rgba(20, 35, 32, 0.35)",
        focus: "0 0 0 3px rgba(79, 136, 98, 0.35)"
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
  plugins: [tailwindcssAnimate, dataStateVariants]
};
