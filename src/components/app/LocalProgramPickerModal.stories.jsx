import { useState } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
import LocalProgramPickerModal from "./LocalProgramPickerModal";

const PROGRAMS = [
  { id: "p1", title: "Lokalprogram 1", district: "Södermalm", type: "Kontor", maxBudget: 95000 },
  { id: "p2", title: "Lokalprogram 2", district: "Norrmalm", type: "Coworking", maxBudget: 40000 }
];

function Harness({ onClose, onSelect }) {
  const [programs, setPrograms] = useState(PROGRAMS);
  return (
    <LocalProgramPickerModal
      programs={programs}
      onClose={() => {
        onClose();
        setPrograms(null);
      }}
      onSelect={(program) => {
        onSelect(program);
        setPrograms(null);
      }}
    />
  );
}

const meta = {
  component: Harness,
  tags: ["ai-generated", "needs-work"],
  args: { onClose: fn(), onSelect: fn() }
};

export default meta;

export const SelectSecondProgram = {
  play: async ({ userEvent, args }) => {
    const dialog = within(document.body);
    await dialog.findByText("Vilket lokalprogram vill ni söka med?");
    await userEvent.click(dialog.getByText("Lokalprogram 2"));
    await userEvent.click(dialog.getByRole("button", { name: "Sök med lokalprogram" }));
    await waitFor(() => expect(args.onSelect).toHaveBeenCalledOnce());
    await expect(args.onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "p2" }));
  }
};

export const CloseViaBackdrop = {
  play: async ({ userEvent, args }) => {
    const dialog = within(document.body);
    await dialog.findByText("Vilket lokalprogram vill ni söka med?");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(args.onClose).toHaveBeenCalledOnce());
  }
};
