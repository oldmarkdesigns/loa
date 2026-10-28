import { useRef } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
import { listingApi } from "../../api";
import AdminPanelPage from "../../pages/app/AdminPanelPage";
import BrokerPanelPage from "../../pages/app/BrokerPanelPage";
import { usePathname } from "../../lib/router";
import { THEME_STORAGE_KEY } from "../../lib/theme";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * The account window: what Profil, Adminprofil, Inställningar and Hjälp of the profile menu open, over the page the person was on.
 * These stories render the two panel pages (the company admin's and the broker's) and follow the address, as the app does, so a
 * click in the profile menu really opens the window and closing it really goes back.
 */

const listings = [
  { id: "office-1", title: "Ljust kontor vid Odenplan", address: "Odengatan 62", district: "Vasastan", type: "Kontor", sizeSqm: 240, priceMonthly: 48000, views: 1248, inquiries: 18, ownerId: "owner-1", companyId: "company-1", status: "active", advertiserName: "Anna Svensson", image: "/object-images/object-1.jpeg", amenities: [], updatedAt: "2026-09-18T10:00:00Z" },
  { id: "office-2", title: "Studio i Hornstull", address: "Hornsgatan 96", district: "Södermalm", type: "Studio", sizeSqm: 85, priceMonthly: 18500, views: 386, inquiries: 6, ownerId: "owner-1", companyId: "company-1", status: "draft", advertiserName: "Anna Svensson", image: "/object-images/object-2.jpeg", amenities: [], updatedAt: "2026-09-17T10:00:00Z" }
];

const person = (role) => ({
  id: "owner-1",
  name: "Anna Svensson",
  email: "anna@strandfastigheter.se",
  phone: "",
  role,
  roles: [role],
  profile: { companyName: "Strand Fastigheter", companyId: "company-1", avatarUrl: "" }
});

const makeApp = (role) => ({
  user: person(role),
  adminCompany: { id: "company-1", name: "Strand Fastigheter" },
  listings,
  leads: [],
  companyBrokers: [],
  notifications: [],
  favorites: [],
  filterPresets: [],
  searchHistory: [],
  updateProfile: fn(async () => {}),
  toggleFavorite: fn(),
  deleteSavedFilter: fn(),
  refreshCoreData: fn(async () => {}),
  pushToast: fn(),
  logout: fn(async () => {})
});

/** A panel page that follows the address: navigateTo changes it, as it does in the app. */
function Routed({ Page, app, start }) {
  const started = useRef(false);
  if (!started.current) {
    started.current = true;
    window.history.replaceState({}, "", start);
  }
  const pathname = usePathname();
  return (
    <TooltipProvider>
      <div className="h-screen">
        <Page app={app} pathname={pathname} />
      </div>
    </TooltipProvider>
  );
}

const meta = {
  title: "Account/Window",
  tags: ["ai-generated", "needs-work"],
  parameters: { layout: "fullscreen" },
  // The address is part of these stories: put it back afterwards, and start each with the panel's own pages loaded.
  beforeEach: () => {
    const original = window.location.pathname + window.location.search;
    const getListings = listingApi.getListings;
    listingApi.getListings = async () => ({ listings });
    return () => {
      window.history.replaceState({}, "", original);
      listingApi.getListings = getListings;
    };
  }
};

export default meta;

const brokerApp = makeApp("broker");
const adminApp = makeApp("company_admin");

const root = () => document.documentElement;
const body = () => within(document.body);
const path = () => window.location.pathname;

/** The window (a dialog of its own, not the menu that opens it), once it is there. */
const windowOf = async () => within(await body().findByRole("dialog", { name: /Konto|Företag|Inställningar|Hjälp/ }, { timeout: 5000 }));

/**
 * Opens an entry of the profile menu. Below `lg` the side menu is a drawer behind the "Meny" button (the story canvas is narrow, the
 * app on a laptop is not), so the drawer is opened first when that is what there is.
 */
async function openFromMenu(canvas, userEvent, name) {
  const drawerButton = canvas.queryByRole("button", { name: "Meny" });
  if (drawerButton) await userEvent.click(drawerButton);
  const trigger = (await body().findAllByRole("button", { name: /^Konto/ }, { timeout: 5000 }))[0];
  await userEvent.click(trigger);
  const menu = within(await body().findByRole("dialog", { name: "Kontomeny" }));
  await userEvent.click(menu.getByRole("button", { name }));
}

/** The pages of the window: the side panel (from `md`), or the row of pages above the page on a narrow screen. */
const wide = () => window.innerWidth >= 768;
const sidePanel = () => within(body().getByRole("navigation", { name: wide() ? "Konto och inställningar" : "Sidor" }));

/** What is still the light theme in the window: a pure white background, or pure black text. */
function lightLeaks(container) {
  const leaks = [];
  for (const element of container.querySelectorAll("*")) {
    if (["IMG", "svg", "path"].includes(element.tagName) || element.closest("svg")) continue;
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") continue;
    if (style.backgroundColor === "rgb(255, 255, 255)") leaks.push(`white background: <${element.tagName.toLowerCase()} class="${String(element.className).slice(0, 60)}">`);
    const ownText = [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim());
    if (ownText && style.color === "rgb(0, 0, 0)") leaks.push(`black text: <${element.tagName.toLowerCase()}> "${element.textContent.trim().slice(0, 30)}"`);
  }
  return leaks;
}

// The profile menu opens the window over the page you were on (the menu item is a route), the page stays behind it, and Stäng goes
// back to it. A broker has no company profile, so the side panel has no Företag.
export const OpensOverThePage = {
  render: () => <Routed Page={BrokerPanelPage} app={brokerApp} start="/app/broker/objekt" />,
  play: async ({ canvas, userEvent }) => {
    await openFromMenu(canvas, userEvent, "Profil");
    const dialog = await windowOf();
    await expect(path()).toBe("/app/broker/profil");
    await expect(dialog.getByRole("heading", { name: "Profil", level: 2 })).toBeVisible();
    // The page behind is still the one that was open: Dina objekt is the active row of the side menu.
    await expect(canvas.getAllByRole("button", { name: "Dina objekt", hidden: true })[0]).toHaveAttribute("aria-current", "page");

    // The side panel (from a medium screen up) has the groups, and no Företag for a broker.
    if (wide()) {
      const groups = within(body().getByRole("navigation", { name: "Konto och inställningar" })).getAllByRole("group").map((group) => group.getAttribute("aria-label"));
      await expect(groups).toEqual(["Konto", "Inställningar", "Hjälp"]);
    }

    await userEvent.click(dialog.getByRole("button", { name: "Stäng" }));
    await waitFor(() => expect(body().queryByRole("dialog", { name: /Konto/ })).toBeNull());
    await expect(path()).toBe("/app/broker/objekt");
  }
};

// Opened by its address (a link, a reload with nothing behind it) the window is over the start page of the panel, and closing goes there.
export const OpenedByAddress = {
  render: () => <Routed Page={AdminPanelPage} app={adminApp} start="/app/admin/hjalp" />,
  play: async ({ userEvent }) => {
    const dialog = await windowOf();
    await expect(dialog.getByRole("heading", { name: "Kom igång", level: 2 })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(path()).toBe("/app/admin"));
    await waitFor(() => expect(body().queryByRole("dialog", { name: /Hjälp/ })).toBeNull());
  }
};

// The company admin has the company's profile too: its own group, its own page, saved with one bar that is there while something has
// changed.
export const CompanyProfileForTheAdmin = {
  render: () => <Routed Page={AdminPanelPage} app={adminApp} start="/app/admin" />,
  play: async ({ canvas, userEvent }) => {
    await openFromMenu(canvas, userEvent, "Adminprofil");
    const dialog = await windowOf();
    await expect(path()).toBe("/app/admin/adminprofil");
    await expect(dialog.getByRole("heading", { name: "Adminprofil", level: 2 })).toBeVisible();
    // Nothing to save yet: the bar is not there.
    await expect(dialog.queryByRole("button", { name: "Spara ändringar" })).toBeNull();
    const name = dialog.getByRole("textbox", { name: "Bolagsnamn" });
    await expect(name).toHaveValue("Strand Fastigheter");
    await userEvent.clear(name);
    await userEvent.type(name, "Strand Förvaltning");
    await userEvent.click(await dialog.findByRole("button", { name: "Spara ändringar" }));
    await waitFor(() => expect(adminApp.updateProfile).toHaveBeenCalled());
    const sent = adminApp.updateProfile.mock.calls.at(-1)[0].profile;
    await expect(sent.legalEntity).toBe("Strand Förvaltning");
    await expect(sent.companyName).toBe("Strand Förvaltning");
    await expect(sent.approvalFlow).toBe("admin_approves_broker");
  }
};

// The side panel has every page, and going between them keeps the window: one step back leaves it.
export const SidePanelMovesBetweenPages = {
  render: () => <Routed Page={BrokerPanelPage} app={brokerApp} start="/app/broker/leads" />,
  play: async ({ canvas, userEvent }) => {
    const before = window.history.length;
    await openFromMenu(canvas, userEvent, "Profil");
    const dialog = await windowOf();
    const side = sidePanel();
    for (const [label, address, heading] of [
      ["Lokalprogram", "/app/broker/profil/lokalprogram", "Lokalprogram"],
      ["Sparat", "/app/broker/profil/sparat", "Sparat"],
      ["Genvägar", "/app/broker/installningar/genvagar", "Tangentbordsgenvägar"],
      ["Vanliga frågor", "/app/broker/hjalp/fragor", "Vanliga frågor"],
      ["Kontakt", "/app/broker/hjalp/kontakt", "Kontakt"],
      ["Allmänt", "/app/broker/installningar", "Allmänt"]
    ]) {
      await userEvent.click(side.getByRole("button", { name: label }));
      await waitFor(() => expect(path()).toBe(address));
      await expect(await dialog.findByRole("heading", { name: heading, level: 2 })).toBeVisible();
      await expect(side.getByRole("button", { name: label })).toHaveAttribute("aria-current", "page");
    }
    // One history entry for the window, however many pages were visited.
    await expect(window.history.length).toBe(before + 1);
    await userEvent.click(dialog.getByRole("button", { name: "Stäng" }));
    await waitFor(() => expect(path()).toBe("/app/broker/leads"));
  }
};

// The search over the side panel narrows the pages, also by what is on them (the theme is on Allmänt).
export const SearchNarrowsThePages = {
  render: () => <Routed Page={BrokerPanelPage} app={brokerApp} start="/app/broker/profil" />,
  play: async ({ userEvent }) => {
    await windowOf();
    // The search is in the side panel, which a narrow screen does not have (there the pages are a row).
    if (!wide()) return;
    const side = sidePanel();
    await userEvent.type(side.getByRole("searchbox", { name: "Sök i inställningar" }), "tema");
    await expect(side.getByRole("button", { name: "Allmänt" })).toBeVisible();
    await expect(side.queryByRole("button", { name: "Profil" })).toBeNull();
    await userEvent.clear(side.getByRole("searchbox"));
    await userEvent.type(side.getByRole("searchbox"), "zzz");
    await expect(side.getByText("Inga träffar.")).toBeVisible();
  }
};

// The profile is edited in place: the rows become fields, and Spara ändringar sends the name and the phone.
export const ProfileIsEditedInPlace = {
  render: () => <Routed Page={BrokerPanelPage} app={brokerApp} start="/app/broker/profil" />,
  play: async ({ userEvent }) => {
    const dialog = await windowOf();
    await userEvent.click(await dialog.findByRole("button", { name: "Redigera" }));
    const name = dialog.getByRole("textbox", { name: "Namn" });
    await userEvent.clear(name);
    await userEvent.type(name, "Anna S");
    await userEvent.type(dialog.getByRole("textbox", { name: "Telefon" }), "070-123 45 67");
    await userEvent.click(dialog.getByRole("button", { name: "Spara ändringar" }));
    await waitFor(() => expect(brokerApp.updateProfile).toHaveBeenCalled());
    const sent = brokerApp.updateProfile.mock.calls.at(-1)[0];
    await expect(sent.name).toBe("Anna S");
    await expect(sent.phone).toBe("070-123 45 67");
    // Back to rows.
    await waitFor(() => expect(dialog.queryByRole("textbox", { name: "Namn" })).toBeNull());
  }
};

// The settings work: the theme is the theme of the whole app, and the choice of the side menu is heard by the menu itself.
export const SettingsChangeTheAppAndTheMenu = {
  globals: { theme: "light" },
  render: () => <Routed Page={BrokerPanelPage} app={brokerApp} start="/app/broker/installningar" />,
  play: async ({ userEvent }) => {
    const dialog = await windowOf();
    await expect(root()).not.toHaveClass("dark");
    await userEvent.click(dialog.getByRole("button", { name: "Mörkt" }));
    await waitFor(() => expect(root()).toHaveClass("dark"));
    await expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    await userEvent.click(dialog.getByRole("button", { name: "Ljust" }));
    await waitFor(() => expect(root()).not.toHaveClass("dark"));

    const menu = () => document.querySelector(".admin-sidebar-panel");
    await expect(menu()).toHaveAttribute("data-display", "expanded");
    await userEvent.click(dialog.getByRole("combobox", { name: "Sidomeny" }));
    await userEvent.click(await body().findByRole("option", { name: "Ihopfälld" }));
    await waitFor(() => expect(menu()).toHaveAttribute("data-display", "collapsed"));
    await userEvent.click(dialog.getByRole("combobox", { name: "Sidomeny" }));
    await userEvent.click(await body().findByRole("option", { name: "Expanderad" }));
    await waitFor(() => expect(menu()).toHaveAttribute("data-display", "expanded"));
  }
};

// Help: the steps go to the pages they name (and the window goes), the questions open, and the way to reach us is there.
export const HelpHasContent = {
  render: () => <Routed Page={BrokerPanelPage} app={brokerApp} start="/app/broker/hjalp" />,
  play: async ({ userEvent }) => {
    const dialog = await windowOf();
    // A broker has four steps; the company admin has a fifth, for the brokers.
    await expect(dialog.getAllByRole("button", { name: /Publicera|Till prospekten|Till leads|Öppna assistenten/ })).toHaveLength(4);
    const side = sidePanel();

    await userEvent.click(side.getByRole("button", { name: "Vanliga frågor" }));
    const question = await dialog.findByRole("button", { name: "Hur fungerar leads?" });
    await expect(question).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(question);
    await expect(question).toHaveAttribute("aria-expanded", "true");
    await expect(dialog.queryByRole("button", { name: "Hur godkänns nya mäklare?" })).toBeNull();

    await userEvent.click(side.getByRole("button", { name: "Kontakt" }));
    await expect(await dialog.findByRole("link", { name: "support@foretag.se" })).toHaveAttribute("href", "mailto:support@foretag.se");

    await userEvent.click(side.getByRole("button", { name: "Kom igång" }));
    await userEvent.click(await dialog.findByRole("button", { name: /Till leads/ }));
    await waitFor(() => expect(path()).toBe("/app/broker/leads"));
    await waitFor(() => expect(body().queryByRole("dialog", { name: /Hjälp/ })).toBeNull());
  }
};

export const HelpForTheAdminHasTheBrokerStep = {
  render: () => <Routed Page={AdminPanelPage} app={adminApp} start="/app/admin/hjalp" />,
  play: async ({ userEvent }) => {
    const dialog = await windowOf();
    await expect(await dialog.findByRole("button", { name: /Till mäklarna/ })).toBeVisible();
    await userEvent.click(sidePanel().getByRole("button", { name: "Vanliga frågor" }));
    await expect(await dialog.findByRole("button", { name: "Hur godkänns nya mäklare?" })).toBeVisible();
  }
};

// Sized like a settings window, not a screen: it never fills the page, and in dark it is the dark overlay with nothing left white.
export const DarkAndSized = {
  globals: { theme: "dark" },
  render: () => <Routed Page={AdminPanelPage} app={adminApp} start="/app/admin/adminprofil" />,
  play: async ({ userEvent }) => {
    const dialog = await windowOf();
    const popup = body().getByRole("dialog", { name: /Företag/ });
    await waitFor(() => expect(getComputedStyle(popup).backgroundColor).toBe("rgb(20, 23, 28)"), { timeout: 4000 });
    const box = popup.getBoundingClientRect();
    await expect(box.width).toBeLessThanOrEqual(window.innerWidth - 32 + 1);
    await expect(box.width).toBeLessThanOrEqual(960 + 1);
    await expect(box.height).toBeLessThanOrEqual(window.innerHeight - 48 + 1);
    await waitFor(() => expect(lightLeaks(popup)).toEqual([]), { timeout: 4000 });
    for (const label of ["Allmänt", "Genvägar", "Kom igång", "Vanliga frågor", "Kontakt", "Profil", "Lokalprogram", "Sparat"]) {
      await userEvent.click(sidePanel().getByRole("button", { name: label }));
      await waitFor(() => expect(lightLeaks(popup)).toEqual([]), { timeout: 4000 });
    }
    await expect(dialog.getByRole("heading", { name: "Sparat", level: 2 })).toBeVisible();
  }
};

// The window as it is, to look at: the company admin's (with the company profile) and the broker's.
export const AdminWindow = {
  render: () => <Routed Page={AdminPanelPage} app={adminApp} start="/app/admin/profil" />,
  play: async () => {
    await windowOf();
  }
};

export const BrokerWindow = {
  render: () => <Routed Page={BrokerPanelPage} app={brokerApp} start="/app/broker/profil" />,
  play: async () => {
    await windowOf();
  }
};
