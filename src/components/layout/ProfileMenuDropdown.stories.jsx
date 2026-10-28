import { useState } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
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
    await expect(menu.queryByRole("menuitem", { name: "Växla till adminläge" })).not.toBeInTheDocument();
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
    await expect(menu.getByRole("menuitem", { name: "Växla till adminläge" })).toBeInTheDocument();
    await userEvent.click(menu.getByText("Logga ut"));
    await expect(args.onLogout).toHaveBeenCalledOnce();
  }
};

async function switchToAdminMode({ canvas, userEvent, args }, role, path) {
  args.onSwitchRole.mockClear();
  const start = window.location.pathname + window.location.search;
  await userEvent.click(canvas.getByRole("button", { name: "Öppna profilmeny" }));
  await userEvent.click(await within(document.body).findByRole("menuitem", { name: "Växla till adminläge" }));
  await waitFor(() => expect(args.onSwitchRole).toHaveBeenCalledWith(role));
  await waitFor(() => expect(window.location.pathname).toBe(path));
  window.history.replaceState(null, "", start);
}

// While searching, the first row of the menu leads to the workspace, and the active role follows.
export const BrokerSwitchesToAdminMode = {
  args: { user: { role: "renter", roles: ["renter", "broker"], name: "Test Broker" } },
  play: (context) => switchToAdminMode(context, "broker", "/app/broker")
};

export const CompanyAdminSwitchesToAdminMode = {
  args: { user: { role: "renter", roles: ["renter", "broker", "company_admin"], name: "Test Admin" } },
  play: (context) => switchToAdminMode(context, "company_admin", "/app/admin")
};
