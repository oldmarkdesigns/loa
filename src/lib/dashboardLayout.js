/**
 * The broker's overview is a grid of widgets, and this is the model of it: which widgets there are, and the order, the
 * size and the visibility that each person has chosen. Only data and pure functions here; the widgets themselves are in
 * components/admin/dashboard, and useDashboardLayout keeps the choice.
 *
 * The "hierarchy" of the overview is two things: the order the widgets come in (top left first, reading like text) and
 * how wide each one is, since a wide widget is a more important one.
 */

export const WIDGET_SIZES = ["small", "medium", "large", "full"];

/** `span` is the number of the 12 columns the size takes on a wide screen. */
export const SIZE_META = {
  small: { label: "Liten", fraction: "⅓", span: 4, hint: "en tredjedel av bredden" },
  medium: { label: "Mellan", fraction: "½", span: 6, hint: "halva bredden" },
  large: { label: "Stor", fraction: "⅔", span: 8, hint: "två tredjedelar av bredden" },
  full: { label: "Hel bredd", fraction: "1/1", span: 12, hint: "hela bredden" }
};

/**
 * Every widget there is, in the order a broker who has changed nothing sees them. `size` and `visible` are the defaults.
 * The last three are there to be switched on.
 */
export const WIDGETS = [
  { id: "quick-actions", title: "Snabbåtgärder", description: "Genvägar till ny annons, objekt, prospekt och inkorgen.", group: "Översikt", size: "full", visible: true },
  { id: "key-figures", title: "Nyckeltal", description: "Aktiva objekt, visningar, leads och svarstid.", group: "Översikt", size: "full", visible: true },
  { id: "lead-trend", title: "Intresse över tid", description: "Nya leads per dag de senaste 7, 30 eller 90 dagarna.", group: "Leads", size: "large", visible: true },
  { id: "next-steps", title: "Nästa steg", description: "Förslag från AI-assistenten på vad du gör härnäst.", group: "Översikt", size: "small", visible: true },
  { id: "pipeline", title: "Leads per steg", description: "Var dina leads står just nu, från ny till vunnen.", group: "Leads", size: "small", visible: true },
  { id: "funnel", title: "Konvertering", description: "Hur många leads som blir visningar och affärer.", group: "Leads", size: "small", visible: true },
  { id: "listing-status", title: "Objekt per status", description: "Fördelningen mellan utkast, aktiva, uthyrda och inaktiva objekt.", group: "Objekt", size: "small", visible: true },
  { id: "top-listings", title: "Objekt i topp", description: "Objekten som ger flest leads eller visningar.", group: "Objekt", size: "large", visible: true },
  { id: "follow-ups", title: "Kommande uppföljningar", description: "Uppföljningar de närmaste två veckorna och de som är försenade.", group: "Leads", size: "small", visible: true },
  { id: "rent-by-district", title: "Hyra per område", description: "Snitthyra per kvm och år i varje område.", group: "Objekt", size: "small", visible: false },
  { id: "lead-fit", title: "Leadens matchning", description: "Hur väl dina leads matchar lokalerna de hört av sig om.", group: "Leads", size: "small", visible: false },
  { id: "listing-age", title: "Tid på marknaden", description: "Hur länge dina aktiva annonser har legat ute.", group: "Objekt", size: "small", visible: false }
];

const WIDGET_BY_ID = new Map(WIDGETS.map((widget) => [widget.id, widget]));
export const widgetById = (id) => WIDGET_BY_ID.get(id);

const LAYOUT_VERSION = 1;

/** The layout of a broker who has changed nothing. */
export function defaultLayout() {
  return { version: LAYOUT_VERSION, items: WIDGETS.map(({ id, size, visible }) => ({ id, size, visible })) };
}

/**
 * Makes a layout out of whatever was stored, so an old, damaged or hand-edited value can never break the page: widgets that
 * no longer exist are dropped, repeats are dropped, a size that is not a size gets the widget's own, and widgets added since the
 * layout was saved come last, as they are by default.
 */
export function normalizeLayout(raw) {
  const seen = new Set();
  const items = [];
  for (const entry of Array.isArray(raw?.items) ? raw.items : []) {
    const widget = WIDGET_BY_ID.get(entry?.id);
    if (!widget || seen.has(widget.id)) continue;
    seen.add(widget.id);
    items.push({
      id: widget.id,
      size: WIDGET_SIZES.includes(entry.size) ? entry.size : widget.size,
      visible: typeof entry.visible === "boolean" ? entry.visible : widget.visible
    });
  }
  for (const widget of WIDGETS) {
    if (!seen.has(widget.id)) items.push({ id: widget.id, size: widget.size, visible: widget.visible });
  }
  return { version: LAYOUT_VERSION, items };
}

export function layoutsEqual(a, b) {
  return a.items.length === b.items.length && a.items.every((item, index) => {
    const other = b.items[index];
    return item.id === other.id && item.size === other.size && item.visible === other.visible;
  });
}

/** The widgets to draw, in order. */
export const visibleItems = (layout) => layout.items.filter((item) => item.visible);

/** Moves the item with id `activeId` to where the item with id `overId` is. */
export function moveItem(items, activeId, overId) {
  const from = items.findIndex((item) => item.id === activeId);
  const to = items.findIndex((item) => item.id === overId);
  if (from < 0 || to < 0 || from === to) return items;
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export const setItemVisible = (items, id, visible) => items.map((item) => (item.id === id ? { ...item, visible } : item));
export const setItemSize = (items, id, size) => (WIDGET_SIZES.includes(size) ? items.map((item) => (item.id === id ? { ...item, size } : item)) : items);

// ── Keeping the choice ─────────────────────────────────────────────────────────────────────────
// In this browser, per person (like the saved searches). Reading and writing never throw: private windows and blocked site
// data make storage unavailable, and the overview then simply starts from the default every time.

export const layoutStorageKey = (userId) => `office_rental_broker_dashboard_${userId || "anonymous"}`;

export function readLayout(key, storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(key);
    return raw ? normalizeLayout(JSON.parse(raw)) : defaultLayout();
  } catch {
    return defaultLayout();
  }
}

export function writeLayout(key, layout, storage = globalThis.localStorage) {
  try {
    storage?.setItem(key, JSON.stringify(layout));
    return true;
  } catch {
    return false;
  }
}

export function clearLayout(key, storage = globalThis.localStorage) {
  try {
    storage?.removeItem(key);
  } catch {
    // Nothing to do: there was nothing kept.
  }
}
