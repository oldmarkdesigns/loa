import { expect, fn, waitFor, within } from "storybook/test";
import { BuildingIcon, LogoutIcon as LogoutNavIcon, SettingsGearIcon } from "../icons/UiIcons";
import { SIDEBAR_DISPLAY_KEY, readSidebarMode } from "../../lib/sidebarDisplay";
import AdminPanelShell from "./AdminPanelShell";
import { PanelChromeProvider } from "./PanelChrome";

const NAV_ITEMS = [
  { key: "listings", label: "Annonser", path: "/app/admin/annonser", Icon: BuildingIcon },
  { key: "settings", label: "Inställningar", path: "/app/admin/installningar", Icon: SettingsGearIcon }
];
const BOTTOM_NAV_ITEMS = [{ key: "logout-nav", label: "Support", path: "/app/admin/support", Icon: LogoutNavIcon }];

const meta = {
  component: AdminPanelShell,
  tags: ["ai-generated", "needs-work"],
  args: {
    pathname: "/app/admin/annonser",
    navItems: NAV_ITEMS,
    bottomNavItems: BOTTOM_NAV_ITEMS,
    sectionTitle: "Annonser",
    badges: {},
    children: <div className="p-4 text-sm">Panelinnehåll</div>
  }
};

export default meta;

export const MobileDrawer = {
  play: async ({ canvas, userEvent }) => {
    const menuButton = await canvas.findByRole("button", { name: "Meny" });
    await userEvent.click(menuButton);

    // The always-present (CSS-hidden below lg:) desktop <aside> renders the same
    // nav items, so scope queries to the open Sheet's own content specifically.
    const sheetContent = await within(document.body).findByText("Inställningar", {
      selector: '[data-slot="sheet-content"] *'
    });
    const drawer = within(sheetContent.closest('[data-slot="sheet-content"]'));

    await userEvent.click(drawer.getByText("Inställningar"));
    await expect(window.location.pathname).toBe("/app/admin/installningar");
  }
};

const chrome = {
  user: { name: "Samuel Oldmark", email: "samuel@strandfastigheter.se", profile: { companyId: "company-1", companyName: "Strand Fastigheter" } },
  myCompanies: [{ companyId: "company-1", name: "Strand Fastigheter" }],
  onSwitchRole: fn(async () => null),
  onSwitchCompany: fn(async () => null)
};

// ⌘K (Ctrl K) opens the search from anywhere, a field included, and closes it again; ⌘B (Ctrl B) folds the side menu and
// unfolds it, but leaves the letter to a field that has the keyboard. The search reaches the pages and goes there.
export const Shortcuts = {
  render: (args) => (
    <PanelChromeProvider value={chrome}>
      <AdminPanelShell {...args}>
        <label className="block p-4 text-sm">
          Anteckning <input aria-label="Anteckning" className="ml-2 rounded border border-veil/20 px-2 py-1" />
        </label>
      </AdminPanelShell>
    </PanelChromeProvider>
  ),
  play: async ({ canvas, userEvent }) => {
    const aside = () => document.querySelector("aside.admin-sidebar-panel");
    const start = window.location.pathname + window.location.search;
    await expect(aside()).toHaveClass("w-[272px]");

    await userEvent.keyboard("{Meta>}b{/Meta}");
    await waitFor(() => expect(aside()).toHaveClass("w-[72px]"));
    await userEvent.keyboard("{Control>}b{/Control}");
    await waitFor(() => expect(aside()).toHaveClass("w-[272px]"));

    // In a field ⌘B is the field's (bold, in editors that have it).
    const field = canvas.getByRole("textbox", { name: "Anteckning" });
    await userEvent.click(field);
    await userEvent.keyboard("{Meta>}b{/Meta}");
    await expect(aside()).toHaveClass("w-[272px]");

    // ⌘K works from the field, and a second one closes the search again.
    await userEvent.keyboard("{Meta>}k{/Meta}");
    const search = await within(document.body).findByRole("dialog", { name: "Sök i arbetsytan" }, { timeout: 4000 });
    await expect(within(search).getByRole("combobox")).toHaveFocus();
    await userEvent.keyboard("{Meta>}k{/Meta}");
    await waitFor(() => expect(within(document.body).queryByRole("dialog", { name: "Sök i arbetsytan" })).not.toBeInTheDocument(), { timeout: 4000 });

    // The search: two quick actions, the pages of the panel and the account pages; a page is chosen with Enter.
    await userEvent.keyboard("{Control>}k{/Control}");
    const again = within(await within(document.body).findByRole("dialog", { name: "Sök i arbetsytan" }, { timeout: 4000 }));
    await expect(again.getAllByRole("group").map((group) => group.getAttribute("aria-label"))).toEqual(["Snabbåtgärder", "Sidor", "Konto"]);
    await expect(again.getByRole("option", { name: /Publicera annons/ })).toBeInTheDocument();
    await expect(again.getByRole("option", { name: /Växla till sökläge/ })).toBeInTheDocument();
    await expect(again.getByRole("option", { name: /Annonser/ })).toHaveTextContent("Här är du");
    await userEvent.type(again.getByRole("combobox"), "inställ");
    await userEvent.keyboard("{Enter}");
    await expect(window.location.pathname).toBe("/app/admin/installningar");
    window.history.replaceState(null, "", start);
  }
};

// The display of the side menu is kept in this browser: it opens the way it was left, on every page of the panels. The fold button and
// ⌘B only fold and open: from the menu that opens on hover they give Expanderad and then Ihopfälld, never the hover again.
export const RemembersTheDisplay = {
  beforeEach: () => {
    window.localStorage.setItem(SIDEBAR_DISPLAY_KEY, "hover");
  },
  render: (args) => (
    <PanelChromeProvider value={chrome}>
      <AdminPanelShell {...args} />
    </PanelChromeProvider>
  ),
  play: async ({ userEvent }) => {
    const card = () => document.querySelector("aside.admin-sidebar-panel");
    const slot = () => document.querySelector(".admin-sidebar-slot");
    await expect(card()).toHaveAttribute("data-display", "hover");
    await expect(card()).toHaveClass("w-[72px]");
    await expect(slot()).toHaveClass("w-[72px]");

    // ⌘B opens it: the card and its place are wide, and it is kept.
    await userEvent.keyboard("{Meta>}b{/Meta}");
    await waitFor(() => expect(card()).toHaveAttribute("data-display", "expanded"));
    await expect(card()).toHaveClass("w-[272px]");
    await expect(slot()).toHaveClass("w-[272px]");
    await expect(readSidebarMode()).toBe("expanded");

    // Again: it folds to Ihopfälld, not back to opening on hover.
    await userEvent.keyboard("{Control>}b{/Control}");
    await waitFor(() => expect(card()).toHaveAttribute("data-display", "collapsed"));
    await expect(card()).toHaveClass("w-[72px]");
    await expect(readSidebarMode()).toBe("collapsed");
  }
};

// An earlier browser that has the first version's `{ pinned, rest }` stored keeps the choice it made.
export const KeepsWhatAnEarlierVersionStored = {
  beforeEach: () => {
    window.localStorage.setItem(SIDEBAR_DISPLAY_KEY, JSON.stringify({ pinned: false, rest: "hover" }));
  },
  render: (args) => (
    <PanelChromeProvider value={chrome}>
      <AdminPanelShell {...args} />
    </PanelChromeProvider>
  ),
  play: async () => {
    await expect(document.querySelector("aside.admin-sidebar-panel")).toHaveAttribute("data-display", "hover");
  }
};
