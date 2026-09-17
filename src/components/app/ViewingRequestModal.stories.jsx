import { useState } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
import ViewingRequestModal from "./ViewingRequestModal";

const LISTING = { id: "listing-1", title: "Strandnära Studio Kontor" };

function Harness({ onSubmit, onClosed }) {
  const [listing, setListing] = useState(LISTING);
  return (
    <ViewingRequestModal
      listing={listing}
      onClose={() => {
        onClosed();
        setListing(null);
      }}
      onSubmit={async (payload) => {
        await onSubmit(payload);
      }}
    />
  );
}

const meta = {
  component: Harness,
  tags: ["ai-generated", "needs-work"],
  args: { onSubmit: fn(() => Promise.resolve()), onClosed: fn() }
};

export default meta;

export const BookViewingWithDate = {
  play: async ({ userEvent, args }) => {
    const dialog = within(document.body);
    await dialog.findByText("Skicka till uthyrare");

    // Open the date popover and pick the 15th of the visible month.
    await userEvent.click(dialog.getByText("Välj datum"));
    const dayButtons = await dialog.findAllByRole("gridcell", { name: "15" });
    await userEvent.click(within(dayButtons[0]).getByRole("button"));

    await userEvent.click(dialog.getByRole("button", { name: "Skicka" }));
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledOnce());
    const payload = args.onSubmit.mock.calls[0][0];
    await expect(payload.listingId).toBe("listing-1");
    await expect(payload.preferredSlots).toHaveLength(1);
    await waitFor(() => expect(args.onClosed).toHaveBeenCalledOnce());
  }
};

export const ContactInquiry = {
  play: async ({ userEvent, args }) => {
    const dialog = within(document.body);
    await dialog.findByText("Skicka till uthyrare");

    await userEvent.click(dialog.getByRole("combobox"));
    await userEvent.click(await within(document.body).findByRole("option", { name: "Kontaktförfrågan" }));

    const textarea = dialog.getByPlaceholderText("Skriv ditt meddelande till uthyraren.");
    await userEvent.type(textarea, "Är lokalen fortfarande ledig?");
    await userEvent.click(dialog.getByRole("button", { name: "Skicka" }));

    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledOnce());
    const payload = args.onSubmit.mock.calls[0][0];
    await expect(payload.message).toBe("Är lokalen fortfarande ledig?");
  }
};

export const CancelWithoutSubmitting = {
  play: async ({ userEvent, args }) => {
    const dialog = within(document.body);
    await dialog.findByText("Skicka till uthyrare");
    await userEvent.click(dialog.getByRole("button", { name: "Avbryt" }));
    await waitFor(() => expect(args.onClosed).toHaveBeenCalledOnce());
    await expect(args.onSubmit).not.toHaveBeenCalled();
  }
};
