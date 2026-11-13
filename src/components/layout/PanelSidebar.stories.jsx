import { useState } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
import {
  BarChart3Icon,
  BellIcon,
  BuildingIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  PdfIcon,
  SettingsGearIcon,
  SparklesIcon,
  SupportIcon,
  UserIcon,
  UsersGroupIcon
} from "../icons/UiIcons";
import { PanelSidebar } from "./AdminPanelShell";
import { PanelChromeProvider } from "./PanelChrome";
import { shellCardClass } from "./shellCard";

/** A colour of the theme (a variable of channels, "11 10 14") as getComputedStyle writes it, so the checks hold in light and dark. */
const token = (name) => `rgb(${getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim().split(/\s+/).join(", ")})`;

const NAV_ITEMS = [
  { key: "oversikt", label: "Översikt", path: "/app/admin", Icon: LayoutDashboardIcon },
  { key: "annonser", label: "Annonser", path: "/app/admin/annonser", Icon: BuildingIcon },
  { key: "leads", label: "Leads & Matchningar", path: "/app/admin/leads", Icon: SparklesIcon },
  { key: "prospekt", label: "Prospekt", path: "/app/admin/prospekt", Icon: PdfIcon },
  { key: "meddelanden", label: "Meddelanden", path: "/app/admin/meddelanden", Icon: MessageSquareIcon },
  { key: "notifikationer", label: "Notifikationer", path: "/app/admin/notifikationer", Icon: BellIcon },
  { key: "maklare", label: "Mäklare", path: "/app/admin/maklare", Icon: UsersGroupIcon },
  { key: "aktivitet", label: "Aktivitet", path: "/app/admin/aktivitet", Icon: HistoryIcon },
  { key: "statistik", label: "Statistik", path: "/app/admin/statistik", Icon: BarChart3Icon }
];
// The same pages in groups, as the panels have them: each group has a title over its rows (a rule between the groups in the rail).
const GROUPED_NAV_ITEMS = NAV_ITEMS.map((item) => ({
  ...item,
  group: { oversikt: "Arbetsyta", annonser: "Annonser", prospekt: "Annonser", leads: "Hyresgäster", meddelanden: "Hyresgäster", notifikationer: "Hyresgäster", maklare: "Företag", aktivitet: "Företag", statistik: "Företag" }[item.key]
})).sort((a, b) => ["Arbetsyta", "Annonser", "Hyresgäster", "Företag"].indexOf(a.group) - ["Arbetsyta", "Annonser", "Hyresgäster", "Företag"].indexOf(b.group));
const BOTTOM_NAV_ITEMS = [
  { key: "profil", label: "Profil", path: "/app/admin/profil", Icon: UserIcon },
  { key: "installningar", label: "Inställningar", path: "/app/admin/installningar", Icon: SettingsGearIcon },
  { key: "hjalp", label: "Hjälp", path: "/app/admin/hjalp", Icon: SupportIcon }
];

const chrome = {
  user: { name: "Samuel Oldmark", email: "samuel@strandfastigheter.se", profile: { companyId: "company-1", companyName: "Strand Fastigheter" } },
  myCompanies: [
    { companyId: "company-1", name: "Strand Fastigheter", organizationNumber: "556123-4567" },
    { companyId: "company-2", name: "Nordic Offices" }
  ],
  onSwitchRole: fn(async () => null),
  onSwitchCompany: fn(async () => null)
};

// `tall` gives the card room for every page without scrolling (the nav scrolls when the card is shorter, as it does in a low window).
function Harness({ startCollapsed = false, withToggle = true, pathname = "/app/admin/annonser", callbacks, onClose, provider = chrome, tall = false, navItems = NAV_ITEMS }) {
  const [collapsed, setCollapsed] = useState(startCollapsed);
  const [mode, setMode] = useState("expanded");
  return (
    <PanelChromeProvider value={provider}>
      <div data-testid="card" className={`admin-platform m-4 overflow-hidden ${tall ? "h-[720px]" : "h-[calc(100vh-2rem)] max-h-[640px]"} ${shellCardClass} ${collapsed ? "w-[72px]" : "w-[272px]"}`}>
        <PanelSidebar
          pathname={pathname}
          navItems={navItems}
          bottomNavItems={BOTTOM_NAV_ITEMS}
          badges={{ meddelanden: 3, notifikationer: 12 }}
          collapsed={collapsed}
          onToggleCollapsed={withToggle ? () => setCollapsed((value) => !value) : undefined}
          mode={mode}
          onModeChange={withToggle ? setMode : undefined}
          companySettingsPath="/app/admin/adminprofil"
          onClose={onClose}
          onNavigate={callbacks.onNavigate}
          onLogout={callbacks.onLogout}
          onOpenSearch={callbacks.onOpenSearch}
        />
      </div>
    </PanelChromeProvider>
  );
}

const makeCallbacks = () => ({ onNavigate: fn(), onLogout: fn(async () => null), onOpenSearch: fn() });
const clear = (callbacks) => Object.values(callbacks).forEach((spy) => spy.mockClear());

const meta = {
  component: PanelSidebar,
  tags: ["ai-generated", "needs-work"],
  parameters: { layout: "fullscreen" }
};

export default meta;

const box = (element) => element.getBoundingClientRect();
const middle = (element) => ({ x: box(element).left + box(element).width / 2, y: box(element).top + box(element).height / 2 });
// A drop shadow is a shadow with a blur; the ring of an overlay is a shadow with a spread and no blur.
const hasDropShadow = (element) =>
  (getComputedStyle(element).boxShadow.match(/rgba?\([^)]*\)\s+-?[\d.]+px\s+-?[\d.]+px\s+[\d.]+px/g) || []).some((shadow) => parseFloat(shadow.split(/\s+/).at(-1)) > 0);
const fontSize = (element) => parseFloat(getComputedStyle(element).fontSize);
const body = () => within(document.body);
const tooltip = (text) => body().findByText(text, { selector: '[data-slot="tooltip-content"]' }, { timeout: 4000 });
const menuGone = () => waitFor(() => expect(body().queryByRole("dialog", { name: "Kontomeny" })).not.toBeInTheDocument(), { timeout: 4000 });

// The pages in groups, each under its own title, all on the same 44px pitch, with the marker of the open page on its row wherever it is;
// in the rail the titles are a rule between the groups.
const groupedCallbacks = makeCallbacks();
export const GroupedPages = {
  render: () => <Harness callbacks={groupedCallbacks} navItems={GROUPED_NAV_ITEMS} pathname="/app/admin/notifikationer" tall />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const nav = canvas.getByRole("navigation", { name: "Arbetsyta" });
    const groups = within(nav).getAllByRole("group");
    await expect(groups.map((group) => group.getAttribute("aria-label"))).toEqual(["Arbetsyta", "Annonser", "Hyresgäster", "Företag"]);
    await expect(groups.map((group) => within(group).getAllByRole("button").map((row) => row.getAttribute("aria-label")))).toEqual([
      ["Översikt"],
      ["Annonser", "Prospekt"],
      ["Leads & Matchningar", "Meddelanden", "Notifikationer"],
      ["Mäklare", "Aktivitet", "Statistik"]
    ]);
    // Each group has its title, a small quiet one, over its rows.
    for (const group of groups) {
      const title = within(group).getByText(group.getAttribute("aria-label"), { selector: "p" });
      await expect(fontSize(title)).toBe(13);
      await expect(getComputedStyle(title).textTransform).toBe("none");
      await expect(box(title).bottom).toBeLessThan(box(within(group).getAllByRole("button")[0]).top);
    }
    // Rows are 38px on the same 44px pitch everywhere in a group.
    for (const group of groups) {
      const rows = within(group).getAllByRole("button");
      for (let index = 1; index < rows.length; index += 1) await expect(Math.round(box(rows[index]).top - box(rows[index - 1]).top)).toBe(44);
    }
    // The marker of the open page (in the third group) is on its row.
    const active = within(nav).getByRole("button", { name: "Notifikationer" });
    await expect(active).toHaveAttribute("aria-current", "page");
    await waitFor(() => expect(Math.round(box(canvasElement.querySelector(".admin-nav-indicator")).top)).toBe(Math.round(box(active).top)));

    // The rail: no titles, a rule between the groups (and one above the first), every page still a button.
    await userEvent.click(canvas.getByRole("button", { name: "Fäll ihop meny" }));
    const rail = await canvas.findByRole("navigation", { name: "Arbetsyta" });
    await expect(within(rail).queryByText("Annonser", { selector: "p" })).toBeNull();
    await expect(rail.querySelectorAll('[role="group"] > div[aria-hidden="true"]')).toHaveLength(4);
    await expect(within(rail).getAllByRole("button")).toHaveLength(9);
  }
};

// To try by hand: the whole menu in the floating card, in the theme of the toolbar.
export const Playground = { render: () => <Harness callbacks={makeCallbacks()} /> };

// The open menu, and how big things are: 272px wide, pages in rows 38px tall and 6px apart with an 18px icon and 14px text, a
// 38px search, a small title. At the foot the way over to searching and the person, with the e-mail under the name.
const expandedCallbacks = makeCallbacks();
export const Expanded = {
  render: () => <Harness callbacks={expandedCallbacks} tall />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    clear(expandedCallbacks);
    const card = canvas.getByTestId("card");
    await expect(Math.round(box(card).width)).toBe(272);

    // The header and the search: the company (with its full name) and the fold button on one row, the search under it.
    const company = canvas.getByRole("button", { name: /Strand Fastigheter/ });
    const fold = canvas.getByRole("button", { name: "Fäll ihop meny" });
    const search = canvas.getByRole("button", { name: "Sök" });
    await expect(Math.round(box(company).height)).toBe(42);
    await expect(Math.round(box(fold).top + 19)).toBe(Math.round(middle(company).y));
    await expect(within(company).getByText("Strand Fastigheter").scrollWidth).toBeLessThanOrEqual(within(company).getByText("Strand Fastigheter").clientWidth);
    await expect(Math.round(box(search).height)).toBe(38);
    await expect(Math.round(box(search).width)).toBe(246);
    await expect(search).toHaveTextContent(/K$/);
    await expect(box(company).bottom).toBeLessThan(box(search).top);

    // The pages: a small title, then rows of 38px on a 44px pitch, with an icon of 18px and text of 14px.
    const title = canvas.getByText("Arbetsyta");
    await expect(fontSize(title)).toBe(13);
    await expect(getComputedStyle(title).textTransform).toBe("none");
    await expect(box(search).bottom).toBeLessThan(box(title).top);
    const nav = canvas.getByRole("navigation", { name: "Arbetsyta" });
    const rows = within(nav).getAllByRole("button");
    await expect(rows).toHaveLength(NAV_ITEMS.length);
    for (const row of rows) await expect(Math.round(box(row).height)).toBe(38);
    for (let index = 1; index < rows.length; index += 1) await expect(Math.round(box(rows[index]).top - box(rows[index - 1]).top)).toBe(44);
    await expect(box(title).bottom).toBeLessThan(box(rows[0]).top);
    await expect(Math.round(box(rows[0].querySelector("svg")).width)).toBe(18);
    await expect(fontSize(within(rows[1]).getByText("Annonser"))).toBe(14);
    await expect(Math.round(box(rows[0]).width)).toBe(246);

    // The page in use is the one with the pill (which is as tall as its row and follows it), and it is marked for a screen reader.
    const active = rows.find((row) => row.dataset.active === "true");
    await expect(active).toHaveAccessibleName("Annonser");
    await expect(active).toHaveAttribute("aria-current", "page");
    const pill = canvasElement.querySelector(".admin-nav-indicator");
    await waitFor(() => expect(Math.round(box(pill).height)).toBe(38));
    await expect(Math.round(box(pill).top)).toBe(Math.round(box(active).top));
    await expect(getComputedStyle(pill).backgroundColor).toBe(token("strong"));
    await expect(getComputedStyle(active).color).toBe(token("on-strong"));
    await expect(within(nav).getAllByRole("button", { current: "page" })).toHaveLength(1);

    // A count is a small pill at the end of its row.
    const messages = rows.find((row) => row.getAttribute("aria-label") === "Meddelanden");
    const count = within(messages).getByText("3");
    await expect(Math.round(box(count).height)).toBe(22);
    await expect(box(count).right).toBeLessThanOrEqual(box(messages).right - 11);

    // The foot: a rule, the way over to searching, and the person under it.
    const mode = canvas.getByRole("button", { name: "Växla till sökläge" });
    const person = canvas.getByRole("button", { name: /Samuel Oldmark/ });
    await expect(Math.round(box(mode).height)).toBe(38);
    await expect(within(mode).getByText("Växla till sökläge")).toBeVisible();
    await expect(Math.round(box(person).height)).toBe(52);
    await expect(box(rows.at(-1)).bottom).toBeLessThan(box(mode).top);
    await expect(box(mode).bottom).toBeLessThanOrEqual(box(person).top);
    await expect(within(person).getByText("samuel@strandfastigheter.se")).toBeVisible();
    await expect(box(card).bottom - 1 - 12).toBeCloseTo(box(person).bottom, 0);

    // A page is one click away, and so is the search.
    await userEvent.click(rows[3]);
    await expect(expandedCallbacks.onNavigate).toHaveBeenCalledWith("/app/admin/prospekt");
    await userEvent.click(search);
    await expect(expandedCallbacks.onOpenSearch).toHaveBeenCalledTimes(1);
  }
};

// The folded menu, the rail (72px): the fold button first, then the company, the search, the pages, the way over to searching and
// the person are all icons with their names in tooltips beside them, all on one axis, the middle of the card; a count is a dot on
// the icon.
export const Collapsed = {
  render: () => <Harness startCollapsed callbacks={makeCallbacks()} />,
  play: async ({ canvas, userEvent }) => {
    const card = canvas.getByTestId("card");
    await expect(Math.round(box(card).width)).toBe(72);
    await expect(canvas.queryByText("Arbetsyta")).toBeNull();

    // The fold button is the first thing in the rail, above the company.
    const fold = canvas.getByRole("button", { name: "Expandera meny" });
    const mark = canvas.getByRole("button", { name: "Strand Fastigheter" });
    await expect(box(fold).bottom).toBeLessThan(box(mark).top);
    await expect(box(mark).bottom).toBeLessThan(box(canvas.getByRole("button", { name: "Sök" })).top);

    // Everything is centred on the card: the controls of the header and the foot, and the icon of every page.
    const axis = box(card).left + box(card).width / 2;
    for (const name of ["Expandera meny", "Strand Fastigheter", "Sök", "Växla till sökläge", "Kontomeny, Samuel Oldmark"]) {
      const control = canvas.getByRole("button", { name });
      await expect(Math.abs(middle(control).x - axis)).toBeLessThan(0.5);
    }

    const nav = canvas.getByRole("navigation", { name: "Arbetsyta" });
    const rows = within(nav).getAllByRole("button");
    await expect(rows).toHaveLength(NAV_ITEMS.length);
    for (const row of rows) {
      await expect(Math.abs(middle(row).x - axis)).toBeLessThan(0.5);
      await expect(Math.round(box(row).width)).toBe(46);
      await expect(Math.round(box(row).height)).toBe(38);
      await expect(row).toHaveAccessibleName(/\S/);
      await expect(row.textContent.trim()).toBe("");
      await expect(Math.abs(middle(row.querySelector("svg")).x - middle(row).x)).toBeLessThan(0.5);
    }
    // The counts are dots (of Meddelanden and Notifikationer), not numbers.
    await expect(within(nav).queryByText("3")).toBeNull();
    await expect(rows.filter((row) => row.querySelector('span[aria-hidden="true"].rounded-full'))).toHaveLength(2);

    // There is no room for the display menu in the rail.
    await expect(canvas.queryByRole("button", { name: "Visning av sidomenyn" })).toBeNull();

    await userEvent.hover(rows[3]);
    await tooltip("Prospekt");
    await userEvent.unhover(rows[3]);

    // The person opens the menu beside the rail.
    const person = canvas.getByRole("button", { name: "Kontomeny, Samuel Oldmark" });
    await expect(Math.round(box(person).width)).toBe(38);
    await expect(Math.abs(middle(person.firstElementChild).x - axis)).toBeLessThan(0.5);
    await userEvent.click(person);
    const menu = await body().findByRole("dialog", { name: "Kontomeny" }, { timeout: 4000 });
    await expect(box(menu).left).toBeGreaterThan(box(person).right);
    await userEvent.keyboard("{Escape}");
    await menuGone();
  }
};

// The profile menu: the theme first, as a segmented control, then the account pages, and set apart, logging out.
export const ProfileMenu = {
  render: () => <Harness callbacks={makeCallbacks()} />,
  play: async ({ canvas, userEvent }) => {
    const person = canvas.getByRole("button", { name: /Samuel Oldmark/ });
    await expect(person).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(person);
    const menu = await body().findByRole("dialog", { name: "Kontomeny" }, { timeout: 4000 });
    await expect(person).toHaveAttribute("aria-expanded", "true");

    // It opens above the person, as wide as the row, with a hairline and no shadow (it grows from 95% while it fades in).
    await waitFor(() => expect(Math.abs(box(menu).width - box(person).width)).toBeLessThan(1), { timeout: 4000 });
    await expect(box(menu).bottom).toBeLessThanOrEqual(box(person).top);
    await expect(Math.abs(box(menu).left - box(person).left)).toBeLessThan(1);
    await expect(hasDropShadow(menu)).toBe(false);

    const inside = within(menu);
    const theme = inside.getByRole("group", { name: "Tema" });
    const choices = within(theme).getAllByRole("button");
    await expect(choices.map((choice) => choice.getAttribute("aria-label"))).toEqual(["Ljust", "Mörkt", "Som systemet"]);
    await expect(inside.getByRole("button", { name: "Profil" })).toBeInTheDocument();
    await expect(inside.getByRole("button", { name: "Inställningar" })).toBeInTheDocument();
    await expect(inside.getByRole("button", { name: "Hjälp" })).toBeInTheDocument();
    const logout = inside.getByRole("button", { name: "Logga ut" });
    const help = inside.getByRole("button", { name: "Hjälp" });
    await expect(box(theme).bottom).toBeLessThan(box(inside.getByRole("button", { name: "Profil" })).top);
    await expect(box(help).bottom).toBeLessThan(box(logout).top - 4);
    await expect(Math.round(box(logout).height)).toBe(38);

    // Choosing a theme changes it at once and leaves the menu open (so the choice can be seen and changed).
    await userEvent.click(inside.getByRole("button", { name: "Mörkt" }));
    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    await expect(inside.getByRole("button", { name: "Mörkt" })).toHaveAttribute("aria-pressed", "true");
    await expect(menu).toBeInTheDocument();
    await userEvent.click(inside.getByRole("button", { name: "Ljust" }));
    await waitFor(() => expect(document.documentElement).not.toHaveClass("dark"));
    await userEvent.keyboard("{Escape}");
    await menuGone();
    await expect(person).toHaveFocus();
  }
};

// A page of the account goes there and closes the menu; Logga ut logs out. The page in use is marked in the menu.
const actionCallbacks = makeCallbacks();
export const ProfileMenuActions = {
  render: () => <Harness callbacks={actionCallbacks} pathname="/app/admin/hjalp" />,
  play: async ({ canvas, userEvent }) => {
    clear(actionCallbacks);
    const person = canvas.getByRole("button", { name: /Samuel Oldmark/ });
    await userEvent.click(person);
    const menu = await body().findByRole("dialog", { name: "Kontomeny" }, { timeout: 4000 });
    await expect(within(menu).getByRole("button", { name: "Hjälp" })).toHaveAttribute("aria-current", "page");
    await expect(within(menu).getByRole("button", { name: "Profil" })).not.toHaveAttribute("aria-current");

    await userEvent.click(within(menu).getByRole("button", { name: "Inställningar" }));
    await expect(actionCallbacks.onNavigate).toHaveBeenCalledWith("/app/admin/installningar");
    await menuGone();

    await userEvent.click(person);
    const again = await body().findByRole("dialog", { name: "Kontomeny" }, { timeout: 4000 });
    const start = window.location.pathname + window.location.search;
    await userEvent.click(within(again).getByRole("button", { name: "Logga ut" }));
    await expect(actionCallbacks.onLogout).toHaveBeenCalledTimes(1);
    await menuGone();
    window.history.replaceState(null, "", start);
  }
};

// The company menu of the header, in the card: the companies, each with its gear, and "Lägg till bolag". (The menu itself is
// checked in PanelSidebarControls.stories; the page a gear goes to is the one the panel gives it.)
const companyCallbacks = makeCallbacks();
export const CompanyMenu = {
  render: () => <Harness callbacks={companyCallbacks} />,
  play: async ({ canvas, userEvent }) => {
    clear(companyCallbacks);
    chrome.onSwitchCompany.mockClear();
    await userEvent.click(canvas.getByRole("button", { name: /Strand Fastigheter/ }));
    const menu = await body().findByRole("menu", {}, { timeout: 4000 });
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Inställningar för Nordic Offices" }));
    await expect(chrome.onSwitchCompany).toHaveBeenCalledWith("company-2");
    await waitFor(() => expect(companyCallbacks.onNavigate).toHaveBeenCalledWith("/app/admin/adminprofil"));
  }
};

// In the drawer (below lg) the header has a button that closes it instead of the fold button, and every row is a full-width row.
export const Drawer = {
  args: { onClose: fn() },
  render: (args) => <Harness withToggle={false} onClose={args.onClose} callbacks={makeCallbacks()} />,
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.queryByRole("button", { name: /Fäll ihop|Expandera/ })).toBeNull();
    await expect(within(canvas.getByRole("button", { name: /Strand Fastigheter/ })).getByText("Strand Fastigheter")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Växla till sökläge" })).toHaveTextContent("Växla till sökläge");
    await userEvent.click(canvas.getByRole("button", { name: "Stäng meny" }));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  }
};

// Without the app around it (no company, no person) the menu still works: the pages, the search and the account menu.
export const WithoutTheApp = {
  render: () => <Harness callbacks={makeCallbacks()} provider={null} />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: "Växla till sökläge" })).toBeNull();
    await expect(canvas.queryByRole("button", { name: /Strand Fastigheter/ })).toBeNull();
    await expect(canvas.getByRole("button", { name: "Sök" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Konto/ })).toBeInTheDocument();
    await expect(within(canvas.getByRole("navigation", { name: "Arbetsyta" })).getAllByRole("button")).toHaveLength(NAV_ITEMS.length);
  }
};
