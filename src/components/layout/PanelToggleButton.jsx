import { PanelLeft, PanelLeftClose, PanelLeftOpen, PanelRight, PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { PanelHint } from "./PanelHint";
import { menuIcon, menuQuietButton } from "./menuScale";

const GLYPHS = {
  left: { plain: PanelLeft, closing: PanelLeftClose, opening: PanelLeftOpen },
  right: { plain: PanelRight, closing: PanelRightClose, opening: PanelRightOpen }
};

// A hairline around the button while it is pointed at or has the keyboard. `aria-expanded` (which a button that opens and closes a
// panel has) must not tint it: the button says nothing of the state until it is pointed at, and the panel shows it.
const toggleClass = cn(
  menuQuietButton,
  "hover:border-veil/15 focus-visible:border-veil/15 aria-expanded:bg-transparent aria-expanded:text-ink-600 hover:aria-expanded:bg-veil/5 hover:aria-expanded:text-strong"
);

/**
 * The button that folds a panel away and brings it back: the side menu's (`side="left"`) and the assistant's column (`side="right"`).
 * At rest it is the plain panel icon, the same whether the panel is open or not. Pointed at, or with the keyboard on it, it gets a
 * hairline border and the icon shows a chevron in the direction of what a click does: toward the edge when the panel is `open`
 * (it closes), away from it when it is not. It only ever folds and unfolds; nothing else hangs on it. `label` is what the tooltip says,
 * and the accessible name unless `aria-label` is given; other props (onClick, aria-expanded, className for the size) go to the button.
 * `iconClassName` sets the size of the icon.
 */
export function PanelToggleButton({ side = "left", open, label, shortcut, tooltipSide = "bottom", className, iconClassName = menuIcon, ...props }) {
  const { plain: Plain, closing: Closing, opening: Opening } = GLYPHS[side];
  const Direction = open ? Closing : Opening;
  return (
    <PanelHint
      label={label}
      shortcut={shortcut}
      side={tooltipSide}
      render={<Button type="button" variant="ghost" aria-label={label} className={cn(toggleClass, className)} {...props} />}
    >
      <span aria-hidden="true" className={cn("relative block", iconClassName)}>
        <Plain className="absolute inset-0 size-full transition-opacity duration-150 group-hover/button:opacity-0 group-focus-visible/button:opacity-0" strokeWidth={1.8} />
        <Direction className="absolute inset-0 size-full opacity-0 transition-opacity duration-150 group-hover/button:opacity-100 group-focus-visible/button:opacity-100" strokeWidth={1.8} />
      </span>
    </PanelHint>
  );
}

export default PanelToggleButton;
