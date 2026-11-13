import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "cn";
import { navigateTo, routeMatches } from "../../lib/router";
import { LogoutIcon, SwitchModeIcon } from "../icons/UiIcons";
import { usePanelChrome } from "./PanelChrome";
import { PanelHint } from "./PanelHint";
import { menuIcon, menuRow, menuRowInset, menuSquare } from "./menuScale";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

/**
 * The foot of the side menu: the person (avatar, name and e-mail) on one quiet row that opens the profile menu above it. In it, the
 * theme as a segmented control, then the account pages (`items`, the bottom entries of the panel: Profil, Inställningar, Hjälp)
 * and, set apart, Logga ut. In the folded rail the row is only the avatar, and the menu opens beside it.
 */

function initialsForPerson(name, email) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return String(email || "?").trim().charAt(0).toUpperCase() || "?";
}

function MenuButton({ Icon, active = false, onClick, children }) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-current={active ? "page" : undefined}
      className={cn(menuRow, menuRowInset, "text-ink-700 hover:bg-veil/5 hover:text-strong", active && "bg-veil/5 text-strong")}
      onClick={onClick}
    >
      <Icon aria-hidden="true" className={cn(menuIcon, "text-ink-500")} />
      <span className="min-w-0 flex-1 truncate text-left">{children}</span>
    </Button>
  );
}

export default function PanelProfileMenu({ collapsed = false, pathname, items = [], onNavigate, onLogout, onOpenChange }) {
  const chrome = usePanelChrome();
  const [open, setOpen] = useState(false);
  // Also told to the side menu, which stays open while this menu is.
  const changeOpen = (next) => {
    setOpen(next);
    onOpenChange?.(next);
  };
  const user = chrome?.user;
  const name = user?.name || "Konto";
  const email = user?.email || "";

  // In the folded rail the avatar is centred by auto margins, which only centre a block-level box, and a button is inline-flex:
  // so it is `flex` there. (The open menu's row is as wide as its space and needs nothing of the kind.)
  const trigger = (
    <PopoverTrigger
      render={
        <Button
          type="button"
          variant="ghost"
          aria-label={`Kontomeny, ${name}`}
          className={cn(
            "loa-person-trigger min-h-0 text-left hover:bg-veil/5 focus-visible:ring-veil/20 aria-expanded:bg-veil/5",
            collapsed ? cn(menuSquare, "mx-auto flex !rounded-full p-0") : "h-auto w-full justify-start gap-2.5 !rounded-md px-2.5 py-1.5"
          )}
        />
      }
    >
      <Avatar aria-hidden="true" className={menuSquare}>
        <AvatarImage src={user?.profile?.avatarUrl} alt="" />
        <AvatarFallback className="bg-tint-3 text-sm font-semibold text-ink-800">{initialsForPerson(user?.name, email)}</AvatarFallback>
      </Avatar>
      {collapsed ? null : (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold leading-[18px] text-strong">{name}</span>
            {email ? <span title={email} className="block truncate text-[12.5px] font-normal leading-4 text-ink-500">{email}</span> : null}
          </span>
          <ChevronsUpDown aria-hidden="true" className="size-3.5 shrink-0 text-ink-500" />
        </>
      )}
    </PopoverTrigger>
  );

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      {collapsed ? (
        <PanelHint label={name} side="right" render={trigger} />
      ) : (
        trigger
      )}
      <PopoverContent
        aria-label="Kontomeny"
        side={collapsed ? "right" : "top"}
        align={collapsed ? "end" : "start"}
        sideOffset={collapsed ? 10 : 8}
        className={cn("loa-account-popover admin-workspace gap-0 rounded-none p-3 shadow-none", collapsed ? "w-72" : "w-[var(--anchor-width)]")}
      >
        <div className="flex items-center justify-between gap-3 px-3 py-1.5">
          <span aria-hidden="true" className="text-sm font-medium text-ink-600">
            Tema
          </span>
          <ThemeToggle />
        </div>
        <MenuButton Icon={SwitchModeIcon} onClick={() => { changeOpen(false); navigateTo("/lokaler"); }}>Byt till sökläge</MenuButton>
        {items.length ? <Separator className="my-2 bg-veil/10" /> : null}
        {items.map((item) => (
          <MenuButton
            key={item.key}
            Icon={item.Icon}
            active={routeMatches(pathname, item.path)}
            onClick={() => {
              changeOpen(false);
              onNavigate(item.path);
            }}
          >
            {item.label}
          </MenuButton>
        ))}
        <Separator className="my-2 bg-veil/10" />
        <MenuButton
          Icon={LogoutIcon}
          onClick={async () => {
            changeOpen(false);
            await onLogout?.();
            navigateTo("/", { replace: true });
          }}
        >
          Logga ut
        </MenuButton>
      </PopoverContent>
    </Popover>
  );
}
