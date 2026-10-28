import { initialDraft } from "./listingDraft";

// Document import for "Publicera annons".
//
// The extraction itself is MOCKED: parseListingDocuments() waits a realistic amount of time and returns
// canned listings, so the whole experience (upload → reading → review → publish) can be demoed end to end.
// Swap the body of parseListingDocuments() for a real extraction service later; the callers only rely on
// its signature and on the shape of the listings it returns.

export const IMPORT_ACCEPT = ".xlsx,.xls,.csv,.pdf,.doc,.docx,.ppt,.pptx,.txt,.json,image/*";
export const IMPORT_MAX_FILES = 10;
export const IMPORT_MAX_BYTES = 25 * 1024 * 1024;

const kindByExtension = {
  xlsx: "spreadsheet",
  xls: "spreadsheet",
  csv: "spreadsheet",
  pdf: "pdf",
  doc: "document",
  docx: "document",
  txt: "document",
  ppt: "presentation",
  pptx: "presentation",
  json: "data",
  jpg: "image",
  jpeg: "image",
  png: "image",
  webp: "image",
  heic: "image",
  gif: "image"
};

export const importKindLabels = {
  spreadsheet: "Kalkylblad",
  pdf: "PDF",
  document: "Dokument",
  presentation: "Presentation",
  data: "Data",
  image: "Bild"
};

export function importKindFor(fileName = "", mimeType = "") {
  const extension = String(fileName).split(".").pop()?.toLowerCase() || "";
  if (kindByExtension[extension]) return kindByExtension[extension];
  if (String(mimeType).startsWith("image/")) return "image";
  return null;
}

export function formatFileSize(bytes = 0) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} kB`;
}

/** Turns picked or dropped File objects into import entries, keeping the ones we can read and explaining the rest. */
export function classifyImportFiles(fileList, existing = []) {
  const accepted = [];
  const problems = [];
  const known = new Set(existing.map((entry) => `${entry.name}:${entry.size}`));

  for (const file of fileList) {
    const kind = importKindFor(file.name, file.type);
    const key = `${file.name}:${file.size}`;
    if (!kind) {
      problems.push(`${file.name} har en filtyp som inte stöds.`);
    } else if (file.size > IMPORT_MAX_BYTES) {
      problems.push(`${file.name} är större än 25 MB.`);
    } else if (!known.has(key)) {
      known.add(key);
      accepted.push({ id: `file-${crypto.randomUUID()}`, name: file.name, size: file.size, kind, file });
    }
  }

  const room = Math.max(0, IMPORT_MAX_FILES - existing.length);
  if (accepted.length > room) {
    problems.push(`Du kan läsa in högst ${IMPORT_MAX_FILES} filer åt gången.`);
  }
  return { accepted: accepted.slice(0, room), problems };
}

// Files attached in the broker assistant wait here for "Publicera annons", which picks them up when it opens.
let queuedImportFiles = [];
export function queueImportFiles(files) {
  queuedImportFiles = files;
}
export function takeQueuedImportFiles() {
  const files = queuedImportFiles;
  queuedImportFiles = [];
  return files;
}

/** Two ready-made files for trying the flow without any documents at hand. */
export function sampleImportFiles() {
  return [
    { id: "sample-portfolio", name: "Fastighetsportfölj_Q3_2026.xlsx", size: 184_320, kind: "spreadsheet", sample: true },
    { id: "sample-prospectus", name: "Prospekt_Butikslokal_Götgatan.pdf", size: 2_516_582, kind: "pdf", sample: true }
  ];
}

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Avbruten", "AbortError"));
      return;
    }
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      window.clearTimeout(timer);
      reject(new DOMException("Avbruten", "AbortError"));
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function draftFrom(fields) {
  return {
    ...initialDraft,
    responseHours: "2",
    amenities: [],
    ...fields,
    images: fields.image ? [{ id: `img-${fields.image}`, src: fields.image, name: "Omslagsbild" }] : []
  };
}

// Canned extraction results. A few fields are left empty or marked uncertain on purpose so the review
// step has something to show: missing fields block publishing, uncertain ones just ask for a second look.
const mockListingPool = [
  {
    fields: {
      title: "Ljust kontor vid Odenplan", district: "Vasastan", type: "Kontor", address: "Odengatan 62, Stockholm",
      sizeSqm: "240", capacity: "20", priceMonthly: "48000", term: "36 månader", availability: "Ledig nu",
      transitDistance: "0-3 min", parkingType: "Garage", layoutType: "Öppet landskap",
      amenities: ["Mötesrum", "Fiber", "Kök", "Reception"], image: "/object-images/object-1.jpeg",
      description: "Ljust och luftigt kontor med öppen planlösning, två mötesrum och pentry. En minut från Odenplans tunnelbana."
    },
    uncertain: []
  },
  {
    fields: {
      title: "Studio i Hornstull", district: "Södermalm", type: "Studio", address: "Hornsgatan 96, Stockholm",
      sizeSqm: "85", capacity: "6", priceMonthly: "18500", term: "12 månader", availability: "Inom 1 månad",
      transitDistance: "3-7 min", amenities: ["Fiber", "Kaffezon", "Cykelförråd"], image: "/object-images/object-2.jpeg",
      description: "Kreativ studio med högt i tak och stora fönster mot gården. Passar ett mindre team eller en enskild yrkesutövare."
    },
    uncertain: []
  },
  {
    fields: {
      title: "Flexibelt kontor vid vattnet", district: "Kungsholmen", type: "Kontor", address: "Kungsholms strand 15, Stockholm",
      sizeSqm: "160", capacity: "12", priceMonthly: "32000", term: "Flexibelt avtal", availability: "Ledig nu",
      contractFlex: "Flexibelt avtal", amenities: ["Mötesrum", "Takterrass", "Fiber", "Kök"], image: "/object-images/object-3.jpeg",
      description: "Flexibelt kontor med sjöutsikt och delad takterrass. Möbler kan ingå enligt överenskommelse."
    },
    uncertain: ["Månadshyra"]
  },
  {
    fields: {
      title: "Butikslokal på Götgatan", district: "Södermalm", type: "Butik", address: "",
      sizeSqm: "110", capacity: "", priceMonthly: "52000", term: "24 månader", availability: "Efter överenskommelse",
      amenities: ["Skyltfönster", "Lastzon"], image: "/object-images/object-4.jpeg",
      description: "Butikslokal i bra skyltläge med stora fönster mot gatan och lastzon bakom huset."
    },
    uncertain: []
  },
  {
    fields: {
      title: "Klinikvåning på Östermalm", district: "Östermalm", type: "Klinik", address: "Sturegatan 34, Stockholm",
      sizeSqm: "195", capacity: "8", priceMonthly: "61000", term: "36 månader", availability: "Inom 2 månader",
      amenities: ["Väntrum", "Reception", "Dusch"], image: "/object-images/object-5.jpeg", description: ""
    },
    uncertain: []
  },
  {
    fields: {
      title: "Coworking i Solna", district: "Solna", type: "Coworking", address: "Solnavägen 3, Solna",
      sizeSqm: "420", capacity: "45", priceMonthly: "89000", term: "24 månader", availability: "Ledig nu",
      amenities: ["Mötesrum", "Lounge", "Telefonbås", "Fiber"], image: "/object-images/object-6.jpeg",
      description: "Stor coworkingyta med flera zoner för fokus, möten och event. Nära pendeltåg och Mall of Scandinavia."
    },
    uncertain: ["Storlek"]
  },
  {
    fields: {
      title: "Kontor vid Drottninggatan", district: "Norrmalm", type: "Kontor", address: "Drottninggatan 71, Stockholm",
      sizeSqm: "130", capacity: "10", priceMonthly: "39000", term: "12 månader", availability: "Inom 2 veckor",
      amenities: ["Mötesrum", "Fiber", "Pentry"], image: "/object-images/object-7.jpeg",
      description: "Välplanerat kontor mitt i city med bra ljusinsläpp och egna mötesrum."
    },
    uncertain: []
  }
];

function pagesFor(file) {
  return 3 + (file.name.length % 7);
}

function sourceRefFor(file, index) {
  if (file.kind === "spreadsheet") return `Blad 1 · rad ${index + 2}`;
  if (file.kind === "presentation") return `Bild 1–${pagesFor(file)}`;
  if (file.kind === "image") return "Bild 1";
  return `Sida 1–${pagesFor(file)}`;
}

function listingsForFile(file, cursor) {
  const count = file.kind === "spreadsheet" ? 3 : file.kind === "image" ? 0 : 1;
  const listings = [];
  for (let index = 0; index < count && cursor + index < mockListingPool.length; index += 1) {
    const entry = mockListingPool[cursor + index];
    listings.push({
      id: `import-${file.id}-${index}`,
      sourceName: file.name,
      sourceRef: sourceRefFor(file, index),
      draft: draftFrom(entry.fields),
      uncertain: entry.uncertain,
      status: "review",
      listingId: null,
      error: ""
    });
  }
  return listings;
}

/**
 * MOCK extraction. Reports progress through onProgress and resolves with { listings }.
 * Events: { phase: "file-start" | "identifying" | "file-done", file, count? } then { phase: "extracting" | "verifying" }.
 */
export async function parseListingDocuments(files, { onProgress, signal } = {}) {
  const listings = [];
  let cursor = 0;

  for (const file of files) {
    onProgress?.({ phase: "file-start", file });
    await wait(650, signal);
    onProgress?.({ phase: "identifying", file });
    await wait(550, signal);
    const found = listingsForFile(file, cursor);
    cursor += found.length;
    listings.push(...found);
    onProgress?.({ phase: "file-done", file, count: found.length });
  }

  // Images alone carry no data to read: offer one half-empty listing to complete by hand.
  if (listings.length === 0 && files.length > 0) {
    const [first] = files;
    listings.push({
      id: `import-${first.id}-0`,
      sourceName: first.name,
      sourceRef: "Bild 1",
      draft: draftFrom({ ...mockListingPool[3].fields, title: "", address: "", sizeSqm: "", priceMonthly: "", description: "" }),
      uncertain: [],
      status: "review",
      listingId: null,
      error: ""
    });
  }

  onProgress?.({ phase: "extracting" });
  await wait(700, signal);
  onProgress?.({ phase: "verifying" });
  await wait(600, signal);
  return { listings };
}
