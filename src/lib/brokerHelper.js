// The part of the broker's assistant that does not depend on the broker's own data: small talk, rent arithmetic,
// drafts, how-to answers and a few terms of the trade. Plain rules, no model and no network, like brokerAssistant.js.
// Each function returns null when the question is not theirs, so the caller can try the next one.

const sek = (value) => `${Math.round(value).toLocaleString("sv-SE")} kr`;
const NOT_ADVICE = "Det här är allmän information och ingen juridisk eller skattemässig rådgivning.";

const navChip = (label, path) => ({ id: `nav-${path}`, label, intent: { type: "navigate", path } });
const askChip = (label, text = label) => ({ id: `ask-${text}`, label, intent: { type: "ask", text } });

// ── Small talk ───────────────────────────────────────────────────────────────────────────────

export const capabilities = [
  { id: "data", icon: "list-checks", title: "Läget just nu", text: "Leads, uppföljningar, utkast", ask: "Vad ska jag göra idag?" },
  { id: "listing-text", icon: "file-pen", title: "Annonstext", text: "Utkast till en beskrivning", ask: "Skriv en annonstext" },
  { id: "email", icon: "mail", title: "Mejl till en lead", text: "Färdigt utkast att skicka", ask: "Skriv ett mejl till en lead" },
  { id: "rent", icon: "calculator", title: "Räkna på hyra", text: "Kr/kvm, månadshyra, moms", ask: "Vad blir 2 400 kr/kvm och år för 250 kvm?" },
  { id: "import", icon: "upload", title: "Från dokument", text: "Excel och prospekt till annonser", ask: "Hur skapar jag annonser från ett dokument?" },
  { id: "terms", icon: "book-open", title: "Begrepp", text: "Kallhyra, index, anpassning", ask: "Vad är en indexklausul?" }
];

export function capabilitiesReply() {
  return {
    text: [
      "Jag är din assistent i panelen. Jag kan bland annat:",
      "• gå igenom dina leads, utkast och visningar och föreslå nästa steg",
      "• skriva utkast till annonstexter och mejl till leads",
      "• räkna på hyra (kr per kvm, månadshyra, moms)",
      "• läsa in Excel-ark och prospekt du bifogar och göra annonser av dem",
      "• förklara begrepp och visa var saker finns i panelen"
    ].join("\n"),
    chips: capabilities.slice(0, 4).map((item) => askChip(item.ask))
  };
}

export function smallTalk(q, firstName) {
  const words = q.split(/\s+/).filter(Boolean).length;
  if (words <= 3 && /^(hej|hallå|hejsan|tjena|tja|god (morgon|dag|kväll))/.test(q)) {
    return { text: `Hej${firstName ? ` ${firstName}` : ""}! Vad kan jag hjälpa dig med?`, chips: [askChip("Vad ska jag göra idag?"), askChip("Vad kan du hjälpa mig med?")] };
  }
  if (/^(tack|tusen tack|perfekt|toppen|bra)[\s!.]*$/.test(q)) {
    return { text: "Varsågod! Säg till om det är något mer." };
  }
  if (/(vem är du|vad är du|vad kan du|vad kan jag fråga|vad gör du|hjälp mig)/.test(q) || /^hjälp[\s!?.]*$/.test(q)) return capabilitiesReply();
  return null;
}

// ── Rent arithmetic ──────────────────────────────────────────────────────────────────────────

const NUM = "(\\d{1,3}(?:[\\s\\u00a0]\\d{3})+|\\d+)(?:[.,](\\d+))?";
const toNumber = (whole, fraction) => Number(`${String(whole).replace(/[\s ]/g, "")}${fraction ? `.${fraction}` : ""}`);
const numberBefore = (q, unit) => {
  const match = q.match(new RegExp(`${NUM}\\s*(?:kr|:-|sek)?\\s*${unit}`));
  return match ? toNumber(match[1], match[2]) : null;
};

/** "250 kvm à 2 400 kr/kvm och år", "48 000 kr/mån för 240 kvm", optionally with moms. */
export function calculateRent(q) {
  const area = numberBefore(q, "(?:kvm|m2|m²|kvadrat)");
  const perMonthRate = /kr\s*(?:\/|per|pr)\s*(?:kvm|m2|m²)\s*(?:\/|per|pr|och)\s*(?:mån|månad)/.test(q);
  const rate = numberBefore(q, "(?:\\/|per|pr)\\s*(?:kvm|m2|m²)");
  const monthly = numberBefore(q, "(?:\\/|per|pr|i)\\s*(?:månaden|månad|mån)(?![a-zåäö])");
  const yearly = numberBefore(q, "(?:\\/|per|pr|om|i)\\s*(?:året|år)(?![a-zåäö])");
  const withVat = /moms/.test(q);
  const asksToCalculate = /(räkna|vad blir|hur mycket|omvandla|motsvarar|blir det|kostar|omräkning)/.test(q);
  const vat = (perMonth) => (withVat ? `\nMed 25 % moms: ${sek(perMonth * 1.25)} i månaden.` : "");

  if (rate !== null && area !== null && area > 0) {
    const month = perMonthRate ? rate * area : (rate * area) / 12;
    const year = perMonthRate ? month * 12 : rate * area;
    return { text: `${area} kvm à ${sek(rate)} per kvm och ${perMonthRate ? "månad" : "år"} blir ${sek(month)} i månaden (${sek(year)} per år).${vat(month)}` };
  }
  if (monthly !== null && area !== null && area > 0) {
    return { text: `${sek(monthly)} i månaden för ${area} kvm motsvarar ${sek((monthly * 12) / area)} per kvm och år (${sek(monthly * 12)} per år).${vat(monthly)}` };
  }
  if (yearly !== null && area !== null && area > 0) {
    return { text: `${sek(yearly)} per år för ${area} kvm motsvarar ${sek(yearly / area)} per kvm och år, alltså ${sek(yearly / 12)} i månaden.${vat(yearly / 12)}` };
  }
  if (asksToCalculate && monthly !== null) return { text: `${sek(monthly)} i månaden blir ${sek(monthly * 12)} per år.${vat(monthly)}` };
  if (asksToCalculate && yearly !== null) return { text: `${sek(yearly)} per år blir ${sek(yearly / 12)} i månaden.${vat(yearly / 12)}` };
  return null;
}

// ── Drafts ───────────────────────────────────────────────────────────────────────────────────

function joinList(items) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} och ${items[items.length - 1]}`;
}

/** A description built only from what is known about the listing, so nothing in it has to be checked for truth. */
export function draftListingText(listing) {
  const place = [listing.district, listing.address].filter(Boolean).join(", ");
  const facts = `${listing.type || "Lokal"}${Number(listing.sizeSqm) > 0 ? ` om ${listing.sizeSqm} kvm` : ""}${place ? ` – ${place}` : ""}.`;
  const amenities = Array.isArray(listing.amenities) ? listing.amenities.filter(Boolean).slice(0, 5) : [];
  const parts = [
    listing.title || "Ny lokal",
    "",
    facts,
    amenities.length > 0 ? `I lokalen och fastigheten finns ${joinList(amenities.map((item) => item.toLowerCase()))}.` : "",
    Number(listing.priceMonthly) > 0 ? `Hyra: ${sek(listing.priceMonthly)} per månad.` : "",
    "Hör av dig så bokar vi en visning."
  ];
  return parts.filter((part, index) => part !== "" || index === 1).join("\n").replace(/\n{3,}/g, "\n\n");
}

/** A short mail to a lead, worded for where the lead stands. */
export function draftEmail({ lead, listingTitle, brokerName, leadName }) {
  const first = String(leadName || "").split(/\s+/)[0];
  const opening = { new: `Tack för ditt intresse för ${listingTitle}. Jag vill gärna boka en visning och berätta mer om lokalen – passar det någon dag den här veckan?`, viewing_booked: `Jag ser fram emot att visa ${listingTitle} för dig. Hör av dig om något behöver ändras inför visningen.`, negotiating: `Tack för samtalet om ${listingTitle}. Jag återkommer gärna med ett förslag på villkor – finns det något du vill att jag tar med?` };
  const body = opening[lead?.status] || `Jag hör av mig för att stämma av hur du ser på ${listingTitle} och om du har några frågor.`;
  return {
    subject: `${listingTitle}`,
    body: `Hej${first ? ` ${first}` : ""},\n\n${body}\n\nMed vänlig hälsning\n${brokerName || ""}`.trimEnd()
  };
}

// ── How-to and terms ─────────────────────────────────────────────────────────────────────────

export function howTo(q, s) {
  const isAdmin = s.paths.leads.startsWith("/app/admin");
  if (/(bjuda in|bjud in|lägga till|lägg till|ny).*(mäklare|kollega)/.test(q)) {
    return isAdmin
      ? { text: "Öppna Mäklare i menyn. Där bjuder du in kollegor med en inbjudningskod och ser vilka som är aktiva.", chips: [navChip("Öppna mäklare", "/app/admin/maklare")] }
      : { text: "Det är företagets administratör som bjuder in mäklare. Hen hittar det under Mäklare i sin panel." };
  }
  if (/(skapa|göra|ta fram|bygga|hur).*prospekt/.test(q) && !/(ladda|läs in|importera|bifoga|excel|dokument)/.test(q)) {
    return { text: "Öppna Prospekt i menyn, välj ett av dina objekt och skapa ett nytt prospekt. Du redigerar sektionerna och publicerar en version som du kan dela med intresserade.", chips: [navChip("Öppna prospekt", s.paths.prospects)] };
  }
  if (/(hur|var).{0,20}bok(a|ar|as)\b.*visning/.test(q)) {
    return { text: "Hyresgäster bokar visning via annonsen och dyker då upp som leads. Under Leads öppnar du en lead, loggar hur det gick och sätter en uppföljning.", chips: [navChip("Öppna leads", s.paths.leads)] };
  }
  if (/(meddelande|inkorg|skriva till en)/.test(q) && /(hur|var|hitta)/.test(q)) {
    return { text: "Meddelanden i menyn samlar dina konversationer. Välj en konversation för att svara, bifoga filer eller använda ett svarsförslag.", chips: [navChip("Öppna meddelanden", s.paths.messages)] };
  }
  if (/(sökläge|byta läge|växla till|se annonserna som)/.test(q)) {
    return { text: "Klicka på Växla till sökläge högst upp i menyn till vänster för att se lokalerna som en hyresgäst gör. Du kommer tillbaka via Växla till adminläge i profilmenyn uppe till höger." };
  }
  return null;
}

const glossary = [
  {
    test: /(kallhyra|varmhyra|bruttohyra|nettohyra)/,
    text: "Kallhyra (även nettohyra) är hyran utan driftkostnader som värme och el – dem betalar hyresgästen separat. Varmhyra (bruttohyra) har dem inräknade i hyran. Vilket som gäller ska stå i hyresavtalet."
  },
  {
    test: /(indexklausul|indexering|\bkpi\b|index\b)/,
    text: "En indexklausul knyter hyran till konsumentprisindex (KPI), så att den räknas upp varje år efter inflationen – ofta utifrån oktober-KPI. Hur stor del av förändringen som slår igenom, och vilket basår som gäller, regleras i avtalet."
  },
  {
    test: /(hyresgästanpassning|anpassning av (lokalen|lokal))/,
    text: "En hyresgästanpassning är en ombyggnad eller anpassning av lokalen efter hyresgästens behov, till exempel nya väggar, ytskikt eller installationer. Vem som bekostar den, och om kostnaden vägs upp av lägre hyra, förhandlas i avtalet."
  },
  {
    test: /(moms|skattskyldig)/,
    text: "Uthyrning av lokaler är som utgångspunkt momsfri. En hyresvärd kan dock ansöka om frivillig skattskyldighet hos Skatteverket och då ta ut 25 % moms på hyran – det förutsätter normalt att hyresgästen bedriver momspliktig verksamhet."
  }
];

export function explainTerm(q) {
  const entry = glossary.find((item) => item.test.test(q));
  if (!entry) return null;
  return { text: `${entry.text}\n\n${NOT_ADVICE}` };
}

// ── Navigation ───────────────────────────────────────────────────────────────────────────────

export function openPage(q, s) {
  if (!/(öppna|gå till|ta mig till|navigera|hoppa till)/.test(q)) return null;
  const targets = [
    [/(leads|intresseanmälning|förfrågning)/, "Leads", s.paths.leads],
    [/(objekt|annonser|lokaler)/, "Objekt", s.paths.listings],
    [/(meddelanden|inkorg)/, "Meddelanden", s.paths.messages],
    [/prospekt/, "Prospekt", s.paths.prospects],
    [/(översikt|startsida)/, "Översikt", s.paths.overview],
    [/(publicera|ny annons)/, "Ny annons", s.paths.publish]
  ];
  const target = targets.find(([pattern]) => pattern.test(q));
  if (!target) return null;
  return { text: `Här kommer du till ${target[1].toLowerCase()}:`, chips: [navChip(`Öppna ${target[1].toLowerCase()}`, target[2])] };
}
