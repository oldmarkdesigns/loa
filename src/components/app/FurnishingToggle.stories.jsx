import { useState } from "react";
import { expect, waitFor } from "storybook/test";
import FurnishingToggle from "./FurnishingToggle";

/** A colour of the theme (a variable of channels, "11 10 14") as getComputedStyle writes it, so the checks hold in light and dark. */
const token = (name) => `rgb(${getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim().split(/\s+/).join(", ")})`;

const OPTIONS = [
  { value: "furnished", label: "Möblerat" },
  { value: "unfurnished", label: "Omöblerat" }
];

function ControlledToggle(props) {
  const [value, setValue] = useState(props.value);
  return <FurnishingToggle {...props} value={value} onChange={setValue} />;
}

const meta = {
  component: FurnishingToggle,
  tags: ["ai-generated", "needs-work"],
  render: (args) => <ControlledToggle {...args} />
};

export default meta;

export const Default = {
  args: { options: OPTIONS, value: "furnished" },
  play: async ({ canvas, userEvent }) => {
    const unfurnishedButton = canvas.getByText("Omöblerat");
    const onStrong = token("on-strong");
    await expect(getComputedStyle(unfurnishedButton).color).not.toBe(onStrong);
    await userEvent.click(unfurnishedButton);
    // The text colour eases to the one of the filled pill (`transition-colors`), so it is read until it has arrived.
    await waitFor(() => expect(getComputedStyle(unfurnishedButton).color).toBe(onStrong), { timeout: 2000 });
  }
};

export const ThreeOptions = {
  args: {
    options: [
      { value: "furnished", label: "Möblerat" },
      { value: "semi", label: "Delvis" },
      { value: "unfurnished", label: "Omöblerat" }
    ],
    value: "semi"
  }
};
