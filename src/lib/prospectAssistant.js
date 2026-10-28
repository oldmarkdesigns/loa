// Logic behind the assistant in "Redigera prospekt". Plain rules over the prospect being edited (its title and sections)
// and the listing it presents: no model call and no network. ProspectAssistant.jsx renders the conversation; the UI
// only depends on the shapes returned here.
//
// A "change" is one edit to the prospect: { key, label, detail?, patch }, where `patch` is one of
//   { kind: "title", value }                          the prospect's title
//   { kind: "body", section, value }                  the free text of a section
//   { kind: "field", section, field, value }          one structured field ("terms", "location" and "contact")
// Changes are only ever applied by applyProspectChanges().

const plural = (count, one, many) => (count === 1 ? one : many);
const norm = (value) => String(value || "").trim().toLowerCase();
const list = (items) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} och ${items[items.length - 1]}`);
const askChip = (id, label, text = label) => ({ id, label, intent: { type: "ask", text } });
const improveChip = { id: "improve", label: "Förbättra allt", intent: { type: "improve" } };

const fieldLabels = {
  term: "Hyrestid",
  noticePeriod: "Uppsägningstid",
  deposit: "Deposition",
  transit: "Kollektivtrafik",
  parking: "Parkering",
  neighborhood: "Närområde",
  firstName: "Förnamn",
  lastName: "Efternamn",
  phone: "Telefon",
  email: "E-post"
};

/** Where things live: the sections of the prospect, and the other tabs of the workspace. */
export const prospectTargets = {
  overview: { label: "översikten" },
  description: { label: "lokalbeskrivningen" },
  terms: { label: "hyresvillkoren" },
  location: { label: "läget" },
  contact: { label: "kontaktpersonen" },
  materials: { label: "bilagorna" },
  kommentarer: { label: "kommentarerna" },
  samarbete: { label: "delningen" },
  installningar: { label: "inställningarna" }
};

const sectionOf = (sections, kind) => sections.find((section) => section.kind === kind);
const fieldOf = (sections, kind, key) => String(sectionOf(sections, kind)?.fields?.[key] || "").trim();
const bodyOf = (sections, kind) => String(sectionOf(sections, kind)?.body || "").trim();
const missingFields = (sections, kind, keys) => keys.filter((key) => !fieldOf(sections, kind, key));

// ── Review ───────────────────────────────────────────────────────────────────────────────────

/** What is missing or thin in the prospect, most useful first. `section` says where the person can go to fix it. */
export function reviewProspect({ title, sections }) {
  const findings = [];
  if (title.trim().length < 8) {
    findings.push({ id: "title", kind: "title", text: "Prospektet saknar en tydlig titel", cta: "Föreslå" });
  }
  const description = bodyOf(sections, "description");
  if (description.length < 80) {
    findings.push({ id: "description", kind: "description", section: "description", text: description ? "Lokalbeskrivningen är kort" : "Lokalbeskrivning saknas", cta: "Skriv" });
  }
  const terms = missingFields(sections, "terms", ["term", "noticePeriod", "deposit"]);
  if (terms.length > 0) {
    findings.push({ id: "terms", kind: "terms", section: "terms", text: terms.length === 3 ? "Hyresvillkoren är inte ifyllda" : `Hyresvillkor saknas: ${list(terms.map((key) => fieldLabels[key].toLowerCase()))}`, cta: "Föreslå" });
  }
  const location = missingFields(sections, "location", ["transit", "parking", "neighborhood"]);
  if (location.length > 0) {
    findings.push({ id: "location", kind: "location", section: "location", text: location.length === 3 ? "Läget och kommunikationerna är inte ifyllda" : `Läget saknar ${list(location.map((key) => fieldLabels[key].toLowerCase()))}`, cta: "Föreslå" });
  }
  const contact = missingFields(sections, "contact", ["firstName", "phone", "email"]);
  if (contact.length > 0) {
    findings.push({ id: "contact", kind: "contact", section: "contact", text: contact.length === 3 ? "Kontaktperson saknas" : `Kontaktpersonen saknar ${list(contact.map((key) => fieldLabels[key].toLowerCase()))}`, cta: "Fyll i" });
  }
  if (!sections.some((section) => (section.attachments || []).length > 0)) {
    findings.push({ id: "materials", section: "materials", text: "Inga bilagor är uppladdade", cta: "Visa material" });
  }
  return findings;
}

const iconForFinding = { title: "file-pen", description: "file-pen", terms: "coins", location: "map-pin", contact: "user", materials: "paperclip" };

export function buildProspectBriefing(ctx) {
  const findings = reviewProspect(ctx);
  if (findings.length === 0) {
    return { text: "Prospektet ser komplett ut. Vill du att jag finslipar lokalbeskrivningen eller föreslår en ny titel?", chips: [askChip("description", "Ny beskrivning", "Skriv en lokalbeskrivning"), askChip("title", "Ny titel", "Föreslå en titel")] };
  }
  return {
    text: `Jag har gått igenom prospektet: ${findings.length} ${plural(findings.length, "sak", "saker")} kan bli bättre. Jag fyller i flera i ett svep, eller så säger du vad du vill ändra – till exempel “sätt uppsägningstiden till 6 månader”.`,
    suggestions: findings.slice(0, 4).map((finding) => ({
      id: finding.id,
      icon: iconForFinding[finding.id],
      text: finding.text,
      cta: finding.cta,
      action: finding.kind ? { type: "propose", kind: finding.kind } : { type: "focus", target: finding.section }
    })),
    chips: [improveChip]
  };
}

// ── What the assistant writes itself ─────────────────────────────────────────────────────────

const money = (value) => `${Math.round(Number(value)).toLocaleString("sv-SE")} kr`;

export function suggestProspectTitle({ listing }) {
  return listing?.title ? `${listing.title} – presentation` : "Presentation av lokalen";
}

/** A description from what is known about the listing: its own text when it has one, otherwise the facts. */
export function describeForProspect({ listing }) {
  if (String(listing?.description || "").trim().length >= 40) return String(listing.description).trim();
  const size = Number(listing?.sizeSqm) > 0 ? ` om ${Math.round(Number(listing.sizeSqm))} kvm` : "";
  const place = [listing?.district, listing?.address].filter(Boolean).join(", ");
  const amenities = (Array.isArray(listing?.amenities) ? listing.amenities : []).slice(0, 5).map((item) => String(item).toLowerCase());
  return [
    `${listing?.type || "Lokal"}${size}${place ? ` – ${place}` : ""}.`,
    Number(listing?.capacity) > 0 ? `Plats för ${Math.round(Number(listing.capacity))} personer.` : "",
    amenities.length > 0 ? `I lokalen och fastigheten finns ${list(amenities)}.` : "",
    Number(listing?.priceMonthly) > 0 ? `Hyran är ${money(listing.priceMonthly)} per månad.` : ""
  ].filter(Boolean).join(" ");
}

function fieldChange(section, field, value) {
  return { key: `${section}.${field}`, label: `${fieldLabels[field]}: ${value}`, patch: { kind: "field", section, field, value } };
}

/** Sensible defaults for the terms; the person still reads them through before they are used. */
function termsChanges({ sections, listing }) {
  const term = /^\d+ månader$/.test(String(listing?.term || "")) ? listing.term : "12 månader";
  const wanted = { term, noticePeriod: "3 månader", deposit: "3 månadshyror" };
  return missingFields(sections, "terms", Object.keys(wanted)).map((field) => fieldChange("terms", field, wanted[field]));
}

const transitText = (value) => (value ? `${value} till kollektivtrafik` : "");

function locationChanges({ sections, listing }) {
  const amenities = (Array.isArray(listing?.amenities) ? listing.amenities : []).map(norm);
  const parking = listing?.parkingType && listing.parkingType !== "Ingen parkering" ? listing.parkingType : amenities.includes("garage") ? "Garage" : amenities.includes("parkering") ? "Parkering" : "";
  const known = { transit: transitText(listing?.transitDistance), parking, neighborhood: listing?.district ? `${listing.district}, Stockholm` : "" };
  return missingFields(sections, "location", Object.keys(known)).filter((field) => known[field]).map((field) => fieldChange("location", field, known[field]));
}

function contactChanges({ sections, user }) {
  const [first = "", ...rest] = String(user?.name || "").trim().split(/\s+/);
  const known = { firstName: first, lastName: rest.join(" "), phone: user?.phone || "", email: user?.email || "" };
  return missingFields(sections, "contact", Object.keys(known)).filter((field) => known[field]).map((field) => fieldChange("contact", field, known[field]));
}

function descriptionChange(ctx) {
  const value = describeForProspect(ctx);
  return { key: "description", label: bodyOf(ctx.sections, "description") ? "Ersätt lokalbeskrivningen med ett nytt utkast" : "Lägg till en lokalbeskrivning", detail: value, patch: { kind: "body", section: "description", value } };
}

export function proposalFor(kind, ctx) {
  if (kind === "title") {
    const value = suggestProspectTitle(ctx);
    return [{ key: "title", label: `Titel: “${value}”`, patch: { kind: "title", value } }];
  }
  if (kind === "description") return [descriptionChange(ctx)];
  if (kind === "terms") return termsChanges(ctx);
  if (kind === "location") return locationChanges(ctx);
  if (kind === "contact") return contactChanges(ctx);
  return [];
}

/** Everything the review found that can be filled in for the person, as one proposal. */
export function improveAll(ctx) {
  const kinds = reviewProspect(ctx).map((finding) => finding.kind).filter(Boolean);
  return kinds.flatMap((kind) => proposalFor(kind, ctx));
}

// ── Reading a request ────────────────────────────────────────────────────────────────────────

const monthsOrYears = (raw) => {
  const match = raw.match(/(\d+)\s*(månad\w*|mån|år)\b/i) || raw.match(/(\d+)\s*(år)/i);
  if (!match) return /tillsvidare/i.test(raw) ? "Tillsvidare" : "";
  const unit = /^år/i.test(match[2]) ? "år" : "månader";
  return `${match[1]} ${unit}`;
};

const tail = (raw, word) => raw.match(new RegExp(`${word}\\w*\\s*(?::|till|är|=)\\s*(.+?)\\s*$`, "i"))?.[1]?.trim() || "";

/** Turns “sätt uppsägningstiden till 6 månader och deposition 3 månadshyror” into changes; each part is read on its own. */
export function interpretProspectEdit(raw, { sections }) {
  const text = String(raw || "").trim();
  const q = text.toLowerCase();
  const changes = [];
  const push = (change) => {
    if (change && !changes.some((item) => item.key === change.key)) changes.push(change);
  };

  const title = text.match(/(?:rubrik|titel|namn)\w*\s*(?:till|:|=)\s*["“”']?(.+?)["“”']?\s*$/i);
  if (title && title[1].trim()) push({ key: "title", label: `Titel: “${title[1].trim()}”`, patch: { kind: "title", value: title[1].trim() } });

  const term = q.match(/(?:hyrestid|avtalstid|hyresperiod)\w*[^\d]{0,14}(\d+\s*(?:månad\w*|mån|år)|tillsvidare)/);
  if (term) push(fieldChange("terms", "term", monthsOrYears(term[1])));
  const notice = q.match(/uppsägning\w*[^\d]{0,14}(\d+\s*(?:månad\w*|mån|år))/);
  if (notice) push(fieldChange("terms", "noticePeriod", monthsOrYears(notice[1])));
  const deposit = q.match(/deposition\w*[^\d\wåäö]{0,14}(\d+)\s*månadshyr\w*/) || q.match(/deposition\w*\s*(?:till|på|:|=)?\s*(\d+)\s*(?:mån)/);
  if (deposit) push(fieldChange("terms", "deposit", `${deposit[1]} ${Number(deposit[1]) === 1 ? "månadshyra" : "månadshyror"}`));
  else if (/deposition\w*[^.]{0,16}bankgaranti/.test(q)) push(fieldChange("terms", "deposit", "Bankgaranti"));

  const transit = tail(text, "(?:kollektivtrafik|kommunikation|tunnelbana)");
  if (transit) push(fieldChange("location", "transit", transit));
  const parking = tail(text, "parkering");
  if (parking) push(fieldChange("location", "parking", parking));
  const neighborhood = tail(text, "(?:närområde|omgivning)");
  if (neighborhood) push(fieldChange("location", "neighborhood", neighborhood));

  if (/kontakt/.test(q)) {
    const email = text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)?.[0];
    const phone = text.match(/(\+?\d[\d\s-]{6,}\d)/)?.[1]?.trim();
    const name = (text.split(/kontakt\w*\s*(?:person\w*)?\s*[:=]?\s*/i)[1] || "").split(/[,;]/)[0].replace(email || "", "").replace(phone || "", "").trim();
    const [first, ...rest] = /^[\p{L}\s.'-]+$/u.test(name) ? name.split(/\s+/) : [];
    if (first) push(fieldChange("contact", "firstName", first));
    if (rest.length > 0) push(fieldChange("contact", "lastName", rest.join(" ")));
    if (phone) push(fieldChange("contact", "phone", phone));
    if (email) push(fieldChange("contact", "email", email));
  }
  // Nothing to ask about a value that is already there.
  return changes.filter((change) => change.patch.kind !== "field" || fieldOf(sections, change.patch.section, change.patch.field) !== change.patch.value);
}

/** Applies the chosen changes and returns the new { title, sections }. */
export function applyProspectChanges({ title, sections }, changes) {
  let nextTitle = title;
  let nextSections = sections;
  for (const { patch } of changes) {
    if (patch.kind === "title") {
      nextTitle = patch.value;
    } else if (patch.kind === "body") {
      nextSections = nextSections.map((section) => (section.kind === patch.section ? { ...section, body: patch.value } : section));
    } else if (patch.kind === "field") {
      nextSections = nextSections.map((section) => (section.kind === patch.section ? { ...section, fields: { ...(section.fields || {}), [patch.field]: patch.value } } : section));
    }
  }
  return { title: nextTitle, sections: nextSections };
}

// ── Answers ──────────────────────────────────────────────────────────────────────────────────

const helpText = [
  "Jag kan fylla i flera delar av prospektet i ett svep, till exempel:",
  "• “Sätt uppsägningstiden till 6 månader och deposition 3 månadshyror”",
  "• “Kontaktperson: Anna Svensson, 070 123 45 67, anna@bolag.se”",
  "• “Kollektivtrafik: 5 min till T-bana”",
  "• “Skriv en lokalbeskrivning” eller “Förbättra allt”",
  "Jag kan också visa var något finns."
].join("\n");

const whereTargets = [
  [/(bilaga|bilagor|material|fil|filer|ladda upp)/, "materials"],
  [/(kommentar)/, "kommentarer"],
  [/(dela|delning|samarbete|länk)/, "samarbete"],
  [/(arkivera|version|historik|inställning)/, "installningar"],
  [/(beskrivning)/, "description"],
  [/(villkor|hyrestid|uppsägning|deposition)/, "terms"],
  [/(läge|kollektiv|parkering|närområde)/, "location"],
  [/(kontakt)/, "contact"],
  [/(översikt)/, "overview"]
];

/** Answers a request about the prospect: { text, chips?, suggestions? }, with `changes` when the answer is edits to offer. */
export function answerProspectQuestion(raw, ctx) {
  const q = norm(raw);
  const has = (pattern) => pattern.test(q);

  if (has(/^(hej|hallå|tjena)(?![a-zåäö])/) && q.split(/\s+/).length <= 3) return { text: "Hej! Vad vill du ändra i prospektet?", chips: [improveChip] };
  if (has(/^(tack|tusen tack|perfekt|toppen)[\s!.]*$/)) return { text: "Varsågod! Säg till om du vill ändra något mer." };

  if (has(/^(var|hur)(?![a-zåäö]).*(?<![a-zåäö])(ändrar|ändra|lägger|lägga|laddar|ladda|hittar|hitta|delar|dela|redigerar|redigera|arkiverar|arkivera)(?![a-zåäö])/) && !/\d/.test(q)) {
    const target = whereTargets.find(([pattern]) => pattern.test(q))?.[1];
    if (target) return { text: `Du hittar ${prospectTargets[target].label} här:`, chips: [{ id: `focus-${target}`, label: `Visa ${prospectTargets[target].label}`, intent: { type: "focus", target } }] };
  }

  if (has(/(förbättra|fixa|fyll i).{0,20}(allt|prospekt|alla)|förbättra prospektet|fixa allt|förbättra allt/)) {
    const changes = improveAll(ctx);
    return changes.length > 0
      ? { text: "Så här skulle jag fylla i prospektet. Bocka ur det du inte vill ha.", changes }
      : { text: "Det finns inget mer jag kan fylla i själv. Det som återstår är uppgifter bara du känner till.", chips: [{ id: "focus-materials", label: "Visa bilagorna", intent: { type: "focus", target: "materials" } }] };
  }

  const edits = interpretProspectEdit(raw, ctx);
  const asks = {
    description: has(/(skriv|generera|ta fram|föreslå|förbättra|formulera).{0,30}(beskrivning|lokalbeskrivning|texten)/),
    title: has(/(föreslå|bättre|ny|skriv|formulera|hitta på).{0,20}(rubrik|titel)/) && !edits.some((change) => change.key === "title"),
    terms: has(/(föreslå|fyll i|lägg in).{0,20}(villkor|hyresvillkor)/),
    location: has(/(föreslå|fyll i|lägg in).{0,20}(läge|kommunikation)/),
    contact: has(/(föreslå|fyll i|lägg in).{0,20}(kontaktperson|kontaktuppgift|kontakt)/) && !/@/.test(q)
  };
  const generated = Object.entries(asks).filter(([, wanted]) => wanted).flatMap(([kind]) => proposalFor(kind, ctx));
  const changes = [...edits.filter((change) => !generated.some((item) => item.key === change.key)), ...generated];
  if (changes.length > 0) {
    return { text: changes.length === 1 ? "Så här skulle jag ändra:" : `Jag hittade ${changes.length} ändringar. Bocka ur det du inte vill ha.`, changes };
  }
  if (Object.values(asks).some(Boolean)) {
    return { text: "Jag har inget underlag att fylla i det från – uppgifterna behöver skrivas in av dig.", chips: [improveChip] };
  }

  if (has(/(hjälp|vad kan du|vad kan jag)/)) return { text: helpText, chips: [improveChip] };
  return { text: `Det där förstod jag inte riktigt. ${helpText}`, chips: [improveChip] };
}
