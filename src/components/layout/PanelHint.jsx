import { createContext, useContext } from "react";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * The tooltips of the side menu can be told to wait longer than the app's usual (which is no wait at all). The side menu that
 * opens when the pointer is on it needs it: an icon of its rail must not flash its name in the moment before the menu opens
 * and shows the name in the row itself. Only a delay set on the pointer; focus from the keyboard still shows a tooltip at once.
 */
const PanelHintContext = createContext({ delay: undefined });
export const PanelHintSettings = PanelHintContext.Provider;

/**
 * A tooltip for a control of the side menu that is an icon without a label: its name, and the shortcut when it has one (the same
 * tooltip as "Collapse sidebar ⌘B"). `render` is the control itself and `children` what is inside it, the way Base UI's triggers
 * are composed, so the control can be a menu trigger too: `render={<DropdownMenuTrigger render={<Button />} />}`. `disabled` keeps
 * the control as it is and only turns the tooltip off (a row that shows its own name), so the control is not rebuilt.
 */
export function PanelHint({ label, shortcut, side = "bottom", render, disabled = false, children }) {
  const { delay } = useContext(PanelHintContext);
  return (
    <Tooltip disabled={disabled}>
      <TooltipTrigger render={render} delay={delay}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} sideOffset={6}>
        {label}
        {shortcut ? <Kbd className="bg-on-strong/20 text-on-strong">{shortcut}</Kbd> : null}
      </TooltipContent>
    </Tooltip>
  );
}

export default PanelHint;
