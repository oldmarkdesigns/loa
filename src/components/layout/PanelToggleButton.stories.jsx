import { expect, fn, waitFor } from "storybook/test";
import { PanelToggleButton } from "./PanelToggleButton";

const meta = {
  component: PanelToggleButton,
  tags: ["ai-generated", "needs-work"],
  parameters: { layout: "centered" }
};

export default meta;

const glyph = (button, name) => button.querySelector(`.lucide-${name}`);
const opacityOf = (element) => Number(getComputedStyle(element).opacity);
const opacityIs = (element, value) => waitFor(() => expect(opacityOf(element)).toBeCloseTo(value, 2), { timeout: 3000 });

// The button that folds a panel: the side menu's (left) and the assistant's column (right), open and closed. At rest it is the plain
// panel icon, the same for both, with no border and no fill, even when it says aria-expanded. The icon of the direction of a click is
// there under it, unseen until the button is pointed at or has the keyboard.
export const FourStates = {
  args: { onClick: fn() },
  render: (args) => (
    <div className="flex items-center gap-6 p-8">
      <PanelToggleButton {...args} side="left" open label="Fäll ihop meny" className="size-9" />
      <PanelToggleButton {...args} side="left" open={false} label="Expandera meny" className="size-9" />
      <PanelToggleButton {...args} side="right" open label="Dölj kolumnen" aria-expanded className="size-9" />
      <PanelToggleButton {...args} side="right" open={false} label="Visa kolumnen" aria-expanded={false} className="size-9" />
    </div>
  ),
  play: async ({ canvas, args, userEvent }) => {
    const [leftOpen, leftClosed, rightOpen, rightClosed] = canvas.getAllByRole("button");
    await expect(leftOpen).toHaveAccessibleName("Fäll ihop meny");
    await expect(rightClosed).toHaveAccessibleName("Visa kolumnen");

    // The plain icon of the side it is on, and the direction under it: toward the edge when the panel closes, away when it opens.
    const expected = [
      [leftOpen, "panel-left", "panel-left-close"],
      [leftClosed, "panel-left", "panel-left-open"],
      [rightOpen, "panel-right", "panel-right-close"],
      [rightClosed, "panel-right", "panel-right-open"]
    ];
    for (const [button, plain, direction] of expected) {
      await expect(glyph(button, plain)).not.toBeNull();
      await expect(glyph(button, direction)).not.toBeNull();
      await opacityIs(glyph(button, plain), 1);
      await opacityIs(glyph(button, direction), 0);
      await expect(getComputedStyle(button).borderTopColor).toBe("rgba(0, 0, 0, 0)");
      await expect(getComputedStyle(button).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    }

    // With the keyboard on it: a hairline, and the direction instead of the plain icon.
    await userEvent.tab();
    await expect(leftOpen).toHaveFocus();
    await opacityIs(glyph(leftOpen, "panel-left-close"), 1);
    await opacityIs(glyph(leftOpen, "panel-left"), 0);
    await expect(getComputedStyle(leftOpen).borderTopColor).not.toBe("rgba(0, 0, 0, 0)");

    // A click only calls what it is given.
    await userEvent.click(rightClosed);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  }
};
