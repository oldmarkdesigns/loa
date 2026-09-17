import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

function SidePanelFrame({ widthClassName, onClose, children }) {
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
        className={`${widthClassName} max-w-none gap-0 bg-[#ffffff] text-base`}
      >
        {children(() => setOpen(false))}
      </SheetContent>
    </Sheet>
  );
}

export default SidePanelFrame;
