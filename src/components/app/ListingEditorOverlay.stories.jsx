import { expect, fn, within } from "storybook/test";
import { ListingEditorSections, useListingEditorState } from "./ListingEditorOverlay";

const LISTING = {
  id: "listing-1",
  title: "Strandnära Studio Kontor",
  district: "Södermalm",
  address: "Hornsgatan 96",
  sizeSqm: 210,
  priceMonthly: 95000,
  amenities: ["Fiber"],
  description: "Fint kontor.",
  status: "draft"
};

function Harness({ onUpdateListing }) {
  const app = {
    updateListing: onUpdateListing,
    deleteListing: fn(),
    publishListing: fn(),
    pushToast: fn()
  };
  const editor = useListingEditorState(LISTING, app);
  return <ListingEditorSections listing={LISTING} editor={editor} />;
}

const meta = {
  component: Harness,
  tags: ["ai-generated", "needs-work"],
  args: { onUpdateListing: fn(() => Promise.resolve()) }
};

export default meta;

export const EditFieldsAndToggleAmenity = {
  play: async ({ canvas, userEvent }) => {
    const titleInput = canvas.getByDisplayValue("Strandnära Studio Kontor");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Nytt namn");
    await expect(titleInput).toHaveValue("Nytt namn");

    const descriptionArea = canvas.getByDisplayValue("Fint kontor.");
    await expect(descriptionArea.tagName).toBe("TEXTAREA");

    // Fiber starts active (border/bg styled), toggling should flip its pressed look.
    const fiberButton = canvas.getByRole("button", { name: /fiber/i });
    const initiallyActive = fiberButton.className.includes("bg-[#0b0a0e]");
    await userEvent.click(fiberButton);
    await expect(fiberButton.className.includes("bg-[#0b0a0e]")).toBe(!initiallyActive);
  }
};
