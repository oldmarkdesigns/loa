import { expect, within } from "storybook/test";
import { BuildingIcon, LogoutIcon as LogoutNavIcon, SettingsGearIcon } from "../icons/UiIcons";
import AdminPanelShell from "./AdminPanelShell";

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
