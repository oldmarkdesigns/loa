import { expect, fn, within } from "storybook/test";
import MarketingHeader from "./MarketingHeader";

const meta = {
  component: MarketingHeader,
  tags: ["ai-generated", "needs-work"],
  parameters: { layout: "fullscreen" },
  args: { pathname: "/app/rent", onSwitchRole: fn(), onLogout: fn(), onRequireAuth: fn() }
};

export default meta;

async function openProfileMenu({ canvas, userEvent }) {
  await userEvent.click(canvas.getByRole("button", { name: "Öppna profilmeny" }));
  return within(document.body);
}

// While searching, the way over to the workspace is the first row of the profile menu, not a button of its own in the header.
export const BrokerHeader = {
  args: { user: { id: "user-1", role: "broker", roles: ["renter", "broker"], name: "Samuel Oldmark" } },
  play: async (context) => {
    await expect(context.canvas.queryByRole("button", { name: /Växla till/ })).not.toBeInTheDocument();
    const menu = await openProfileMenu(context);
    const [first] = await menu.findAllByRole("menuitem");
    await expect(first).toHaveTextContent("Växla till adminläge");
  }
};

// Company admins used to have only that button and no profile menu; they get the menu, with the same first row.
export const CompanyAdminHeader = {
  args: { user: { id: "user-2", role: "company_admin", roles: ["renter", "broker", "company_admin"], name: "Anna Admin" } },
  play: async (context) => {
    await expect(context.canvas.queryByRole("button", { name: /Växla till/ })).not.toBeInTheDocument();
    const menu = await openProfileMenu(context);
    await expect(await menu.findByRole("menuitem", { name: "Växla till adminläge" })).toBeInTheDocument();
    await expect(menu.getByRole("menuitem", { name: "Logga ut" })).toBeInTheDocument();
  }
};

export const RenterHeader = {
  args: { user: { id: "user-3", role: "renter", roles: ["renter"], name: "Test Renter" } },
  play: async (context) => {
    const menu = await openProfileMenu(context);
    await menu.findByRole("menuitem", { name: "Profil" });
    await expect(menu.queryByRole("menuitem", { name: "Växla till adminläge" })).not.toBeInTheDocument();
  }
};

// A picture that stands in for a profile photo: a skyline in the dusk, so the circle is easy to see against the page.
const photo =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88"><rect width="88" height="88" fill="#e8b9a6"/><rect y="52" width="88" height="36" fill="#5d6675"/><rect x="10" y="34" width="14" height="30" fill="#39404d"/><rect x="30" y="26" width="18" height="38" fill="#2f3541"/><rect x="54" y="38" width="22" height="26" fill="#39404d"/></svg>`
  );

const withPhoto = { id: "user-1", role: "broker", roles: ["renter", "broker"], name: "Samuel Oldmark", profile: { avatarUrl: photo } };

// The avatar is the whole button: a circle and nothing around it (no border, no fill, no rounded square behind it).
export const AvatarWithoutCard = {
  args: { user: withPhoto },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Öppna profilmeny" });
    const style = getComputedStyle(trigger);
    await expect(parseFloat(style.borderTopWidth)).toBe(0);
    await expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    // A circle: the corners are half the side, not the 12px the platform gives its buttons.
    await expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThanOrEqual(22);
    const box = trigger.getBoundingClientRect();
    await expect(Math.round(box.width)).toBe(44);
    await expect(Math.round(box.height)).toBe(44);
    // The avatar fills it exactly.
    const avatar = trigger.querySelector('[data-slot="avatar"]').getBoundingClientRect();
    await expect(Math.round(avatar.width)).toBe(44);
    await expect(Math.round(avatar.height)).toBe(44);
    await expect(Math.round(avatar.left)).toBe(Math.round(box.left));
  }
};

// Without a photo the initials sit on a circle of their own (the colour of a control: white, and in dark mode the dark control fill),
// since there is no card behind them any more.
export const AvatarInitials = {
  args: { user: { id: "user-1", role: "broker", roles: ["renter", "broker"], name: "Samuel Oldmark" } },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Öppna profilmeny" });
    const initials = within(trigger).getByText("SO");
    const dark = document.documentElement.classList.contains("dark");
    await expect(getComputedStyle(initials).backgroundColor).toBe(dark ? "rgb(23, 26, 32)" : "rgb(255, 255, 255)");
    await expect(parseFloat(getComputedStyle(initials).borderTopLeftRadius)).toBeGreaterThanOrEqual(22);
  }
};

// The same over a dark hero image, where the bar has no background: the photo is the only thing there.
export const AvatarOverDarkHero = {
  args: { user: withPhoto, overHero: true, fadeWithScroll: true },
  decorators: [
    (Story) => (
      <div className="bg-[#0b0a0e]">
        <Story />
      </div>
    )
  ],
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Öppna profilmeny" });
    await expect(parseFloat(getComputedStyle(trigger).borderTopWidth)).toBe(0);
    await expect(getComputedStyle(trigger).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  }
};
