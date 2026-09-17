import { expect } from "storybook/test";
import StatusPill, { LEAD_STATUS_ORDER, LISTING_STATUS_ORDER, PROSPECT_STATUS_ORDER } from "./StatusPill";

const meta = {
  component: StatusPill,
  tags: ["ai-generated", "needs-work"],
  argTypes: {
    variant: { control: "select", options: ["lead", "listing", "prospect"] }
  }
};

export default meta;

export const Lead = {
  args: { status: "new", variant: "lead" },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Ny")).toBeVisible();
  }
};

export const Listing = { args: { status: "active", variant: "listing" } };

export const Prospect = { args: { status: "published", variant: "prospect" } };

export const AllLeadStatuses = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {LEAD_STATUS_ORDER.map((status) => (
        <StatusPill key={status} status={status} variant="lead" />
      ))}
    </div>
  )
};

export const AllListingStatuses = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {LISTING_STATUS_ORDER.map((status) => (
        <StatusPill key={status} status={status} variant="listing" />
      ))}
    </div>
  )
};

export const AllProspectStatuses = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {PROSPECT_STATUS_ORDER.map((status) => (
        <StatusPill key={status} status={status} variant="prospect" />
      ))}
    </div>
  )
};
