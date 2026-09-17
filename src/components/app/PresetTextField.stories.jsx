import { useState } from "react";
import { expect, within } from "storybook/test";
import PresetTextField from "./PresetTextField";

const PRESETS = ["Kontor", "Coworking", "Lager", "Butik"];

function ControlledField(props) {
  const [value, setValue] = useState(props.value);
  return <PresetTextField {...props} value={value} onChange={setValue} />;
}

const meta = {
  component: PresetTextField,
  tags: ["ai-generated", "needs-work"],
  render: (args) => <ControlledField {...args} />
};

export default meta;

export const Default = {
  args: { presets: PRESETS, value: "", selectPlaceholder: "Välj lokaltyp" },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("combobox");
    await userEvent.click(trigger);
    // The listbox renders in a portal outside canvasElement, so query the document.
    const option = await within(document.body).findByRole("option", { name: "Coworking" });
    await userEvent.click(option);
    await expect(trigger).toHaveTextContent("Coworking");
  }
};

export const Preselected = { args: { presets: PRESETS, value: "Lager", selectPlaceholder: "Välj lokaltyp" } };
