import { useState } from "react";
import { expect } from "storybook/test";
import FurnishingToggle from "./FurnishingToggle";

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
    await expect(getComputedStyle(unfurnishedButton).color).not.toBe("rgb(255, 255, 255)");
    await userEvent.click(unfurnishedButton);
    await expect(getComputedStyle(unfurnishedButton).color).toBe("rgb(255, 255, 255)");
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
