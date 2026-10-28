import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";

const sizeClasses = {
  compact: "admin-workspace flex h-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[860px] sm:max-w-[860px] ring-gray-200 flex-col gap-0 overflow-hidden rounded-xl p-0",
  default: "admin-workspace flex h-[100dvh] w-full max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-[calc(100dvh-3rem)] sm:w-[calc(100%-3rem)] sm:max-w-[1180px] sm:rounded-xl",
  // Slightly smaller than "default" and never taller than the viewport, so panels laid out in columns
  // can fill it instead of scrolling. Full screen below the sm breakpoint.
  medium: "admin-workspace flex h-[100dvh] w-full max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-[min(720px,calc(100dvh-4rem))] sm:w-[calc(100%-4rem)] sm:max-w-[1040px] sm:rounded-xl",
  // Room for a category sidebar, the form and an assistant side by side.
  wide: "admin-workspace flex h-[100dvh] w-full max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-[calc(100dvh-3rem)] sm:w-[calc(100%-3rem)] sm:max-w-[1480px] sm:rounded-xl",
  // Fixed-height stage for one-question-at-a-time flows: content stays put between steps.
  focus: "admin-workspace flex h-[100dvh] w-full max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-[min(820px,calc(100dvh-3rem))] sm:w-[calc(100%-3rem)] sm:max-w-[960px] sm:rounded-xl"
};

/** A roomy, focus-trapped workspace. Closing never silently discards edits. */
export default function EditorWorkspace({ title, description, dirty = false, busy = false, compact = false, size, saveDraftLabel = "Spara utkast", discardTitle = "Spara ändringarna innan du lämnar?", discardDescription = "Om du kastar ändringarna går dina osparade uppgifter förlorade.", discardLabel = "Kasta ändringar", onClose, onSaveDraft, children }) {
  const [open, setOpen] = useState(true);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function close() {
    if (busy) return;
    if (dirty) setConfirmDiscard(true);
    else setOpen(false);
  }
  async function saveDraft() {
    if (!onSaveDraft || savingDraft) return;
    setSavingDraft(true);
    try {
      await onSaveDraft();
      setConfirmDiscard(false);
    } finally {
      setSavingDraft(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
      onOpenChangeComplete={(next) => {
        if (!next) onClose?.();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={sizeClasses[size ?? (compact ? "compact" : "default")]}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          {description || "Redigera innehåll och spara dina ändringar innan du stänger."}
        </DialogDescription>
        {children(close)}
        <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
          <AlertDialogContent className="dialog-dissolve">
            <AlertDialogHeader>
              <AlertDialogTitle>{discardTitle}</AlertDialogTitle>
              <AlertDialogDescription>{discardDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="w-full flex-row items-center justify-between sm:flex-row">
              <AlertDialogAction
                variant="destructive"
                disabled={savingDraft}
                onClick={() => {
                  setConfirmDiscard(false);
                  setOpen(false);
                }}
              >
                {discardLabel}
              </AlertDialogAction>
              <div className="flex items-center gap-2">
                <AlertDialogCancel disabled={savingDraft}>Fortsätt redigera</AlertDialogCancel>
                {onSaveDraft ? <Button disabled={savingDraft} onClick={saveDraft}>{savingDraft ? "Sparar…" : saveDraftLabel}</Button> : null}
              </div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
