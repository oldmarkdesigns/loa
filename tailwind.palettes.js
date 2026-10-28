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
  canvas: ["#fafafa", "#050608"], // the page behind the cards (in dark nearly black, so that the containers on it read as a layer of their own)
  page: ["#ffffff", "#050608"], // the page of search mode (white, where the panels have the off-white canvas; in dark the same near-black as the canvas)
  surface: ["#ffffff", "#0f1115"], // the containers: cards, panels, the side menu (in dark a step above the canvas, with a hairline, and everything that sits on them is lighter again)
  control: ["#ffffff", "#171a20"], // what is pressed or typed into and sits on a container: buttons, chips, fields, toggle tracks (in dark clearly lighter than the container under them, so that the eye finds them first)
  subtle: ["#f5f5f5", "#14171c"], // a row under the pointer, a zebra stripe
  tint: ["#f3f7f7", "#1b1e25"], // chips and soft fills (secondary buttons)
  "tint-2": ["#eef2f8", "#242830"], // selected and highlighted fills
  "tint-3": ["#dde7eb", "#2f3540"], // stronger fills, tracks
  line: ["#d7e2ee", "#282d36"], // borders with a hue
  "line-2": ["#bfd0e3", "#383e4a"], // stronger borders
  strong: ["#0b0a0e", "#eceef2"], // headings, and the dark fill of primary buttons and active pills
  "on-strong": ["#ffffff", "#08090b"] // what is written on a strong fill
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
  light: { 50: "#f5f7f7", 100: "#e6ebeb", 200: "#cfd8d7", 300: "#adbdbc", 400: "#859b9a", 500: "#68817f", 600: "#536a69", 700: "#465657", 800: "#3c4949", 900: "#343f3f" },
  dark: { 50: "#111317", 100: "#191c21", 200: "#252932", 300: "#6b7a8c", 400: "#7f8fa1", 500: "#93a2b3", 600: "#aebbc9", 700: "#c6d0da", 800: "#dbe2e9", 900: "#eef1f5" }
};

const BRAND = {
  light: { 50: "#f3f7fb", 100: "#e4ecf6", 200: "#cad9ec", 300: "#a7c0df", 400: "#7ea1cc", 500: "#5d84b8", 600: "#476a99", 700: "#3b557c", 800: "#344867", 900: "#2f3e56" },
  dark: { 50: "#10161f", 100: "#151e2d", 200: "#1c2a40", 300: "#2a3b57", 400: "#5476a5", 500: "#6f92c1", 600: "#8fb0da", 700: "#a9c3e6", 800: "#c4d6ef", 900: "#dbe6f5" }
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
