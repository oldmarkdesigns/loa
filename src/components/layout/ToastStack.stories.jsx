import { expect } from "storybook/test";
import ToastStack from "./ToastStack";

const meta = {
  component: ToastStack,
  tags: ["ai-generated", "needs-work"]
};

export default meta;

export const Success = {
  args: { toasts: [{ id: "1", type: "success", message: "Objektet sparades" }] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Objektet sparades")).toBeVisible();
  }
};

export const ErrorToast = {
  args: { toasts: [{ id: "1", type: "error", message: "Kunde inte spara objektet" }] }
};

export const Stacked = {
  args: {
    toasts: [
      { id: "1", type: "success", message: "Visning bokad" },
      { id: "2", type: "info", message: "Nytt meddelande från hyresvärd" },
      { id: "3", type: "error", message: "Betalningen misslyckades" }
    ]
  }
};

export const Empty = { args: { toasts: [] } };
