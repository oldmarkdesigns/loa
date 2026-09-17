/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Urbanist", "Avenir Next", "Helvetica Neue", "sans-serif"],
        body: ["Urbanist", "Avenir Next", "Helvetica Neue", "sans-serif"]
      },
      colors: {
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
        accent: {
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
  plugins: []
};
