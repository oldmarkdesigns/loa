import { expect, waitFor } from "storybook/test";
import LiveDateTime from "./LiveDateTime";

const meta = {
  component: LiveDateTime,
  tags: ["ai-generated", "needs-work"],
  parameters: { layout: "centered" }
};

export default meta;

// Today's date, a divider, and a clock in hours, minutes and seconds that keeps counting.
export const Default = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/dag \d{1,2} \p{L}+/u)).toBeInTheDocument();
    const clock = canvas.getByText(/^\d{2}:\d{2}:\d{2}$/);
    const first = clock.textContent;
    await waitFor(() => expect(clock.textContent).not.toBe(first), { timeout: 4000 });
  }
};
