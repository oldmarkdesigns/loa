// Logic behind the lead assistant. Everything here is plain rules over the lead's own data (status,
// age, follow-up date, logged activity): no model call and no network. LeadAssistant.jsx renders the
// conversation; a real model could later replace interpretUpdate() and buildBriefing() without
// touching the UI, since the UI only depends on the shapes returned here.

const DAY_MS = 86_400_000;

export const ACTIVITY_LABELS = { note: "Notering", call: "Samtal", email: "E-post", meeting: "Möte", viewing: "Visning" };
const activityNouns = { call: "ett samtal", email: "ett mejl", meeting: "ett möte", viewing: "en visning", note: "en anteckning" };
const contactTypes = ["call", "email", "meeting", "viewing"];

// Order of the pipeline. "lost" sits beside "won": both end it, and neither can be reached by drifting forward.
const statusRank = { new: 0, contacted: 1, viewing_booked: 2, negotiating: 3, won: 4, lost: 4 };
export const statusLabels = {
  new: "Ny",
  contacted: "Kontaktad",
  viewing_booked: "Visning bokad",
  negotiating: "Förhandling",
  won: "Vunnen",
  lost: "Förlorad"
};

// ── Dates ────────────────────────────────────────────────────────────────────────────────────

export function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(value, days) {
  const date = startOfDay(value);
  date.setDate(date.getDate() + days);
  return date;
}

export function toIsoDate(value) {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local date for a "YYYY-MM-DD" string (new Date(iso) would read it as UTC and can land on the wrong day). */
export function parseIsoDate(iso) {
  const [year, month, day] = String(iso).split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

/** Whole calendar days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from, to) {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);
}

function plural(count, one, many) {
  return count === 1 ? one : many;
}

export function ageLabel(days) {
  if (days <= 0) return "idag";
  if (days === 1) return "igår";
  if (days < 14) return `för ${days} dagar sedan`;
  if (days < 60) return `för ${Math.round(days / 7)} veckor sedan`;
  return `för ${Math.round(days / 30)} månader sedan`;
}

const weekdayFormat = new Intl.DateTimeFormat("sv-SE", { weekday: "long", day: "numeric", month: "long" });

export function describeDay(iso, now = new Date()) {
  const diff = daysBetween(now, parseIsoDate(iso));
  if (diff === 0) return "idag";
  if (diff === 1) return "imorgon";
  return weekdayFormat.format(parseIsoDate(iso));
}

const weekdayNames = [
  ["söndag", "sön"],
  ["måndag", "mån"],
  ["tisdag", "tis"],
  ["onsdag", "ons"],
  ["torsdag", "tors", "tor"],
  ["fredag", "fre"],
  ["lördag", "lör"]
];
const monthNames = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const monthAbbreviations = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const numberWords = { en: 1, ett: 1, två: 2, tre: 3, fyra: 4, fem: 5, sex: 6, sju: 7, tio: 10 };

// \b does not treat å, ä and ö as letters, so word edges are spelled out.
const edge = (source) => new RegExp(`(?<![a-zåäö])(?:${source})(?![a-zåäö])`);

/** First future date named in a Swedish sentence ("på torsdag", "imorgon", "om 3 dagar", "24/9"), as YYYY-MM-DD. */
export function parseSwedishDate(text, now = new Date()) {
  const lower = String(text || "").toLowerCase();
  const today = startOfDay(now);

  const iso = lower.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  if (edge("i ?övermorgon").test(lower)) return toIsoDate(addDays(today, 2));
  if (edge("i ?morgon").test(lower)) return toIsoDate(addDays(today, 1));

  const relative = lower.match(edge("om (\\d+|en|ett|två|tre|fyra|fem|sex|sju|tio) (dag|dagar|vecka|veckor)"));
  if (relative) {
    const amount = numberWords[relative[1]] || Number(relative[1]);
    return toIsoDate(addDays(today, relative[2].startsWith("veck") ? amount * 7 : amount));
  }
  if (edge("nästa vecka").test(lower)) return toIsoDate(addDays(today, ((8 - today.getDay()) % 7) || 7));

  for (let day = 0; day < weekdayNames.length; day += 1) {
    if (edge(weekdayNames[day].join("|")).test(lower)) {
      return toIsoDate(addDays(today, ((day - today.getDay() + 7) % 7) || 7));
    }
  }

  const written = lower.match(new RegExp(`(?<![\\d])(\\d{1,2})(?::e)? (${monthNames.join("|")}|${monthAbbreviations.join("|")})[a-zåäö]*\\.?`));
  const numeric = lower.match(/(?<!\d)(\d{1,2})\s*[/.]\s*(\d{1,2})(?!\d)/);
  const found = written
    ? { day: Number(written[1]), month: Math.max(monthNames.indexOf(written[2]), monthAbbreviations.indexOf(written[2].slice(0, 3))) }
    : numeric
      ? { day: Number(numeric[1]), month: Number(numeric[2]) - 1 }
      : null;
  if (found && found.day >= 1 && found.day <= 31 && found.month >= 0 && found.month <= 11) {
    let date = new Date(today.getFullYear(), found.month, found.day);
    if (date < today) date = new Date(today.getFullYear() + 1, found.month, found.day);
    return toIsoDate(date);
  }
  return null;
}

// ── Reading what the person wrote ────────────────────────────────────────────────────────────

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

function inferActivityType(lower) {
  if (/(möte|träffades|träffade|fikade|lunch|videosamtal|teams|zoom)/.test(lower)) return "meeting";
  if (/(visade|visning(en)? (är )?(genomförd|klar|hölls|gick)|var på visning|besökte lokalen|tittade på lokalen|kom på visning)/.test(lower)) return "viewing";
  if (/(mejl|mail|e-post|epost|skickade|skrev till)/.test(lower)) return "email";
  if (/(ring|samtal|telefon|pratade|snackade|nådde|meddelande|voicemail|sms)/.test(lower)) return "call";
  return "note";
}

function inferStatus(lower, hasDate) {
  if (/(tackade nej|tackat nej|inte (längre )?intresserad|inte aktuellt|avböjde|hoppade av|valde (en )?annan|har hittat (en )?annan|avslog|föll bort)/.test(lower)) return "lost";
  if (/(skrev på|signerade|signerat|tecknade|avtal (är )?(klart|påskrivet|undertecknat)|hyresavtal (klart|signerat)|affären är klar|vunnit)/.test(lower)) return "won";
  if (/(förhandl|budgivning|motbud|prisförslag|offert|kontraktsutkast|hyresvillkor|(pratade|diskuterade|snackade)( om)? (pris|hyra|villkor))/.test(lower)) return "negotiating";
  if (hasDate && /(bokat (en )?visning|bokade (en )?visning|visning (är )?bokad|kommer (på visning|och titta)|vill se lokalen|vill titta på)/.test(lower)) return "viewing_booked";
  return null;
}

/** The status the lead should move to, never sliding backwards unless the person closes it. */
export function forwardStatus(current, target, type) {
  const from = current || "new";
  if (target === "won" || target === "lost") return from === target ? null : target;
  if (target && statusRank[target] > statusRank[from]) return target;
  if (!target && from === "new" && contactTypes.includes(type)) return "contacted";
  return null;
}

// Days until the next follow-up when the person did not name a date.
const defaultFollowUpDays = { call: 3, email: 3, meeting: 5, viewing: 2 };

function followUpFor(lead, type, status, parsedDate, now) {
  if (status === "won" || status === "lost") return lead.followUpDate ? "" : null;
  if (parsedDate && daysBetween(now, parseIsoDate(parsedDate)) >= 0) return parsedDate;
  const hasFutureFollowUp = lead.followUpDate && daysBetween(now, parseIsoDate(lead.followUpDate)) >= 0;
  if (!hasFutureFollowUp && defaultFollowUpDays[type]) return toIsoDate(addDays(now, defaultFollowUpDays[type]));
  return null;
}

/**
 * Turns free text like "Ringde henne, hon vill se lokalen på torsdag" into a proposed update:
 * { type, body, status, followUpDate }. Fields are null when nothing should change.
 */
export function interpretUpdate(text, { lead, now = new Date() }) {
  const raw = String(text || "").trim();
  const lower = raw.toLowerCase();
  const parsedDate = parseSwedishDate(raw, now);
  const isPlan = /(?<![a-zåäö])(ska|ringer|mejlar|mailar|tänker|planerar|påminn|glöm inte)(?![a-zåäö])/.test(lower)
    && !/(ringde|mejlade|mailade|pratade|träffade|skickade)/.test(lower);

  if (isPlan) {
    return {
      type: "note",
      body: `Planerat: ${raw.replace(/[.!\s]+$/, "")}.`,
      status: null,
      followUpDate: parsedDate && daysBetween(now, parseIsoDate(parsedDate)) >= 0 ? parsedDate : toIsoDate(addDays(now, 1))
    };
  }

  const type = inferActivityType(lower);
  const status = forwardStatus(lead.status, inferStatus(lower, Boolean(parsedDate)), type);
  return {
    type,
    body: capitalize(raw),
    status,
    followUpDate: followUpFor(lead, type, status || lead.status, parsedDate, now)
  };
}

/** The lines a proposal is made of, so each can be switched off before anything is saved. */
export function proposalChanges(update, { lead, now = new Date() }) {
  const changes = [];
  if (update.type && update.body) changes.push({ key: "activity", label: `Logga ${ACTIVITY_LABELS[update.type].toLowerCase()}: “${update.body}”` });
  if (update.status) changes.push({ key: "status", label: `Status: ${statusLabels[lead.status || "new"]} → ${statusLabels[update.status]}` });
  if (update.followUpDate) changes.push({ key: "followUp", label: `Uppföljning: ${describeDay(update.followUpDate, now)}` });
  if (update.followUpDate === "") changes.push({ key: "followUp", label: "Ta bort uppföljningen" });
  return changes;
}

// ── Reading the lead ─────────────────────────────────────────────────────────────────────────

export function firstName(name = "") {
  return String(name).trim().split(/\s+/)[0] || "";
}

function situationOf({ lead, activities = [], now = new Date() }) {
  const last = activities[0] || null;
  return {
    status: lead.status || "new",
    name: firstName(lead.renter?.name) || "kunden",
    listing: lead.listing?.title || "objektet",
    createdDays: daysBetween(lead.createdAt || now, now),
    last,
    lastDays: last ? daysBetween(last.createdAt, now) : null,
    followDiff: lead.followUpDate ? daysBetween(now, parseIsoDate(lead.followUpDate)) : null,
    hasContact: activities.some((activity) => contactTypes.includes(activity.type)),
    phone: lead.renter?.phone || lead.renter?.profile?.phone || "",
    email: lead.renter?.email || ""
  };
}

function lastSentence(s) {
  return s.last ? `Senaste aktiviteten var ${activityNouns[s.last.type] || "en aktivitet"} ${ageLabel(s.lastDays)}. ` : "";
}

function openingText(ctx, s) {
  const hello = ctx.brokerName ? `Hej ${ctx.brokerName}! ` : "Hej! ";
  const interest = `${s.name} visade intresse för ${s.listing} ${ageLabel(s.createdDays)}`;
  if (s.status === "won") return `${hello}Det här leadet är vunnet – grattis! Vill du lägga till något om hur affären landade?`;
  if (s.status === "lost") return `${hello}Det här leadet är markerat som förlorat. Vill du anteckna varför, eller öppna det igen om ${s.name} hör av sig?`;
  if (s.followDiff !== null && s.followDiff < 0) {
    const late = -s.followDiff;
    return `${hello}Uppföljningen med ${s.name} skulle ske ${describeDay(ctx.lead.followUpDate, ctx.now)}, för ${late} ${plural(late, "dag", "dagar")} sedan. Har du hunnit höra av dig?`;
  }
  if (s.status === "viewing_booked") return `${hello}Visning är bokad med ${s.name} för ${s.listing}. Har den ägt rum, eller har något ändrats?`;
  if (s.status === "negotiating") return `${hello}Ni förhandlar med ${s.name} om ${s.listing}. ${lastSentence(s)}Har något hänt sedan sist – ett samtal, mejl eller möte?`;
  if (s.status === "contacted") {
    if (s.lastDays !== null && s.lastDays >= 5) return `${hello}Du hörde av dig till ${s.name} ${ageLabel(s.lastDays)} och det har inte hänt något sedan dess. Har ni haft kontakt sedan dess?`;
    return `${hello}${interest}, och ni har varit i kontakt. ${lastSentence(s)}Har det hänt något mer?`;
  }
  if (!s.hasContact) return `${hello}${interest}, men ingen kontakt är loggad än. Har du ringt, mejlat eller träffat ${s.name}?`;
  return `${hello}${interest}. Du har loggat ${activityNouns[s.last.type] || "aktivitet"}, men leadet står kvar som Ny. Vill du flytta det vidare?`;
}

// ── Quick replies ────────────────────────────────────────────────────────────────────────────

const capture = (kind, label) => ({ id: `capture-${kind}`, label, intent: { type: "capture", kind } });

export function captureChips(ctx) {
  const s = situationOf(ctx);
  if (s.status === "won" || s.status === "lost") {
    return [
      capture("note", "Anteckna något"),
      { id: "status-menu", label: "Öppna leadet igen", intent: { type: "status-menu" } }
    ];
  }
  const viewing = capture("viewing", s.status === "viewing_booked" ? "Visningen är genomförd" : "Visning genomförd");
  const chips = s.status === "viewing_booked"
    ? [viewing, capture("call", "Jag ringde"), capture("email", "Jag mejlade"), capture("meeting", "Vi hade ett möte")]
    : [capture("call", "Jag ringde"), capture("email", "Jag mejlade"), capture("meeting", "Vi hade ett möte"), viewing];
  return [
    ...chips,
    { id: "none", label: "Inget nytt än", intent: { type: "none" } },
    { id: "more", label: "Något annat", intent: { type: "more" } }
  ];
}

export function moreChips() {
  return [
    capture("note", "Anteckna något"),
    { id: "status-menu", label: "Ändra status", intent: { type: "status-menu" } },
    { id: "followup-menu", label: "Sätt uppföljning", intent: { type: "followup-menu" } }
  ];
}

export function statusChips(ctx) {
  const current = ctx.lead.status || "new";
  return Object.keys(statusLabels)
    .filter((status) => status !== current)
    .map((status) => ({ id: `status-${status}`, label: statusLabels[status], intent: { type: "status", status } }));
}

export function followUpChips(ctx) {
  const options = [["Imorgon", 1], ["Om 3 dagar", 3], ["Nästa vecka", 7], ["Om två veckor", 14]];
  return options.map(([label, days]) => ({
    id: `followup-${days}`,
    label,
    intent: { type: "followup", date: toIsoDate(addDays(ctx.now || new Date(), days)) }
  }));
}

function outcome(ctx, { id, label, type, body, status = null, followUpDays = null }) {
  const now = ctx.now || new Date();
  return {
    id,
    label,
    intent: {
      type: "update",
      update: {
        type,
        body,
        status: forwardStatus(ctx.lead.status, status, type),
        followUpDate: followUpDays === null ? null : toIsoDate(addDays(now, followUpDays))
      }
    }
  };
}

/** How it went: the second question, once we know what kind of contact took place. */
export function outcomeQuestion(kind, ctx) {
  const s = situationOf(ctx);
  const n = s.name;
  const o = (option) => outcome(ctx, option);
  if (kind === "call") {
    return {
      text: `Bra! Hur gick samtalet med ${n}?`,
      chips: [
        o({ id: "call-positive", label: "Positivt samtal", type: "call", body: `Pratade med ${n} – positivt och intresserad.`, followUpDays: 3 }),
        o({ id: "call-viewing", label: "Vill se lokalen", type: "call", body: `Pratade med ${n}. Vill se lokalen, tid att bestämma.`, followUpDays: 2 }),
        o({ id: "call-voicemail", label: "Lämnade meddelande", type: "call", body: `Lämnade meddelande till ${n}.`, followUpDays: 2 }),
        o({ id: "call-noanswer", label: "Ingen svarade", type: "call", body: `Försökte nå ${n} – ingen svarade.`, followUpDays: 1 }),
        o({ id: "call-lost", label: "Inte intresserad", type: "call", body: `${n} är inte intresserad längre.`, status: "lost" })
      ]
    };
  }
  if (kind === "email") {
    return {
      text: `Vad stod det i mejlet till ${n}?`,
      chips: [
        o({ id: "email-info", label: "Skickade information", type: "email", body: `Skickade information om ${s.listing} till ${n}.`, followUpDays: 3 }),
        o({ id: "email-times", label: "Föreslog visningstider", type: "email", body: `Föreslog visningstider till ${n}.`, followUpDays: 2 }),
        o({ id: "email-reply", label: "Fick svar", type: "email", body: `Fick svar från ${n}.`, followUpDays: 2 }),
        o({ id: "email-terms", label: "Skickade villkor", type: "email", body: `Skickade hyresvillkor till ${n}.`, status: "negotiating", followUpDays: 4 })
      ]
    };
  }
  if (kind === "meeting") {
    return {
      text: `Hur gick mötet med ${n}?`,
      chips: [
        o({ id: "meeting-good", label: "Bra möte – går vidare", type: "meeting", body: `Möte med ${n}. Bra samtal, vi går vidare.`, status: "negotiating", followUpDays: 5 }),
        o({ id: "meeting-think", label: "Behöver tänka", type: "meeting", body: `Möte med ${n}. Behöver fundera och återkommer.`, followUpDays: 7 }),
        o({ id: "meeting-lost", label: "Inte aktuellt", type: "meeting", body: `Möte med ${n}. Inte aktuellt just nu.`, status: "lost" })
      ]
    };
  }
  if (kind === "viewing") {
    return {
      text: `Vad tyckte ${n} om lokalen?`,
      chips: [
        o({ id: "viewing-keen", label: "Mycket intresserad", type: "viewing", body: `Visning genomförd. ${n} var mycket intresserad.`, status: "negotiating", followUpDays: 2 }),
        o({ id: "viewing-think", label: "Vill fundera", type: "viewing", body: `Visning genomförd. ${n} vill fundera.`, followUpDays: 4 }),
        o({ id: "viewing-noshow", label: "Kom inte", type: "viewing", body: `${n} kom inte till visningen.`, followUpDays: 1 }),
        o({ id: "viewing-lost", label: "Inte intresserad", type: "viewing", body: `Visning genomförd. ${n} är inte intresserad.`, status: "lost" })
      ]
    };
  }
  return { text: "Vad vill du anteckna? Skriv det så sparar jag det i loggen.", chips: [] };
}

// ── Suggested next steps ─────────────────────────────────────────────────────────────────────

export function emailDraft(kind, ctx) {
  const s = situationOf(ctx);
  const address = ctx.lead.listing?.address ? ` (${ctx.lead.listing.address})` : "";
  const signature = ctx.brokerName ? `\n\nVänliga hälsningar,\n${ctx.brokerName}` : "\n\nVänliga hälsningar";
  const drafts = {
    intro: {
      subject: `${s.listing} – tack för ditt intresse`,
      body: `Hej ${s.name},\n\nTack för ditt intresse för ${s.listing}${address}. Jag hjälper dig gärna vidare – när passar det att prata, eller vill du komma och titta på lokalen?${signature}`
    },
    reminder: {
      subject: `${s.listing} – har du hunnit fundera?`,
      body: `Hej ${s.name},\n\nJag ville höra av mig igen angående ${s.listing}. Har du hunnit fundera, och finns det något jag kan svara på?${signature}`
    },
    viewing: {
      subject: `${s.listing} – förslag på visningstider`,
      body: `Hej ${s.name},\n\nVill du komma och titta på ${s.listing}${address}? Jag kan erbjuda två tider:\n\n• \n• \n\nSäg till vilken som passar bäst.${signature}`
    },
    confirm: {
      subject: `${s.listing} – bekräftelse på visningen`,
      body: `Hej ${s.name},\n\nJag bekräftar visningen av ${s.listing}${address}. Hör av dig om något ändras.${signature}`
    },
    terms: {
      subject: `${s.listing} – sammanfattning av villkoren`,
      body: `Hej ${s.name},\n\nHär kommer en sammanfattning av vad vi pratat om för ${s.listing}:\n\n• Hyra:\n• Avtalstid:\n• Tillträde:\n\nTa gärna kontakt om du vill justera något.${signature}`
    }
  };
  return drafts[kind] || drafts.reminder;
}

export function mailtoFor(kind, ctx) {
  const to = ctx.lead.renter?.email;
  if (!to) return "";
  const draft = emailDraft(kind, ctx);
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
}

/** Up to three concrete things worth doing next for this particular lead. */
export function suggestNextSteps(ctx) {
  const s = situationOf(ctx);
  const suggestions = [];
  const add = (item) => {
    if (suggestions.length < 3 && !suggestions.some((existing) => existing.id === item.id)) suggestions.push(item);
  };
  const call = { id: "call", text: `Ring ${s.name}${s.status === "new" ? ` och presentera ${s.listing}` : ""}`, cta: s.phone ? "Ring" : "Logga samtal", action: { type: "call" } };
  const mail = (id, text, draft) => ({ id, text, cta: s.email ? "Skriv mejl" : "Logga mejl", action: { type: "email", draft } });
  const followUp = { id: "followup", text: "Sätt en uppföljning om 3 dagar", cta: "Sätt", action: { type: "followup", days: 3 } };

  if (s.status === "won" || s.status === "lost") {
    add({ id: "note", text: s.status === "won" ? "Anteckna avtalsdetaljer och nästa steg" : "Anteckna varför affären föll bort", cta: "Anteckna", action: { type: "capture", kind: "note" } });
    return suggestions;
  }
  if (s.followDiff !== null && s.followDiff < 0) add({ ...call, id: "call-overdue", text: `Följ upp med ${s.name} idag – det är försenat` });
  if (s.status === "new") {
    add(call);
    add(mail("mail-intro", `Skicka ett kort välkomstmejl om ${s.listing}`, "intro"));
  }
  if (s.status === "contacted") {
    add(s.lastDays !== null && s.lastDays >= 3 ? mail("mail-reminder", `Skicka en påminnelse till ${s.name}`, "reminder") : call);
    add(mail("mail-viewing", "Föreslå två tider för visning", "viewing"));
  }
  if (s.status === "viewing_booked") {
    add(mail("mail-confirm", "Bekräfta visningen dagen innan", "confirm"));
    add({ id: "viewing-done", text: "Logga visningen när den är klar", cta: "Logga", action: { type: "capture", kind: "viewing" } });
  }
  if (s.status === "negotiating") {
    add(mail("mail-terms", "Sammanfatta villkoren i ett mejl", "terms"));
    add({ id: "meeting", text: `Boka ett avstämningsmöte med ${s.name}`, cta: "Logga möte", action: { type: "capture", kind: "meeting" } });
  }
  if (s.followDiff === null || s.followDiff < 0) add(followUp);
  if (s.status !== "viewing_booked" && s.status !== "negotiating") add(call);
  return suggestions;
}

/** The assistant's opening message with everything it offers alongside it. */
export function buildBriefing(ctx) {
  const context = { ...ctx, now: ctx.now || new Date() };
  const s = situationOf(context);
  const status = context.lead.status || "new";
  const suggestions = suggestNextSteps(context);
  const chips = status === "new" && s.hasContact
    ? [{ id: "status-contacted", label: "Ja, flytta till Kontaktad", intent: { type: "status", status: "contacted" } }, ...captureChips(context)]
    : captureChips(context);
  return { text: openingText(context, s), chips, suggestions };
}
