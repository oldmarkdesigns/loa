import { fn, expect } from "storybook/test";
import ListingVisualCard from "./ListingVisualCard";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='320'%3E%3Crect width='480' height='320' fill='%23e4ecf6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='20' fill='%23476a99' text-anchor='middle' dominant-baseline='middle'%3EKontor%3C/text%3E%3C/svg%3E";

const LISTING = {
  id: "listing_1",
  title: "Ljust kontor vid Kungsgatan",
  image: PLACEHOLDER_IMAGE,
  address: "Kungsgatan 12",
  district: "Norrmalm",
  type: "Kontor",
  sizeSqm: 240,
  capacity: 18,
  priceMonthly: 84000,
  availability: "Tillgänglig nu",
  advertiserName: "Vasakronan",
  score: 92
};

const meta = {
  component: ListingVisualCard,
  tags: ["ai-generated", "needs-work"],
  args: {
    listing: LISTING,
    shortlisted: false,
    onOpenListing: fn(),
    onBookViewing: fn(),
    onToggleShortlist: fn()
  }
};

export default meta;

export const Default = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByText("Ljust kontor vid Kungsgatan"));
    await expect(args.onOpenListing).toHaveBeenCalledWith(LISTING);
  }
};

export const Shortlisted = { args: { shortlisted: true } };

export const WithMatchChip = { args: { showMatchChip: true } };

export const Compact = { args: { compact: true } };

export const Horizontal = { args: { horizontal: true } };
