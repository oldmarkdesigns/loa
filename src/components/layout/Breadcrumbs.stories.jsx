import { expect } from "storybook/test";
import Breadcrumbs from "./Breadcrumbs";

const meta = {
  component: Breadcrumbs,
  tags: ["ai-generated", "needs-work"]
};

export default meta;

export const Default = {
  args: {
    items: [
      { label: "Mina objekt", to: "/app/my-listings" },
      { label: "Kontor på Kungsgatan" }
    ]
  },
  play: async ({ canvas, userEvent }) => {
    const crumb = canvas.getByRole("button", { name: "Mina objekt" });
    await userEvent.click(crumb);
    await expect(window.location.pathname).toBe("/app/my-listings");
  }
};

export const SingleLevel = { args: { items: [{ label: "Mina objekt" }] } };

export const ThreeLevels = {
  args: {
    items: [
      { label: "Admin", to: "/app/admin" },
      { label: "Leads", to: "/app/admin/leads" },
      { label: "Acme AB" }
    ]
  }
};
