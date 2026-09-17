import { expect } from "storybook/test";
import FieldLabel from "./FieldLabel";

const meta = {
  component: FieldLabel,
  tags: ["ai-generated", "needs-work"]
};

export default meta;

export const Default = {
  args: { children: "Företagsnamn" },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Företagsnamn")).toBeVisible();
  }
};

export const Required = { args: { children: "Organisationsnummer", required: true } };
