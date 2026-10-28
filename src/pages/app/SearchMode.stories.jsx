import { expect, fn, waitFor, within } from "storybook/test";
import AppShell from "../../components/layout/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { listings } from "../../data/mockData";
import { PLATFORM_GOOGLE_MAP_STYLE, PLATFORM_GOOGLE_MAP_STYLE_DARK } from "../../lib/googleMapStyles";
import { THEME_STORAGE_KEY } from "../../lib/theme";
import RentPage from "./RentPage";
import ListingDetailPage from "./ListingDetailPage";
import ProfilePage from "./ProfilePage";
import SettingsPage from "./SettingsPage";
import ViewingsPage from "./ViewingsPage";
import MessagesPage from "./MessagesPage";

/**
 * Search mode: the renter's side of the app (the search, a listing, the profile, settings, viewings and messages), inside the
 * shell it has in the app (the marketing header on top, nothing below the page). The map is a stand-in for Google's, so nothing here
 * reaches the network, and it records what it was asked to do.
 */

const defaultFilters = {
  county: "Stockholms län",
  query: "",
  district: "Alla",
  type: [],
  minSize: "",
  maxSize: "",
  maxBudget: "",
  teamSize: "",
  transitDistance: "",
  moveInDate: "",
  contractFlex: "",
  accessHours: "",
  parkingType: "",
  layoutType: "",
  requirePrice: false,
  onlyBostadsratt: false,
  includeOperatingCosts: false,
  accessibilityAdapted: false,
  ecoCertified: false,
  daysOnMarket: "all",
  keyword: "",
  advertiser: "Alla",
  verified: false,
  readyNow: false
};

const renter = {
  id: "renter-1",
  name: "Samuel Oldmark",
  email: "samuel@example.com",
  role: "renter",
  roles: ["renter"],
  profile: { firstName: "Samuel", lastName: "Oldmark", phone: "070-123 45 67", companyName: "Oldmark Designs AB" }
};

const viewings = [
  { id: "viewing-1", listingId: "L-101", listingTitle: "Strandnära Studio Kontor", status: "Ny", message: "Vi vill gärna se lokalen nästa vecka.", createdAt: "2026-09-18T10:00:00Z" },
  { id: "viewing-2", listingId: "L-102", listingTitle: "Modernt Coworking Hub", status: "Visning bokad", message: "Tisdag passar bra.", createdAt: "2026-09-16T10:00:00Z" }
];

const app = {
  user: renter,
  listings,
  favorites: ["L-101", "L-103"],
  viewings,
  leads: [],
  notifications: [],
  filterPresets: [{ id: "preset-1", name: "Kontor i Söder", filters: { ...defaultFilters, district: "Södermalm" }, createdAt: "2026-09-10T10:00:00Z" }],
  savedFilters: defaultFilters,
  savedAiSearches: [],
  aiHistory: [],
  defaultFilters,
  allListingsFilters: defaultFilters,
  searchListings: fn(async () => listings),
  resetSearchToAllListings: fn(async () => listings),
  saveCurrentFilters: fn(async () => {}),
  deleteSavedFilter: fn(async () => {}),
  toggleFavorite: fn(),
  requestViewing: fn(async () => {}),
  runAiSearch: fn(async () => ({ listings, summary: "" })),
  recordListingView: fn(),
  recordMatchDismissal: fn(async () => {}),
  switchRole: fn(async () => {}),
  updateProfile: fn(async () => {}),
  resendBrokerVerificationRequest: fn(async () => {}),
  pushToast: fn(),
  logout: fn()
};

/** A stand-in for Google Maps: it draws nothing and remembers the options and markers, so a story can see what the page asked for. */
function installFakeMaps() {
  const record = { maps: [], markers: [] };
  class FakeMap {
    constructor(element, options) {
      this.element = element;
      this.options = { ...options };
      this.setOptionsCalls = [];
      record.maps.push(this);
    }
    setOptions(options) {
      this.setOptionsCalls.push(options);
      this.options = { ...this.options, ...options };
    }
    addListener() {}
    panTo() {}
    setZoom() {}
    setCenter() {}
    fitBounds() {}
  }
  class FakeMarker {
    constructor(options) {
      this.options = { ...options };
      this.icons = [options?.icon];
      record.markers.push(this);
    }
    addListener() {}
    setMap() {}
    setTitle() {}
    setPosition() {}
    setZIndex() {}
    setIcon(icon) {
      this.icons.push(icon);
    }
  }
  window.google = {
    maps: {
      Map: FakeMap,
      Marker: FakeMarker,
      LatLngBounds: class {
        extend() {}
      },
      LatLng: class {
        constructor(lat, lng) {
          this.lat = lat;
          this.lng = lng;
        }
      },
      Size: class {
        constructor(width, height) {
          this.width = width;
          this.height = height;
        }
      },
      Point: class {
        constructor(x, y) {
          this.x = x;
          this.y = y;
        }
      },
      StreetViewPanorama: class {
        constructor() {}
      }
    }
  };
  window.__fakeMaps = record;
  return () => {
    delete window.google;
    delete window.__fakeMaps;
  };
}

function Shell({ pathname, children, guest = false }) {
  return (
    <TooltipProvider>
      <div className="h-screen">
        <AppShell
          pathname={pathname}
          user={guest ? null : renter}
          isGuest={guest}
          listings={listings}
          onSwitchRole={fn()}
          onLogout={fn()}
          onRequireAuth={fn()}
        >
          {children}
        </AppShell>
      </div>
    </TooltipProvider>
  );
}

const meta = {
  title: "Search mode/Pages",
  tags: ["ai-generated", "needs-work"],
  parameters: { layout: "fullscreen" },
  beforeEach: () => installFakeMaps()
};

export default meta;

export const Rent = {
  render: () => (
    <Shell pathname="/app/rent">
      <RentPage app={app} />
    </Shell>
  ),
  play: async ({ canvas }) => {
    await canvas.findAllByRole("link", { name: "Lediga lokaler" });
  }
};

export const RentAsGuest = {
  render: () => (
    <Shell pathname="/app/rent" guest>
      <RentPage app={{ ...app, user: null }} isGuest onRequireAuth={fn()} />
    </Shell>
  ),
  play: async ({ canvas }) => {
    await canvas.findByRole("button", { name: "Logga in" });
  }
};

export const ListingDetail = {
  render: () => (
    <Shell pathname="/app/listings/L-101">
      <ListingDetailPage app={app} listingId="L-101" />
    </Shell>
  ),
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getAllByText(/Strandnära Studio Kontor/).length).toBeGreaterThan(0), { timeout: 5000 });
  }
};

export const Profile = {
  render: () => (
    <Shell pathname="/app/profile">
      <ProfilePage app={app} />
    </Shell>
  )
};

export const Settings = {
  render: () => (
    <Shell pathname="/app/settings">
      <SettingsPage app={app} />
    </Shell>
  )
};

export const Viewings = {
  render: () => (
    <Shell pathname="/app/viewings">
      <ViewingsPage app={app} />
    </Shell>
  )
};

export const Messages = {
  render: () => (
    <Shell pathname="/app/messages">
      <MessagesPage app={app} />
    </Shell>
  )
};

// ── Dark mode ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Search mode has the theme of the workspace panels: the same tokens, so the same dark. The stories below look at the page as a whole
// (nothing left white, no black text on the dark page) and at the way in (the switch in the profile menu).

const root = () => document.documentElement;
const body = () => within(document.body);

/** What is still the light theme on the page: a pure white background, or pure black text. Photos and frames are not backgrounds. */
function lightLeaks(container) {
  const leaks = [];
  for (const element of container.querySelectorAll("*")) {
    if (["IMG", "IFRAME", "svg", "path", "VIDEO", "CANVAS"].includes(element.tagName) || element.closest("svg")) continue;
    const style = getComputedStyle(element);
    if (style.visibility === "hidden" || style.display === "none") continue;
    if (style.backgroundColor === "rgb(255, 255, 255)") leaks.push(`white background: <${element.tagName.toLowerCase()} class="${String(element.className).slice(0, 80)}">`);
    const ownText = [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim());
    if (ownText && style.color === "rgb(0, 0, 0)") leaks.push(`black text: <${element.tagName.toLowerCase()}> "${element.textContent.trim().slice(0, 30)}"`);
  }
  return leaks;
}

const lastStyles = () => window.__fakeMaps.maps.at(-1)?.setOptionsCalls.at(-1)?.styles ?? window.__fakeMaps.maps.at(-1)?.options.styles;

/** Dark: the page is the near-black canvas, the cards are the dark surface, and nothing of the light theme is left. */
async function expectDarkPage(canvasElement) {
  await waitFor(() => expect(root()).toHaveClass("dark"));
  const main = canvasElement.querySelector("main");
  await waitFor(() => expect(getComputedStyle(main).backgroundColor).toBe("rgb(5, 6, 8)"), { timeout: 4000 });
  await expect(getComputedStyle(document.body).backgroundColor).toBe("rgb(5, 6, 8)");
  await waitFor(() => expect(lightLeaks(canvasElement)).toEqual([]), { timeout: 4000 });
}

export const RentDark = {
  globals: { theme: "dark" },
  render: Rent.render,
  play: async ({ canvas, canvasElement }) => {
    await canvas.findAllByRole("link", { name: "Lediga lokaler" });
    await expectDarkPage(canvasElement);
    // A listing card is the dark surface with a hairline of white, and the map is drawn in the dark style.
    const card = canvasElement.querySelector("article");
    await expect(getComputedStyle(card).backgroundColor).toBe("rgb(15, 17, 21)");
    await waitFor(() => expect(window.__fakeMaps.maps.length).toBeGreaterThan(0), { timeout: 5000 });
    await waitFor(() => expect(lastStyles()).toEqual(PLATFORM_GOOGLE_MAP_STYLE_DARK), { timeout: 4000 });
  }
};

export const ListingDetailDark = {
  globals: { theme: "dark" },
  render: ListingDetail.render,
  play: async ({ canvas, canvasElement }) => {
    await waitFor(() => expect(canvas.getAllByText(/Strandnära Studio Kontor/).length).toBeGreaterThan(0), { timeout: 5000 });
    await expectDarkPage(canvasElement);
    // The pictograms are dark line drawings: they are turned light.
    const pictogram = canvasElement.querySelector('img[aria-hidden="true"]');
    await expect(getComputedStyle(pictogram).filter).toContain("invert");
    await waitFor(() => expect(window.__fakeMaps.maps.length).toBeGreaterThan(0), { timeout: 5000 });
    await waitFor(() => expect(lastStyles()).toEqual(PLATFORM_GOOGLE_MAP_STYLE_DARK), { timeout: 4000 });
  }
};

export const ProfileDark = { globals: { theme: "dark" }, render: Profile.render, play: async ({ canvasElement }) => { await expectDarkPage(canvasElement); } };
export const SettingsDark = { globals: { theme: "dark" }, render: Settings.render, play: async ({ canvasElement }) => { await expectDarkPage(canvasElement); } };
export const ViewingsDark = { globals: { theme: "dark" }, render: Viewings.render, play: async ({ canvasElement }) => { await expectDarkPage(canvasElement); } };
export const MessagesDark = { globals: { theme: "dark" }, render: Messages.render, play: async ({ canvasElement }) => { await expectDarkPage(canvasElement); } };

// The switch is at the top of the profile menu, as in the workspace, and the menu stays open while it is used. The choice is kept, and
// the page and the map follow it, in both directions.
export const ThemeSwitchInTheProfileMenu = {
  globals: { theme: "light" },
  render: Rent.render,
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Öppna profilmeny" }));
    const menu = await body().findByRole("menu");
    const theme = within(within(menu).getByRole("group", { name: "Tema" }));
    await userEvent.click(theme.getByRole("button", { name: "Mörkt" }));
    await expectDarkPage(canvasElement);
    await expect(body().getByRole("menu")).toBeInTheDocument();
    await expect(theme.getByRole("button", { name: "Mörkt" })).toHaveAttribute("aria-pressed", "true");
    await expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    await waitFor(() => expect(lastStyles()).toEqual(PLATFORM_GOOGLE_MAP_STYLE_DARK));

    await userEvent.click(theme.getByRole("button", { name: "Ljust" }));
    await waitFor(() => expect(root()).not.toHaveClass("dark"));
    await expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    await waitFor(() => expect(getComputedStyle(canvasElement.querySelector("main")).backgroundColor).toBe("rgb(255, 255, 255)"));
    await waitFor(() => expect(lastStyles()).toEqual(PLATFORM_GOOGLE_MAP_STYLE));
  }
};

// Search mode has no footer: the page runs to the bottom of the window.
export const NoFooter = {
  render: Rent.render,
  play: async ({ canvas, canvasElement }) => {
    await canvas.findAllByRole("link", { name: "Lediga lokaler" });
    await expect(canvasElement.querySelector("main > footer")).toBeNull();
    const main = canvasElement.querySelector("main");
    const section = main.querySelector(":scope > section");
    await expect(Math.round(section.getBoundingClientRect().bottom)).toBe(Math.round(main.getBoundingClientRect().bottom));
  }
};

// The overlays are rendered under <body>, outside the page: each is looked at on its own, in dark.
async function expectDarkOverlay(selector) {
  const overlay = await waitFor(() => {
    const found = document.body.querySelector(selector);
    expect(found).not.toBeNull();
    return found;
  }, { timeout: 5000 });
  await waitFor(() => expect(lightLeaks(overlay)).toEqual([]), { timeout: 4000 });
  return overlay;
}

export const RentFiltersDark = {
  globals: { theme: "dark" },
  render: Rent.render,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Visa alla filter" }));
    const dialog = await expectDarkOverlay('[role="dialog"]');
    // Regression guard: the dialog's own max-w-4xl used to be silently capped at the
    // base DialogContent's sm:max-w-md (448px, see reference-platform-css-overrides),
    // which squeezed the Möblering toggle until its labels overflowed each other.
    await expect(dialog.getBoundingClientRect().width).toBeGreaterThan(700);
    const withinDialog = within(dialog);
    for (const label of ["Alla", "Möblerad", "Omöblerad"]) {
      const button = await withinDialog.findByRole("button", { name: label });
      await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth);
    }
    // Regression guard: a stray `relative` in this DialogContent's className used to beat
    // the base's `fixed` (same tailwind-merge group, caller wins), so the dialog positioned
    // itself in normal document flow instead of centred in the viewport, overflowing past
    // the bottom of the screen with no way to scroll the rest into view.
    await expect(getComputedStyle(dialog).position).toBe("fixed");
    const rect = dialog.getBoundingClientRect();
    await expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
  }
};

export const RentViewingRequestDark = {
  globals: { theme: "dark" },
  render: Rent.render,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click((await canvas.findAllByRole("button", { name: "Boka visning" }))[0]);
    const dialog = await expectDarkOverlay('[role="dialog"]');
    await expect(getComputedStyle(dialog).backgroundColor).toBe("rgb(20, 23, 28)");
  }
};

export const ListingGalleryDark = {
  globals: { theme: "dark" },
  render: ListingDetail.render,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click((await canvas.findAllByRole("button", { name: /Se alla bilder/ }))[0]);
    const gallery = await expectDarkOverlay(".fixed.inset-0.z-\\[90\\]");
    await expect(getComputedStyle(gallery).backgroundColor).toBe("rgb(5, 6, 8)");
  }
};

export const ProfileManageDark = {
  globals: { theme: "dark" },
  render: Profile.render,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: /Hantera profil/ }));
    await expectDarkOverlay('[role="dialog"]');
  }
};

// The entry point into the AI-assisted search is named for what it is (not just "Sök", which could be mistaken for the plain
// fields' own submit), matches the assistant's look (its orb, the same greeting shape, pills to try), and clicking a suggestion
// runs the search and closes the dialog, the same as typing one in and sending it.
export const RentAiSearch = {
  render: Rent.render,
  play: async ({ canvas, userEvent }) => {
    const trigger = await canvas.findByRole("button", { name: "AI-sök" });
    await userEvent.click(trigger);
    const dialog = within(await body().findByRole("dialog", { name: "AI-sök" }, { timeout: 4000 }));
    await waitFor(() => expect(dialog.getByText(/Vad letar ni efter\?/)).toBeVisible(), { timeout: 4000 });
    await expect(dialog.getByRole("textbox", { name: "Beskriv lokalen ni söker" })).toBeVisible();
    const suggestion = dialog.getByRole("button", { name: "Kontor för 15 personer i Södermalm" });
    await expect(suggestion).toBeVisible();
    await userEvent.click(suggestion);
    await waitFor(() => expect(app.runAiSearch).toHaveBeenCalledWith("Kontor för 15 personer i Södermalm", expect.anything()), { timeout: 4000 });
    await waitFor(() => expect(body().queryByRole("dialog", { name: "AI-sök" })).toBeNull(), { timeout: 4000 });
  }
};

// Dark: the dialog and everything in it (the composer, the pills, "Ny start") are a real, working fill, not the page showing
// through a transparent one; the plain fields and the utility pills beside the entry point are the same.
export const RentAiSearchDark = {
  globals: { theme: "dark" },
  render: Rent.render,
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expectDarkPage(canvasElement);
    const pageBg = "rgb(5, 6, 8)";
    const teamSizeField = canvas.getByPlaceholderText("Platser").closest("div");
    await waitFor(() => expect(getComputedStyle(teamSizeField).backgroundColor).not.toBe(pageBg), { timeout: 4000 });
    const districtTrigger = canvas.getByText("Alla områden").closest('[data-slot="select-trigger"]');
    await waitFor(() => expect(getComputedStyle(districtTrigger).backgroundColor).not.toBe(pageBg), { timeout: 4000 });
    const filterButton = canvas.getByRole("button", { name: "Visa alla filter" });
    await waitFor(() => expect(getComputedStyle(filterButton).backgroundColor).not.toBe(pageBg), { timeout: 4000 });
    // Regression guard: [data-slot="select-trigger"]'s global 42px height (index.css) used to
    // silently beat this trigger's own h-[48px], leaving Område 6px shorter than its row-mates.
    const rowHeight = (el) => Math.round(el.getBoundingClientRect().height);
    await expect(rowHeight(districtTrigger)).toBe(rowHeight(teamSizeField));
    await expect(rowHeight(filterButton)).toBe(rowHeight(teamSizeField));

    await userEvent.click(await canvas.findByRole("button", { name: "AI-sök" }));
    const dialog = within(await expectDarkOverlay('[role="dialog"]'));
    const composer = dialog.getByRole("textbox", { name: "Beskriv lokalen ni söker" }).closest('[data-slot="card"]');
    await waitFor(() => expect(getComputedStyle(composer).backgroundColor).not.toBe(pageBg), { timeout: 4000 });
  }
};

// Once a search has run, every matched card offers a one-click "not relevant" reason instead of
// silent abandonment — this is what feeds the search-to-qualified-match KPI without anyone at
// LOA reading free text. Reuses the proven AI-search flow from RentAiSearch to reach "matched".
export const RentMatchDismissal = {
  render: Rent.render,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "AI-sök" }));
    const dialog = within(await body().findByRole("dialog", { name: "AI-sök" }, { timeout: 4000 }));
    const suggestion = dialog.getByRole("button", { name: "Kontor för 15 personer i Södermalm" });
    await userEvent.click(suggestion);
    await waitFor(() => expect(app.runAiSearch).toHaveBeenCalled(), { timeout: 4000 });
    await waitFor(() => expect(body().queryByRole("dialog", { name: "AI-sök" })).toBeNull(), { timeout: 4000 });

    const dismissTriggers = await canvas.findAllByRole("button", { name: "Inte relevant för er?" });
    await userEvent.click(dismissTriggers[0]);

    const reasonButton = await canvas.findByRole("button", { name: "För dyrt" });
    await userEvent.click(reasonButton);

    await waitFor(() => expect(app.recordMatchDismissal).toHaveBeenCalledWith(expect.any(String), "too_expensive"), { timeout: 4000 });
    await expect(canvas.getByText("Skickat ✓")).toBeInTheDocument();
    // The reason chips are gone from that card now that it's answered, but its neighbours (also
    // matches) still offer theirs — the feature is per card, not a one-shot for the whole page.
    await expect(canvas.queryAllByRole("button", { name: "Inte relevant för er?" }).length).toBe(dismissTriggers.length - 1);
  }
};
