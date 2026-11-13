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

// The card is the site's dark band (bg-[#0f1422]), a hardcoded hex, so it is a precise,
// non-Tailwind-theme-dependent proof that the shared preview's CSS actually loaded.
export const CssCheck = {
  play: async ({ canvas }) => {
    const card = canvas.getByText("LOA Premium").closest("[data-premium-card]");
    await expect(getComputedStyle(card).backgroundColor).toBe("rgb(15, 20, 34)");
  }
};
