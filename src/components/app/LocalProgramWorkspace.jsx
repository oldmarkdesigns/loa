import { useEffect, useRef, useState } from "react";
import EditorWorkspace from "../layout/EditorWorkspace";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight } from "lucide-react";

const prompts = ["Berätta om lokalen ni letar efter.", "Hur mycket utrymme behöver ni, och vad får det kosta?", "När börjar nästa kapitel för er?", "Vad behöver fungera i vardagen?", "Vilka krav behöver lokalen uppfylla?", "Vad skulle göra lokalen komplett?"];
const examples = ["Vi vill gärna ha ett lugnt läge nära våra kunder…", "Vi är 8 idag men planerar att växa till 12…", "Inflyttningen är flexibel om rätt lokal dyker upp…", "Nära tunnelbana är viktigare än egen parkering…", "Vi behöver kunna ta emot besökare med rullstol…", "Ett kök och ett tyst rum för videosamtal vore bra…"];
const steps = ["Grunduppgifter", "Storlek och budget", "Tid och avtal", "Läge och tillgång", "Särskilda krav", "Bekvämligheter"];

function programSnapshot(draft = {}) {
  const contextNotes = Object.fromEntries(
    Object.entries(draft.contextNotes || {})
      .map(([key, value]) => [key, String(value || "")])
      .filter(([, value]) => value.trim())
      .sort(([a], [b]) => a.localeCompare(b, "sv"))
  );
  return JSON.stringify({
    id: draft.id || "",
    title: draft.title || "",
    district: draft.district || "Alla",
    type: Array.isArray(draft.type) ? draft.type.filter(Boolean) : [],
    teamSize: draft.teamSize || "",
    minSize: draft.minSize || "",
    maxSize: draft.maxSize || "",
    minBudget: draft.minBudget || "",
    maxBudget: draft.maxBudget || "",
    moveInDate: draft.moveInDate || "",
    contractFlex: draft.contractFlex || "",
    transitDistance: draft.transitDistance || "",
    accessHours: draft.accessHours || "",
    parkingType: draft.parkingType || "",
    layoutType: draft.layoutType || "",
    includeOperatingCosts: Boolean(draft.includeOperatingCosts),
    accessibilityAdapted: Boolean(draft.accessibilityAdapted),
    ecoCertified: Boolean(draft.ecoCertified),
    amenities: draft.amenities || "",
    contextNotes
  });
}

export default function LocalProgramWorkspace({ draft, editing, busy, onClose, onSave, onContextChange, children }) {
  const [initial, setInitial] = useState(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const heading = useRef(null);
  const content = useRef(null);
  const draftId = draft?.id || "";
  useEffect(() => {
    setInitial(programSnapshot(draft));
  }, [draftId]);
  useEffect(() => {
    if (!editing) { heading.current?.focus(); content.current?.scrollTo({ top: 0 }); }
  }, [step, editing]);
  function next() {
    if (step === 0 && !String(draft.title || "").trim()) { setError("Ge lokalprogrammet ett namn innan du fortsätter."); return; }
    if (step === 1 && draft.minSize && draft.maxSize && Number(draft.minSize) > Number(draft.maxSize)) { setError("Maxytan måste vara minst lika stor som minytan."); return; }
    setError(""); setStep((value) => value + 1);
  }
  return <EditorWorkspace compact title={editing ? "Redigera lokalprogram" : "Nytt lokalprogram"} dirty={initial !== null && programSnapshot(draft) !== initial} busy={busy} onClose={onClose} onSaveDraft={onSave}>
    {(close) => <>
      {!editing && <header className="shrink-0 border-b border-border bg-surface px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-ink-500">Nytt lokalprogram</p>
          <span className="rounded-full bg-strong px-2.5 py-1 text-xs font-semibold text-on-strong">Steg {step + 1} av {steps.length}</span>
        </div>
        <h2 ref={heading} tabIndex={-1} className="mt-3 text-xl font-semibold outline-none">{steps[step]}</h2>
        <p className="mt-1 text-sm text-ink-500">{prompts[step]}</p>
        <ol aria-label="Förlopp för lokalprogram" className="relative isolate mt-5 grid grid-cols-6 gap-1.5">
          <span aria-hidden="true" className="program-step-selection-indicator" style={{ transform: `translateX(calc(${step * 100}% + ${step * 6}px))` }} />
          {steps.map((label, index) => {
            const status = index < step ? "klar" : index === step ? "pågående" : "kommande";
            return <li key={label} aria-current={index === step ? "step" : undefined} data-program-step={index === step ? "active" : undefined} className="relative z-10 min-w-0">
              <div className={`flex h-8 items-center justify-center rounded-md text-xs font-semibold transition-colors duration-200 ${index < step ? "bg-tint-3 text-ink-800" : index === step ? "bg-transparent text-on-strong" : "bg-subtle text-ink-500"}`}>
                {index + 1}<span className="sr-only">: {label}, {status}</span>
              </div>
              <p className={`mt-1 hidden truncate text-center text-[10px] sm:block ${index === step ? "font-semibold text-ink-900" : "text-ink-500"}`}>{label}</p>
            </li>;
          })}
        </ol>
      </header>}
      <div ref={content} className="min-h-0 overflow-y-auto bg-surface p-4 sm:p-5">
        {error && <p role="alert" className="mb-4 text-sm text-rose-700">{error}</p>}
        <fieldset disabled={busy} className="min-w-0">{children(close, editing ? null : step)}</fieldset>
        <div className="mt-5 border-t border-border pt-4">
          <div className={editing ? "grid gap-3 sm:grid-cols-2" : ""}>
          {(editing ? steps : [steps[step]]).map((category) => <div key={category} className="mb-3 last:mb-0">
            <label htmlFor={`context-${steps.indexOf(category)}`} className="mb-2 block text-sm font-medium">{editing ? `${category} – egna önskemål` : "Vill du berätta mer?"} <span className="font-normal text-ink-500">(valfritt)</span></label>
            <div className="rounded-lg border border-border bg-canvas px-3 py-2 focus-within:ring-1 focus-within:ring-gray-300">
              <Textarea id={`context-${steps.indexOf(category)}`} rows={editing ? 1 : 2} disabled={busy} value={draft.contextNotes?.[category] || ""} onChange={(event) => onContextChange({ ...draft.contextNotes, [category]: event.target.value })} placeholder={examples[steps.indexOf(category)]} className={`${editing ? "min-h-[42px]" : "min-h-[60px]"} resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0`} />
            </div>
          </div>)}
          </div>
          <p className="mt-2 text-xs text-ink-500">Dina egna svar sparas med lokalprogrammet. Du kan lämna övriga val öppna.</p>
        </div>
      </div>
      {!editing && <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-surface px-5 py-4">
        <Button variant="outline" disabled={busy} onClick={close}>Avbryt</Button>
        <div className="flex items-center gap-2">
          {step > 0 && <Button variant="outline" disabled={busy} onClick={() => { setError(""); setStep((value) => value - 1); }}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Föregående
          </Button>}
          {step < steps.length - 1 ? <Button disabled={busy} onClick={next}>
            Nästa steg
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button> : <Button disabled={busy} onClick={onSave}>{busy ? "Sparar…" : "Skapa lokalprogram"}</Button>}
        </div>
      </footer>}
      {editing && <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-surface px-5 py-4">
        <Button variant="outline" disabled={busy} onClick={close}>Avbryt</Button>
        <Button disabled={busy} onClick={onSave}>{busy ? "Sparar…" : "Spara ändringar"}</Button>
      </footer>}
    </>}
  </EditorWorkspace>;
}
