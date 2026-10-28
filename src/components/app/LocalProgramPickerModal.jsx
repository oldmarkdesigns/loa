import { useEffect, useRef, useState } from "react";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { programPreview } from "./LocalProgramModule";
import { BuildingIcon } from "../icons/UiIcons";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function LocalProgramPickerModal({ programs, onClose, onSelect }) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const pendingActionRef = useRef("close");
  const lastProgramsRef = useRef([]);
  const hasPrograms = Array.isArray(programs) && programs.length > 0;
  if (hasPrograms) lastProgramsRef.current = programs;
  const displayPrograms = hasPrograms ? programs : lastProgramsRef.current;

  useEffect(() => {
    if (!hasPrograms) return;
    setSelectedId(programs[0]?.id || null);
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPrograms, programs?.[0]?.id]);

  function handleOpenChangeComplete(isOpen) {
    if (isOpen) return;
    if (pendingActionRef.current === "select") {
      const selectedProgram = displayPrograms.find((program) => program.id === selectedId) || displayPrograms[0];
      onSelect?.(selectedProgram);
    } else {
      onClose?.();
    }
  }

  function confirmSelection() {
    pendingActionRef.current = "select";
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) pendingActionRef.current = "close";
        setOpen(nextOpen);
      }}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
      <DialogContent showCloseButton={false} className="max-w-lg rounded-3xl border border-veil/10 bg-surface p-5 sm:p-6">
        <DialogHeader className="gap-1 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Lokalprogram</p>
          <DialogTitle className="text-lg font-semibold text-ink-900">Vilket lokalprogram vill ni söka med?</DialogTitle>
          <DialogDescription className="text-sm text-ink-600">
            Ni har flera lokalprogram sparade i profilen. Välj vilket som ska styra sökningen.
          </DialogDescription>
        </DialogHeader>

        <RadioGroupPrimitive
          value={selectedId}
          onValueChange={setSelectedId}
          aria-label="Välj lokalprogram"
          className="grid gap-2"
        >
          {displayPrograms.map((program) => (
            <RadioPrimitive.Root
              key={program.id}
              value={program.id}
              className="group/program-item flex w-full items-center justify-between gap-3 rounded-2xl border border-veil/15 bg-surface px-4 py-3 text-left transition outline-none hover:border-strong/50 focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:border-strong data-checked:shadow-[0_0_0_1px_rgba(15,25,48,0.2)]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-strong text-on-strong">
                  <BuildingIcon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink-900">{program.title || "Lokalprogram"}</span>
                  <span className="block truncate text-xs text-ink-500">{programPreview(program)}</span>
                </span>
              </span>
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-veil/20 group-data-checked/program-item:border-strong">
                <RadioPrimitive.Indicator className="h-2 w-2 rounded-full bg-strong" />
              </span>
            </RadioPrimitive.Root>
          ))}
        </RadioGroupPrimitive>

        <Button onClick={confirmSelection} className="h-auto w-full rounded-xl bg-strong px-4 py-2.5 text-sm font-semibold text-on-strong hover:bg-strong/90">
          Sök med lokalprogram
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default LocalProgramPickerModal;
