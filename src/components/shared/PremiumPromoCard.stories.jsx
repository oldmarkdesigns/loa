import { fn, expect } from "storybook/test";
import PremiumPromoCard from "./PremiumPromoCard";

const meta = {
  component: PremiumPromoCard,
  tags: ["ai-generated", "needs-work"],
  args: { onUpgrade: fn() }
};

export default meta;

export const Default = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Uppgradera/i }));
    await expect(args.onUpgrade).toHaveBeenCalledOnce();
  }
};

export const CustomLabel = { args: { buttonLabel: "Se Premium-planer" } };

// PremiumPromoCard highlights "Lokalflöde Premium" in a bg-[#f3d571] chip — the only
// hardcoded-hex color in the file, so it's a precise, non-Tailwind-theme-dependent
// proof that the shared preview's CSS actually loaded.
export const CssCheck = {
  play: async ({ canvas }) => {
    const chip = canvas.getByText("Lokalflöde Premium");
    await expect(getComputedStyle(chip).backgroundColor).toBe("rgb(243, 213, 113)");
  }
};
