import { Badge } from "@/components/ui/badge";

const TONE_CLASSES = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-800",
  rose: "border-rose-200 bg-rose-50 text-rose-800",
  neutral: "border-black/10 bg-[#f7f7f7] text-ink-700"
};

// Mirrors LEAD_STATUSES in convex/lib.js.
const LEAD_STATUS_META = {
  new: { label: "Ny", tone: "amber" },
  contacted: { label: "Kontaktad", tone: "blue" },
  viewing_booked: { label: "Visning bokad", tone: "emerald" },
  negotiating: { label: "Förhandling", tone: "indigo" },
  won: { label: "Vunnen", tone: "emerald" },
  lost: { label: "Förlorad", tone: "rose" }
};

// Mirrors LISTING_STATUSES in convex/lib.js.
const LISTING_STATUS_META = {
  draft: { label: "Utkast", tone: "neutral" },
  active: { label: "Aktiv", tone: "emerald" },
  negotiating: { label: "Förhandling", tone: "indigo" },
  rented: { label: "Uthyrd", tone: "blue" },
  inactive: { label: "Inaktiv", tone: "neutral" }
};

// Mirrors PROSPECT_STATUSES in convex/lib.js.
const PROSPECT_STATUS_META = {
  draft: { label: "Utkast", tone: "neutral" },
  published: { label: "Publicerad", tone: "emerald" },
  archived: { label: "Arkiverad", tone: "neutral" }
};

export const LEAD_STATUS_ORDER = ["new", "contacted", "viewing_booked", "negotiating", "won", "lost"];
export const LISTING_STATUS_ORDER = ["draft", "active", "negotiating", "rented", "inactive"];
export const PROSPECT_STATUS_ORDER = ["draft", "published", "archived"];

function metaFor(status, variant) {
  const map = variant === "listing" ? LISTING_STATUS_META : variant === "prospect" ? PROSPECT_STATUS_META : LEAD_STATUS_META;
  return map[status] || { label: status || "Okänd", tone: "neutral" };
}

export function leadStatusLabel(status) {
  return metaFor(status, "lead").label;
}

export function listingStatusLabel(status) {
  return metaFor(status, "listing").label;
}

export function prospectStatusLabel(status) {
  return metaFor(status, "prospect").label;
}

export function leadStatusOptions() {
  return LEAD_STATUS_ORDER.map((value) => ({ value, label: LEAD_STATUS_META[value].label }));
}

export function listingStatusOptions() {
  return LISTING_STATUS_ORDER.map((value) => ({ value, label: LISTING_STATUS_META[value].label }));
}

export function prospectStatusOptions() {
  return PROSPECT_STATUS_ORDER.map((value) => ({ value, label: PROSPECT_STATUS_META[value].label }));
}

function StatusPill({ status, variant = "lead", className = "" }) {
  const { label, tone } = metaFor(status, variant);
  return (
    <Badge
      variant="outline"
      className={`h-auto rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASSES[tone]} ${className}`}
    >
      {label}
    </Badge>
  );
}

export default StatusPill;
