export const PLATFORM_GOOGLE_MAP_STYLE = [
  {
    featureType: "all",
    elementType: "all",
    stylers: [{ visibility: "on" }]
  },
  {
    featureType: "administrative",
    elementType: "labels.text.fill",
    stylers: [{ color: "#444444" }]
  },
  {
    featureType: "landscape",
    elementType: "all",
    stylers: [{ color: "#f2f2f2" }]
  },
  {
    featureType: "poi",
    elementType: "all",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "road",
    elementType: "all",
    stylers: [{ saturation: -100 }, { lightness: 45 }]
  },
  {
    featureType: "road.highway",
    elementType: "all",
    stylers: [{ visibility: "simplified" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#ffffff" }]
  },
  {
    featureType: "road.arterial",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "transit",
    elementType: "all",
    stylers: [{ visibility: "simplified" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "simplified" }]
  },
  {
    featureType: "transit",
    elementType: "labels.text",
    stylers: [{ visibility: "simplified" }]
  },
  {
    featureType: "transit.station",
    elementType: "all",
    stylers: [{ visibility: "simplified" }]
  },
  {
    featureType: "transit.station.airport",
    elementType: "all",
    stylers: [{ visibility: "simplified" }]
  },
  {
    featureType: "transit.station.airport",
    elementType: "labels",
    stylers: [{ visibility: "on" }]
  },
  {
    featureType: "transit.station.bus",
    elementType: "all",
    stylers: [{ visibility: "on" }]
  },
  {
    featureType: "transit.station.bus",
    elementType: "labels",
    stylers: [{ visibility: "on" }]
  },
  {
    featureType: "transit.station.rail",
    elementType: "all",
    stylers: [{ visibility: "on" }]
  },
  {
    featureType: "transit.station.rail",
    elementType: "labels",
    stylers: [{ visibility: "on" }]
  },
  {
    featureType: "water",
    elementType: "all",
    stylers: [{ color: "#dde6e8" }, { visibility: "on" }]
  }
];

/**
 * The same map in the dark theme. It keeps what PLATFORM_GOOGLE_MAP_STYLE shows (the same features and labels) and gives the land,
 * the water, the roads and the labels the dark palette of the app. Google applies the rules in order and a later one wins, so
 * these come after the light ones.
 */
const DARK_MAP_COLOURS = [
  { elementType: "geometry", stylers: [{ color: "#0d0f13" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b97a6" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d0f13" }] },
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#a9b4c2" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#262b33" }] },
  { featureType: "landscape", elementType: "all", stylers: [{ color: "#0d0f13" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#1b1f27" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0d0f13" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#7c8896" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#2a303b" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#a0abb9" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#8b97a6" }] },
  { featureType: "water", elementType: "all", stylers: [{ color: "#06080b" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4b5563" }] }
];

export const PLATFORM_GOOGLE_MAP_STYLE_DARK = [...PLATFORM_GOOGLE_MAP_STYLE, ...DARK_MAP_COLOURS];

/** The style of the map for the theme. */
export const platformMapStyle = (dark) => (dark ? PLATFORM_GOOGLE_MAP_STYLE_DARK : PLATFORM_GOOGLE_MAP_STYLE);

// The pins of the listings map: red at rest, dark when chosen, navy under the pointer. On the dark map the chosen pin turns light (a
// dark pin would vanish) and the one under the pointer turns blue; the red one shows on both.
const PIN_PATH = "M12 1.75C6.34 1.75 1.75 6.34 1.75 12c0 7.71 8.58 16.56 9.57 17.55a.97.97 0 0 0 1.36 0c.99-.99 9.57-9.84 9.57-17.55 0-5.66-4.59-10.25-10.25-10.25Z";
const PIN_COLOURS = {
  light: {
    inactive: { fill: "#ea4335", stroke: "#c5221f", dot: "#ffffff" },
    active: { fill: "#141a2b", stroke: "#0b1428", dot: "#ffffff" },
    hover: { fill: "#1b2a4d", stroke: "#141a2b", dot: "#ffffff" }
  },
  dark: {
    inactive: { fill: "#ea4335", stroke: "#c5221f", dot: "#ffffff" },
    active: { fill: "#eceef2", stroke: "#ffffff", dot: "#141a2b" },
    hover: { fill: "#8fb0da", stroke: "#eceef2", dot: "#141a2b" }
  }
};

/** The data URL of a pin: `kind` is "inactive", "active" or "hover". */
export function mapPinUrl(kind, dark = false) {
  const { fill, stroke, dot } = PIN_COLOURS[dark ? "dark" : "light"][kind];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32"><path fill="${fill}" stroke="${stroke}" stroke-width="1.4" d="${PIN_PATH}"/><circle cx="12" cy="12" r="4.1" fill="${dot}"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
