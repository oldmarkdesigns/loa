import { useState } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
import { ADD_COMPANY_PATH, PanelChromeProvider } from "./PanelChrome";
import PanelSidebarControls from "./PanelSidebarControls";
import { shellCardClass } from "./shellCard";

/** A colour of the theme (a variable of channels, "11 10 14") as getComputedStyle writes it, so the checks hold in light and dark. */
const token = (name) => `rgb(${getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim().split(/\s+/).join(", ")})`;

const chrome = {
  user: { name: "Samuel Oldmark", profile: { companyId: "company-1", companyName: "Strand Fastigheter" } },
  myCompanies: [
    { companyId: "company-1", name: "Strand Fastigheter", organizationNumber: "556123-4567" },
    { companyId: "company-2", name: "Nordic Offices" }
  ],
  onSwitchRole: fn(async () => null),
  onSwitchCompany: fn(async () => null)
};

const SETTINGS_PATH = "/app/admin/adminprofil";

function Harness({ startCollapsed = false, withToggle = true, withSettings = true, onClose, onNavigate, onModeChange }) {
  const [collapsed, setCollapsed] = useState(startCollapsed);
  const [mode, setMode] = useState("expanded");
  return (
    <PanelChromeProvider value={chrome}>
      <div data-testid="card" className={`m-4 p-3 ${shellCardClass} ${collapsed ? "w-[72px]" : "w-[272px]"}`}>
        <PanelSidebarControls
          collapsed={collapsed}
          onToggleCollapsed={withToggle ? () => setCollapsed((value) => !value) : undefined}
          mode={mode}
          onModeChange={
            withToggle
              ? (next) => {
                  setMode(next);
                  onModeChange?.(next);
                }
              : undefined
          }
          companySettingsPath={withSettings ? SETTINGS_PATH : undefined}
          onNavigate={onNavigate}
          onClose={onClose}
        />
      </div>
    </PanelChromeProvider>
  );
}

const meta = {
  component: PanelSidebarControls,
  tags: ["ai-generated", "needs-work"],
  parameters: { layout: "fullscreen" }
};

export default meta;

const box = (element) => element.getBoundingClientRect();
const middle = (element) => ({ x: box(element).left + box(element).width / 2, y: box(element).top + box(element).height / 2 });
// A drop shadow is a shadow with a blur; the ring of an overlay is a shadow with a spread and no blur.
const hasDropShadow = (element) =>
  (getComputedStyle(element).boxShadow.match(/rgba?\([^)]*\)\s+-?[\d.]+px\s+-?[\d.]+px\s+[\d.]+px/g) || []).some((shadow) => parseFloat(shadow.split(/\s+/).at(-1)) > 0);
const body = () => within(document.body);
const tooltip = (text) => body().findByText(text, { selector: '[data-slot="tooltip-content"]' }, { timeout: 4000 });
const menuGone = () => waitFor(() => expect(body().queryByRole("menu")).not.toBeInTheDocument(), { timeout: 4000 });
// A popup grows from 95% while it fades in, so its size is only its own once the animation has ended.
const settled = (element) => Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => null)));

// To try by hand: hover, tab through and click the controls.
export const Playground = { args: { onNavigate: fn(), onModeChange: fn() }, render: (args) => <Harness {...args} /> };

// The open menu: one row. The company selector (the company's mark and its name) takes the room there is, then the fold button and
// the chevron that opens the choice of display, which end the row, close together. The fold button names itself, with its shortcut,
// when the pointer is on it. The chevron keeps its place but is only seen while the fold button is pointed at (see FoldButton).
export const Expanded = {
  render: () => <Harness />,
  play: async ({ canvas, userEvent }) => {
    const card = canvas.getByTestId("card");
    const company = canvas.getByRole("button", { name: /Strand Fastigheter/ });
    const toggle = canvas.getByRole("button", { name: "Fäll ihop meny" });
    const display = canvas.getByRole("button", { name: "Visning av sidomenyn" });

    // One row: the selector, the fold button, then the chevron, whose right edge is the inside edge of the card (12px of padding).
    for (const control of [toggle, display]) {
      await expect(Math.round(middle(control).y)).toBe(Math.round(middle(company).y));
    }
    await expect(box(company).right).toBeLessThanOrEqual(box(toggle).left);
    await expect(Math.round(box(display).left - box(toggle).right)).toBe(0);
    await expect(Math.round(box(card).right - 1 - 12 - box(display).right)).toBe(0);
    await expect(Math.round(box(company).left - box(card).left - 1)).toBe(12);
    await expect(Math.round(box(toggle).width)).toBe(38);
    await expect(Math.round(box(toggle).height)).toBe(38);
    await expect(Math.round(box(display).width)).toBe(22);
    await expect(Math.round(box(company).height)).toBe(42);

    // The mark is a 34px square with the corners of a small button and the strong fill, and the whole name is there: the selector
    // has no chevron of its own, its room is the name's.
    const mark = within(company).getByText("SF");
    await expect(Math.round(box(mark).width)).toBe(34);
    await expect(Math.round(box(mark).height)).toBe(34);
    await expect(getComputedStyle(mark).backgroundColor).toBe(token("strong"));
    const name = within(company).getByText("Strand Fastigheter");
    await expect(name).toBeVisible();
    await expect(name.scrollWidth).toBeLessThanOrEqual(name.clientWidth);
    await expect(company.querySelector("svg")).toBeNull();

    // The icon is exactly in the middle of its button.
    const icon = toggle.querySelector("svg");
    await expect(Math.abs(middle(icon).x - middle(toggle).x)).toBeLessThan(0.5);
    await expect(Math.abs(middle(icon).y - middle(toggle).y)).toBeLessThan(0.5);

    // The tooltips have the name and, for the fold button, the shortcut.
    await userEvent.hover(toggle);
    const tip = await tooltip(/Fäll ihop meny/);
    await expect(within(tip).getByText(/B$/)).toBeInTheDocument();
    await userEvent.unhover(toggle);
    await userEvent.hover(display);
    await tooltip("Visning av sidomenyn");
  }
};

const glyphs = (button) => ({
  plain: button.querySelector(".lucide-panel-left"),
  direction: button.querySelector(".lucide-panel-left-close, .lucide-panel-left-open")
});
const opacityOf = (element) => Number(getComputedStyle(element).opacity);
// The glyphs and the chevron ease in and out (150 ms), so an opacity is read until it has arrived, and to two decimals.
const opacityIs = (element, value) => waitFor(() => expect(opacityOf(element)).toBeCloseTo(value, 2), { timeout: 3000 });

// The fold button at rest is the plain panel icon, with no chevron, and no border. With the keyboard on it (a pointer does the same,
// which a play function cannot show) it gets a hairline and the icon shows a chevron in the direction of the click, and the chevron of
// the display menu appears next to it and stays while its menu is open. It only folds and opens.
export const FoldButton = {
  render: () => <Harness />,
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("button", { name: "Fäll ihop meny" });
    const display = canvas.getByRole("button", { name: "Visning av sidomenyn" });

    // At rest.
    const rest = glyphs(toggle);
    await expect(rest.plain).not.toBeNull();
    await expect(rest.direction).toHaveClass("lucide-panel-left-close");
    await opacityIs(rest.plain, 1);
    await opacityIs(rest.direction, 0);
    await expect(getComputedStyle(toggle).borderTopColor).toBe("rgba(0, 0, 0, 0)");
    await opacityIs(display, 0);

    // With the keyboard on it.
    await userEvent.tab();
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    await opacityIs(rest.direction, 1);
    await opacityIs(rest.plain, 0);
    await expect(getComputedStyle(toggle).borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
    await opacityIs(display, 1);

    // The chevron stays while its menu is open, and goes when it is closed and the keyboard is elsewhere.
    await userEvent.click(display);
    await body().findByRole("menu", {}, { timeout: 4000 });
    await expect(display).toHaveAttribute("aria-expanded", "true");
    await opacityIs(display, 1);
    await userEvent.keyboard("{Escape}");
    await menuGone();
    (document.activeElement ?? toggle).blur();
    await opacityIs(display, 0);

    // A click only folds: the tooltip and the icon now say the opposite.
    await userEvent.click(toggle);
    const opened = await canvas.findByRole("button", { name: "Expandera meny" });
    await expect(glyphs(opened).direction).toHaveClass("lucide-panel-left-open");
    await expect(canvas.queryByRole("button", { name: "Visning av sidomenyn" })).toBeNull();
  }
};

// The choice of display: three choices, one ticked, and choosing one closes the menu and tells what it is.
export const DisplayMenu = {
  args: { onModeChange: fn() },
  render: (args) => <Harness {...args} />,
  play: async ({ canvas, args, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "Visning av sidomenyn" });
    await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await userEvent.click(trigger);
    const menu = await body().findByRole("menu", {}, { timeout: 4000 });
    await expect(within(menu).getByText("Sidomeny")).toBeInTheDocument();
    const choices = within(menu).getAllByRole("menuitemradio");
    await expect(choices.map((choice) => choice.textContent)).toEqual(["Expanderad", "Ihopfälld", "Expandera vid hovring"]);
    await expect(choices.map((choice) => choice.getAttribute("aria-checked"))).toEqual(["true", "false", "false"]);
    // The tick is at the end of the ticked row only, and the card of the menu has a hairline and no shadow.
    await expect(choices[0].querySelector("svg")).not.toBeNull();
    await expect(choices[1].querySelector("svg")).toBeNull();
    await expect(hasDropShadow(menu)).toBe(false);

    // As wide as its labels: from the end of the longest one to the edge of the menu is the tick's room and the menu's padding, no more.
    await settled(menu);
    const longest = document.createRange();
    longest.selectNodeContents(choices[2]);
    const room = box(menu).right - longest.getBoundingClientRect().right;
    await expect(room).toBeGreaterThanOrEqual(38);
    await expect(room).toBeLessThanOrEqual(42);
    await expect(box(menu).width).toBeLessThan(240);

    await userEvent.click(choices[2]);
    await expect(args.onModeChange).toHaveBeenCalledWith("hover");
    await menuGone();

    // It is the third that is ticked now.
    await userEvent.click(trigger);
    const again = await body().findByRole("menu", {}, { timeout: 4000 });
    await expect(within(again).getAllByRole("menuitemradio").map((choice) => choice.getAttribute("aria-checked"))).toEqual(["false", "false", "true"]);
    await userEvent.keyboard("{Escape}");
    await menuGone();
    await expect(args.onModeChange).toHaveBeenCalledTimes(1);
  }
};

// The company menu, after the reference: each company on a compact row with its mark, name and organisation number, the one in use
// ticked and a gear at the end of the row for its settings, then a rule and "Lägg till bolag".
export const CompanyMenu = {
  args: { onNavigate: fn() },
  render: (args) => <Harness {...args} />,
  play: async ({ canvas, args, userEvent }) => {
    chrome.onSwitchCompany.mockClear();
    args.onNavigate.mockClear();
    const company = canvas.getByRole("button", { name: /Strand Fastigheter/ });
    await userEvent.click(company);
    const menu = await body().findByRole("menu", {}, { timeout: 4000 });
    await settled(menu);
    const active = within(menu).getByRole("menuitemradio", { name: /Strand Fastigheter/ });
    const other = within(menu).getByRole("menuitemradio", { name: /Nordic Offices/ });
    await expect(within(active).getByText("556123-4567")).toBeInTheDocument();
    await expect(active).toHaveAttribute("aria-checked", "true");
    await expect(other).toHaveAttribute("aria-checked", "false");
    await expect(active.querySelector("svg")).not.toBeNull();
    await expect(other.querySelector("svg")).toBeNull();
    await expect(hasDropShadow(menu)).toBe(false);

    // Compact: rows of 44px with 2px between them, a gear at the end of each, then a rule and the row that adds a company.
    const rows = [active, other].map((item) => item.parentElement);
    for (const row of rows) await expect(Math.round(box(row).height)).toBe(44);
    await expect(Math.round(box(rows[1]).top - box(rows[0]).bottom)).toBe(2);
    const gears = within(menu).getAllByRole("menuitem", { name: /^Inställningar för / });
    await expect(gears.map((gear) => gear.getAttribute("aria-label"))).toEqual(["Inställningar för Strand Fastigheter", "Inställningar för Nordic Offices"]);
    for (const [index, gear] of gears.entries()) {
      await expect(gear.parentElement).toBe(rows[index]);
      await expect(box(gear).left).toBeGreaterThan(box(rows[index].firstElementChild).right - 1);
      await expect(Math.round(box(gear).width)).toBe(32);
    }
    const add = within(menu).getByRole("menuitem", { name: "Lägg till bolag" });
    await expect(box(within(menu).getByRole("separator")).top).toBeGreaterThan(box(rows[1]).bottom);
    await expect(box(within(menu).getByRole("separator")).bottom).toBeLessThan(box(add).top);
    await expect(Math.round(box(add).height)).toBe(44);
    // The mark of a company and the plus of the add row are one column.
    await expect(Math.abs(box(within(active).getByText("SF")).left - box(add.firstElementChild).left)).toBeLessThan(1);

    // The gear of the company in use goes to its settings; the gear of another company switches to it first.
    await userEvent.click(gears[0]);
    await expect(args.onNavigate).toHaveBeenLastCalledWith(SETTINGS_PATH);
    await expect(chrome.onSwitchCompany).not.toHaveBeenCalled();
    await menuGone();
    await userEvent.click(company);
    await userEvent.click(within(await body().findByRole("menu", {}, { timeout: 4000 })).getByRole("menuitem", { name: "Inställningar för Nordic Offices" }));
    await expect(chrome.onSwitchCompany).toHaveBeenCalledWith("company-2");
    await waitFor(() => expect(args.onNavigate).toHaveBeenCalledTimes(2));
    await menuGone();

    // "Lägg till bolag" goes to the setup of a company.
    await userEvent.click(company);
    await userEvent.click(within(await body().findByRole("menu", {}, { timeout: 4000 })).getByRole("menuitem", { name: "Lägg till bolag" }));
    await expect(args.onNavigate).toHaveBeenLastCalledWith(ADD_COMPANY_PATH);
    await menuGone();

    // Choosing another company switches to it, and Escape closes the menu without choosing.
    chrome.onSwitchCompany.mockClear();
    await userEvent.click(company);
    await userEvent.click(within(await body().findByRole("menu", {}, { timeout: 4000 })).getByRole("menuitemradio", { name: /Nordic Offices/ }));
    await expect(chrome.onSwitchCompany).toHaveBeenCalledWith("company-2");
    await menuGone();
    await userEvent.click(company);
    await body().findByRole("menu", {}, { timeout: 4000 });
    await userEvent.keyboard("{Escape}");
    await menuGone();
    await expect(chrome.onSwitchCompany).toHaveBeenCalledTimes(1);
  }
};

// A panel without a page for the settings of a company (the broker's) has no gears, and still the row that adds a company.
export const CompanyMenuWithoutSettings = {
  render: () => <Harness withSettings={false} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Strand Fastigheter/ }));
    const menu = await body().findByRole("menu", {}, { timeout: 4000 });
    await expect(within(menu).queryAllByRole("menuitem", { name: /^Inställningar för / })).toHaveLength(0);
    await expect(within(menu).getAllByRole("menuitemradio")).toHaveLength(2);
    await expect(within(menu).getByRole("menuitem", { name: "Lägg till bolag" })).toBeInTheDocument();
  }
};

// The rail: the fold button first, above the company, whose mark is all there is of the selector. Everything is on one axis, the
// middle of the card, and each button names itself in a tooltip beside it.
export const Collapsed = {
  render: () => <Harness startCollapsed />,
  play: async ({ canvas, userEvent }) => {
    const card = canvas.getByTestId("card");
    const toggle = canvas.getByRole("button", { name: "Expandera meny" });
    const company = canvas.getByRole("button", { name: "Strand Fastigheter" });

    await expect(box(toggle).bottom).toBeLessThan(box(company).top);
    const axis = box(card).left + box(card).width / 2;
    for (const control of [toggle, company]) await expect(Math.abs(middle(control).x - axis)).toBeLessThan(0.5);
    await expect(Math.abs(middle(toggle.querySelector("svg")).x - axis)).toBeLessThan(0.5);
    await expect(Math.round(box(company).width)).toBe(38);
    await expect(Math.round(box(toggle).height)).toBe(38);
    const block = within(company).getByText("SF");
    await expect(Math.abs(box(block).width - 38)).toBeLessThan(1);
    await expect(getComputedStyle(block).backgroundColor).toBe(token("strong"));
    await expect(within(company).queryByText("Strand Fastigheter")).toBeNull();
    // There is no room for the display menu in the rail.
    await expect(canvas.queryByRole("button", { name: "Visning av sidomenyn" })).toBeNull();

    await userEvent.hover(toggle);
    await tooltip(/Expandera meny/);
    await userEvent.unhover(toggle);

    // The company menu opens beside the rail, from the mark.
    await userEvent.click(company);
    const item = await body().findByRole("menuitemradio", { name: /Strand Fastigheter/ }, { timeout: 4000 });
    await expect(box(item.closest('[data-slot="dropdown-menu-content"]')).left).toBeGreaterThan(box(company).right);
    await userEvent.keyboard("{Escape}");
    await menuGone();

    // Expanding again puts the fold button on the row of the company selector, after it.
    await userEvent.click(toggle);
    const expanded = await canvas.findByRole("button", { name: "Fäll ihop meny" });
    await waitFor(() => expect(Math.round(box(expanded).top + 19)).toBe(Math.round(middle(canvas.getByRole("button", { name: /Strand Fastigheter/ })).y)), { timeout: 4000 });
    await expect(box(canvas.getByRole("button", { name: /Strand Fastigheter/ })).right).toBeLessThanOrEqual(box(expanded).left);
  }
};

// The drawer has no fold button and no hover: the company selector with a button that closes the drawer at the end of its row.
export const Drawer = {
  args: { onClose: fn() },
  render: (args) => <Harness withToggle={false} onClose={args.onClose} />,
  play: async ({ canvas, args, userEvent }) => {
    const close = canvas.getByRole("button", { name: "Stäng meny" });
    const company = canvas.getByRole("button", { name: /Strand Fastigheter/ });
    await expect(within(company).getByText("Strand Fastigheter")).toBeVisible();
    await expect(Math.round(box(within(company).getByText("SF")).width)).toBe(34);
    await expect(box(company).right).toBeLessThanOrEqual(box(close).left);
    await expect(canvas.queryByRole("button", { name: /Fäll ihop|Expandera|Visning/ })).not.toBeInTheDocument();
    await userEvent.click(close);
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  }
};
