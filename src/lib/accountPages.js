import {
  Bookmark,
  Building2,
  CircleHelp,
  Compass,
  Keyboard,
  LifeBuoy,
  Rocket,
  SlidersHorizontal,
  UserRound
} from "lucide-react";

/**
 * The account overlay of the workspace panels: what the entries of the profile menu (Profil, Adminprofil, Inställningar, Hjälp) open.
 * It is a window over the page the person was on, with a side panel of every page in it, in groups. Each menu entry is a section of
 * the URL (`/app/admin/profil`, `/app/broker/hjalp`) and opens the window at the first page of its group; the side panel goes to the
 * others (`/app/admin/profil/lokalprogram`). The window is the route, so a link, the back button and a reload all work.
 */

/** The parts of the URL, after `/app/admin/` or `/app/broker/`, that open the overlay. */
export const ACCOUNT_SECTIONS = ["profil", "adminprofil", "installningar", "hjalp"];

export const ACCOUNT_PAGES = [
  {
    key: "profil",
    section: "profil",
    sub: "",
    group: "Konto",
    label: "Profil",
    title: "Profil",
    description: "Dina personuppgifter, profilbild och verifiering.",
    Icon: UserRound,
    keywords: "namn telefon e-post foto bild företag roll verifiering mäklare premium slutför"
  },
  {
    key: "lokalprogram",
    section: "profil",
    sub: "lokalprogram",
    group: "Konto",
    label: "Lokalprogram",
    title: "Lokalprogram",
    description: "Dina sökprofiler och de hyresgäster som matchar dem.",
    Icon: Compass,
    keywords: "sökprofil preferenser matchning hyresgäster budget yta område"
  },
  {
    key: "sparat",
    section: "profil",
    sub: "sparat",
    group: "Konto",
    label: "Sparat",
    title: "Sparat",
    description: "Objekt och sökningar du har sparat.",
    Icon: Bookmark,
    keywords: "sparade objekt sökningar favoriter bevakning"
  },
  {
    key: "adminprofil",
    section: "adminprofil",
    sub: "",
    group: "Företag",
    label: "Adminprofil",
    title: "Adminprofil",
    description: "Uppgifter om bolaget och reglerna för era mäklare och annonser.",
    Icon: Building2,
    companyAdminOnly: true,
    keywords: "bolag företag organisationsnummer logotyp godkännande moderering e-postdomän webbplats"
  },
  {
    key: "installningar",
    section: "installningar",
    sub: "",
    group: "Inställningar",
    label: "Allmänt",
    title: "Allmänt",
    description: "Utseende, sidomeny och ditt konto.",
    Icon: SlidersHorizontal,
    keywords: "tema mörkt ljust utseende sidomeny hovring roll sökläge logga ut"
  },
  {
    key: "genvagar",
    section: "installningar",
    sub: "genvagar",
    group: "Inställningar",
    label: "Genvägar",
    title: "Tangentbordsgenvägar",
    description: "Snabbare väg genom arbetsytan.",
    Icon: Keyboard,
    keywords: "tangentbord kortkommando cmd ctrl sök meny"
  },
  {
    key: "hjalp",
    section: "hjalp",
    sub: "",
    group: "Hjälp",
    label: "Kom igång",
    title: "Kom igång",
    description: "Stegen till en arbetsyta som är igång.",
    Icon: Rocket,
    keywords: "starta guide steg publicera annons prospekt assistent mäklare"
  },
  {
    key: "fragor",
    section: "hjalp",
    sub: "fragor",
    group: "Hjälp",
    label: "Vanliga frågor",
    title: "Vanliga frågor",
    description: "Svar på det vi oftast får frågor om.",
    Icon: CircleHelp,
    keywords: "faq fråga svar leads prospekt roller godkännande statistik assistent"
  },
  {
    key: "kontakt",
    section: "hjalp",
    sub: "kontakt",
    group: "Hjälp",
    label: "Kontakt",
    title: "Kontakt",
    description: "Så når du oss, och vad vi behöver veta.",
    Icon: LifeBuoy,
    keywords: "support mejl fel problem feedback"
  }
];

/** The pages a person has: the company admin has the company's profile too. */
export function accountPagesFor(role) {
  return ACCOUNT_PAGES.filter((page) => !page.companyAdminOnly || role === "company_admin");
}

/** The pages in their groups, in order: `[{ label, pages }]`. */
export function groupAccountPages(pages) {
  const groups = [];
  for (const page of pages) {
    const last = groups[groups.length - 1];
    if (last && last.label === page.group) last.pages.push(page);
    else groups.push({ label: page.group, pages: [page] });
  }
  return groups;
}

/** Where a page lives: `/app/admin/profil`, `/app/broker/profil/sparat`. */
export function accountPath(base, page) {
  return `${base}/${page.section}${page.sub ? `/${page.sub}` : ""}`;
}

/** The first page of a section, which is what its entry in the profile menu opens. */
export function firstPageOfSection(section) {
  return ACCOUNT_PAGES.find((page) => page.section === section && !page.sub) ?? ACCOUNT_PAGES[0];
}

// Links from before the profile had pages: /app/broker/profil#sparade-objekt.
const HASH_PAGES = { "sparade-objekt": "sparat", "sparade-sokningar": "sparat" };

/**
 * The account page a URL names, or null when it names another page of the panel: `{ base, page }`.
 * A page that is not the person's (the company profile, for a broker) opens the first page of its section instead.
 */
export function parseAccountPath(pathname, hash = "", role = "broker") {
  const match = String(pathname || "").match(/^\/app\/(admin|broker)\/([^/?#]+)(?:\/([^/?#]+))?\/?$/);
  if (!match || !ACCOUNT_SECTIONS.includes(match[2])) return null;
  const [, panel, section, sub = ""] = match;
  const available = accountPagesFor(role);
  const hashKey = !sub && section === "profil" ? HASH_PAGES[String(hash).replace(/^#/, "")] : null;
  const page =
    available.find((item) => item.section === section && item.sub === sub) ??
    (hashKey ? available.find((item) => item.key === hashKey) : null) ??
    available.find((item) => item.section === section && !item.sub) ??
    available[0];
  return { base: `/app/${panel}`, page };
}

/** Whether a path opens the overlay. */
export const isAccountPath = (pathname) => parseAccountPath(pathname) !== null;

/**
 * The page the account window was opened over, for the panel `base` (`/app/admin`): the one the router remembered, or the panel's
 * start page when the window was opened by address (a link, a reload without history) or the page remembered is not the panel's.
 */
export function accountBackgroundPath(base) {
  const saved = typeof window !== "undefined" ? window.history.state?.accountBackground : null;
  const path = typeof saved === "string" ? saved.split(/[?#]/)[0] : "";
  return path && (path === base || path.startsWith(`${base}/`)) && !isAccountPath(path) ? path : base;
}
