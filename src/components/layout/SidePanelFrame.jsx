import { useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";

function SidePanelFrame({ widthClassName, title = "Detaljer", onClose, children }) {
  const [open, setOpen] = useState(true);

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) onClose?.();
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className={`admin-workspace ${widthClassName} data-[side=right]:w-full data-[side=right]:sm:max-w-[640px] max-w-none gap-0 bg-surface text-base`}
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <SheetDescription className="sr-only">Visa och hantera uppgifter.</SheetDescription>
        {children(() => setOpen(false))}
      </SheetContent>
    </Sheet>
  );
}

export default SidePanelFrame;
