import { propertyAmenityDefinitions } from "./propertyAmenityIcons";
import { contractOptions, districtOptions, layoutOptions, parkingOptions, transitOptions, typeOptions, accessOptions } from "./profileHelpers";

// Logic behind "Beskriv med egna ord" in "Nytt lokalprogram". Plain rules over what the person wrote: no model call and
// no network. LocalProgramFlow.jsx renders the flow; a real model could later replace interpretProgramText() without
// touching it, since the UI only depends on the shape returned here.
//
// interpretProgramText() returns
//   patch    the fields of a lokalprogram that the text told us about, ready to be merged into a draft
//   found    what was understood, as { id, label, value } for showing back to the person
//   missing  the main things the text said nothing about (area, size, budget, move-in, seats)

const LETTERS = "a-zåäö";
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const list = (items) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} och ${items[items.length - 1]}`);
const words = (source, flags = "i") => new RegExp(`(?<![${LETTERS}])(?:${source})(?![${LETTERS}])`, flags);

const NUMBER = "\\d{1,3}(?:[ \\u00a0.]\\d{3})+|\\d+(?:[.,]\\d+)?";
const SQM = "(?:kvm|kvadratmeter|kvadrat|m2|m²)";
const MULTIPLIER = `(?:\\s*(k|tkr|tusen|miljoner|miljon|mkr)(?![${LETTERS}]))?`;
const CURRENCY = "(?:kr|kronor|sek|:-)";
const PER_MONTH = "(?:\\s*(?:\\/|per|i)\\s*(?:mån|månad|månaden))?";

const numberWords = { en: 1, ett: 1, två: 2, tre: 3, fyra: 4, fem: 5, sex: 6, sju: 7, åtta: 8, nio: 9, tio: 10, elva: 11, tolv: 12, tretton: 13, fjorton: 14, femton: 15, sexton: 16, sjutton: 17, arton: 18, nitton: 19, tjugo: 20 };
const numberWordPattern = Object.keys(numberWords).join("|");

const months = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const monthShort = { jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, okt: 9, nov: 10, dec: 11 };
const monthPattern = `${months.join("|")}|${Object.keys(monthShort).join("|")}`;
const monthIndex = (name) => {
  const key = name.toLowerCase();
  const full = months.indexOf(key);
  return full >= 0 ? full : monthShort[key];
};

const districtNames = districtOptions.filter((name) => name !== "Alla");
const districtAliases = {
  Norrmalm: ["norrmalm", "city", "t-centralen", "hötorget"],
  Södermalm: ["södermalm", "söder", "sofo", "hornstull", "medborgarplatsen"],
  Vasastan: ["vasastan", "vasa", "odenplan", "sankt eriksplan"],
  Östermalm: ["östermalm", "stureplan", "karlaplan"],
  Kungsholmen: ["kungsholmen", "fridhemsplan", "rådhuset"],
  Solna: ["solna", "solna business park", "arenastaden"],
  Sundbyberg: ["sundbyberg"]
};
const typeAliases = {
  Kontor: ["kontor", "kontorslokal", "kontorslokaler", "kontorsyta", "kontorsytor"],
  Coworking: ["coworking", "co-working", "cowork", "delat kontor", "flexplats", "flexplatser"],
  Kontorshotell: ["kontorshotell"],
  Butik: ["butik", "butikslokal", "butikslokaler", "handelslokal"],
  Lager: ["lager", "lagerlokal", "lagerlokaler"],
  Showroom: ["showroom", "utställningslokal"],
  Ateljé: ["ateljé", "atelje", "studio"],
  Klinik: ["klinik", "mottagning", "vårdlokal"],
  Restaurang: ["restaurang", "restauranglokal", "kafé", "café"]
};
const typeWords = new Set(Object.values(typeAliases).flat());

const prepositionFor = { Södermalm: "på", Kungsholmen: "på", Östermalm: "på" };

function toNumber(raw) {
  let text = String(raw).replace(/[ \s]/g, "");
  if (/^\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, "");
  return Number(text.replace(",", "."));
}

function withMultiplier(value, unit) {
  const key = String(unit || "").toLowerCase();
  if (key === "k" || key === "tkr" || key === "tusen") return value * 1000;
  if (key === "miljon" || key === "miljoner" || key === "mkr") return value * 1000000;
  return value;
}

const toIsoDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const roundTo = (value, step) => Math.round(value / step) * step;
const sek = (value) => `${Math.round(value).toLocaleString("sv-SE")} kr`;

/** The next day of the year that has not passed: "15 mars" written in October means next March. */
function upcoming(day, month, year, now) {
  const explicit = Number.isFinite(year);
  let date = new Date(explicit ? year : now.getFullYear(), month, day);
  if (!explicit && date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) date = new Date(now.getFullYear() + 1, month, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function findMoveIn(text, now, take) {
  let match = text.match(words("så snart som möjligt|snarast|omgående|direkt|asap|redan nu|genast"));
  if (match) {
    take(match);
    return { date: toIsoDate(now), label: "Så snart som möjligt" };
  }
  match = text.match(new RegExp(`(?<![\\d])(\\d{1,2})(?::a|:e)?\\s+(${monthPattern})(?![${LETTERS}])(?:\\s+(20\\d{2}))?`, "i"));
  if (match && Number(match[1]) >= 1 && Number(match[1]) <= 31) {
    const date = upcoming(Number(match[1]), monthIndex(match[2]), match[3] ? Number(match[3]) : NaN, now);
    if (date) {
      take(match);
      return { date: toIsoDate(date) };
    }
  }
  match = text.match(new RegExp(`(?<![${LETTERS}])q([1-4])\\s*(20\\d{2})?(?![\\d${LETTERS}])`, "i"));
  if (match) {
    const date = upcoming(1, (Number(match[1]) - 1) * 3, match[2] ? Number(match[2]) : NaN, now);
    if (date) {
      take(match);
      return { date: toIsoDate(date) };
    }
  }
  match = text.match(new RegExp(`(?<![${LETTERS}])(?:inflyttning|inflytt|flytta in|flytt|tillträde|från|till|senast|i)\\s+(${monthPattern})(?![${LETTERS}])(?:\\s+(20\\d{2}))?`, "i"));
  if (match) {
    const date = upcoming(1, monthIndex(match[1]), match[2] ? Number(match[2]) : NaN, now);
    if (date) {
      take(match);
      return { date: toIsoDate(date) };
    }
  }
  match = text.match(new RegExp(`(?<![${LETTERS}])om\\s+(\\d+|${numberWordPattern}|ett halvår)\\s*(månader|månad|veckor|vecka|år)?(?![${LETTERS}])`, "i"));
  if (match) {
    const halfYear = /halvår/i.test(match[1]);
    const amount = halfYear ? 6 : (numberWords[match[1].toLowerCase()] || Number(match[1]));
    const unit = halfYear ? "månader" : (match[2] || "").toLowerCase();
    if (amount > 0 && unit) {
      const date = new Date(now);
      if (unit.startsWith("vecka") || unit.startsWith("veckor")) date.setDate(date.getDate() + amount * 7);
      else if (unit === "år") date.setFullYear(date.getFullYear() + amount);
      else date.setMonth(date.getMonth() + amount);
      take(match);
      return { date: toIsoDate(date) };
    }
  }
  return null;
}

const transitFromMeters = (meters) => (meters <= 300 ? "0-300 meter" : meters <= 600 ? "0-600 meter" : meters <= 1000 ? "0-1000 meter" : "0-1100 meter");

const listOf = (value) => (Array.isArray(value) ? value : String(value || "").split(",")).map((item) => String(item).trim()).filter(Boolean);

export function suggestProgramTitle({ type = [], district = "Alla", teamSize = "" } = {}) {
  const kind = listOf(type)[0] || "Lokal";
  if (district && district !== "Alla") return `${kind} ${prepositionFor[district] || "i"} ${district}`;
  if (Number(teamSize) > 0) return `${kind} för ${Number(teamSize)} personer`;
  return "";
}

/**
 * Reads a description such as "Vi är 12 personer och söker kontor på Södermalm, 200–250 kvm, max 90 000 kr i månaden,
 * inflyttning i januari, nära tunnelbana och med mötesrum" into the fields of a lokalprogram. Every part is read on its
 * own; what is not mentioned is left out of `patch` and named in `missing`.
 */
export function interpretProgramText(raw, { now = new Date() } = {}) {
  const original = String(raw || "").trim();
  let rest = ` ${original.toLowerCase().replace(/\s+/g, " ")} `;
  const patch = {};
  const found = [];
  const add = (id, label, value) => found.push({ id, label, value });
  const take = (match) => {
    rest = rest.replace(match[0], " ".repeat(Math.min(match[0].length, 1)));
    return match;
  };

  // ── Size in square metres: a range, a lower or upper bound, or "about"
  let match = rest.match(new RegExp(`(${NUMBER})\\s*(?:-|–|—|till|och)\\s*(${NUMBER})\\s*${SQM}`, "i"));
  if (match && toNumber(match[1]) < toNumber(match[2]) && toNumber(match[1]) >= 10) {
    take(match);
    patch.minSize = String(toNumber(match[1]));
    patch.maxSize = String(toNumber(match[2]));
  } else {
    const least = rest.match(new RegExp(`(?:minst|från|över|lägst|åtminstone|minimum|min\\.?)\\s*(?:på\\s*)?(${NUMBER})\\s*${SQM}`, "i"));
    if (least) {
      take(least);
      patch.minSize = String(toNumber(least[1]));
    }
    const most = rest.match(new RegExp(`(?:max(?:imalt|imum)?\\.?|högst|upp till|som mest|inte större än|under)\\s*(?:på\\s*)?(${NUMBER})\\s*${SQM}`, "i"));
    if (most) {
      take(most);
      patch.maxSize = String(toNumber(most[1]));
    }
    if (!least && !most) {
      const about = rest.match(new RegExp(`(?<![\\d,.\\/])(${NUMBER})\\s*${SQM}(?!\\s*(?:\\/|per))`, "i"));
      if (about && toNumber(about[1]) >= 10) {
        take(about);
        patch.minSize = String(roundTo(toNumber(about[1]) * 0.9, 5));
        patch.maxSize = String(roundTo(toNumber(about[1]) * 1.1, 5));
      }
    }
  }
  if (patch.minSize || patch.maxSize) add("size", "Yta", `${patch.minSize || 0}–${patch.maxSize || "∞"} kvm`);

  // ── Budget per month
  const money = (numberText, unit) => withMultiplier(toNumber(numberText), unit);
  let budgetRange = rest.match(new RegExp(`(${NUMBER})${MULTIPLIER}\\s*(?:-|–|—|till)\\s*(${NUMBER})${MULTIPLIER}\\s*${CURRENCY}${PER_MONTH}`, "i"));
  if (budgetRange) {
    let low = money(budgetRange[1], budgetRange[2] || budgetRange[4]);
    const high = money(budgetRange[3], budgetRange[4]);
    if (!budgetRange[2] && budgetRange[4]) low = money(budgetRange[1], budgetRange[4]);
    if (low >= 1000 && high > low) {
      take(budgetRange);
      patch.minBudget = String(Math.round(low));
      patch.maxBudget = String(Math.round(high));
    } else {
      budgetRange = null;
    }
  }
  if (!budgetRange) {
    const cap = rest.match(new RegExp(`(?:max(?:imalt|imum)?\\.?|högst|upp till|som mest|under|inte mer än|budget(?:en)?(?:\\s+(?:på|är|ligger på|runt|cirka|ca))?)\\s*(?:på\\s*)?(${NUMBER})${MULTIPLIER}\\s*(${CURRENCY})?${PER_MONTH}`, "i"));
    if (cap) {
      const value = money(cap[1], cap[2]);
      if (value >= 1000) {
        take(cap);
        patch.maxBudget = String(Math.round(value));
      }
    }
    const floor = rest.match(new RegExp(`(?:minst|från|över|lägst)\\s*(${NUMBER})${MULTIPLIER}\\s*${CURRENCY}${PER_MONTH}`, "i"));
    if (floor) {
      const value = money(floor[1], floor[2]);
      if (value >= 1000) {
        take(floor);
        patch.minBudget = String(Math.round(value));
      }
    }
    if (!patch.maxBudget) {
      const plain = rest.match(new RegExp(`(?<![\\d,.])(${NUMBER})${MULTIPLIER}\\s*${CURRENCY}${PER_MONTH}`, "i"));
      if (plain && money(plain[1], plain[2]) >= 5000) {
        take(plain);
        patch.maxBudget = String(Math.round(money(plain[1], plain[2])));
      }
    }
  }
  if (patch.minBudget || patch.maxBudget) add("budget", "Budget", patch.minBudget ? `${sek(Number(patch.minBudget))}–${sek(Number(patch.maxBudget || 0))}` : `Upp till ${sek(Number(patch.maxBudget))}`);

  // ── Seats
  let seats = rest.match(new RegExp(`(\\d{1,3})\\s*(?:-|–|till)\\s*(\\d{1,3})\\s*(?:personer|pers\\.?|anställda|medarbetare|arbetsplatser|platser|kollegor)`, "i"));
  let seatCount = seats ? Math.max(Number(seats[1]), Number(seats[2])) : null;
  if (!seats) {
    seats = rest.match(new RegExp(`(?<![\\d,.\\/])(\\d{1,3}|${numberWordPattern})\\s*(?:personer|pers\\.?|anställda|medarbetare|arbetsplatser|platser|kollegor)(?![${LETTERS}])`, "i"))
      || rest.match(new RegExp(`(?:team|bolag|företag|byrå|grupp)\\w*\\s+(?:på|om|med)\\s+(?:ca\\s+|cirka\\s+)?(\\d{1,3})(?![\\d,.]|\\s*${SQM})`, "i"))
      || rest.match(new RegExp(`vi är (?:ca |cirka |ungefär |runt )?(\\d{1,3}|${numberWordPattern})(?![\\d,.]|\\s*${SQM})`, "i"));
    if (seats) seatCount = numberWords[seats[1].toLowerCase()] || Number(seats[1]);
  }
  if (seats && seatCount > 0 && seatCount <= 500) {
    take(seats);
    patch.teamSize = String(seatCount);
    add("teamSize", "Platser", `${seatCount} platser`);
  }

  // ── Area and kind of premises
  const districtsSeen = [];
  for (const name of districtNames) {
    const aliases = districtAliases[name] || [name.toLowerCase()];
    const hit = aliases.map((alias) => ({ alias, at: rest.search(words(escapeRegExp(alias))) })).filter((item) => item.at >= 0).sort((a, b) => a.at - b.at)[0];
    if (hit) districtsSeen.push({ name, at: hit.at });
  }
  districtsSeen.sort((a, b) => a.at - b.at);
  if (districtsSeen.length > 0) {
    patch.district = districtsSeen[0].name;
    add("district", "Område", districtsSeen[0].name);
  }
  const kinds = [];
  for (const name of typeOptions) {
    const at = rest.search(words((typeAliases[name] || [name.toLowerCase()]).map(escapeRegExp).join("|")));
    if (at >= 0) kinds.push({ name, at });
  }
  kinds.sort((a, b) => a.at - b.at);
  if (kinds.length > 0) {
    patch.type = kinds.slice(0, 2).map((kind) => kind.name);
    add("type", "Typ", patch.type.join(", "));
  }

  // ── Move-in
  const moveIn = findMoveIn(rest, now, take);
  if (moveIn) {
    patch.moveInDate = moveIn.date;
    add("moveInDate", "Inflyttning", moveIn.label || new Date(`${moveIn.date}T12:00:00`).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" }));
  }

  // ── Contract length
  const monthsOf = (amount, unit) => (/^år|års/.test(unit) ? amount * 12 : amount);
  let contract = rest.match(new RegExp(`(?:avtal|kontrakt|hyresavtal|bindningstid)\\w*[^.,;]{0,30}?(\\d+)\\s*(?:-\\s*(\\d+)\\s*)?(år|års|månader|månaders|mån)`, "i"))
    || rest.match(new RegExp(`(\\d+)\\s*(?:-\\s*(\\d+)\\s*)?(år|års|månader|månaders|mån)\\w*\\s*(?:avtal|kontrakt|hyresavtal|bindningstid)`, "i"));
  if (contract) {
    const length = monthsOf(Math.max(Number(contract[1]), Number(contract[2] || 0)), contract[3].toLowerCase());
    patch.contractFlex = length <= 6 ? contractOptions[1] : length <= 12 ? contractOptions[2] : contractOptions[3];
  } else {
    contract = rest.match(words("kort avtal|korttidsavtal|kort kontrakt|kortare avtal|kort hyrestid"));
    if (contract) patch.contractFlex = contractOptions[1];
    else if ((contract = rest.match(words("långt avtal|långtidsavtal|långsiktigt|långsiktig|lång bindningstid|långt kontrakt")))) patch.contractFlex = contractOptions[3];
  }
  if (contract) take(contract);
  if (patch.contractFlex) add("contractFlex", "Avtal", patch.contractFlex);

  // ── Public transport, access, parking and layout
  const transitNear = "tunnelbana|t-bana|tunnelbanan|pendeltåg|pendeltåget|pendel|station|stationen|kollektivtrafik|kollektivtrafiken|t-centralen|buss|bussen|spårvagn";
  let transit = rest.match(new RegExp(`(?:inom|max|högst|på)\\s*(\\d{1,4})\\s*(meter|m|min|minuter)(?![${LETTERS}])[^.,;]{0,25}?(?:${transitNear}|gångavstånd)`, "i"))
    || rest.match(new RegExp(`(?:${transitNear})[^.,;]{0,25}?(?:inom|max|högst|på)\\s*(\\d{1,4})\\s*(meter|m|min|minuter)(?![${LETTERS}])`, "i"));
  if (transit) {
    const meters = /^m/.test(transit[2]) && !/^min/.test(transit[2]) ? Number(transit[1]) : Number(transit[1]) * 80;
    patch.transitDistance = transitFromMeters(meters);
  } else if ((transit = rest.match(new RegExp(`(?:precis intill|direkt vid|mycket nära|alldeles intill)\\s+(?:\\w+\\s+)?(?:${transitNear})`, "i")))) {
    patch.transitDistance = transitOptions[1];
  } else if ((transit = rest.match(new RegExp(`(?:nära|intill|vid|bredvid|gångavstånd till)\\s+(?:\\w+\\s+)?(?:${transitNear})`, "i")))) {
    patch.transitDistance = transitOptions[2];
  }
  if (transit) take(transit);
  if (patch.transitDistance) add("transitDistance", "Kollektivtrafik", patch.transitDistance);

  if (words("24/7|dygnet runt|dygnet-runt|alla tider|dygnet runt-tillträde").test(rest)) patch.accessHours = accessOptions[3];
  else if (words("kvällar och helger|även helger|helger|utökad access|utökade tider|flexibla tider|kvällstid").test(rest)) patch.accessHours = accessOptions[2];
  else if (words("kontorstid|kontorstider").test(rest)) patch.accessHours = accessOptions[1];
  if (patch.accessHours) add("accessHours", "Tillgång", patch.accessHours);

  if (words("ingen parkering behövs|behöver ingen parkering|inget parkeringsbehov").test(rest)) patch.parkingType = parkingOptions[1];
  else if (words("laddplats|laddplatser|laddstolpe|laddstolpar|elbilsladdning|laddning för elbil").test(rest)) patch.parkingType = parkingOptions[3];
  else if (words("garage|garageplats|garageplatser").test(rest)) patch.parkingType = parkingOptions[4];
  else if (words("parkering|p-plats|p-platser|bilplats|bilplatser|parkeringsplats|parkeringsplatser").test(rest)) patch.parkingType = parkingOptions[2];
  if (patch.parkingType) add("parkingType", "Parkering", patch.parkingType);

  if (words("öppet landskap|öppen planlösning|kontorslandskap|öppna ytor").test(rest)) patch.layoutType = layoutOptions[1];
  else if (words("cellkontor|egna rum|enskilda rum|slutna rum").test(rest)) patch.layoutType = layoutOptions[3];
  else if (words("blandad planlösning|mixad planlösning|mixat|mix av").test(rest)) patch.layoutType = layoutOptions[2];
  else if (words("flexibel planlösning|flexibla ytor|flexibelt").test(rest)) patch.layoutType = layoutOptions[4];
  if (patch.layoutType) add("layoutType", "Planlösning", patch.layoutType);

  // ── Requirements
  const requirements = [];
  if (words("driftkostnader ingår|drift ingår|inklusive drift|inklusive driftkostnader|allt inkluderat|driftkostnad ingår").test(rest)) {
    patch.includeOperatingCosts = true;
    requirements.push("Driftkostnad ingår");
  }
  if (words("tillgänglighetsanpassad|tillgänglighetsanpassade|tillgänglig för rullstol|rullstol|handikappanpassad|hiss och ramp").test(rest)) {
    patch.accessibilityAdapted = true;
    requirements.push("Tillgänglighetsanpassad");
  }
  if (words("miljöcertifierad|miljöcertifierade|miljöklassad|miljöbyggnad|breeam|leed|green building").test(rest)) {
    patch.ecoCertified = true;
    requirements.push("Miljöcertifierad");
  }
  if (requirements.length > 0) add("requirements", "Krav", list(requirements));

  // ── Amenities
  const amenities = [];
  for (const definition of propertyAmenityDefinitions) {
    const names = [definition.label, ...definition.aliases].map((name) => name.toLowerCase()).filter((name) => !typeWords.has(name));
    if (names.some((name) => words(escapeRegExp(name)).test(rest))) amenities.push(definition.label);
  }
  // Parking is its own answer, so the amenity of the same name is not added on top of it.
  const amenityNames = patch.parkingType ? amenities.filter((name) => name !== "Parkering" && name !== "Garage") : amenities;
  if (amenityNames.length > 0) {
    patch.amenities = amenityNames.join(", ");
    add("amenities", "Bekvämligheter", list(amenityNames));
  }

  // ── Name, and the person's own words kept with the program
  const title = suggestProgramTitle({ ...patch, district: patch.district || "Alla" });
  if (title) patch.title = title;
  if (original) patch.contextNotes = { Övrigt: original };

  const order = ["district", "type", "teamSize", "size", "budget", "moveInDate", "contractFlex", "transitDistance", "accessHours", "parkingType", "layoutType", "requirements", "amenities"];
  found.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const has = (id) => found.some((item) => item.id === id);
  const missing = [["district", "område"], ["teamSize", "antal platser"], ["size", "yta"], ["budget", "budget"], ["moveInDate", "inflyttning"]].filter(([id]) => !has(id)).map(([, label]) => label);
  return { patch, found, missing };
}

const orNothing = (value) => (value ? value : "");

/** The rows of the summary at the end of the flow. `step` is the question that changes the row. */
export function programSummaryRows(program = {}) {
  const types = listOf(program.type);
  const amenities = listOf(program.amenities);
  const size = program.minSize || program.maxSize ? `${program.minSize || 0}–${program.maxSize || "∞"} kvm` : "";
  const budget = program.maxBudget ? (program.minBudget ? `${sek(Number(program.minBudget))}–${sek(Number(program.maxBudget))}` : `Upp till ${sek(Number(program.maxBudget))}`) : program.minBudget ? `Från ${sek(Number(program.minBudget))}` : "";
  const requirements = [program.includeOperatingCosts && "Driftkostnad ingår", program.accessibilityAdapted && "Tillgänglighetsanpassad", program.ecoCertified && "Miljöcertifierad"].filter(Boolean);
  return [
    { id: "title", step: "name", label: "Namn", value: orNothing(program.title) },
    { id: "district", step: "place", label: "Område", value: program.district && program.district !== "Alla" ? program.district : "" },
    { id: "type", step: "place", label: "Typ av lokal", value: types.join(", ") },
    { id: "teamSize", step: "size", label: "Platser", value: program.teamSize ? `${program.teamSize} platser` : "" },
    { id: "size", step: "size", label: "Yta", value: size },
    { id: "budget", step: "budget", label: "Budget per månad", value: budget },
    { id: "moveInDate", step: "timing", label: "Inflyttning", value: program.moveInDate ? new Date(`${program.moveInDate}T12:00:00`).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" }) : "" },
    { id: "contractFlex", step: "timing", label: "Avtal", value: program.contractFlex || "" },
    { id: "transitDistance", step: "access", label: "Kollektivtrafik", value: program.transitDistance || "" },
    { id: "accessHours", step: "access", label: "Tillgång", value: program.accessHours || "" },
    { id: "parkingType", step: "access", label: "Parkering", value: program.parkingType || "" },
    { id: "layoutType", step: "access", label: "Planlösning", value: program.layoutType || "" },
    { id: "requirements", step: "requirements", label: "Särskilda krav", value: requirements.join(" · ") },
    { id: "amenities", step: "amenities", label: "Bekvämligheter", value: amenities.join(", ") },
    { id: "notes", step: "notes", label: "Egna önskemål", value: Object.values(program.contextNotes || {}).filter(Boolean).join(" ") }
  ];
}

