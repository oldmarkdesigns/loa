import { useState } from "react";
import { expect, fn, within } from "storybook/test";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ProfileMenuDropdown from "./ProfileMenuDropdown";

function Harness({ user, onSwitchRole, onLogout, onHelp }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger render={<button type="button" className="rounded-md border px-3 py-1.5 text-sm" />}>
        Öppna profilmeny
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px] rounded-2xl border border-black/10 p-3 shadow-[0_10px_28px_rgba(15,25,48,0.10)]">
        <ProfileMenuDropdown setMenuOpen={setOpen} user={user} onSwitchRole={onSwitchRole} onLogout={onLogout} onHelp={onHelp} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const meta = {
  component: Harness,
  tags: ["ai-generated", "needs-work"],
  args: { onSwitchRole: fn(), onLogout: fn(), onHelp: fn() }
};

export default meta;

export const RenterMenu = {
  args: { user: { role: "renter", name: "Test Renter" } },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "Öppna profilmeny" });
    await userEvent.click(trigger);
    const menu = within(document.body);
    await menu.findByText("Profil");
    await expect(menu.queryByText("Dina objekt")).not.toBeInTheDocument();
    await userEvent.click(menu.getByText("Sparade objekt"));
    await expect(window.location.pathname + window.location.search).toBe("/app/profile?tab=favorites");
  }
};

export const BrokerMenu = {
  args: { user: { role: "broker", roles: ["broker"], name: "Test Broker" } },
  play: async ({ canvas, userEvent, args }) => {
    const trigger = canvas.getByRole("button", { name: "Öppna profilmeny" });
    await userEvent.click(trigger);
    const menu = within(document.body);
    await menu.findByText("Dina objekt");
    await userEvent.click(menu.getByText("Logga ut"));
    await expect(args.onLogout).toHaveBeenCalledOnce();
  }
};
