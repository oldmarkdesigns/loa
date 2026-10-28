import { useState } from "react";
import { expect, fireEvent, fn, waitFor, within } from "storybook/test";
import { BuildingIcon, LayoutDashboardIcon, MessageSquareIcon, SettingsGearIcon, SparklesIcon, SupportIcon, UserIcon } from "../icons/UiIcons";
import { PanelSidebar, PanelSidebarDock } from "./AdminPanelShell";
import { PanelChromeProvider } from "./PanelChrome";

const NAV_ITEMS = [
  { key: "oversikt", label: "Översikt", path: "/app/admin", Icon: LayoutDashboardIcon },
  { key: "annonser", label: "Annonser", path: "/app/admin/annonser", Icon: BuildingIcon },
  { key: "leads", label: "Leads & Matchningar", path: "/app/admin/leads", Icon: SparklesIcon },
  { key: "meddelanden", label: "Meddelanden", path: "/app/admin/meddelanden", Icon: MessageSquareIcon }
];
const BOTTOM_NAV_ITEMS = [
  { key: "profil", label: "Profil", path: "/app/admin/profil", Icon: UserIcon },
  { key: "installningar", label: "Inställningar", path: "/app/admin/installningar", Icon: SettingsGearIcon },
  { key: "hjalp", label: "Hjälp", path: "/app/admin/hjalp", Icon: SupportIcon }
];

const chrome = {
  user: { name: "Samuel Oldmark", email: "samuel@strandfastigheter.se", profile: { companyId: "company-1", companyName: "Strand Fastigheter" } },
  myCompanies: [{ companyId: "company-1", name: "Strand Fastigheter", organizationNumber: "556123-4567" }],
  onSwitchRole: fn(async () => null),
  onSwitchCompany: fn(async () => null)
};

// The dock and the side menu in it beside a page, the way the panels have them (without the breakpoint that hides them below lg).
function Harness({ initial = "hover" }) {
  const [mode, setMode] = useState(initial);
  return (
    <PanelChromeProvider value={chrome}>
      <div className="admin-platform flex h-[640px] bg-canvas">
        <PanelSidebarDock mode={mode} onModeChange={setMode}>
          {({ collapsed, toggle, onMenuOpenChange }) => (
            <PanelSidebar
              pathname="/app/admin/annonser"
              navItems={NAV_ITEMS}
              bottomNavItems={BOTTOM_NAV_ITEMS}
              badges={{}}
              collapsed={collapsed}
              onToggleCollapsed={toggle}
              mode={mode}
              onModeChange={setMode}
              onMenuOpenChange={onMenuOpenChange}
              onNavigate={fn()}
              onLogout={fn()}
              onOpenSearch={fn()}
            />
          )}
        </PanelSidebarDock>
        <main data-testid="page" className="min-w-0 flex-1 p-4 text-sm text-strong">
          Innehåll
        </main>
      </div>
    </PanelChromeProvider>
  );
}

const meta = {
  component: PanelSidebarDock,
  tags: ["ai-generated", "needs-work"],
  parameters: { layout: "fullscreen" }
};

export default meta;

const box = (element) => element.getBoundingClientRect();
const body = () => within(document.body);
const parts = (canvasElement) => ({
  card: canvasElement.querySelector("aside.admin-sidebar-panel"),
  slot: canvasElement.querySelector(".admin-sidebar-slot"),
  page: canvasElement.querySelector('[data-testid="page"]')
});
// The card grows and folds with a spring, so its size is its own once its animations have ended.
const settled = (element) => Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => null)));
const isOpen = (card, open) => waitFor(() => expect(card).toHaveAttribute("data-open", open ? "true" : "false"), { timeout: 3000 });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// To try by hand: it starts as the menu that opens when the pointer is on it. The dropdown next to the fold button chooses the
// display; the fold button only folds and opens.
export const Playground = { render: () => <Harness /> };

// Fixed to the left, top and bottom of the panel: no margin, no radius, no shadow, whatever the display is. A hairline on the
// right is what tells it apart from the page.
export const FixedToTheEdges = {
  render: () => <Harness initial="expanded" />,
  play: async ({ canvasElement }) => {
    const { card, slot } = parts(canvasElement);
    const outer = canvasElement.querySelector(".admin-platform");
    await expect(Math.round(box(slot).left)).toBe(Math.round(box(outer).left));
    await expect(Math.round(box(card).left)).toBe(Math.round(box(outer).left));
    await expect(Math.round(box(card).top)).toBe(Math.round(box(outer).top));
    await expect(Math.round(box(card).bottom)).toBe(Math.round(box(outer).bottom));
    const style = getComputedStyle(card);
    await expect(style.borderTopLeftRadius).toBe("0px");
    await expect(style.boxShadow).toBe("none");
    await expect(style.borderRightWidth).toBe("1px");
    await expect(style.borderLeftWidth).toBe("0px");
  }
};

// Expanderad: the menu is open, and its place in the layout is as wide as it is.
export const Expanded = {
  render: () => <Harness initial="expanded" />,
  play: async ({ canvasElement }) => {
    const { card, slot } = parts(canvasElement);
    await expect(card).toHaveAttribute("data-display", "expanded");
    await expect(card).toHaveAttribute("data-open", "true");
    await expect(Math.round(box(card).width)).toBe(272);
    await expect(Math.round(box(slot).width)).toBe(272);
  }
};

// Ihopfälld: the rail, and the pointer on it does nothing.
export const Collapsed = {
  render: () => <Harness initial="collapsed" />,
  play: async ({ canvasElement, userEvent }) => {
    const { card, slot } = parts(canvasElement);
    await expect(card).toHaveAttribute("data-display", "collapsed");
    await expect(Math.round(box(card).width)).toBe(72);
    await expect(Math.round(box(slot).width)).toBe(72);
    await userEvent.hover(card);
    await wait(600);
    await expect(card).toHaveAttribute("data-open", "false");
    await expect(Math.round(box(card).width)).toBe(72);
  }
};

// Expandera vid hovring: the rail at rest. With the pointer on it the card grows over the page (its place stays as narrow as the
// rail, so nothing on the page moves) and shows the names; when the pointer leaves it folds again.
export const OpensOnHover = {
  render: () => <Harness />,
  play: async ({ canvasElement, userEvent }) => {
    const { card, slot, page } = parts(canvasElement);
    const inside = within(card);
    const pageLeft = box(page).left;

    await expect(card).toHaveAttribute("data-display", "hover");
    await expect(card).toHaveAttribute("data-open", "false");
    await expect(Math.round(box(card).width)).toBe(72);
    await expect(Math.round(box(slot).width)).toBe(72);
    await expect(inside.queryByText("Arbetsyta")).toBeNull();
    await expect(inside.getByRole("button", { name: "Expandera meny" })).toBeInTheDocument();

    await userEvent.hover(card);
    await isOpen(card, true);
    await settled(card);
    await expect(Math.round(box(card).width)).toBe(272);
    await expect(Math.round(box(slot).width)).toBe(72);
    await expect(box(page).left).toBe(pageLeft);
    await expect(box(card).right).toBeGreaterThan(box(page).left);
    await expect(inside.getByText("Arbetsyta")).toBeVisible();
    await expect(inside.getByText("Leads & Matchningar")).toBeVisible();
    // The card is over the page, not beside it.
    const over = document.elementFromPoint(box(card).left + 200, box(card).top + 60);
    await expect(card.contains(over)).toBe(true);
    // It looks open, so the fold button offers to fold it, as it does on any open menu.
    await expect(inside.getByRole("button", { name: "Fäll ihop meny" })).toBeInTheDocument();

    await userEvent.unhover(card);
    await isOpen(card, false);
    await settled(card);
    await expect(Math.round(box(card).width)).toBe(72);
    await expect(box(page).left).toBe(pageLeft);
  }
};

// The spring is the menu's own: the card and its place in the layout both move with the width transition of .admin-sidebar-panel.
export const UsesTheMenusSpring = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const { card, slot } = parts(canvasElement);
    for (const element of [card, slot]) {
      // (The theme switches transitions off for the moment it is put on the page, so the first look may be too early.)
      await waitFor(() => expect(getComputedStyle(element).transitionProperty).toBe("width"), { timeout: 3000 });
      const style = getComputedStyle(element);
      await expect(style.transitionDuration).toBe("0.44s");
      await expect(style.transitionTimingFunction).toBe("cubic-bezier(0.32, 1.22, 0.44, 1)");
    }
  }
};

// A menu opened from the card (here the profile menu) keeps the card open when the pointer leaves it for the menu or the page, and
// when the menu has closed the card folds.
export const HoldsWhileAMenuIsOpen = {
  render: () => <Harness />,
  play: async ({ canvasElement, userEvent }) => {
    const { card } = parts(canvasElement);
    await userEvent.hover(card);
    await isOpen(card, true);
    await settled(card);

    await userEvent.click(within(card).getByRole("button", { name: /Samuel Oldmark/ }));
    await body().findByRole("dialog", { name: "Kontomeny" }, { timeout: 4000 });
    await userEvent.unhover(card);
    await wait(700);
    await expect(card).toHaveAttribute("data-open", "true");

    await userEvent.keyboard("{Escape}");
    await isOpen(card, false);
  }
};

// Touch has no pointer to leave, so it does not open the card; the pointer of a mouse does. Neither does keyboard focus: the rail
// is used from the keyboard as it is, with the names in tooltips, and the fold button opens the menu.
export const TouchAndKeyboardDoNotOpen = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const { card } = parts(canvasElement);
    // React hears a pointer arriving as `pointerover` from outside the element.
    fireEvent.pointerOver(card, { pointerType: "touch" });
    await wait(500);
    await expect(card).toHaveAttribute("data-open", "false");
    within(card).getByRole("button", { name: "Sök" }).focus();
    await wait(500);
    await expect(card).toHaveAttribute("data-open", "false");
    fireEvent.pointerOver(card, { pointerType: "mouse" });
    await isOpen(card, true);
  }
};

// The fold button, and ⌘B, only fold and open. From the menu that opens on hover: a click opens it (Expanderad), a click again folds
// it to Ihopfälld, which does not come back to opening on hover. The hover is the display menu's to give.
export const FoldButtonOnlyFoldsAndOpens = {
  render: () => <Harness />,
  play: async ({ canvasElement, userEvent }) => {
    const { card, slot, page } = parts(canvasElement);
    const pageLeft = box(page).left;

    await userEvent.click(within(card).getByRole("button", { name: "Expandera meny" }));
    await expect(card).toHaveAttribute("data-display", "expanded");
    await settled(slot);
    // The place grew with the card: the page moved over to make room, by what the rail was short of.
    await expect(Math.round(box(slot).width)).toBe(272);
    await expect(Math.round(box(page).left - pageLeft)).toBe(200);

    await userEvent.click(within(card).getByRole("button", { name: "Fäll ihop meny" }));
    await expect(card).toHaveAttribute("data-display", "collapsed");
    await settled(slot);
    await expect(Math.round(box(slot).width)).toBe(72);
    await expect(box(page).left).toBe(pageLeft);

    // It stays a rail with the pointer on it.
    await userEvent.hover(card);
    await wait(600);
    await expect(card).toHaveAttribute("data-open", "false");
    await userEvent.unhover(card);

    // The keys do the same: open, then fold.
    await userEvent.keyboard("{Meta>}b{/Meta}");
    await expect(card).toHaveAttribute("data-display", "expanded");
    await userEvent.keyboard("{Control>}b{/Control}");
    await expect(card).toHaveAttribute("data-display", "collapsed");
  }
};

// Folding what the pointer has opened: the menu looks open, so the button folds it, to Ihopfälld, and it stays folded with the
// pointer on it.
export const FoldingWhatTheHoverOpened = {
  render: () => <Harness />,
  play: async ({ canvasElement, userEvent }) => {
    const { card } = parts(canvasElement);
    await userEvent.hover(card);
    await isOpen(card, true);
    await settled(card);
    await userEvent.click(within(card).getByRole("button", { name: "Fäll ihop meny" }));
    await expect(card).toHaveAttribute("data-display", "collapsed");
    await isOpen(card, false);
    await settled(card);
    await expect(Math.round(box(card).width)).toBe(72);
    await wait(500);
    await expect(card).toHaveAttribute("data-open", "false");
  }
};

// The dropdown next to the fold button chooses the display, and the menu follows: Expandera vid hovring makes it the rail that
// opens on hover, and Ihopfälld makes it a rail that does not.
export const ChoosingTheDisplay = {
  render: () => <Harness initial="expanded" />,
  play: async ({ canvasElement, userEvent }) => {
    const { card, slot } = parts(canvasElement);
    const choose = async (name) => {
      await userEvent.click(within(card).getByRole("button", { name: "Visning av sidomenyn" }));
      const menu = await body().findByRole("menu", {}, { timeout: 4000 });
      await userEvent.click(within(menu).getByRole("menuitemradio", { name }));
      await waitFor(() => expect(body().queryByRole("menu")).not.toBeInTheDocument(), { timeout: 4000 });
    };

    await choose("Expandera vid hovring");
    await expect(card).toHaveAttribute("data-display", "hover");
    await isOpen(card, false);
    await settled(card);
    await expect(Math.round(box(card).width)).toBe(72);
    await expect(Math.round(box(slot).width)).toBe(72);

    await userEvent.hover(card);
    await isOpen(card, true);
    await settled(card);
    await expect(Math.round(box(card).width)).toBe(272);

    // From the open card, to a rail that stays a rail.
    await choose("Ihopfälld");
    await expect(card).toHaveAttribute("data-display", "collapsed");
    await isOpen(card, false);
    await userEvent.unhover(card);
    await userEvent.hover(card);
    await wait(500);
    await expect(card).toHaveAttribute("data-open", "false");
  }
};
