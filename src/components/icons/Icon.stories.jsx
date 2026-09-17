import { expect } from "storybook/test";
import { Icon } from "./Icon";
import { ICONS } from "../../lib/iconSystem";

const meta = {
  component: Icon,
  tags: ["ai-generated", "needs-work"],
  argTypes: {
    name: { control: "select", options: Object.keys(ICONS) }
  }
};

export default meta;

export const Single = {
  args: { name: "star", "aria-label": "Star", strokeWidth: 1.8 },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Star")).toBeVisible();
  }
};

// Every semantic icon key in lib/iconSystem.ts, rendered against its Lucide mapping —
// the fastest way to spot a broken or missing icon mapping across the whole app.
export const AllIcons = {
  render: () => (
    <div className="grid grid-cols-6 gap-4 p-2">
      {Object.keys(ICONS).map((name) => (
        <div key={name} className="flex flex-col items-center gap-1.5 rounded-xl border border-ink-200 p-3 text-center">
          <Icon name={name} aria-label={name} aria-hidden={undefined} className="h-5 w-5 text-ink-800" />
          <span className="text-[10px] leading-tight text-ink-600 break-all">{name}</span>
        </div>
      ))}
    </div>
  )
};
