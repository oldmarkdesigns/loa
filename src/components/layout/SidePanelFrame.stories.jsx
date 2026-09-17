import { useState } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
import { Button } from "@/components/ui/button";
import SidePanelFrame from "./SidePanelFrame";

function Harness({ onClose }) {
  const [mounted, setMounted] = useState(true);
  if (!mounted) {
    return <Button onClick={() => setMounted(true)}>Öppna panel</Button>;
  }
  return (
    <SidePanelFrame
      widthClassName="w-[min(400px,100vw)]"
      onClose={() => {
        onClose();
        setMounted(false);
      }}
    >
      {(handleClose) => (
        <div className="flex h-full flex-col p-5">
          <h2 className="text-lg font-semibold">Panelinnehåll</h2>
          <button type="button" onClick={handleClose} className="mt-4 self-start rounded-md border px-3 py-1.5 text-sm">
            Stäng panel
          </button>
        </div>
      )}
    </SidePanelFrame>
  );
}

const meta = {
  component: Harness,
  tags: ["ai-generated", "needs-work"],
  args: { onClose: fn() }
};

export default meta;

export const CloseViaButton = {
  play: async ({ canvas, userEvent, args }) => {
    const panel = within(document.body);
    await panel.findByText("Panelinnehåll");
    await userEvent.click(panel.getByText("Stäng panel"));
    // onClose fires from onOpenChangeComplete, after the exit CSS transition ends.
    await waitFor(() => expect(args.onClose).toHaveBeenCalledOnce());
    await expect(canvas.getByRole("button", { name: "Öppna panel" })).toBeInTheDocument();
  }
};
