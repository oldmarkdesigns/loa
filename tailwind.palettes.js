import colors from "tailwindcss/colors";

/**
 * The colours that change with the theme (see src/lib/theme.jsx and the token block in src/index.css).
 *
 * Every colour here is a CSS variable holding its channels ("236 253 245"), used as `rgb(var(--x) / <alpha-value>)`, so the
 * opacity modifiers of Tailwind (`bg-emerald-50/60`, `border-veil/10`) keep working. The variables of :root hold today's light
 * values exactly, so nothing changes in light mode; the `.dark` class (put on <html> while a workspace panel is open) swaps
 * them.
 *
 *  - The named app tokens (canvas, surface, ...) are the surfaces, lines and text of the workspace, written by hand for both
 *    modes.
 *  - `ink` and `brand` are the app's own scales, with a hand-tuned dark half.
 *  - The standard hues (emerald, rose, ...) are mirrored: in dark mode 50 is what 950 is in light mode, 100 is 900 and so on,
 *    so a pastel pill ("bg-emerald-50 text-emerald-800 border-emerald-200") becomes a deep one with light text.
 */

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const channels = (hex) => {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.replace(/./g, "$&$&") : value;
  return [0, 2, 4].map((start) => parseInt(full.slice(start, start + 2), 16)).join(" ");
};

const colorOf = (name) => `rgb(var(--${name}) / <alpha-value>)`;

// ── Named tokens ─────────────────────────────────────────────────────────────────────────────────

/** [light, dark] hex of each app token. Light is what the panels have always used. */
export const APP_TOKENS = {
  canvas: ["#f7f7f8", "#0a0d16"], // the page behind the cards (in dark a deep navy, so that the containers on it read as a layer of their own)
  page: ["#ffffff", "#0a0d16"], // the page of search mode (white, where the panels have the off-white canvas)
  surface: ["#ffffff", "#11151f"], // the containers: cards, panels, the side menu
  control: ["#ffffff", "#181d29"], // what is pressed or typed into and sits on a container: buttons, chips, fields, toggle tracks
  subtle: ["#f5f6f8", "#151a25"], // a row under the pointer, a zebra stripe
  tint: ["#f2f3f6", "#1c2130"], // chips and soft fills (secondary buttons)
  "tint-2": ["#eceef3", "#252b3b"], // selected and highlighted fills
  "tint-3": ["#dfe2e9", "#303749"], // stronger fills, tracks
  line: ["#e3e5ea", "#272d3c"], // hairlines
  "line-2": ["#cfd3dc", "#384054"], // stronger hairlines
  strong: ["#141a2b", "#eceef4"], // headings, and the dark fill of primary buttons and active pills: the navy-graphite of the logo
  "on-strong": ["#ffffff", "#0a0d16"] // what is written on a strong fill
};

/** The colour that overlays are made of: black at low opacity on a light page, white on a dark one. */
const VEIL = ["#000000", "#ffffff"];

/**
 * How much stronger every `veil` alpha is drawn: `border-veil/10` is a 10 % line in light and, times the gain, a 12.5 % one in dark, where
 * a hairline of the same alpha is far harder to see on near-black. It applies to every use of `veil` (borders, hover fills, rings), so the
 * separation between the layers (canvas, container, control) is tuned in one place. Light stays 1: nothing changes there.
 */
const VEIL_GAIN = ["1", "1.25"];

// ── The app's own scales ─────────────────────────────────────────────────────────────────────────

const INK = {
  // Navy-graphite, the greys of the public site (ink-600 is its secondary text, ink-400 its quiet text).
  light: { 50: "#f6f7f9", 100: "#eceef2", 200: "#dcdfe6", 300: "#bcc1cc", 400: "#8b8f9a", 500: "#6f7483", 600: "#5b6070", 700: "#444a5b", 800: "#2e3446", 900: "#1d2334" },
  dark: { 50: "#0f1320", 100: "#161b2a", 200: "#222839", 300: "#646c82", 400: "#7c8499", 500: "#959cb0", 600: "#b0b6c6", 700: "#c8cdd9", 800: "#dde1ea", 900: "#eff1f6" }
};

const BRAND = {
  // A steel navy beside the ink: the one quiet hue the product has, for links, selections and the second series of a chart.
  light: { 50: "#f3f5f9", 100: "#e5e9f1", 200: "#ccd3e2", 300: "#a9b4cc", 400: "#7e8cab", 500: "#5c6b8d", 600: "#475574", 700: "#39445e", 800: "#2c354b", 900: "#1f2638" },
  dark: { 50: "#10141f", 100: "#161c2b", 200: "#1f2840", 300: "#2d3a57", 400: "#5a6c94", 500: "#7587ad", 600: "#94a4c6", 700: "#b1bed9", 800: "#cdd6ea", 900: "#e3e8f4" }
};

// ── Standard hues, mirrored ──────────────────────────────────────────────────────────────────────

const MIRRORED = ["slate", "gray", "zinc", "neutral", "red", "orange", "amber", "yellow", "green", "emerald", "teal", "sky", "blue", "indigo", "rose"];
const mirror = (shade) => SHADES[SHADES.length - 1 - SHADES.indexOf(shade)];

/** The theme.extend.colors of Tailwind for everything above. */
export function themeColors() {
  const result = {};
  for (const name of Object.keys(APP_TOKENS)) result[name] = colorOf(name);
  result.tint = { DEFAULT: colorOf("tint"), 2: colorOf("tint-2"), 3: colorOf("tint-3") };
  result.line = { DEFAULT: colorOf("line"), 2: colorOf("line-2") };
  result.strong = colorOf("strong");
  result["on-strong"] = colorOf("on-strong");
  result.veil = "rgb(var(--veil) / calc(<alpha-value> * var(--veil-gain, 1)))";
  result.ink = Object.fromEntries(Object.keys(INK.light).map((shade) => [shade, colorOf(`ink-${shade}`)]));
  result.brand = Object.fromEntries(Object.keys(BRAND.light).map((shade) => [shade, colorOf(`brand-${shade}`)]));
  for (const hue of MIRRORED) result[hue] = Object.fromEntries(SHADES.map((shade) => [shade, colorOf(`c-${hue}-${shade}`)]));
  return result;
}

/** The CSS variables of :root (light) and .dark. */
export function themeVariables() {
  const light = {};
  const dark = {};
  for (const [name, [lightHex, darkHex]] of Object.entries(APP_TOKENS)) {
    light[`--${name}`] = channels(lightHex);
    dark[`--${name}`] = channels(darkHex);
  }
  light["--veil"] = channels(VEIL[0]);
  dark["--veil"] = channels(VEIL[1]);
  light["--veil-gain"] = VEIL_GAIN[0];
  dark["--veil-gain"] = VEIL_GAIN[1];
  for (const shade of Object.keys(INK.light)) {
    light[`--ink-${shade}`] = channels(INK.light[shade]);
    dark[`--ink-${shade}`] = channels(INK.dark[shade]);
  }
  for (const shade of Object.keys(BRAND.light)) {
    light[`--brand-${shade}`] = channels(BRAND.light[shade]);
    dark[`--brand-${shade}`] = channels(BRAND.dark[shade]);
  }
  for (const hue of MIRRORED) {
    for (const shade of SHADES) {
      light[`--c-${hue}-${shade}`] = channels(colors[hue][shade]);
      dark[`--c-${hue}-${shade}`] = channels(colors[hue][mirror(shade)]);
    }
  }
  return { light, dark };
}
