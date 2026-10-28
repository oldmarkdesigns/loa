import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { PanelHint } from "./PanelHint";
import { menuQuietButton } from "./menuScale";

const OPTIONS = [
  { value: "expanded", label: "Expanderad" },
  { value: "collapsed", label: "Ihopfälld" },
  { value: "hover", label: "Expandera vid hovring" }
];

/**
 * How the side menu is shown: a small chevron beside the fold button that opens a menu of three choices, one of them ticked.
 * Expanderad holds the menu open, Ihopfälld keeps it as the narrow rail, and Expandera vid hovring keeps it as the rail until the
 * pointer is on it (see PanelSidebarDock). This is the only place that chooses the last one: the fold button never does. The menu
 * is as wide as its labels (and the tick at the end of a row). `className` is for the chevron, which the header shows only while the
 * fold button is pointed at; `onOpenChange` tells the side menu that one of its menus is open, so it does not fold up under the menu
 * while the pointer is on the menu.
 */
export default function PanelSidebarModeMenu({ mode, onModeChange, onOpenChange, className }) {
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <PanelHint
        label="Visning av sidomenyn"
        render={
          <DropdownMenuTrigger
            render={<Button type="button" variant="ghost" aria-label="Visning av sidomenyn" className={cn(menuQuietButton, "h-7 w-[22px]", className)} />}
          />
        }
      >
        <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
      </PanelHint>
      <DropdownMenuContent align="end" sideOffset={8} className="w-max rounded-xl p-2 shadow-none">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 pb-1.5 pt-1 text-[12.5px] font-medium text-ink-500">Sidomeny</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={mode} onValueChange={onModeChange}>
            {OPTIONS.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                closeOnClick
                className="whitespace-nowrap rounded-md py-2 pl-2.5 pr-8 text-sm font-medium focus:bg-veil/5 focus:text-strong"
              >
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
