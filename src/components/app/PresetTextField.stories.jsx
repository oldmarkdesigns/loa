import { useState } from "react";
import { expect } from "storybook/test";
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
    const select = canvas.getByRole("combobox");
    await userEvent.selectOptions(select, "Coworking");
    await expect(select).toHaveValue("Coworking");
  }
};

export const Preselected = { args: { presets: PRESETS, value: "Lager", selectPlaceholder: "Välj lokaltyp" } };
