import { createContext, useContext } from "react";
import { cn } from "cn";
import { navigateTo } from "../../lib/router";
import { PlusIcon, SettingsGearIcon, SwitchModeIcon } from "../icons/UiIcons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { PanelHint } from "./PanelHint";
import { menuIcon, menuRow, menuRowIconOnly, menuRowInset, menuSquare } from "./menuScale";

/**
 * What the workspace panels need from the app around them: the person, their companies and the callbacks behind the
 * company switcher and the mode switch. AppShell provides it. The company selector heads the side menu (see
 * PanelSidebarControls) and the mode switch is the row above the person at its foot (see AdminPanelShell), so the panels have
 * no bar of their own (the profile menu, with the theme, help and logging out, opens from the person). Without a provider,
 * for instance when a page is shown on its own, they render nothing.
 *
 * Both controls are `collapsed` in the narrow rail of the folded side menu, where they are only an icon (the mode switch names
 * itself in a tooltip); everywhere else (the open side menu and the drawer) they show their text.
 */
const PanelChromeContext = createContext(null);

export const PanelChromeProvider = PanelChromeContext.Provider;
export const usePanelChrome = () => useContext(PanelChromeContext);

function initialsForName(name = "") {
  const parts = String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return (parts.map((part) => part[0]).join("") || "B").toUpperCase();
}

function companyNameForUser(user) {
  return (
    user?.profile?.legalEntity ||
    user?.profile?.companyName ||
    user?.profile?.company ||
    user?.profile?.organizationName ||
    "Ditt bolag"
  );
}

/** Where "Lägg till bolag" goes: the setup of a company profile, the same flow that is offered when a broker has been verified. */
export const ADD_COMPANY_PATH = "/onboarding/company-admin-profile?role=company_admin&intent=add-role";

/** The way over to searching for space: the search pages take over, and the role follows (the same as the mode switch does). */
export function switchToSearchMode(chrome) {
  navigateTo("/lokaler");
}

/** A company's mark: its initials on black, in a square with rounded corners (people are round, companies are not). */
function CompanyMark({ name, className }) {
  return (
    <span aria-hidden="true" className={cn("flex shrink-0 items-center justify-center rounded-md bg-strong font-semibold leading-none text-on-strong", className)}>
      {initialsForName(name)}
    </span>
  );
}

/**
 * The company the panel is showing, and a menu to switch to another one: the company's mark and its name on a quiet row of the side
 * menu's header, or only the mark in the folded rail. The menu lists the companies (the one in use ticked, each with a gear that
 * opens the company's settings, which is `settingsPath`, when the panel has such a page) and ends with "Lägg till bolag".
 * `onNavigate` is how it goes to a page (the drawer closes itself on the way); `onOpenChange` tells the side menu that this menu is
 * open, so it stays open while the menu is.
 */
export function PanelCompanySwitcher({ collapsed = false, settingsPath, onNavigate = navigateTo, onOpenChange, className }) {
  const chrome = usePanelChrome();
  if (!chrome) return null;
  const { user, myCompanies, onSwitchCompany } = chrome;
  const name = companyNameForUser(user);
  const activeId = String(user?.profile?.companyId || "");
  const options = Array.isArray(myCompanies) && myCompanies.length > 0 ? myCompanies : [{ companyId: activeId, name }];

  // The settings of a company are the settings of the company in use, so another company is switched to first.
  async function openSettings(companyId) {
    if (String(companyId) !== activeId) await onSwitchCompany?.(companyId);
    onNavigate(settingsPath);
  }

  const trigger = (
    <DropdownMenuTrigger
      render={
        <Button
          type="button"
          variant="ghost"
          aria-label={collapsed ? name : undefined}
          className={cn(
            "min-h-0 !rounded-md text-left hover:bg-veil/5 focus-visible:ring-veil/20 aria-expanded:bg-veil/5",
            collapsed ? cn(menuSquare, "mx-auto p-0") : "h-[42px] min-w-0 flex-1 justify-start gap-2.5 px-1.5",
            className
          )}
        />
      }
    >
      {collapsed ? (
        <CompanyMark name={name} className="size-[38px] text-sm" />
      ) : (
        <>
          <CompanyMark name={name} className="size-[34px] text-[13px]" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-strong">{name}</span>
        </>
      )}
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      {collapsed ? (
        <PanelHint label={name} side="right" render={trigger} />
      ) : (
        trigger
      )}
      <DropdownMenuContent align="start" side={collapsed ? "right" : "bottom"} sideOffset={collapsed ? 10 : 6} className="w-[280px] rounded-xl p-2 shadow-none">
        <DropdownMenuRadioGroup
          value={activeId}
          onValueChange={(companyId) => {
            if (companyId !== activeId) void onSwitchCompany?.(companyId);
          }}
          className="space-y-0.5"
        >
          {options.map((company) => (
            // The company and its gear are two menu items on one row, so the row is lit when either has the pointer or the keyboard.
            <div key={company.companyId} className="flex items-center gap-1 rounded-md focus-within:bg-veil/5 hover:bg-veil/5">
              <DropdownMenuRadioItem
                value={String(company.companyId)}
                closeOnClick
                className="min-h-11 min-w-0 flex-1 gap-2.5 rounded-md py-1 pl-2 pr-9 focus:bg-transparent focus:text-strong"
              >
                <CompanyMark name={company.name} className="size-8 text-xs" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium leading-[18px] text-strong">{company.name}</span>
                  {company.organizationNumber ? <span className="block truncate text-[12.5px] leading-4 text-ink-500">{company.organizationNumber}</span> : null}
                </span>
              </DropdownMenuRadioItem>
              {settingsPath ? (
                <DropdownMenuItem
                  aria-label={`Inställningar för ${company.name}`}
                  title={`Inställningar för ${company.name}`}
                  className="mr-1 size-8 shrink-0 justify-center gap-0 rounded-md p-0 text-ink-500 hover:bg-veil/10 hover:text-strong focus:bg-veil/10 focus:text-strong"
                  onClick={() => void openSettings(company.companyId)}
                >
                  <SettingsGearIcon aria-hidden="true" className="size-[17px]" />
                </DropdownMenuItem>
              ) : null}
            </div>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator className="-mx-2 my-1.5 bg-veil/10" />
        <DropdownMenuItem
          className="min-h-11 gap-2.5 rounded-md py-1 pl-2 pr-2.5 text-sm font-medium text-ink-700 focus:bg-veil/5 focus:text-strong"
          onClick={() => onNavigate(ADD_COMPANY_PATH)}
        >
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center text-ink-500">
            <PlusIcon className="size-[18px]" />
          </span>
          Lägg till bolag
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The way over to searching for space: a quiet row above the person at the foot of the side menu, made like the rows of the pages
 * above it though it is not one of them. Its counterpart in the other mode is "Växla till adminläge" in the profile menu of the
 * search header. In the folded rail it is only the icon, with its name in a tooltip. It is in the search of the side menu too.
 */
export function PanelModeSwitch({ collapsed = false, className }) {
  const chrome = usePanelChrome();
  if (!chrome) return null;
  const label = "Växla till sökläge";
  const rowClass = cn(menuRow, "text-ink-700 hover:bg-veil/5 hover:text-strong");

  if (collapsed) {
    return (
      <PanelHint
        label={label}
        side="right"
        render={
          <Button type="button" variant="ghost" aria-label={label} className={cn(rowClass, menuRowIconOnly, className)} onClick={() => switchToSearchMode(chrome)} />
        }
      >
        <SwitchModeIcon aria-hidden="true" className={menuIcon} />
      </PanelHint>
    );
  }
  return (
    <Button type="button" variant="ghost" className={cn(rowClass, menuRowInset, className)} onClick={() => switchToSearchMode(chrome)}>
      <SwitchModeIcon aria-hidden="true" className={menuIcon} />
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
    </Button>
  );
}
