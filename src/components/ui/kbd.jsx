import * as React from "react"
import { cn } from "cn"

/**
 * A key of a keyboard shortcut, small and quiet ("⌘K"). Muted on a card; on the dark tooltip (which is the inverse of the page)
 * pass `bg-on-strong/20 text-on-strong`.
 */
function Kbd({
  className,
  ...props
}) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-[18px] min-w-[18px] select-none items-center justify-center gap-0.5 rounded-[5px] bg-veil/5 px-1 font-sans text-[11px] font-medium leading-none text-ink-500 [&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props} />
  );
}

export { Kbd }
