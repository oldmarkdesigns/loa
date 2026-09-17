import { useState } from "react";
import { expect, fn, waitFor } from "storybook/test";
import ProspectCommentThread from "./ProspectCommentThread";

const SECTIONS = [
  { id: "overview", title: "Översikt" },
  { id: "terms", title: "Villkor" }
];

function Harness({ onAddComment, requireGuestName }) {
  const [comments, setComments] = useState([]);
  const [guestName, setGuestName] = useState("");
  return (
    <div style={{ height: 420 }}>
      <ProspectCommentThread
        sections={SECTIONS}
        comments={comments}
        requireGuestName={requireGuestName}
        guestName={guestName}
        onGuestNameChange={setGuestName}
        onAddComment={async (sectionId, body) => {
          await onAddComment(sectionId, body);
          setComments((prev) => [...prev, { id: String(prev.length), sectionId, body, authorName: "Test" }]);
        }}
      />
    </div>
  );
}

const meta = {
  component: Harness,
  tags: ["ai-generated", "needs-work"],
  args: { onAddComment: fn(() => Promise.resolve()) }
};

export default meta;

export const PostToSection = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Villkor" }));
    const input = canvas.getByPlaceholderText('Kommentera "Villkor"...');
    await userEvent.type(input, "Ser bra ut!");
    await userEvent.click(canvas.getByRole("button", { name: "Skicka kommentar" }));
    await waitFor(() => expect(args.onAddComment).toHaveBeenCalledWith("terms", "Ser bra ut!"));
    await expect(await canvas.findByText("Ser bra ut!")).toBeVisible();
  }
};

export const RequiresGuestNameToSubmit = {
  args: { requireGuestName: true },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByPlaceholderText('Kommentera "Översikt"...');
    await userEvent.type(input, "Fråga om hyra");
    const submitButton = canvas.getByRole("button", { name: "Skicka kommentar" });
    await expect(submitButton).toBeDisabled();

    await userEvent.type(canvas.getByPlaceholderText("Ditt namn"), "Gäst Testsson");
    await expect(submitButton).toBeEnabled();
  }
};
