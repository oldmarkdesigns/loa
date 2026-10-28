import { cn } from "cn";
import FieldLabel from "./FieldLabel";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Building blocks for the listing editor. The same look as the questions in "Publicera annons", laid out for a form.

export function Field({ label, required = false, className, children, ...props }) {
  return (
    <label className={cn("block min-w-0", className)} {...props}>
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
    </label>
  );
}

/** Number input with its unit inside the field. */
export function UnitInput({ unit, className, ...props }) {
  return (
    <div className="relative">
      <Input
        inputMode="numeric"
        type="number"
        className={cn("pr-14 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none", className)}
        {...props}
      />
      <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-500">{unit}</span>
    </div>
  );
}

/** A choice from a fixed list. A value that is not on the list (older listings) is kept as an extra choice instead of vanishing. */
export function ChoiceSelect({ value, options, onChange, emptyLabel, ...props }) {
  const current = value || emptyLabel || "";
  const choices = current && !options.includes(current) ? [current, ...options] : options;
  return (
    <Select value={current} onValueChange={(next) => onChange(emptyLabel && next === emptyLabel ? "" : next)}>
      <SelectTrigger className="w-full" {...props}><SelectValue /></SelectTrigger>
      <SelectContent>
        {choices.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function CheckOption({ checked, onChange, children, ...props }) {
  return (
    <label className="flex h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-veil/10 bg-control px-3.5 text-sm font-medium text-ink-800 transition-colors hover:bg-canvas" {...props}>
      <Checkbox checked={Boolean(checked)} onCheckedChange={(next) => onChange(Boolean(next))} />
      {children}
    </label>
  );
}
