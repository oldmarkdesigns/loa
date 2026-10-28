import { useState } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
import { Button } from "@/components/ui/button";
import DashboardCustomizer from "./DashboardCustomizer";
import { defaultLayout, normalizeLayout } from "../../../lib/dashboardLayout";

const onSave = fn();

function Harness({ initial }) {
  const [open, setOpen] = useState(true);
  const [layout, setLayout] = useState(() => initial ?? defaultLayout());
  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Anpassa</Button>
      <p data-testid="saved-order" className="mt-3 text-xs text-ink-500">
        {layout.items.filter((item) => item.visible).map((item) => `${item.id}:${item.size}`).join(" ")}
      </p>
      <DashboardCustomizer
        open={open}
        onOpenChange={setOpen}
        layout={layout}
        onSave={(next) => {
          onSave(next);
          setLayout(next);
        }}
      />
    </div>
  );
}

const meta = {
  component: DashboardCustomizer,
  tags: ["ai-generated", "needs-work"],
  parameters: { layout: "fullscreen" },
  beforeEach: () => onSave.mockClear()
};

export default meta;

const screen = () => within(document.body);
const rowOf = (id) => document.querySelector(`[data-widget-row="${id}"]`);
const order = () => Array.from(document.querySelectorAll("[data-widget-row]")).map((row) => row.dataset.widgetRow);
const previewBlocks = () => Array.from(document.querySelectorAll("[data-preview]"));
const openDialog = async () => screen().findByRole("dialog", {}, { timeout: 4000 });
// The overlay slides in when it opens. dnd-kit measures the rows when a widget is lifted, so a test that lifts one has to wait
// until the overlay has stopped moving (a person is never that quick).
const settled = async () => {
  let last = "";
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const box = document.querySelector('[data-slot="dialog-content"]').getBoundingClientRect();
    const now = `${box.top},${box.left},${box.width},${box.height}`;
    if (now === last) return;
    last = now;
    await new Promise((done) => setTimeout(done, 150));
  }
};
// The overlay fades out, and while the pane is not painting the fade does not finish, so "closed" is: gone, or on its way out.
const dialogClosed = () =>
  waitFor(
    () => {
      const dialog = screen().queryByRole("dialog");
      expect(!dialog || dialog.hasAttribute("data-closed")).toBe(true);
    },
    { timeout: 6000 }
  );

// To try by hand: drag the handles, flip the switches, change the sizes.
export const Playground = { render: () => <Harness /> };

// The overlay opens on the layout the overview has now: a row for every widget, the shown ones numbered in order, the
// hidden ones dimmed, and the miniature beside the list drawn on twelve columns.
export const Default = {
  render: () => <Harness />,
  play: async () => {
    const dialog = await openDialog();
    await expect(within(dialog).getByRole("heading", { name: "Anpassa översikten" })).toBeInTheDocument();
    await expect(order()).toHaveLength(12);
    await expect(within(dialog).getByText(/av 12 widgets visas/)).toHaveTextContent("9 av 12 widgets visas");

    // The default order and numbers, and the three widgets that are off.
    await expect(order().slice(0, 3)).toEqual(["quick-actions", "key-figures", "lead-trend"]);
    await expect(within(rowOf("quick-actions")).getByText("1")).toBeInTheDocument();
    await expect(within(rowOf("top-listings")).getByText("8")).toBeInTheDocument();
    for (const id of ["rent-by-district", "lead-fit", "listing-age"]) {
      await expect(rowOf(id)).toHaveAttribute("data-hidden", "true");
      await expect(within(rowOf(id)).getByRole("switch")).toHaveAttribute("aria-checked", "false");
    }

    // The miniature has a block for each widget that is shown, as wide as its size: 12, 12, 8 + 4, 4 + 4 + 4, 8 + 4.
    await expect(previewBlocks()).toHaveLength(9);
    await expect(previewBlocks().map((block) => block.style.gridColumn)).toEqual([
      "span 12", "span 12", "span 8", "span 4", "span 4", "span 4", "span 4", "span 8", "span 4"
    ]);

    // The size control of a hidden widget is off, and every button in the others has a name.
    for (const button of within(rowOf("lead-fit")).getAllByRole("button", { name: /(Liten|Mellan|Stor|Hel bredd),/ })) {
      await expect(button).toBeDisabled();
    }
    await expect(within(rowOf("pipeline")).getByRole("button", { name: /^Liten, en tredjedel av bredden/ })).toHaveAttribute("aria-pressed", "true");

    // Nothing is changed yet, so there is nothing to save or to reset.
    await expect(within(dialog).getByRole("button", { name: "Spara" })).toBeDisabled();
    await expect(within(dialog).getByRole("button", { name: "Återställ standard" })).toBeDisabled();
  }
};

// Choosing what is shown: a widget that is switched on gets the next number, one that is switched off gives its number away.
export const ChooseWidgets = {
  render: () => <Harness />,
  play: async ({ userEvent }) => {
    const dialog = await openDialog();
    await userEvent.click(within(rowOf("rent-by-district")).getByRole("switch"));
    await expect(rowOf("rent-by-district")).toHaveAttribute("data-hidden", "false");
    await expect(within(dialog).getByText(/av 12 widgets visas/)).toHaveTextContent("10 av 12 widgets visas");
    await expect(previewBlocks()).toHaveLength(10);
    await expect(within(rowOf("rent-by-district")).getByText("10")).toBeInTheDocument();

    await userEvent.click(within(rowOf("key-figures")).getByRole("switch"));
    await expect(within(dialog).getByText(/av 12 widgets visas/)).toHaveTextContent("9 av 12 widgets visas");
    await expect(rowOf("key-figures")).toHaveAttribute("data-hidden", "true");
    // The widgets after it move up one place.
    await expect(within(rowOf("lead-trend")).getByText("2")).toBeInTheDocument();
    await expect(previewBlocks().map((block) => block.dataset.preview)).not.toContain("key-figures");
    await expect(within(dialog).getByRole("button", { name: "Spara" })).toBeEnabled();
  }
};

// The hierarchy: a size for each widget. The miniature follows at once.
export const ResizeWidgets = {
  render: () => <Harness />,
  play: async ({ userEvent }) => {
    await openDialog();
    const preview = (id) => document.querySelector(`[data-preview="${id}"]`);
    await expect(preview("pipeline").style.gridColumn).toBe("span 4");

    await userEvent.click(within(rowOf("pipeline")).getByRole("button", { name: /^Stor, två tredjedelar/ }));
    await expect(within(rowOf("pipeline")).getByRole("button", { name: /^Stor,/ })).toHaveAttribute("aria-pressed", "true");
    await expect(within(rowOf("pipeline")).getByRole("button", { name: /^Liten,/ })).toHaveAttribute("aria-pressed", "false");
    await expect(preview("pipeline").style.gridColumn).toBe("span 8");
    await expect(preview("pipeline")).toHaveAttribute("data-size", "large");

    await userEvent.click(within(rowOf("pipeline")).getByRole("button", { name: /^Hel bredd,/ }));
    await expect(preview("pipeline").style.gridColumn).toBe("span 12");
    await userEvent.click(within(rowOf("pipeline")).getByRole("button", { name: /^Mellan, halva bredden/ }));
    await expect(preview("pipeline").style.gridColumn).toBe("span 6");
  }
};

// Order, from the keyboard: focus a handle, space lifts the widget, the arrow keys move it, space puts it down.
export const ReorderWithKeyboard = {
  render: () => <Harness />,
  play: async ({ userEvent }) => {
    await openDialog();
    await settled();
    await expect(order().slice(0, 3)).toEqual(["quick-actions", "key-figures", "lead-trend"]);

    const live = () => document.querySelector('[aria-live="assertive"]')?.textContent ?? "";
    // dnd-kit measures the rows once a widget is lifted; a person takes longer than that to reach for the next key.
    const lifted = () => waitFor(() => expect(document.querySelector("[data-dragging]")).not.toBeNull()).then(() => new Promise((done) => setTimeout(done, 200)));

    const handle = within(rowOf("key-figures")).getByRole("button", { name: "Flytta Nyckeltal" });
    handle.focus();
    await userEvent.keyboard(" ");
    await lifted();
    await expect(live()).toMatch(/Nyckeltal/);
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(live()).toBe("Nyckeltal flyttades till position 3 av 12."), { timeout: 4000 });
    await userEvent.keyboard(" ");
    await waitFor(() => expect(live()).toBe("Nyckeltal placerades på position 3 av 12."), { timeout: 4000 });
    await waitFor(() => expect(order().slice(0, 3)).toEqual(["quick-actions", "lead-trend", "key-figures"]), { timeout: 4000 });
    // The numbers and the miniature follow the new order.
    await expect(within(rowOf("key-figures")).getByText("3")).toBeInTheDocument();
    await expect(previewBlocks().slice(0, 3).map((block) => block.dataset.preview)).toEqual(["quick-actions", "lead-trend", "key-figures"]);

    // Escape lets go of a widget that is lifted, and leaves the order as it was.
    const second = within(rowOf("lead-trend")).getByRole("button", { name: "Flytta Intresse över tid" });
    second.focus();
    await userEvent.keyboard(" ");
    await lifted();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(live()).toMatch(/flyttades till position 3/), { timeout: 4000 });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(live()).toMatch(/Flytten avbröts/), { timeout: 4000 });
    await waitFor(() => expect(order().slice(0, 3)).toEqual(["quick-actions", "lead-trend", "key-figures"]), { timeout: 4000 });
    // ... and did not close the overlay.
    await expect(screen().getByRole("dialog")).not.toHaveAttribute("data-closed");

    // With nothing lifted, escape closes it as usual.
    within(rowOf("lead-trend")).getByRole("button", { name: "Flytta Intresse över tid" }).focus();
    await userEvent.keyboard("{Escape}");
    await dialogClosed();
  }
};

// Saving hands over the whole layout, and only then does it apply. "Återställ standard" is a draft too.
export const SaveAndReset = {
  render: () => <Harness />,
  play: async ({ userEvent }) => {
    const dialog = await openDialog();
    await userEvent.click(within(rowOf("rent-by-district")).getByRole("switch"));
    await userEvent.click(within(rowOf("funnel")).getByRole("button", { name: /^Stor,/ }));
    await expect(onSave).not.toHaveBeenCalled();

    // Reset goes back to the default in the list, still without saving.
    await userEvent.click(within(dialog).getByRole("button", { name: "Återställ standard" }));
    await expect(rowOf("rent-by-district")).toHaveAttribute("data-hidden", "true");
    await expect(within(rowOf("funnel")).getByRole("button", { name: /^Liten,/ })).toHaveAttribute("aria-pressed", "true");
    await expect(onSave).not.toHaveBeenCalled();

    await userEvent.click(within(rowOf("listing-age")).getByRole("switch"));
    await userEvent.click(within(rowOf("listing-age")).getByRole("button", { name: /^Hel bredd,/ }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Spara" }));
    await expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0];
    await expect(saved.items).toHaveLength(12);
    await expect(saved.items.find((item) => item.id === "listing-age")).toEqual({ id: "listing-age", size: "full", visible: true });
    await expect(normalizeLayout(saved)).toEqual(saved);
    // The overlay closes and the page behind it has the new layout.
    await dialogClosed();
    await expect(screen().getByTestId("saved-order")).toHaveTextContent("listing-age:full");
  }
};

// "Avbryt" throws the changes away: the next time the overlay opens it starts from what the overview has.
export const CancelDiscards = {
  render: () => <Harness />,
  play: async ({ userEvent }) => {
    const dialog = await openDialog();
    await userEvent.click(within(rowOf("lead-fit")).getByRole("switch"));
    await expect(within(dialog).getByText(/av 12 widgets visas/)).toHaveTextContent("10 av 12");
    await userEvent.click(within(dialog).getByRole("button", { name: "Avbryt" }));
    await dialogClosed();
    await expect(onSave).not.toHaveBeenCalled();

    await userEvent.click(within(document.body).getByRole("button", { name: "Anpassa" }));
    await waitFor(() => expect(screen().getByRole("dialog")).not.toHaveAttribute("data-closed"), { timeout: 4000 });
    const again = screen().getByRole("dialog");
    await expect(within(again).getByText(/av 12 widgets visas/)).toHaveTextContent("9 av 12");
    await expect(rowOf("lead-fit")).toHaveAttribute("data-hidden", "true");
  }
};

// A layout that was stored before a widget existed still opens: the new widget is added last, switched on or off as it is by default.
export const OldLayout = {
  render: () => (
    <Harness
      initial={normalizeLayout({
        items: [
          { id: "pipeline", size: "full", visible: true },
          { id: "lead-trend", size: "large", visible: true },
          { id: "removed-widget", size: "small", visible: true }
        ]
      })}
    />
  ),
  play: async () => {
    await openDialog();
    await expect(order().slice(0, 2)).toEqual(["pipeline", "lead-trend"]);
    await expect(order()).toHaveLength(12);
    await expect(order()).not.toContain("removed-widget");
    await expect(within(rowOf("pipeline")).getByRole("button", { name: /^Hel bredd,/ })).toHaveAttribute("aria-pressed", "true");
  }
};
