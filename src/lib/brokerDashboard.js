import { LEAD_STATUS_ORDER, LISTING_STATUS_ORDER, leadStatusLabel, listingStatusLabel } from "../components/app/StatusPill";

/**
 * What the widgets of the broker overview show, worked out from the broker's listings and leads. Everything here is a
 * plain function of its input (the day is passed in too), so the same data always gives the same numbers.
 */

const DAY_MS = 86_400_000;
const CLOSED = new Set(["won", "lost"]);

const number = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const sum = (rows, pick) => rows.reduce((total, row) => total + pick(row), 0);

export const dayKey = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** A date or a date-time as a Date, or null when it is missing or not a date. */
function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** The calendar day of a value. A plain "2026-09-20" is that day here, not the evening before in a zone west of Greenwich. */
function toDay(value) {
  if (!value) return null;
  const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).slice(0, 10));
  if (plain) return new Date(Number(plain[1]), Number(plain[2]) - 1, Number(plain[3]));
  const date = toDate(value);
  return date ? startOfDay(date) : null;
}

const daysFrom = (from, to) => Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);

/** The numbers of the key-figure card. */
export function brokerMetrics(listings = [], leads = []) {
  const responses = listings.filter((item) => item.responseHours != null && Number.isFinite(Number(item.responseHours)));
  return {
    listingCount: listings.length,
    activeCount: listings.filter((item) => item.status === "active").length,
    draftCount: listings.filter((item) => item.status === "draft").length,
    totalViews: sum(listings, (item) => number(item.views)),
    leadCount: leads.length,
    newLeadCount: leads.filter((lead) => lead.status === "new").length,
    responseHours: responses.length ? Math.round(sum(responses, (item) => Number(item.responseHours)) / responses.length) : null
  };
}

/** New leads per day for the last `days` days, ending today. Leads without a date are counted apart. */
export function leadTrend(leads = [], days = 30, now = new Date()) {
  const end = startOfDay(now);
  const counts = new Map();
  let undated = 0;
  for (const lead of leads) {
    const date = toDate(lead.createdAt);
    if (!date) undated += 1;
    else counts.set(dayKey(date), (counts.get(dayKey(date)) || 0) + 1);
  }
  const points = Array.from({ length: days }, (_, index) => {
    const date = new Date(end);
    date.setDate(date.getDate() - days + index + 1);
    return { date, label: date.toLocaleDateString("sv-SE", { day: "numeric", month: "short" }), leads: counts.get(dayKey(date)) || 0 };
  });
  return { points, total: sum(points, (point) => point.leads), undated };
}

/** Where the leads stand now: one row per step, in the order a lead moves through them. */
export function leadPipeline(leads = []) {
  const counts = new Map(LEAD_STATUS_ORDER.map((status) => [status, 0]));
  for (const lead of leads) if (counts.has(lead.status)) counts.set(lead.status, counts.get(lead.status) + 1);
  const stages = LEAD_STATUS_ORDER.map((status) => ({ key: status, label: leadStatusLabel(status), value: counts.get(status) }));
  const closed = counts.get("won") + counts.get("lost");
  return { stages, total: leads.length, open: leads.length - closed };
}

/**
 * How far the leads get. Every lead counts as a lead; one that is now contacted, has a viewing booked, is negotiating or
 * is won has passed the steps before it too. A lost lead is not counted further than that, since where it fell away is not
 * known. `viewToLeadRate` is leads per registered view of the listings; it is null when there are more leads than views
 * (a lead can come from a view that was never counted, and a share over 100 % says nothing).
 */
export function leadFunnel(listings = [], leads = []) {
  const reached = (statuses) => leads.filter((lead) => statuses.includes(lead.status)).length;
  const total = leads.length;
  const steps = [
    { key: "leads", label: "Leads", value: total },
    { key: "contacted", label: "Kontaktade", value: reached(["contacted", "viewing_booked", "negotiating", "won"]) },
    { key: "viewing", label: "Visning bokad", value: reached(["viewing_booked", "negotiating", "won"]) },
    { key: "won", label: "Vunna", value: reached(["won"]) }
  ].map((step) => ({ ...step, share: total ? step.value / total : 0 }));
  const views = sum(listings, (item) => number(item.views));
  return { steps, views, viewToLeadRate: views && views >= total ? total / views : null, winRate: total ? steps[3].value / total : null };
}

/** The listings that draw the most leads or views, most first. */
export function topListings(listings = [], leads = [], metric = "leads", limit = 5) {
  const leadCounts = new Map();
  for (const lead of leads) leadCounts.set(String(lead.listingId), (leadCounts.get(String(lead.listingId)) || 0) + 1);
  return listings
    .map((item) => ({
      id: item.id,
      title: item.title || item.address || "Objekt utan namn",
      district: item.district || "",
      value: metric === "views" ? number(item.views) : leadCounts.get(String(item.id)) || 0
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value || a.title.localeCompare(b.title, "sv"))
    .slice(0, limit);
}

/** The listings by status, in the order a listing goes through them. */
export function listingStatusBreakdown(listings = []) {
  const counts = new Map(LISTING_STATUS_ORDER.map((status) => [status, 0]));
  for (const item of listings) if (counts.has(item.status)) counts.set(item.status, counts.get(item.status) + 1);
  return {
    segments: LISTING_STATUS_ORDER.map((status) => ({ key: status, label: listingStatusLabel(status), value: counts.get(status) })),
    total: listings.length
  };
}

/**
 * The follow-ups that are due in the next `days` days, one count per day, and the ones that are already late. Won and
 * lost leads have nothing left to follow up.
 */
export function followUpSchedule(leads = [], now = new Date(), days = 14) {
  const today = startOfDay(now);
  const buckets = Array.from({ length: days }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    return {
      key: dayKey(date),
      label: String(date.getDate()),
      longLabel: date.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" }),
      today: offset === 0,
      value: 0
    };
  });
  let overdue = 0;
  let later = 0;
  for (const lead of leads) {
    if (CLOSED.has(lead.status)) continue;
    const day = toDay(lead.followUpDate);
    if (!day) continue;
    const offset = daysFrom(today, day);
    if (offset < 0) overdue += 1;
    else if (offset < days) buckets[offset].value += 1;
    else later += 1;
  }
  const upcoming = sum(buckets, (bucket) => bucket.value);
  return { buckets, overdue, later, upcoming, total: overdue + upcoming + later };
}

/**
 * The average rent per square metre and year in each area (the highest first), from the listings that state both a rent and
 * a size. `count` is how many listings that is.
 */
export function rentByDistrict(listings = [], limit = 6) {
  const groups = new Map();
  let count = 0;
  for (const item of listings) {
    const rent = number(item.priceMonthly);
    const area = number(item.sizeSqm);
    if (!item.district || rent <= 0 || area <= 0) continue;
    const group = groups.get(item.district) || { district: item.district, yearlyRent: 0, area: 0, count: 0 };
    group.yearlyRent += rent * 12;
    group.area += area;
    group.count += 1;
    count += 1;
    groups.set(item.district, group);
  }
  const rows = Array.from(groups.values())
    .map((group) => ({ district: group.district, value: Math.round(group.yearlyRent / group.area), count: group.count }))
    .sort((a, b) => b.value - a.value || a.district.localeCompare(b.district, "sv"))
    .slice(0, limit);
  return { rows, count };
}

const FIT_BUCKETS = [
  { key: "under-60", label: "Under 60", min: 0, max: 59 },
  { key: "60-69", label: "60–69", min: 60, max: 69 },
  { key: "70-79", label: "70–79", min: 70, max: 79 },
  { key: "80-89", label: "80–89", min: 80, max: 89 },
  { key: "90-plus", label: "90+", min: 90, max: Infinity }
];

/** How well the leads match the listings (their fit score, 0 to 100), in steps of ten. */
export function fitDistribution(leads = []) {
  const scores = leads.map((lead) => lead.fitScore).filter((score) => score != null && Number.isFinite(Number(score))).map(Number);
  const buckets = FIT_BUCKETS.map(({ key, label, min, max }) => ({
    key,
    label,
    value: scores.filter((score) => score >= min && score <= max).length
  }));
  return { buckets, count: scores.length, average: scores.length ? Math.round(sum(scores, (score) => score) / scores.length) : null };
}

const AGE_BUCKETS = [
  { key: "week", label: "Under 1 v", below: 7 },
  { key: "month", label: "1–4 v", below: 31 },
  { key: "quarter", label: "1–3 mån", below: 91 },
  { key: "older", label: "Över 3 mån", below: Infinity }
];

/** How long the listings that are out on the market have been there, in four steps. */
export function listingAge(listings = [], now = new Date()) {
  const ages = listings
    .filter((item) => item.status === "active" || item.status === "negotiating")
    .map((item) => toDate(item.createdAt) || toDate(item.updatedAt))
    .filter(Boolean)
    .map((date) => Math.max(0, daysFrom(date, now)));
  const buckets = AGE_BUCKETS.map((bucket, index) => {
    const from = index === 0 ? 0 : AGE_BUCKETS[index - 1].below;
    return { key: bucket.key, label: bucket.label, value: ages.filter((age) => age >= from && age < bucket.below).length };
  });
  return { buckets, count: ages.length, average: ages.length ? Math.round(sum(ages, (age) => age) / ages.length) : null };
}
