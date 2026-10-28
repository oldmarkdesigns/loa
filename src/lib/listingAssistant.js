import { parseAmenities } from "./formatters";
import { propertyAmenityDefinitions } from "./propertyAmenityIcons";
import { districtOptions } from "./profileHelpers";

// Logic behind the assistant in "Redigera objekt". Plain rules over the listing being edited (and, for the market
// comparison, the other listings the app has loaded): no model call and no network. ListingAssistant.jsx renders the
// conversation; a real model could later replace answerListingQuestion() without touching it, since the UI only
// depends on the shapes returned here.
//
// A "change" is one edit to the form: { key, label, detail?, patch }. `patch` is { field, value } for a plain field, or
// { field: "amenities", add: [...], remove: [...] }. Changes are only ever applied to the form by applyChanges().

const districts = districtOptions.filter((name) => name !== "Alla");
const placeholderImage = "/object-images/object-1.jpeg";

export const fieldTargets = {
  title: { tab: "details", label: "rubriken" },
  type: { tab: "details", label: "lokaltypen" },
  district: { tab: "details", label: "området" },
  address: { tab: "details", label: "adressen" },
  sizeSqm: { tab: "details", label: "storleken" },
  capacity: { tab: "details", label: "antalet platser" },
  priceMonthly: { tab: "pricing", label: "hyran" },
  term: { tab: "pricing", label: "avtalstiden" },
  contractFlex: { tab: "pricing", label: "avtalsflexen" },
  availability: { tab: "availability", label: "tillgängligheten" },
  moveInDate: { tab: "availability", label: "inflyttningsdatumet" },
  responseHours: { tab: "availability", label: "svarstiden" },
  transitDistance: { tab: "location", label: "kommunikationerna" },
  accessHours: { tab: "location", label: "accessen" },
  parkingType: { tab: "location", label: "parkeringen" },
  layoutType: { tab: "location", label: "planlösningen" },
  includeOperatingCosts: { tab: "terms", label: "villkoren" },
  amenities: { tab: "amenities", label: "bekvämligheterna" },
  image: { tab: "media", label: "bilderna" },
  description: { tab: "description", label: "beskrivningen" }
};

const amenityIdeas = {
  Kontor: ["Fiber", "Mötesrum", "Kök", "Reception"],
  Coworking: ["Fiber", "Kaffezon", "Mötesrum", "Telefonbås"],
  Studio: ["Fiber", "Ljusskenor", "Högt i tak", "Kök"],
  Butik: ["Skyltfönster", "Lastzon", "Förråd", "Säkerhetsdörr"],
  Klinik: ["Väntrum", "Säkerhetsdörr", "Fiber", "Dusch"]
};

const plural = (count, one, many) => (count === 1 ? one : many);
const sek = (value) => `${Math.round(value).toLocaleString("sv-SE")} kr`;
const norm = (value) => String(value || "").trim().toLowerCase();
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const list = (items) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} och ${items[items.length - 1]}`);

// A number as people write it: "45 000", "45000", "2 400,50".
const NUM = "(\\d{1,3}(?:[\\s\\u00a0]\\d{3})+|\\d+)(?:[.,](\\d+))?";
const toNumber = (whole, fraction) => Number(`${String(whole).replace(/[\s ]/g, "")}${fraction ? `.${fraction}` : ""}`);
const navChip = (id, label, field) => ({ id, label, intent: { type: "focus", field } });
const askChip = (id, label, text = label) => ({ id, label, intent: { type: "ask", text } });

// ── Review ───────────────────────────────────────────────────────────────────────────────────

/** What is missing or thin in the listing as it stands in the form, most useful first. */
export function reviewListing({ draft, listing }) {
  const amenities = parseAmenities(draft.amenities);
  const title = draft.title.trim();
  const findings = [];
  if (title.length < 14 || /^(test|ny annons|namnlös)/i.test(title)) {
    findings.push({ id: "title", field: "title", kind: "title", text: "Rubriken är kort eller allmän – en tydlig rubrik ger fler visningar", cta: "Föreslå" });
  }
  if (draft.description.trim().length < 80) {
    findings.push({ id: "description", field: "description", kind: "description", text: draft.description.trim() ? "Beskrivningen är kort" : "Beskrivning saknas", cta: "Skriv" });
  }
  if (amenities.length < 4) {
    findings.push({ id: "amenities", field: "amenities", kind: "amenities", text: amenities.length === 0 ? "Inga bekvämligheter är valda" : `Bara ${amenities.length} ${plural(amenities.length, "bekvämlighet", "bekvämligheter")} valda`, cta: "Föreslå" });
  }
  if (!(Number(draft.priceMonthly) > 0)) findings.push({ id: "price", field: "priceMonthly", text: "Hyran saknas", cta: "Visa fältet" });
  if (!(Number(draft.sizeSqm) > 0)) findings.push({ id: "size", field: "sizeSqm", text: "Storleken saknas", cta: "Visa fältet" });
  if (!draft.address.trim()) findings.push({ id: "address", field: "address", text: "Adressen saknas", cta: "Visa fältet" });
  if (!(Number(draft.capacity) > 0)) findings.push({ id: "capacity", field: "capacity", text: "Antal platser saknas", cta: "Visa fältet" });
  const images = draft.images || [];
  if (images.length === 0 || (images.length === 1 && images[0].src === placeholderImage)) findings.push({ id: "image", field: "image", text: "Ingen egen bild är uppladdad", cta: "Visa bilder" });
  return findings;
}

const iconForFinding = { title: "file-pen", description: "file-pen", amenities: "sparkles", price: "coins", size: "ruler", capacity: "users", address: "map-pin", image: "image" };

export function buildListingBriefing(ctx) {
  const findings = reviewListing(ctx);
  if (findings.length === 0) {
    return {
      text: "Annonsen ser komplett ut. Vill du att jag jämför hyran med liknande objekt eller finslipar rubriken?",
      chips: [askChip("compare", "Jämför hyran", "Jämför hyran med liknande objekt"), askChip("title", "Ny rubrik", "Föreslå en bättre rubrik")]
    };
  }
  const suggestions = findings.slice(0, 4).map((finding) => ({
    id: finding.id,
    icon: iconForFinding[finding.id],
    text: finding.text,
    cta: finding.cta,
    action: finding.kind ? { type: "propose", kind: finding.kind } : { type: "focus", field: finding.field }
  }));
  return {
    text: `Jag har gått igenom annonsen: ${findings.length} ${plural(findings.length, "sak", "saker")} kan bli bättre. Jag fixar flera i ett svep, eller så säger du vad du vill ändra – till exempel “sätt hyran till 45 000 och lägg till parkering”.`,
    suggestions,
    chips: [{ id: "improve", label: "Förbättra allt", intent: { type: "improve" } }, askChip("compare", "Jämför hyran", "Jämför hyran med liknande objekt")]
  };
}

// ── Suggestions the assistant writes itself ──────────────────────────────────────────────────

function placeOf(ctx) {
  return [ctx.draft.district, ctx.draft.address].filter(Boolean).join(", ");
}

export function suggestTitle({ draft, listing }) {
  const type = draft.type || listing?.type || "Lokal";
  const size = Number(draft.sizeSqm) > 0 ? ` på ${Math.round(Number(draft.sizeSqm))} kvm` : "";
  const district = draft.district ? ` i ${draft.district}` : "";
  const street = draft.address.split(",")[0].trim();
  const title = `${type}${size}${district}`;
  return street && title.length + street.length < 56 ? `${title} – ${street}` : title;
}

export function describeListing({ draft, listing }) {
  const type = draft.type || listing?.type || "Lokal";
  const size = Number(draft.sizeSqm) > 0 ? ` om ${Math.round(Number(draft.sizeSqm))} kvm` : "";
  const place = placeOf({ draft });
  const amenities = parseAmenities(draft.amenities).slice(0, 5).map((item) => item.toLowerCase());
  return [
    `${type}${size}${place ? ` – ${place}` : ""}.`,
    amenities.length > 0 ? `I lokalen och fastigheten finns ${list(amenities)}.` : "",
    Number(draft.priceMonthly) > 0 ? `Hyra: ${sek(Number(draft.priceMonthly))} per månad.` : "",
    "Hör av dig så bokar vi en visning."
  ].filter(Boolean).join(" ");
}

export function suggestAmenities({ draft, listing }) {
  const have = parseAmenities(draft.amenities).map(norm);
  const ideas = (amenityIdeas[draft.type || listing?.type] || ["Fiber", "Mötesrum", "Kök", "Reception"]).filter((name) => !have.includes(norm(name)));
  const missing = Math.max(1, 4 - have.length);
  return ideas.slice(0, Math.min(3, missing));
}

/** Rent per square metre and year across similar listings, and where this one stands. */
export function compareRent({ draft, listing, others = [] }) {
  const size = Number(draft.sizeSqm);
  const price = Number(draft.priceMonthly);
  if (!(size > 0) || !(price > 0)) return { ok: false, reason: "missing" };
  const usable = others.filter((item) => Number(item.sizeSqm) > 0 && Number(item.priceMonthly) > 0);
  const kind = draft.type || listing?.type;
  const sameKind = (item) => (!kind || !item.type || item.type === kind);
  const pool = [usable.filter((item) => item.district === draft.district && sameKind(item)), usable.filter((item) => item.district === draft.district), usable.filter(sameKind)]
    .find((group) => group.length >= 2);
  if (!pool) return { ok: false, reason: "few" };
  const rates = pool.map((item) => (Number(item.priceMonthly) * 12) / Number(item.sizeSqm)).sort((a, b) => a - b);
  const median = rates.length % 2 ? rates[(rates.length - 1) / 2] : (rates[rates.length / 2 - 1] + rates[rates.length / 2]) / 2;
  const own = (price * 12) / size;
  return { ok: true, count: pool.length, own, median, min: rates[0], max: rates[rates.length - 1], ratio: own / median, medianMonthly: Math.round((median * size) / 12 / 500) * 500 };
}

// ── Reading a request ────────────────────────────────────────────────────────────────────────

const boundary = "(?=\\s*(?:[,;.]\\s*|\\s+och\\s+)(?:sätt|ändra|byt|lägg|ta bort|pris|hyra|storlek|yta|område|adress|rubrik|titel|beskrivning|skriv)\\b|\\s*$)";

function findAmenityMentions(text) {
  const matches = [];
  for (const definition of propertyAmenityDefinitions) {
    const names = [definition.label, ...definition.aliases].map(norm).filter((name) => new RegExp(`(^|[^a-zåäö])${escapeRegExp(name)}($|[^a-zåäö])`).test(text));
    if (names.length > 0) matches.push({ label: definition.label, names });
  }
  const ownNames = new Set(matches.map((match) => norm(match.label)));
  return matches
    .map((match) => ({ ...match, names: match.names.filter((name) => name === norm(match.label) || !ownNames.has(name)) }))
    .filter((match) => match.names.length > 0)
    .map((match) => match.label);
}

/**
 * Turns "sätt hyran till 45 000, lägg till fiber och ta bort garage" into a list of changes to the form. Every
 * part is read on its own, so one message can change many fields; what was not understood is left alone.
 */
export function interpretListingEdit(raw, ctx) {
  const { draft } = ctx;
  const changes = [];
  let rest = ` ${String(raw || "").trim()} `;
  const take = (match) => {
    rest = rest.replace(match[0], " ");
    return match;
  };

  const title = rest.match(new RegExp(`(?:rubrik|titel|namn)\\w*\\s*(?:till|:|=|blir)\\s*["“”'‘’]?(.+?)["“”'‘’]?${boundary}`, "i"));
  if (title && title[1].trim()) {
    take(title);
    changes.push({ key: "title", label: `Rubrik: “${title[1].trim()}”`, patch: { field: "title", value: title[1].trim() } });
  }
  const address = rest.match(new RegExp(`adress\\w*\\s*(?:till|:|=|är)\\s*["“”'‘’]?(.+?)["“”'‘’]?${boundary}`, "i"));
  if (address && address[1].trim()) {
    take(address);
    changes.push({ key: "address", label: `Adress: ${address[1].trim()}`, patch: { field: "address", value: address[1].trim() } });
  }

  const q = rest.toLowerCase();

  const size = q.match(new RegExp(`(?:storlek|yta|areal)\\w*\\s*(?:till|på|:|=|är|blir)?\\s*${NUM}(?!\\s*kr)`)) || q.match(new RegExp(`${NUM}\\s*(?:kvm|m2|m²)(?!\\s*(?:\\/|per))`));
  const sizeValue = size ? toNumber(size[1], size[2]) : null;
  if (sizeValue && sizeValue > 0) {
    changes.push({ key: "sizeSqm", label: `Storlek: ${sizeValue.toLocaleString("sv-SE")} kvm`, patch: { field: "sizeSqm", value: String(sizeValue) } });
  }
  const effectiveSize = sizeValue && sizeValue > 0 ? sizeValue : Number(draft.sizeSqm);
  const currentPrice = Number(draft.priceMonthly);

  const relative = q.match(new RegExp(`(höj|sänk|öka|minska)\\w*\\s+(?:pris|hyra|månadshyra)\\w*\\s+(?:med\\s+)?${NUM}\\s*(%|procent|kr|:-)?`));
  const perSquare = q.match(new RegExp(`(?:pris|hyra|månadshyra)\\w*\\s*(?:till|på|:|=|är|blir)?\\s*${NUM}\\s*(?:kr|:-)?\\s*(?:\\/|per)\\s*(?:kvm|m2|m²)`));
  const absolute = q.match(new RegExp(`(?:pris|hyra|månadshyra)\\w*\\s*(?:till|på|:|=|är|blir|ska vara|bör vara|ligger på|runt|cirka|ca)?\\s*${NUM}\\s*(?:kr|:-|sek)?(?!\\s*(?:\\/|per)\\s*(?:kvm|m2|m²))`))
    || q.match(new RegExp(`${NUM}\\s*(?:kr|:-)?\\s*(?:\\/|per)\\s*(?:mån|månad)`));
  let price = null;
  let priceNote = "";
  if (relative && currentPrice > 0) {
    const amount = toNumber(relative[2], relative[3]);
    const sign = /^(höj|öka)/.test(relative[1]) ? 1 : -1;
    price = relative[4] === "%" || relative[4] === "procent" ? currentPrice * (1 + (sign * amount) / 100) : currentPrice + sign * amount;
    priceNote = ` (${sign > 0 ? "+" : "−"}${amount.toLocaleString("sv-SE")}${relative[4] === "%" || relative[4] === "procent" ? " %" : " kr"})`;
  } else if (perSquare && effectiveSize > 0) {
    price = (toNumber(perSquare[1], perSquare[2]) * effectiveSize) / 12;
    priceNote = ` (${toNumber(perSquare[1], perSquare[2]).toLocaleString("sv-SE")} kr/kvm och år)`;
  } else if (absolute) {
    price = toNumber(absolute[1], absolute[2]);
  }
  if (price !== null && Number.isFinite(price) && price >= 0) {
    price = Math.round(price);
    changes.push({ key: "priceMonthly", label: `Hyra: ${sek(price)} per månad${priceNote}`, patch: { field: "priceMonthly", value: String(price) } });
  }

  if (/(område|ligger|byt|ändra|flytta|ligger i)/.test(q) || /\bi\s+\p{L}/u.test(q)) {
    const district = districts.find((name) => new RegExp(`(^|[^a-zåäö])${escapeRegExp(norm(name))}($|[^a-zåäö])`).test(q));
    if (district && district !== draft.district) {
      changes.push({ key: "district", label: `Område: ${district}`, patch: { field: "district", value: district } });
    }
  }

  // Amenities: "lägg till fiber och parkering, ta bort garage". A verb sets the mode for the names that follow it.
  const add = [];
  const remove = [];
  let mode = null;
  for (const clause of q.split(/[,;.]|\boch\b|\bsamt\b/)) {
    if (/(ta bort|radera|utan|behöver inte|finns inte)/.test(clause)) mode = "remove";
    else if (/(lägg till|lägg in|med|har|finns|inkludera|även|aktivera|plus)/.test(clause)) mode = "add";
    for (const name of findAmenityMentions(clause)) {
      if ((mode || "add") === "remove") remove.push(name);
      else add.push(name);
    }
  }
  const have = parseAmenities(draft.amenities).map(norm);
  const toAdd = [...new Set(add)].filter((name) => !have.includes(norm(name)));
  const toRemove = [...new Set(remove)].filter((name) => have.includes(norm(name)));
  if (toAdd.length > 0) changes.push({ key: "amenities-add", label: `Lägg till: ${list(toAdd)}`, patch: { field: "amenities", add: toAdd, remove: [] } });
  if (toRemove.length > 0) changes.push({ key: "amenities-remove", label: `Ta bort: ${list(toRemove)}`, patch: { field: "amenities", add: [], remove: toRemove } });
  return changes;
}

/** Applies the chosen changes to a form draft and returns the new draft. */
export function applyChanges(draft, changes) {
  const next = { ...draft };
  for (const { patch } of changes) {
    if (patch.field === "amenities") {
      const removed = (patch.remove || []).map(norm);
      const kept = parseAmenities(next.amenities).filter((item) => !removed.includes(norm(item)));
      for (const name of patch.add || []) {
        if (!kept.some((item) => norm(item) === norm(name))) kept.push(name);
      }
      next.amenities = kept.join(", ");
    } else {
      next[patch.field] = patch.value;
    }
  }
  return next;
}

// ── Whole-listing proposals ──────────────────────────────────────────────────────────────────

function titleChange(ctx) {
  const value = suggestTitle(ctx);
  return { key: "title", label: `Rubrik: “${value}”`, patch: { field: "title", value } };
}

function descriptionChange(ctx) {
  const value = describeListing(ctx);
  return { key: "description", label: ctx.draft.description.trim() ? "Ersätt beskrivningen med ett nytt utkast" : "Lägg till en beskrivning", detail: value, patch: { field: "description", value } };
}

function amenitiesChange(ctx) {
  const names = suggestAmenities(ctx);
  return names.length > 0 ? { key: "amenities-add", label: `Lägg till: ${list(names)}`, patch: { field: "amenities", add: names, remove: [] } } : null;
}

function rentChange(ctx) {
  const comparison = compareRent(ctx);
  if (!comparison.ok || Math.abs(comparison.ratio - 1) < 0.1 || comparison.medianMonthly <= 0) return null;
  return { key: "priceMonthly", label: `Hyra: ${sek(comparison.medianMonthly)} per månad (medianen för liknande)`, patch: { field: "priceMonthly", value: String(comparison.medianMonthly) } };
}

/** Everything the review found that can be written for the person, as one proposal. */
export function improveAll(ctx) {
  const findings = reviewListing(ctx).map((finding) => finding.kind);
  return [
    findings.includes("title") ? titleChange(ctx) : null,
    findings.includes("amenities") ? amenitiesChange(ctx) : null,
    findings.includes("description") ? descriptionChange({ ...ctx, draft: applyChanges(ctx.draft, [amenitiesChange(ctx)].filter(Boolean)) }) : null
  ].filter(Boolean);
}

export function proposalFor(kind, ctx) {
  const change = { title: titleChange, description: descriptionChange, amenities: amenitiesChange, rent: rentChange }[kind]?.(ctx);
  return change ? [change] : [];
}

// ── Answers ──────────────────────────────────────────────────────────────────────────────────

const helpText = [
  "Jag kan ändra flera saker i annonsen i ett svep, till exempel:",
  "• “Sätt hyran till 45 000 och lägg till parkering”",
  "• “Ändra rubriken till Ljust hörnkontor och byt område till Vasastan”",
  "• “Höj hyran med 5 %” eller “2 400 kr/kvm och år”",
  "• “Skriv en beskrivning” eller “Förbättra allt”",
  "Jag kan också jämföra hyran med liknande objekt och visa var något finns."
].join("\n");

/**
 * Answers a request about the listing. Returns { text, chips?, suggestions? } and, when the answer is edits to the
 * form, `changes` for the caller to offer as a proposal.
 */
export function answerListingQuestion(raw, ctx) {
  const q = norm(raw);
  const has = (pattern) => pattern.test(q);

  if (has(/^(hej|hallå|tjena)(?![a-zåäö])/) && q.split(/\s+/).length <= 3) return { text: "Hej! Vad vill du ändra i annonsen?", chips: [{ id: "improve", label: "Förbättra allt", intent: { type: "improve" } }] };
  if (has(/^(tack|tusen tack|perfekt|toppen)[\s!.]*$/)) return { text: "Varsågod! Säg till om du vill ändra något mer." };

  // Where things are: point at the field instead of editing it.
  if (has(/^(var|hur)(?![a-zåäö]).*(?<![a-zåäö])(ändrar|ändra|byter|byta|lägger|lägga|laddar|ladda|hittar|hitta|redigerar|redigera)(?![a-zåäö])/) && !/\d/.test(q)) {
    const target = has(/(bild|foto|omslag)/) ? "image"
      : has(/(bekvämlig|utrustning|möbler)/) ? "amenities"
      : has(/beskrivning/) ? "description"
      : has(/(avtalstid|hyrestid|avtal)/) ? "term"
      : has(/(inflytt)/) ? "moveInDate"
      : has(/(tillgänglig|ledig)/) ? "availability"
      : has(/svarstid/) ? "responseHours"
      : has(/(kommunikation|kollektiv|tunnelbana)/) ? "transitDistance"
      : has(/(access|tillträde)/) ? "accessHours"
      : has(/parkering/) ? "parkingType"
      : has(/planlösning/) ? "layoutType"
      : has(/(driftkostnad|villkor|miljöcert|tillgänglighetsanpass)/) ? "includeOperatingCosts"
      : has(/(platser|team|kapacitet)/) ? "capacity"
      : has(/(pris|hyra)/) ? "priceMonthly"
      : has(/(storlek|yta|kvm)/) ? "sizeSqm"
      : has(/(område|adress)/) ? "district"
      : has(/(rubrik|titel)/) ? "title"
      : has(/(typ|lokaltyp)/) ? "type"
      : null;
    if (target) return { text: `Du hittar ${fieldTargets[target].label} här:`, chips: [navChip(`focus-${target}`, `Visa ${fieldTargets[target].label}`, target)] };
  }
  if (has(/(publicera|dölj|aktivera|radera|ta bort annonsen)/) && !has(/(lägg|bekvämlig|garage|fiber)/)) {
    return { text: "Publicera, dölj och radera hittar du längst ned i fönstret. Spara ändringarna först – knapparna för publicering är låsta så länge det finns osparade ändringar." };
  }

  if (has(/(jämför|jämförelse|marknad|liknande objekt|rimlig|bra pris|för högt|för lågt|prissätt)/)) {
    const comparison = compareRent(ctx);
    if (!comparison.ok) {
      return comparison.reason === "missing"
        ? { text: "Fyll i storlek och hyra först, så jämför jag med liknande objekt.", chips: [navChip("focus-price", "Visa hyran", "priceMonthly"), navChip("focus-size", "Visa storleken", "sizeSqm")] }
        : { text: "Jag hittar för få liknande objekt att jämföra med just nu." };
    }
    const place = ctx.draft.district ? ` i ${ctx.draft.district}` : "";
    const verdict = comparison.ratio > 1.15 ? "Du ligger över medianen, vilket kan ge färre förfrågningar." : comparison.ratio < 0.85 ? "Du ligger under medianen – det finns utrymme att höja." : "Du ligger i linje med marknaden.";
    const change = rentChange(ctx);
    return {
      text: `Din hyra motsvarar ${sek(comparison.own)} per kvm och år. ${comparison.count} liknande objekt${place} ligger mellan ${sek(comparison.min)} och ${sek(comparison.max)}, med medianen ${sek(comparison.median)}. ${verdict}`,
      changes: change ? [change] : undefined
    };
  }

  const wantsAll = has(/(förbättra|fixa|optimera|gör).{0,20}(allt|annons|objektet|alla)|förbättra annonsen|fixa allt|förbättra allt/);
  if (wantsAll) {
    const changes = improveAll(ctx);
    return changes.length > 0 ? { text: "Så här skulle jag förbättra annonsen. Bocka ur det du inte vill ha.", changes } : { text: "Annonsen har redan det viktigaste. Jag kan jämföra hyran med liknande objekt om du vill.", chips: [askChip("compare", "Jämför hyran", "Jämför hyran med liknande objekt")] };
  }

  const edits = interpretListingEdit(raw, ctx);
  const asks = {
    description: has(/(skriv|generera|ta fram|föreslå|förbättra|formulera|gör).{0,30}(beskrivning|annonstext|texten)/),
    title: has(/(föreslå|bättre|förbättra|skriv|formulera|ny|hitta på).{0,20}(rubrik|titel)/) && !edits.some((change) => change.key === "title"),
    amenities: has(/(föreslå|vilka|passar|saknas|rekommendera).{0,30}(bekvämlig|utrustning)/)
  };
  const generated = [asks.title ? titleChange(ctx) : null, asks.amenities ? amenitiesChange(ctx) : null, asks.description ? descriptionChange({ ...ctx, draft: applyChanges(ctx.draft, edits) }) : null].filter(Boolean);
  const changes = [...edits.filter((change) => !generated.some((item) => item.key === change.key)), ...generated];
  if (changes.length > 0) {
    return { text: changes.length === 1 ? "Så här skulle jag ändra:" : `Jag hittade ${changes.length} ändringar. Bocka ur det du inte vill ha.`, changes };
  }

  if (has(/(hjälp|vad kan du|vad kan jag)/)) return { text: helpText, chips: [{ id: "improve", label: "Förbättra allt", intent: { type: "improve" } }, askChip("compare", "Jämför hyran", "Jämför hyran med liknande objekt")] };
  return {
    text: `Det där förstod jag inte riktigt. ${helpText}`,
    chips: [{ id: "improve", label: "Förbättra allt", intent: { type: "improve" } }, askChip("compare", "Jämför hyran", "Jämför hyran med liknande objekt")]
  };
}
