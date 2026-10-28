import { classifyImportFiles } from "./listingImport";
import { calculateRent, capabilitiesReply, draftEmail, draftListingText, explainTerm, howTo, openPage, smallTalk } from "./brokerHelper";
import { daysBetween, firstName as firstNameOf, parseIsoDate, statusLabels } from "./leadAssistant";

// Logic for the broker's assistant in the panel: what deserves attention today, and answers to questions about the
// broker's own leads and listings (general help lives in brokerHelper.js). Rules over data already loaded in the app,
// no model call and no network. The UI only depends on the shapes returned here, so a real model could replace
// answerQuestion() later.

export const panelPaths = {
  broker: { overview: "/app/broker", assistant: "/app/broker/assistent", leads: "/app/broker/leads", listings: "/app/broker/objekt", messages: "/app/broker/meddelanden", prospects: "/app/broker/prospekt", publish: "/app/publish" },
  admin: { overview: "/app/admin", assistant: "/app/admin/assistent", leads: "/app/admin/leads", listings: "/app/admin/annonser", messages: "/app/admin/meddelanden", prospects: "/app/admin/prospekt", publish: "/app/publish" }
};

const listingStatusLabels = { draft: "Utkast", active: "Aktiv", negotiating: "Förhandling", rented: "Uthyrd", inactive: "Dold" };
const dataKinds = ["spreadsheet", "pdf", "document", "presentation", "data"];
const plural = (count, one, many) => (count === 1 ? one : many);
const money = (value) => `${Number(value || 0).toLocaleString("sv-SE")} kr`;
const followUpDay = (lead) => parseIsoDate(String(lead.followUpDate).slice(0, 10));
const lateLabel = (days) => (days <= 0 ? "idag" : `${days} ${plural(days, "dag", "dagar")} sedan`);

export function leadNameOf(lead) {
  return lead.renter?.name || lead.renter?.email || "Hyresgäst";
}

/** Everything the assistant knows, worked out from the leads and listings the panel has loaded (already scoped to the person). */
export function buildSnapshot({ leads: leadInput, listings, now = new Date(), panel = "broker", userName = "" }) {
  const paths = panelPaths[panel] || panelPaths.broker;
  const own = Array.isArray(listings) ? listings : [];
  const leads = Array.isArray(leadInput) ? leadInput : [];
  const titleOf = (lead) => lead.listing?.title || own.find((item) => item.id === lead.listingId)?.title || "objektet";
  const open = leads.filter((lead) => !["won", "lost"].includes(lead.status));
  const overdue = open
    .filter((lead) => lead.followUpDate && daysBetween(now, followUpDay(lead)) <= 0)
    .sort((a, b) => followUpDay(a) - followUpDay(b));
  const newLeads = leads.filter((lead) => lead.status === "new");
  const drafts = own.filter((item) => item.status === "draft");
  const active = own.filter((item) => item.status === "active");
  const responses = own.filter((item) => item.responseHours != null && Number.isFinite(Number(item.responseHours)));
  return {
    now,
    paths,
    userName,
    firstName: firstNameOf(userName),
    own,
    leads,
    overdue,
    newLeads,
    drafts,
    active,
    leadName: leadNameOf,
    titleOf,
    viewingsBooked: leads.filter((lead) => lead.status === "viewing_booked"),
    negotiating: leads.filter((lead) => lead.status === "negotiating"),
    byViews: [...own].sort((a, b) => Number(b.views || 0) - Number(a.views || 0)),
    totalViews: own.reduce((sum, item) => sum + Number(item.views || 0), 0),
    responseHours: responses.length ? Math.round(responses.reduce((sum, item) => sum + Number(item.responseHours), 0) / responses.length) : null,
    quiet: active.filter((item) => Number(item.views || 0) < 5 && daysBetween(item.createdAt || now, now) >= 7),
    attentionCount: overdue.length + newLeads.length + drafts.length
  };
}

export const starterQuestions = ["Vad ska jag göra idag?", "Vilka leads behöver följas upp?", "Hur går det för mina objekt?", "Vad kan du hjälpa mig med?"];

/** Questions worth asking right now, for the "Förslag" menu of the text box: the fixed ones plus a couple about this person's own data. */
export function suggestedQuestions(s) {
  const own = [];
  if (s.newLeads.length > 0) own.push("Vilka nya leads har jag?");
  if (s.drafts.length > 0) own.push("Vilka utkast har jag kvar?");
  if (s.byViews[0]?.title) own.push(`Hur går det för ${s.byViews[0].title}?`);
  const first = s.leads.find((lead) => s.leadName(lead) !== "Hyresgäst");
  if (first) own.push(`Vad är läget med ${s.leadName(first).split(/\s+/)[0]}?`);
  return [...starterQuestions.slice(0, 2), ...own, "Hur skapar jag annonser från ett dokument?"].slice(0, 6);
}

export function overviewSummary(s) {
  if (s.attentionCount === 0) return "Inget brådskar just nu – du ligger i fas.";
  return `${s.attentionCount} ${plural(s.attentionCount, "sak behöver", "saker behöver")} din uppmärksamhet – här är vad jag skulle göra först.`;
}

/** The most useful things to do next, most pressing first. */
export function suggestActions(s, limit = 4) {
  const items = [];
  const add = (item) => {
    if (items.length < limit) items.push(item);
  };
  const go = (path) => ({ type: "navigate", path });

  if (s.overdue.length > 0) {
    const first = s.overdue[0];
    const late = -daysBetween(s.now, followUpDay(first));
    add({
      id: "followups",
      icon: "phone-call",
      title: s.overdue.length === 1 ? `Följ upp ${s.leadName(first)}` : `${s.overdue.length} uppföljningar väntar`,
      detail: s.overdue.length === 1
        ? `${s.titleOf(first)} – uppföljningen ${late <= 0 ? "är planerad till idag" : `var planerad för ${lateLabel(late)}`}`
        : `${late <= 0 ? "Alla är planerade till idag" : `Äldst är ${s.leadName(first)}, planerad för ${lateLabel(late)}`}`,
      text: s.overdue.length === 1
        ? `Följ upp ${s.leadName(first)} om ${s.titleOf(first)} – uppföljningen ${late <= 0 ? "är planerad till idag" : `var planerad för ${lateLabel(late)}`}`
        : `${s.overdue.length} leads ska följas upp – ${late <= 0 ? "alla idag" : `äldst är ${s.leadName(first)}`}`,
      cta: "Öppna leads",
      action: go(s.paths.leads)
    });
  }
  if (s.newLeads.length > 0) {
    const first = s.newLeads[0];
    add({
      id: "new-leads",
      icon: "user-plus",
      title: s.newLeads.length === 1 ? `Ta första kontakten med ${s.leadName(first)}` : `${s.newLeads.length} nya leads väntar`,
      detail: s.newLeads.length === 1 ? `Ny förfrågan om ${s.titleOf(first)}` : `Ta första kontakten med ${s.leadName(first)} och ${s.newLeads.length - 1} ${plural(s.newLeads.length - 1, "till", "till")}`,
      text: s.newLeads.length === 1
        ? `Ta första kontakten med ${s.leadName(first)} – intresserad av ${s.titleOf(first)}`
        : `${s.newLeads.length} nya leads väntar på första kontakt`,
      cta: "Öppna leads",
      action: go(s.paths.leads)
    });
  }
  if (s.drafts.length > 0) {
    add({
      id: "drafts",
      icon: "file-pen",
      title: s.drafts.length === 1 ? `Färdigställ utkastet “${s.drafts[0].title || "Namnlöst utkast"}”` : `${s.drafts.length} utkast är inte publicerade`,
      detail: s.drafts.length === 1 ? "Annonsen syns inte för hyresgäster förrän den är publicerad" : "Färdigställ dem så blir de synliga för hyresgäster",
      text: s.drafts.length === 1
        ? `Färdigställ utkastet “${s.drafts[0].title || "Namnlöst utkast"}” så att det blir synligt`
        : `${s.drafts.length} utkast är inte publicerade ännu`,
      cta: "Öppna objekt",
      action: go(s.paths.listings)
    });
  }
  if (s.viewingsBooked.length > 0) {
    add({
      id: "viewings",
      icon: "calendar-check",
      title: `${s.viewingsBooked.length} ${plural(s.viewingsBooked.length, "visning är bokad", "visningar är bokade")}`,
      detail: "Förbered dig och logga hur det gick efteråt",
      text: `${s.viewingsBooked.length} ${plural(s.viewingsBooked.length, "visning är bokad", "visningar är bokade")} – förbered och logga hur det gick`,
      cta: "Öppna leads",
      action: go(s.paths.leads)
    });
  }
  if (s.quiet.length > 0) {
    add({
      id: "quiet",
      icon: "eye",
      title: `“${s.quiet[0].title}” får få visningar`,
      detail: "Se över rubrik, pris och bilder",
      text: `“${s.quiet[0].title}” har fått få visningar – se över rubrik, pris och bilder`,
      cta: "Öppna objekt",
      action: go(s.paths.listings)
    });
  }
  if (s.own.length === 0) {
    add({ id: "first-listing", icon: "plus", title: "Publicera din första annons", detail: "Skapa den manuellt eller ladda upp dokument", text: "Publicera din första annons – skapa den manuellt eller ladda upp dokument", cta: "Ny annons", action: go(s.paths.publish) });
  }
  if (items.length === 0) {
    add({ id: "import", icon: "upload", title: "Allt är i fas", detail: "Har du fler lokaler? Ladda upp ett Excel-ark eller prospekt så skapar jag annonser åt dig.", text: "Allt är i fas. Har du fler lokaler? Ladda upp ett Excel-ark eller prospekt så skapar jag annonser åt dig.", cta: "Ny annons", action: go(s.paths.publish) });
  }
  return items;
}

const navChip = (label, path) => ({ id: `nav-${path}`, label, intent: { type: "navigate", path } });
const bullets = (lines, more = 0) => lines.map((line) => `• ${line}`).join("\n") + (more > 0 ? `\n… och ${more} till` : "");

function describeListing(listing, s) {
  const related = s.leads.filter((lead) => lead.listingId === listing.id);
  const place = [listing.district, listing.type].filter(Boolean).join(" · ");
  const lines = [
    `${listingStatusLabels[listing.status] || listing.status}${listing.sizeSqm ? ` · ${listing.sizeSqm} kvm` : ""}${listing.priceMonthly ? ` · ${money(listing.priceMonthly)}/mån` : ""}`,
    `${Number(listing.views || 0)} visningar och ${Number(listing.inquiries || related.length)} förfrågningar`
  ];
  if (related.length > 0) {
    const byStatus = related.reduce((counts, lead) => ({ ...counts, [lead.status]: (counts[lead.status] || 0) + 1 }), {});
    lines.push(`Leads: ${Object.entries(byStatus).map(([status, count]) => `${count} ${(statusLabels[status] || status).toLowerCase()}`).join(", ")}`);
  }
  return {
    text: `${listing.title}${place ? ` (${place})` : ""}\n${bullets(lines)}`,
    chips: [navChip("Öppna objekt", s.paths.listings), ...(related.length > 0 ? [navChip("Öppna leads", s.paths.leads)] : [])]
  };
}

function describeLead(lead, s) {
  const followUp = lead.followUpDate ? ` Uppföljning: ${followUpDay(lead).toLocaleDateString("sv-SE", { day: "numeric", month: "long" })}.` : "";
  return {
    text: `${s.leadName(lead)} är intresserad av ${s.titleOf(lead)} och står som ${(statusLabels[lead.status] || lead.status || "ny").toLowerCase()}.${followUp}`,
    chips: [navChip("Öppna leads", s.paths.leads)]
  };
}

const findListing = (q, s) => s.own.find((item) => item.title && q.includes(item.title.toLowerCase()));
const findLead = (q, s) =>
  s.leads.find((item) => {
    const name = s.leadName(item).toLowerCase();
    const first = name.split(/\s+/)[0];
    return name !== "hyresgäst" && ((name.length > 3 && q.includes(name)) || (first.length > 3 && q.includes(first)));
  });
const copyChip = (text) => ({ id: "copy", label: "Kopiera texten", intent: { type: "copy", text } });

function listingTextReply(q, s) {
  if (s.own.length === 0) {
    return { text: "Du har inga objekt att skriva om ännu. Skapa en annons så tar jag fram ett utkast till beskrivningen.", chips: [navChip("Ny annons", s.paths.publish)] };
  }
  const listing = findListing(q, s) || (s.drafts.length === 1 ? s.drafts[0] : null);
  if (!listing) {
    return {
      text: "Vilket objekt ska jag skriva om?",
      chips: s.own.slice(0, 4).map((item) => ({ id: `text-${item.id}`, label: item.title, intent: { type: "ask", text: `Skriv en annonstext för ${item.title}` } }))
    };
  }
  const draft = draftListingText(listing);
  return {
    text: `Här är ett utkast till annonstext för ${listing.title}. Det bygger bara på uppgifterna i annonsen, så lägg gärna till det som gör lokalen speciell.`,
    draft,
    chips: [copyChip(draft), navChip("Öppna objekt", s.paths.listings)]
  };
}

function emailReply(q, s) {
  const lead = findLead(q, s) || s.overdue[0] || s.newLeads[0] || s.leads[0];
  if (!lead) return { text: "Du har inga leads att skriva till än. De dyker upp när hyresgäster bokar visning.", chips: [navChip("Öppna leads", s.paths.leads)] };
  const { subject, body } = draftEmail({ lead, listingTitle: s.titleOf(lead), brokerName: s.userName, leadName: s.leadName(lead) });
  const email = lead.renter?.email;
  return {
    text: `Här är ett utkast till ${s.leadName(lead)}, som står som ${(statusLabels[lead.status] || "ny").toLowerCase()}:`,
    draft: `Ämne: ${subject}\n\n${body}`,
    chips: [
      ...(email ? [{ id: "mailto", label: "Öppna i e-post", intent: { type: "mailto", href: `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` } }] : []),
      copyChip(body)
    ]
  };
}

function draftReply(q, s) {
  if (!/(skriv|formulera|ta fram|generera|hjälp mig (att )?(skriva|formulera))/.test(q)) return null;
  if (/(mejl|e-post|epost|mail|meddelande)/.test(q)) return emailReply(q, s);
  if (/(annonstext|annons|beskrivning|beskriv|rubrik|objektet|lokalen)/.test(q)) return listingTextReply(q, s);
  return null;
}

function summaryReply(s) {
  const lines = [
    `${s.own.length} objekt: ${s.active.length} ${plural(s.active.length, "aktivt", "aktiva")} och ${s.drafts.length} ${plural(s.drafts.length, "utkast", "utkast")}`,
    `${s.leads.length} ${plural(s.leads.length, "lead", "leads")}, varav ${s.newLeads.length} ${plural(s.newLeads.length, "ny", "nya")}`,
    `${s.overdue.length} ${plural(s.overdue.length, "uppföljning", "uppföljningar")} att göra`,
    `${s.totalViews.toLocaleString("sv-SE")} visningar av dina annonser`
  ];
  return { text: `Så här ser det ut just nu:\n${bullets(lines)}`, suggestions: suggestActions(s, 3) };
}

/** Answers a question about the broker's own data, or says what it can help with. */
export function answerQuestion(text, s) {
  const q = String(text || "").toLowerCase();
  const has = (pattern) => pattern.test(q);

  const general = smallTalk(q, s.firstName) || calculateRent(q) || draftReply(q, s) || openPage(q, s) || howTo(q, s) || explainTerm(q);
  if (general) return general;
  if (has(/(sammanfatta|sammanfattning|hur ser det ut|hur är läget|hur ligger jag till|hur ligger vi till)/)) return summaryReply(s);

  const listing = findListing(q, s);
  if (listing) return describeListing(listing, s);
  const lead = findLead(q, s);
  if (lead) return describeLead(lead, s);

  if (has(/(vad (ska|bör|kan) jag (göra|börja)|prioritera|nästa steg|idag|att göra|börja med)/)) {
    const suggestions = suggestActions(s, 3);
    return { text: s.attentionCount === 0 ? "Inget brådskar. Det här skulle jag ändå göra härnäst:" : "Så här skulle jag prioritera:", suggestions };
  }
  if (has(/(uppfölj|följ(a|as|er)? upp)/)) {
    if (s.overdue.length === 0) return { text: "Inga uppföljningar väntar just nu. Bra jobbat!", chips: [navChip("Öppna leads", s.paths.leads)] };
    const lines = s.overdue.slice(0, 5).map((item) => {
      const late = -daysBetween(s.now, followUpDay(item));
      return `${s.leadName(item)} – ${s.titleOf(item)} (${lateLabel(late)})`;
    });
    return { text: `${s.overdue.length} ${plural(s.overdue.length, "lead behöver", "leads behöver")} följas upp:\n${bullets(lines, s.overdue.length - lines.length)}`, chips: [navChip("Öppna leads", s.paths.leads)] };
  }
  if (has(/nya (leads|förfrågningar|intresseanmälningar)/)) {
    if (s.newLeads.length === 0) return { text: "Inga nya leads just nu.", chips: [navChip("Öppna leads", s.paths.leads)] };
    const lines = s.newLeads.slice(0, 5).map((item) => `${s.leadName(item)} – ${s.titleOf(item)}`);
    return { text: `${s.newLeads.length} ${plural(s.newLeads.length, "ny lead", "nya leads")} väntar:\n${bullets(lines, s.newLeads.length - lines.length)}`, chips: [navChip("Öppna leads", s.paths.leads)] };
  }
  if (has(/bokad(e)? visning|visningar? (är )?bokad|kommande visning/)) {
    const lines = s.viewingsBooked.slice(0, 5).map((item) => `${s.leadName(item)} – ${s.titleOf(item)}`);
    return {
      text: s.viewingsBooked.length === 0 ? "Inga visningar är bokade just nu." : `${s.viewingsBooked.length} ${plural(s.viewingsBooked.length, "bokad visning", "bokade visningar")}:\n${bullets(lines, s.viewingsBooked.length - lines.length)}`,
      chips: [navChip("Öppna leads", s.paths.leads)]
    };
  }
  if (has(/(lead|intresse|förfrågan|förfrågningar|hyresgäst)/)) {
    if (s.leads.length === 0) return { text: "Du har inga leads ännu. De dyker upp här när hyresgäster bokar visning.", chips: [navChip("Öppna leads", s.paths.leads)] };
    const byStatus = s.leads.reduce((counts, item) => ({ ...counts, [item.status || "new"]: (counts[item.status || "new"] || 0) + 1 }), {});
    const lines = Object.entries(byStatus).map(([status, count]) => `${count} ${(statusLabels[status] || status).toLowerCase()}`);
    return { text: `Du har ${s.leads.length} ${plural(s.leads.length, "lead", "leads")}:\n${bullets(lines)}`, chips: [navChip("Öppna leads", s.paths.leads)] };
  }
  if (has(/utkast/)) {
    if (s.drafts.length === 0) return { text: "Du har inga utkast – allt är publicerat.", chips: [navChip("Öppna objekt", s.paths.listings)] };
    const lines = s.drafts.slice(0, 5).map((item) => item.title || "Namnlöst utkast");
    return { text: `${s.drafts.length} ${plural(s.drafts.length, "utkast", "utkast")} att färdigställa:\n${bullets(lines, s.drafts.length - lines.length)}`, chips: [navChip("Öppna objekt", s.paths.listings)] };
  }
  if (has(/svarstid/)) {
    return { text: s.responseHours === null ? "Jag har ingen svarstidsdata ännu." : `Din snittsvarstid är ${s.responseHours} h för objekt med data.` };
  }
  if (has(/(visning|visningar|besök|mest sedd|populär|views|hur går det)/)) {
    if (s.own.length === 0) return { text: "Du har inga objekt ännu.", chips: [navChip("Ny annons", s.paths.publish)] };
    const lines = s.byViews.slice(0, 3).map((item) => `${item.title} – ${Number(item.views || 0).toLocaleString("sv-SE")} visningar, ${Number(item.inquiries || 0)} förfrågningar`);
    return { text: `Dina annonser har ${s.totalViews.toLocaleString("sv-SE")} visningar totalt. Mest sedda:\n${bullets(lines)}`, chips: [navChip("Öppna objekt", s.paths.listings)] };
  }
  if (has(/(publicera|ny annons|skapa (en )?annons|lägg upp|excel|prospekt|dokument|ladda upp|importera)/)) {
    return {
      text: "Du kan skapa en annons manuellt, eller bifoga ett Excel-ark, prospekt eller annat dokument här i chatten (knappen +) så läser jag in det och föreslår annonser som du granskar innan de publiceras.",
      chips: [navChip("Ny annons", s.paths.publish)]
    };
  }
  if (has(/(objekt|annons|lokal)/)) {
    return {
      text: `Du har ${s.own.length} objekt: ${s.active.length} ${plural(s.active.length, "aktivt", "aktiva")} och ${s.drafts.length} ${plural(s.drafts.length, "utkast", "utkast")}.`,
      chips: [navChip("Öppna objekt", s.paths.listings)]
    };
  }
  const { chips } = capabilitiesReply();
  return {
    text: "Det där kan jag inte svara på än. Jag hjälper gärna till med dina leads och objekt, utkast till texter och mejl, hyresberäkningar och att läsa in dokument. Prova till exempel:",
    chips
  };
}

/** What to say about files the broker attached: which ones can become listings, and which cannot be read. */
export function attachmentReply(fileList) {
  const { accepted, problems } = classifyImportFiles(fileList, []);
  if (accepted.length === 0) {
    return { accepted, text: problems.length > 0 ? `Jag kunde inte använda filen. ${problems.join(" ")}` : "Jag hittade inga filer att läsa." };
  }
  const names = accepted.map((file) => file.name).join(", ");
  const readable = accepted.some((file) => dataKinds.includes(file.kind));
  const text = readable
    ? `Jag har tagit emot ${names}. Jag kan läsa in ${accepted.length === 1 ? "filen" : "filerna"} och föreslå annonser som du granskar innan något publiceras.`
    : `Jag har tagit emot ${names}. Bilder säger inte så mycket om lokalen i sig, men jag kan börja en annons med dem som omslag.`;
  return {
    accepted,
    text: problems.length > 0 ? `${text}\n${problems.join(" ")}` : text,
    suggestions: [{
      id: "import",
      icon: "upload",
      title: readable ? `Skapa annonser från ${accepted.length === 1 ? accepted[0].name : `${accepted.length} filer`}` : "Börja en annons med bilderna",
      detail: readable ? "Jag läser in filerna och du granskar innan något publiceras" : "Bilderna används som omslag",
      text: readable ? `Skapa annonser från ${accepted.length === 1 ? accepted[0].name : `${accepted.length} filer`}` : "Börja en annons med bilderna",
      cta: readable ? "Läs in" : "Börja",
      action: { type: "import", files: accepted }
    }]
  };
}
