import { cn } from "cn";
import { MoreHorizontalIcon } from "../icons/UiIcons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const itemClass = "gap-2 rounded-lg px-2.5 py-1.5 font-medium text-ink-700 focus:bg-veil/5 focus:text-ink-700 data-popup-open:bg-veil/5 data-open:bg-veil/5";
const surfaceClass = "w-auto min-w-[11rem] rounded-xl border border-veil/10 bg-popover p-1 shadow-[0_10px_28px_rgba(15,25,48,0.10)]";

// The rows of most lists open something when clicked, and a menu is rendered outside the row, so clicks in it must not reach it.
const stop = (event) => event.stopPropagation();

/**
 * The three-dot menu at the end of a row, in the "Åtgärder" column. Every list uses it, so the actions of a row are
 * always in the same place. `actions` is a list of
 *   { key, label, icon, onSelect, destructive?, disabled? }                      one action
 *   { key, label, icon, value, options: [{ value, label }], onValueChange }      a choice: a submenu with the current one ticked
 *   "separator"                                                                 a line between groups
 * Falsy entries are skipped, so an action can be left out with `condition && { … }`.
 */
export default function RowActionsMenu({ label, actions, className }) {
  const entries = actions.filter(Boolean);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            className={cn("h-8 w-8 min-h-0 rounded-md text-ink-600 hover:bg-control", className)}
            onClick={stop}
          />
        }
      >
        <MoreHorizontalIcon className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} className={surfaceClass} onClick={stop}>
        {entries.map((entry, index) => {
          if (entry === "separator") return <DropdownMenuSeparator key={`separator-${index}`} className="mx-0 my-1" />;
          const Icon = entry.icon;
          const icon = Icon ? <Icon aria-hidden="true" className={cn("h-4 w-4", !entry.destructive && "text-ink-500")} /> : null;
          if (entry.options) {
            return (
              <DropdownMenuSub key={entry.key}>
                <DropdownMenuSubTrigger disabled={entry.disabled} className={itemClass}>
                  {icon}
                  {entry.label}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className={surfaceClass} onClick={stop}>
                  <DropdownMenuRadioGroup value={entry.value} onValueChange={entry.onValueChange}>
                    {entry.options.map((option) => (
                      <DropdownMenuRadioItem key={option.value} value={option.value} closeOnClick className={cn(itemClass, "pr-8")}>
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          }
          return (
            <DropdownMenuItem
              key={entry.key}
              variant={entry.destructive ? "destructive" : "default"}
              disabled={entry.disabled}
              className={itemClass}
              onClick={entry.onSelect}
            >
              {icon}
              {entry.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
