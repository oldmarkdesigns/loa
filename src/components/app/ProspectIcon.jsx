import { cn } from "cn";
import { PdfIcon } from "../icons/UiIcons";

/** The document icon in front of a prospect in a list: small, in a light grey circle, in the colour of the primary button. */
export default function ProspectIcon({ className }) {
  return (
    <span aria-hidden="true" className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary", className)}>
      <PdfIcon className="h-4 w-4" />
    </span>
  );
}
