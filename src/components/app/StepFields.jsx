import { cn } from "cn";
import FieldLabel from "./FieldLabel";
import { Input } from "@/components/ui/input";

// The building blocks of the one-question-at-a-time flows ("Publicera annons", "Nytt lokalprogram").

/** A row of fields, each sized for what goes in it. Below the sm breakpoint every field takes the full width. */
export function StepFields({ className, children }) {
  return <div className={cn("flex flex-wrap justify-center gap-x-4 gap-y-5", className)}>{children}</div>;
}

export function StepField({ label, required = false, className, children }) {
  return (
    <label className={cn("block w-full", className)}>
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
    </label>
  );
}

/** Number input with its unit inside the field, so the label can stay short and the field narrow. */
export function UnitInput({ unit, className, ...props }) {
  return (
    <div className="relative">
      <Input
        inputMode="numeric"
        className={cn("pr-14 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none", className)}
        {...props}
      />
      <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-500">{unit}</span>
    </div>
  );
}

export const checkOptionClass = "inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-veil/10 bg-control px-3.5 text-sm font-medium text-ink-800 transition-colors hover:bg-canvas";
