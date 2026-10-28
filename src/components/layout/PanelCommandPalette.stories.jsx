import { useState } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
import { BuildingIcon, PlusIcon, SettingsGearIcon, SparklesIcon, SwitchModeIcon, UserIcon } from "../icons/UiIcons";
import { PanelCommandPalette, PanelSearchButton, filterPaletteItems } from "./PanelCommandPalette";
import { Button } from "@/components/ui/button";

const select = {
  publish: fn(),
  mode: fn(),
  overview: fn(),
  listings: fn(),
  leads: fn(),
  profile: fn(),
  settings: fn()
};

const ITEMS = [
  { id: "publish", group: "Snabbåtgärder", label: "Publicera annons", Icon: PlusIcon, keywords: "ny skapa lägg ut objekt", onSelect: select.publish },
  { id: "mode", group: "Snabbåtgärder", label: "Växla till sökläge", Icon: SwitchModeIcon, keywords: "söka hyra lokaler", onSelect: select.mode },
  { id: "overview", group: "Sidor", label: "Översikt", Icon: BuildingIcon, hint: "Här är du", onSelect: select.overview },
  { id: "listings", group: "Sidor", label: "Annonser", Icon: BuildingIcon, onSelect: select.listings },
  { id: "leads", group: "Sidor", label: "Leads & Matchningar", Icon: SparklesIcon, onSelect: select.leads },
  { id: "profile", group: "Konto", label: "Profil", Icon: UserIcon, onSelect: select.profile },
  { id: "settings", group: "Konto", label: "Inställningar", Icon: SettingsGearIcon, onSelect: select.settings }
];

function Harness({ startOpen = true }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <div className="p-6">
      <PanelSearchButton onOpen={() => setOpen(true)} />
      <PanelCommandPalette open={open} onOpenChange={setOpen} items={ITEMS} />
      <Button className="mt-4" onClick={() => setOpen(true)}>
        Öppna sökningen
      </Button>
    </div>
  );
}

const meta = {
  component: PanelCommandPalette,
  tags: ["ai-generated", "needs-work"],
  parameters: { layout: "fullscreen" }
};

export default meta;

const body = () => within(document.body);
const box = (element) => element.getBoundingClientRect();
const dialog = () => body().findByRole("dialog", { name: "Sök i arbetsytan" }, { timeout: 4000 });
const closed = () => waitFor(() => expect(body().queryByRole("dialog", { name: "Sök i arbetsytan" })).not.toBeInTheDocument(), { timeout: 4000 });
// A drop shadow is a shadow with a blur; the ring of an overlay is a shadow with a spread and no blur.
const hasDropShadow = (element) =>
  (getComputedStyle(element).boxShadow.match(/rgba?\([^)]*\)\s+-?[\d.]+px\s+-?[\d.]+px\s+[\d.]+px/g) || []).some((shadow) => parseFloat(shadow.split(/\s+/).at(-1)) > 0);
const selectedOption = (palette) => palette.getAllByRole("option").find((option) => option.getAttribute("aria-selected") === "true");

// Open from the start, to try by hand.
export const Playground = { render: () => <Harness /> };

// The palette: the field has the keyboard, and everything that can be reached is under it, in groups, the first row ready.
export const Open = {
  render: () => <Harness />,
  play: async () => {
    const palette = within(await dialog());
    const input = palette.getByRole("combobox", { name: "Sök i arbetsytan" });
    await expect(input).toHaveFocus();
    await expect(input).toHaveAttribute("placeholder", "Sök sidor och åtgärder…");
    await expect(palette.getAllByRole("group").map((group) => group.getAttribute("aria-label"))).toEqual(["Snabbåtgärder", "Sidor", "Konto"]);
    await expect(palette.getAllByRole("option")).toHaveLength(ITEMS.length);
    // The first row is the one to act on, and it is the one the field points at.
    await expect(selectedOption(palette)).toHaveAccessibleName(/Publicera annons/);
    await expect(input).toHaveAttribute("aria-activedescendant", selectedOption(palette).id);
    // What the row says about the page in use is at its end.
    await expect(within(palette.getByRole("option", { name: /Översikt/ })).getByText("Här är du")).toBeInTheDocument();
    // A card with a hairline and no shadow, 32rem tall at most.
    const card = await dialog();
    await expect(hasDropShadow(card)).toBe(false);
    await expect(box(card).height).toBeLessThanOrEqual(512 + 1);
  }
};

// Typing narrows the list (case and accents do not matter, every word has to be found, and a row's keywords count); the arrow
// keys move through what is left, and Enter does what the row says and closes.
export const FilterAndChoose = {
  render: () => <Harness />,
  play: async ({ userEvent }) => {
    Object.values(select).forEach((spy) => spy.mockClear());
    const palette = within(await dialog());
    const input = palette.getByRole("combobox", { name: "Sök i arbetsytan" });

    await userEvent.type(input, "OVERSIKT");
    await expect(palette.getAllByRole("option")).toHaveLength(1);
    await expect(palette.getByRole("option", { name: /Översikt/ })).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, "ny ann");
    await expect(palette.getAllByRole("option")).toHaveLength(1);
    await expect(palette.getByRole("option", { name: /Publicera annons/ })).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, "ann");
    await expect(palette.getAllByRole("option").map((option) => option.textContent)).toEqual(["Publicera annons", "Annonser"]);
    await expect(selectedOption(palette)).toHaveAccessibleName(/Publicera annons/);
    await userEvent.keyboard("{ArrowDown}");
    await expect(selectedOption(palette)).toHaveAccessibleName(/Annonser/);
    await expect(input).toHaveAttribute("aria-activedescendant", selectedOption(palette).id);
    // The arrows go round.
    await userEvent.keyboard("{ArrowDown}");
    await expect(selectedOption(palette)).toHaveAccessibleName(/Publicera annons/);
    await userEvent.keyboard("{ArrowUp}");
    await expect(selectedOption(palette)).toHaveAccessibleName(/Annonser/);

    await userEvent.keyboard("{Enter}");
    await expect(select.listings).toHaveBeenCalledTimes(1);
    await expect(select.publish).not.toHaveBeenCalled();
    await closed();
  }
};

// Nothing matches: it says so, and Enter does nothing.
export const NoResults = {
  render: () => <Harness />,
  play: async ({ userEvent }) => {
    Object.values(select).forEach((spy) => spy.mockClear());
    const palette = within(await dialog());
    const input = palette.getByRole("combobox", { name: "Sök i arbetsytan" });
    await userEvent.type(input, "zzz");
    await expect(palette.getByRole("status")).toHaveTextContent("Inga träffar för ”zzz”.");
    await expect(palette.queryAllByRole("option")).toHaveLength(0);
    await expect(input).not.toHaveAttribute("aria-activedescendant");
    await userEvent.keyboard("{Enter}");
    for (const spy of Object.values(select)) await expect(spy).not.toHaveBeenCalled();
    await expect(await dialog()).toBeInTheDocument();
  }
};

// The pointer moves the selection and a click does the row; Escape closes without doing anything.
export const PointerAndEscape = {
  render: () => <Harness />,
  play: async ({ userEvent }) => {
    Object.values(select).forEach((spy) => spy.mockClear());
    const palette = within(await dialog());
    const settings = palette.getByRole("option", { name: /Inställningar/ });
    await userEvent.hover(settings);
    await waitFor(() => expect(settings).toHaveAttribute("aria-selected", "true"));
    await userEvent.click(settings);
    await expect(select.settings).toHaveBeenCalledTimes(1);
    await closed();

    // It opens empty again, and Escape closes it.
    await userEvent.click(within(document.body).getByRole("button", { name: "Öppna sökningen" }));
    const again = within(await dialog());
    await expect(again.getByRole("combobox", { name: "Sök i arbetsytan" })).toHaveValue("");
    await expect(selectedOption(again)).toHaveAccessibleName(/Publicera annons/);
    await userEvent.keyboard("{Escape}");
    await closed();
    await expect(select.publish).not.toHaveBeenCalled();
  }
};

// The field in the menu that opens it: a quiet bar with the shortcut, or only the icon in the folded rail.
export const SearchField = {
  render: () => (
    <div className="flex items-start gap-8 p-6">
      <div className="w-[246px]">
        <PanelSearchButton onOpen={fn()} />
      </div>
      <div className="w-[46px]">
        <PanelSearchButton collapsed onOpen={fn()} />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const [bar, icon] = canvas.getAllByRole("button", { name: "Sök" });
    await expect(Math.round(box(bar).height)).toBe(38);
    await expect(Math.round(box(bar).width)).toBe(246);
    await expect(bar).toHaveTextContent(/K$/);
    await expect(bar).toHaveAttribute("aria-keyshortcuts", "Control+K Meta+K");
    await expect(Math.round(box(icon).width)).toBe(46);
    await expect(icon.textContent.trim()).toBe("");
  }
};

// The matching itself.
export const Matching = {
  render: () => <div className="p-6 text-sm">Se play-funktionen.</div>,
  play: async () => {
    const labels = (query) => filterPaletteItems(ITEMS, query).map((item) => item.label);
    await expect(labels("")).toHaveLength(ITEMS.length);
    await expect(labels("  ")).toHaveLength(ITEMS.length);
    await expect(labels("översikt")).toEqual(["Översikt"]);
    await expect(labels("oversikt")).toEqual(["Översikt"]);
    await expect(labels("LEADS matchn")).toEqual(["Leads & Matchningar"]);
    await expect(labels("matchn leads")).toEqual(["Leads & Matchningar"]);
    await expect(labels("hyra")).toEqual(["Växla till sökläge"]);
    await expect(labels("finns inte")).toEqual([]);
  }
};
