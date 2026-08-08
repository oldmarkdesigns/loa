import { useEffect, useState } from "react";
import { programPreview } from "./LocalProgramModule";
import { BuildingIcon } from "../icons/UiIcons";

function LocalProgramPickerModal({ programs, onClose, onSelect }) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const hasPrograms = Array.isArray(programs) && programs.length > 0;

  useEffect(() => {
    if (!hasPrograms) return undefined;
    setSelectedId(programs[0]?.id || null);
    const id = window.setTimeout(() => setOpen(true), 16);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPrograms, programs?.[0]?.id]);

  if (!hasPrograms) return null;

  function closeWithAnimation() {
    setOpen(false);
    window.setTimeout(() => onClose?.(), 220);
  }

  function confirmSelection() {
    const selectedProgram = programs.find((program) => program.id === selectedId) || programs[0];
    setOpen(false);
    window.setTimeout(() => onSelect?.(selectedProgram), 200);
  }

  return (
    <div
      className={`fixed inset-0 z-[96] flex items-center justify-center bg-[#ffffff]/0 p-4 backdrop-blur-[2px] transition-all duration-200 sm:p-5 ${
        open ? "opacity-100" : "opacity-0"
      }`}
      onClick={closeWithAnimation}
    >
      <div
        className={`w-full max-w-lg rounded-3xl border border-black/10 bg-[#ffffff] p-5 shadow-[0_16px_40px_rgba(15,25,48,0.12)] transition-all duration-200 sm:p-6 ${
          open ? "translate-y-0 scale-100" : "translate-y-2 scale-[0.985]"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Lokalprogram</p>
        <h2 className="mt-1 text-lg font-semibold text-ink-900">Vilket lokalprogram vill ni söka med?</h2>
        <p className="mt-1 text-sm text-ink-600">Ni har flera lokalprogram sparade i profilen. Välj vilket som ska styra sökningen.</p>

        <div className="mt-4 space-y-2" role="radiogroup" aria-label="Välj lokalprogram">
          {programs.map((program) => {
            const isSelected = program.id === selectedId;
            return (
              <button
                key={program.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedId(program.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                  isSelected ? "border-[#0b0a0e] bg-[#ffffff] shadow-[0_0_0_1px_rgba(15,25,48,0.2)]" : "border-black/15 bg-[#ffffff] hover:border-[#0b0a0e]/50"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0b0a0e] text-white">
                    <BuildingIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink-900">{program.title || "Lokalprogram"}</span>
                    <span className="block truncate text-xs text-ink-500">{programPreview(program)}</span>
                  </span>
                </span>
                <span
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    isSelected ? "border-[#0b0a0e]" : "border-black/20"
                  }`}
                  aria-hidden="true"
                >
                  <span className={`h-2 w-2 rounded-full ${isSelected ? "bg-[#0b0a0e]" : "bg-transparent"}`} />
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="mt-4 w-full rounded-xl border border-[#0b0a0e] bg-[#0b0a0e] px-4 py-2.5 text-sm font-semibold text-white"
          onClick={confirmSelection}
        >
          Sök med lokalprogram
        </button>
      </div>
    </div>
  );
}

export default LocalProgramPickerModal;
