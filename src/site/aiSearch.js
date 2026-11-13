import { parseNeedsFromPrompt } from "../data/matchEngine";
import { propertyAmenityDefinitions } from "../lib/propertyAmenityIcons";

// AI-sök on the public site: a description in plain Swedish becomes filters,
// with the same parser the app's AI-sök and the Convex query use
// (data/matchEngine.js), so a visitor gets the same reading before signing in.
// The site adds what that parser leaves out: thousands written with spaces
// ("80 000 kr"), "tkr", numbers as words ("tolv personer"), a size in kvm and
// the amenities it can recognise. Rule-based, no model call.

const NUMBER_WORDS = {
  en: 1, ett: 1, två: 2, tre: 3, fyra: 4, fem: 5, sex: 6, sju: 7, åtta: 8, nio: 9, tio: 10,
  elva: 11, tolv: 12, tretton: 13, fjorton: 14, femton: 15, sexton: 16, sjutton: 17, arton: 18,
  nitton: 19, tjugo: 20, trettio: 30, fyrtio: 40, femtio: 50
};

function normalize(prompt) {
  let text = ` ${String(prompt || "").toLowerCase()} `;
  // "80 000" and "1 200 000" → "80000", "1200000".
  text = text.replace(/(\d)[\s ](?=\d{3}(?!\d))/g, "$1");
  text = text.replace(/(\d+)\s*tkr/g, "$1k");
  text = text.replace(/kronor/g, "kr");
  for (const [word, value] of Object.entries(NUMBER_WORDS)) {
    text = text.replace(new RegExp(`(^|[^a-zåäö])${word}(?=\\s+(personer|platser|pers|anställda|medarbetare))`, "g"), `$1${value}`);
  }
  text = text.replace(/(\d+)\s*(pers|anställda|medarbetare)\b/g, "$1 personer");
  return text.trim();
}

export function interpretPrompt(prompt) {
  const text = normalize(prompt);
  const parsed = parseNeedsFromPrompt(text);
  const result = {};

  if (parsed.district) result.district = parsed.district;
  if (parsed.type) result.type = parsed.type;
  if (parsed.teamSize) result.teamSize = String(parsed.teamSize);
  if (parsed.readyNow) result.readyNow = true;
  if (parsed.onlyVerified) result.onlyVerified = true;

  let budget = parsed.maxBudget;
  if (!budget) {
    const loose = text.match(/(\d{4,7})\s*(kr|sek|k)?\s*(?:i\s*|per\s*|\/\s*)?(?:månad|mån)/);
    if (loose) budget = Number(loose[1]);
  }
  // A budget under a thousand is almost certainly "80" for "80 000" or "80k".
  if (budget && budget < 1000) budget *= 1000;
  if (budget) result.maxBudget = String(budget);

  const size = text.match(/(\d{2,4})\s*(kvm|m2|m²|kvadrat)/);
  if (size) result.sizeAround = String(size[1]);

  const amenities = propertyAmenityDefinitions
    .filter((item) => item.aliases.some((alias) => text.includes(alias)))
    .map((item) => item.label);
  if (amenities.length) result.amenities = [...new Set(amenities)];

  return result;
}

export function amenityMatches(listing, label) {
  const definition = propertyAmenityDefinitions.find((item) => item.label === label);
  const aliases = definition ? definition.aliases : [label.toLowerCase()];
  const haystack = (Array.isArray(listing.amenities) ? listing.amenities.join(" ") : "").toLowerCase();
  return aliases.some((alias) => haystack.includes(alias));
}

export const AI_KEYS = ["district", "type", "teamSize", "maxBudget", "sizeAround", "readyNow", "onlyVerified", "amenities"];

export function hasInterpretation(result) {
  return AI_KEYS.some((key) => (Array.isArray(result[key]) ? result[key].length : Boolean(result[key])));
}
