import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ListChecks, Pencil, Sparkles, XIcon } from "lucide-react";
import { cn } from "cn";
import EditorWorkspace from "../layout/EditorWorkspace";
import AssistantOrb from "./AssistantOrb";
import PublishStage from "./PublishStage";
import { StartOption } from "./PublishStart";
import { StepField, StepFields, UnitInput, checkOptionClass } from "./StepFields";
import { CheckBadgeIcon, ExternalLinkIcon } from "../icons/UiIcons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  accessOptions,
  amenityOptions,
  contractOptions,
  createBlankProgram,
  districtOptions,
  layoutOptions,
  listFromDelimitedValue,
  normalizeAmenity,
  parkingOptions,
  transitOptions,
  typeOptions
} from "../../lib/profileHelpers";
import { interpretProgramText, programSummaryRows } from "../../lib/localProgramAssistant";

// "Nytt lokalprogram" the way "Publicera annons" works: the orb asks one question at a time, or reads a description
// written in the person's own words and shows what it understood. Nothing is stored until the summary is confirmed.
// `onCreate(program)` stores the program and resolves to it (or to nothing when that failed).

const steps = [
  { id: "name", label: "Namn", question: "Vad vill du kalla lokalprogrammet?", helper: "Ett namn du känner igen, till exempel efter teamet eller kontoret.", orb: "composing" },
  { id: "place", label: "Plats", question: "Var vill ni sitta, och vilken typ av lokal söker ni?", helper: "Välj område och lokaltyp. Lämna öppet om ni är flexibla.", orb: "searching" },
  { id: "size", label: "Storlek", question: "Hur stor lokal behöver ni?", helper: "Ange hur många platser ni behöver och önskat ytspann.", orb: "shaping" },
  { id: "budget", label: "Budget", question: "Vad får lokalen kosta?", helper: "Ange högsta hyra per månad. Lägsta hyra är valfritt.", orb: "solving" },
  { id: "timing", label: "Tid", question: "När vill ni flytta in?", helper: "Välj inflyttningsdatum och hur långt avtal som passar.", orb: "working" },
  { id: "access", label: "Vardag", question: "Hur ska vardagen i lokalen fungera?", helper: "Kollektivtrafik, tillgång, parkering och planlösning. Lämna öppet det som inte spelar roll.", orb: "connecting" },
  { id: "requirements", label: "Krav", question: "Finns det särskilda krav?", helper: "Markera bara det som verkligen är ett krav.", orb: "solving" },
  { id: "amenities", label: "Önskemål", question: "Vad ska lokalen ha?", helper: "Välj de bekvämligheter som är viktigast för er.", orb: "weaving" },
  { id: "notes", label: "Övrigt", question: "Något mer vi bör veta?", helper: "Skriv fritt om sådant som inte passade in i övriga frågor. Valfritt.", orb: "composing" },
  { id: "review", label: "Granska", question: "Ser allt rätt ut?", helper: "Kontrollera sammanfattningen innan lokalprogrammet skapas.", orb: "working" }
];
const lastStep = steps.length - 1;

const readingMessages = ["Läser din beskrivning…", "Hittar område, storlek och budget…", "Sammanställer lokalprogrammet…"];
const readingOrbStates = ["searching", "weaving", "composing"];
const READING_STEP_MS = 750;

const examples = [
  { label: "Kontor för ett team", text: "Vi är 12 personer och söker kontor på Södermalm, 200–250 kvm, max 90 000 kr i månaden, inflyttning i januari, nära tunnelbana och med mötesrum och kök." },
  { label: "Butik i city", text: "Butikslokal i city runt 90 kvm, max 55 tkr i månaden, inom 5 minuters gångavstånd från tunnelbanan och med skyltfönster." },
  { label: "Flexibelt cowork", text: "Coworking på Kungsholmen för 6 personer, kort avtal, så snart som möjligt, öppet landskap och 24/7-tillgång." }
];

// Between questions the orb first acknowledges the answer, then works on it with an animation that fits the step.
const RECEIVED_MS = 380;
const PROCESSING_MS = 640;
const textEntrySelector = "input[type=text], input[type=number], input[type=date], input:not([type]), textarea";
const firstControlSelector = `${textEntrySelector}, input[type=checkbox], button:not([disabled]), [role=combobox], [role=checkbox]`;

function stepErrors(id, draft) {
  if (id === "name" && !String(draft.title || "").trim()) return ["Ge lokalprogrammet ett namn."];
  if (id === "size" && draft.minSize && draft.maxSize && Number(draft.minSize) > Number(draft.maxSize)) return ["Maxytan måste vara minst lika stor som minytan."];
  if (id === "budget" && draft.minBudget && draft.maxBudget && Number(draft.minBudget) > Number(draft.maxBudget)) return ["Högsta hyran måste vara minst lika hög som lägsta."];
  return [];
}

const anyOption = (option, label = "Spelar ingen roll") => (option === "Alla" ? label : option);

/** The pencil of a row of the summary: answer that question again. */
function EditRowButton({ row, onEdit }) {
  const name = `Ändra ${row.label.toLocaleLowerCase("sv-SE")}`;
  return (
    <Button type="button" variant="ghost" size="icon-xs" className="min-h-0 shrink-0 self-start text-ink-500" aria-label={name} title={name} onClick={() => onEdit(row.step)}>
      <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
    </Button>
  );
}
const list = (items) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} och ${items[items.length - 1]}`);

export default function LocalProgramFlow({ existingCount = 0, onCreate, onShowMatches, onClose }) {
  const [mode, setMode] = useState("choose"); // choose → describe → reading → questions → done
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState(() => ({ ...createBlankProgram(existingCount), title: "" }));
  const [initialSnapshot] = useState(() => JSON.stringify(draft));
  const [description, setDescription] = useState("");
  const [understood, setUnderstood] = useState(null);
  const [returnToReview, setReturnToReview] = useState(false);
  const [attempted, setAttempted] = useState({});
  const [feedback, setFeedback] = useState("");
  const [advancePhase, setAdvancePhase] = useState(null);
  const [readingPhase, setReadingPhase] = useState(0);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState(null);
  const [orbPulse, setOrbPulse] = useState(null);
  const stepRef = useRef(null);
  const headingRef = useRef(null);
  const timers = useRef([]);
  const pulseTimer = useRef(null);

  const current = steps[stepIndex];
  const advancing = advancePhase !== null;
  const reading = mode === "reading";
  const busy = pending || advancing || reading;
  const dirty = mode === "describe"
    ? description.trim().length > 0
    : mode === "reading" || (mode === "questions" && JSON.stringify(draft) !== initialSnapshot);
  const selectedAmenities = useMemo(() => listFromDelimitedValue(draft.amenities), [draft.amenities]);
  const summary = useMemo(() => programSummaryRows(draft), [draft]);

  const orbState = pending
    ? "connecting"
    : reading
      ? readingOrbStates[readingPhase] || "searching"
      : orbPulse
        ? orbPulse
        : advancePhase === "received"
          ? "listening"
          : advancePhase === "processing"
            ? current.orb
            : "breathing";
  const statusMessage = advancing ? "Tar emot ditt svar…" : reading ? readingMessages[readingPhase] : pending ? "Skapar lokalprogrammet…" : "";

  const currentErrors = attempted[current.id] ? stepErrors(current.id, draft) : [];
  const inlineError = feedback || currentErrors.join(" ");

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }

  useEffect(() => () => {
    clearTimers();
    window.clearTimeout(pulseTimer.current);
  }, []);

  // Each new screen takes focus: a text field when it leads the screen, otherwise the question itself so screen
  // readers announce it before the controls.
  useEffect(() => {
    if (mode === "done") return undefined;
    const timer = window.setTimeout(() => {
      if (stepRef.current?.contains(document.activeElement)) return;
      const first = stepRef.current?.querySelector(firstControlSelector);
      const target = first?.matches(textEntrySelector) ? first : headingRef.current;
      target?.focus({ preventScroll: true });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [mode, stepIndex]);

  function pulseOrb(state = "listening", duration = 900) {
    window.clearTimeout(pulseTimer.current);
    setOrbPulse(state);
    pulseTimer.current = window.setTimeout(() => setOrbPulse(null), duration);
  }

  function updateField(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAmenity(value) {
    setDraft((prev) => {
      const items = listFromDelimitedValue(prev.amenities);
      const has = items.some((item) => normalizeAmenity(item) === normalizeAmenity(value));
      return { ...prev, amenities: (has ? items.filter((item) => normalizeAmenity(item) !== normalizeAmenity(value)) : [...items, value]).join(", ") };
    });
  }

  function goToStep(index) {
    setFeedback("");
    setStepIndex(Math.max(0, Math.min(index, lastStep)));
  }

  function startQuestions() {
    pulseOrb();
    setMode("questions");
    goToStep(0);
  }

  function handleNext() {
    if (advancing || pending || stepIndex >= lastStep) return;
    if (stepErrors(current.id, draft).length > 0) {
      setAttempted((prev) => ({ ...prev, [current.id]: true }));
      return;
    }
    setFeedback("");
    const target = returnToReview ? lastStep : stepIndex + 1;
    const arrive = () => {
      goToStep(target);
      if (target === lastStep) setReturnToReview(false);
    };
    clearTimers();
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      arrive();
      return;
    }
    setAdvancePhase("received");
    timers.current = [
      window.setTimeout(() => setAdvancePhase("processing"), RECEIVED_MS),
      window.setTimeout(() => {
        arrive();
        setAdvancePhase(null);
      }, RECEIVED_MS + PROCESSING_MS)
    ];
  }

  function goBack() {
    if (returnToReview) {
      setReturnToReview(false);
      goToStep(lastStep);
    } else if (stepIndex > 0) {
      goToStep(stepIndex - 1);
    } else {
      setMode("choose");
    }
  }

  // "Ändra" in the summary: answer that question again, then come straight back.
  function editStep(stepId) {
    setReturnToReview(true);
    goToStep(steps.findIndex((step) => step.id === stepId));
  }

  // Enter in a text field answers the question, like the Nästa button.
  function handleFieldKeyDown(event) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    if (!event.target.matches?.("input[type=text], input[type=number], input[type=date], input:not([type])")) return;
    event.preventDefault();
    handleNext();
  }

  function finishReading(result) {
    if (result.found.length === 0) {
      setMode("describe");
      setFeedback("Jag hittade inga uppgifter att fylla i. Beskriv till exempel område, storlek, budget och inflyttning – eller svara på frågorna i stället.");
      return;
    }
    setDraft((prev) => ({
      ...prev,
      ...result.patch,
      title: result.patch.title || prev.title || `Lokalprogram ${existingCount + 1}`
    }));
    setUnderstood({ found: result.found, missing: result.missing });
    setReturnToReview(false);
    setStepIndex(lastStep);
    setMode("questions");
  }

  function startReading() {
    const text = description.trim();
    if (!text || reading) return;
    clearTimers();
    setFeedback("");
    setReadingPhase(0);
    const result = interpretProgramText(text);
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      finishReading(result);
      return;
    }
    setMode("reading");
    timers.current = [
      window.setTimeout(() => setReadingPhase(1), READING_STEP_MS),
      window.setTimeout(() => setReadingPhase(2), READING_STEP_MS * 2),
      window.setTimeout(() => finishReading(result), READING_STEP_MS * 3)
    ];
  }

  function cancelReading() {
    clearTimers();
    setMode("describe");
  }

  async function handleCreate() {
    if (pending) return;
    setPending(true);
    setFeedback("");
    try {
      const program = await onCreate?.({ ...draft, title: draft.title.trim() || `Lokalprogram ${existingCount + 1}` });
      if (program) {
        setCreated(program);
        setMode("done");
      } else {
        setFeedback("Kunde inte skapa lokalprogrammet. Försök igen.");
      }
    } catch (error) {
      setFeedback(error?.message || "Kunde inte skapa lokalprogrammet.");
    } finally {
      setPending(false);
    }
  }

  function resetFlow() {
    clearTimers();
    setDraft({ ...createBlankProgram(existingCount + 1), title: "" });
    setDescription("");
    setUnderstood(null);
    setReturnToReview(false);
    setAttempted({});
    setFeedback("");
    setCreated(null);
    setStepIndex(0);
    setMode("choose");
  }

  const phaseLabel = mode === "questions"
    ? (returnToReview ? "Ändrar en uppgift" : `Fråga ${stepIndex + 1} av ${steps.length}`)
    : { describe: "Beskriv", reading: "Läser in" }[mode] || null;
  const progressValue = mode === "questions" ? ((stepIndex + 1) / steps.length) * 100 : { choose: 0, describe: 12, reading: 25, done: 100 }[mode];
  const stageProps = { groupRef: stepRef, headingRef };

  return (
    <EditorWorkspace
      size="focus"
      title="Nytt lokalprogram"
      dirty={dirty}
      busy={busy}
      discardTitle="Avbryta lokalprogrammet?"
      discardDescription="Det du har fyllt i sparas inte om du stänger nu."
      discardLabel="Avbryt utan att spara"
      onClose={onClose}
    >
      {(close) => (
        <>
          <header className="shrink-0 bg-surface">
            <div className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="flex min-w-0 items-baseline gap-2.5">
                <p className="text-sm font-semibold text-ink-900">Nytt lokalprogram</p>
                {phaseLabel ? <p className="truncate text-xs font-semibold text-ink-500">{phaseLabel}</p> : null}
              </div>
              <Button type="button" variant="outline" size="icon" aria-label="Stäng nytt lokalprogram" disabled={busy} onClick={close}>
                <XIcon />
              </Button>
            </div>
            {mode !== "done" ? (
              <Progress
                value={progressValue}
                aria-label="Framsteg i lokalprogrammet"
                className="gap-0 [&_[data-slot=progress-track]]:h-0.5 [&_[data-slot=progress-track]]:rounded-none [&_[data-slot=progress-indicator]]:duration-500"
              />
            ) : (
              <div className="h-0.5 bg-border" />
            )}
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto bg-surface">
            {mode === "done" && created ? (
              <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-5 pb-8 pt-[clamp(1.25rem,6vh,3rem)] text-center">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <CheckBadgeIcon className="h-7 w-7" />
                </span>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight text-strong sm:text-3xl">Lokalprogrammet är skapat</h2>
                <p className="mt-3 max-w-md text-base leading-relaxed text-ink-600">”{created.title}” används nu för att hitta och rangordna lokaler åt er.</p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  {onShowMatches ? (
                    <Button type="button" className="h-auto px-4" onClick={() => onShowMatches(created)}>
                      Visa matchande lokaler
                      <ExternalLinkIcon className="ml-1.5 h-4 w-4" />
                    </Button>
                  ) : null}
                  <Button type="button" variant="secondary" className="h-auto px-4" onClick={close}>Klar</Button>
                  <Button type="button" variant="secondary" className="h-auto px-4" onClick={resetFlow}>Skapa ytterligare ett</Button>
                </div>
                <dl className="mt-10 grid w-full gap-x-10 text-left text-sm sm:grid-cols-2">
                  {programSummaryRows(created).filter((row) => row.value).map((row) =>
                    row.id === "notes" ? (
                      <div key={row.id} className="border-b border-veil/10 py-2.5 sm:col-span-2">
                        <dt className="text-ink-500">{row.label}</dt>
                        <dd className="mt-1 whitespace-pre-wrap break-words font-medium leading-relaxed text-ink-900">{row.value}</dd>
                      </div>
                    ) : (
                      <div key={row.id} className="flex items-baseline justify-between gap-4 border-b border-veil/10 py-2.5">
                        <dt className="shrink-0 text-ink-500">{row.label}</dt>
                        <dd className="min-w-0 break-words text-right font-medium text-ink-900">{row.value}</dd>
                      </div>
                    )
                  )}
                </dl>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-5 pb-8 pt-[clamp(1.25rem,6vh,3rem)] text-center">
                <AssistantOrb state={orbState} speed={busy ? 1.3 : 1} engaged={busy || Boolean(orbPulse)} />
                <p role="status" aria-live="polite" className="sr-only">{statusMessage}</p>

                {mode === "choose" ? (
                  <PublishStage key="choose" question="Hur vill du skapa lokalprogrammet?" helper="Svara på några frågor eller beskriv med egna ord vad ni letar efter." {...stageProps}>
                    <div className="mx-auto w-full max-w-xl space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <StartOption
                          icon={ListChecks}
                          title="Svara på frågor"
                          description="Vi guidar dig genom lokalprogrammet, en fråga i taget."
                          footnote="Tar ungefär två minuter"
                          onClick={startQuestions}
                        />
                        <StartOption
                          icon={Sparkles}
                          title="Beskriv med egna ord"
                          description="Skriv eller klistra in vad ni söker, så fyller vi i programmet åt dig."
                          footnote="Du granskar allt innan det skapas"
                          badge="AI"
                          onClick={() => {
                            pulseOrb();
                            setMode("describe");
                          }}
                        />
                      </div>
                      <p className="text-center text-xs text-ink-500">Du kan ändra allt i lokalprogrammet efteråt.</p>
                    </div>
                  </PublishStage>
                ) : null}

                {mode === "describe" ? (
                  <PublishStage
                    key="describe"
                    question="Vad letar ni efter?"
                    helper="Berätta fritt om lokalen: område, storlek, budget, inflyttning och önskemål. Ju mer du skriver, desto mer fyller vi i."
                    actions={(
                      <>
                        <Button type="button" variant="secondary" className="h-auto px-4" onClick={() => setMode("choose")}>
                          <ChevronLeft className="mr-1.5 h-4 w-4" />
                          Föregående
                        </Button>
                        <Button type="button" className="h-auto px-4" onClick={startReading} disabled={description.trim().length === 0}>
                          <Sparkles className="mr-1.5 h-4 w-4" />
                          Läs in beskrivningen
                        </Button>
                      </>
                    )}
                    {...stageProps}
                  >
                    <div className="mx-auto w-full max-w-xl space-y-4">
                      <label className="block">
                        <span className="sr-only">Beskriv lokalen ni söker</span>
                        <Textarea
                          className="min-h-40"
                          value={description}
                          onChange={(event) => {
                            setDescription(event.target.value);
                            setFeedback("");
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                              event.preventDefault();
                              startReading();
                            }
                          }}
                          placeholder="Ex. Vi är 12 personer och söker kontor på Södermalm, 200–250 kvm, max 90 000 kr i månaden, inflyttning i januari…"
                        />
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-ink-500">Prova ett exempel:</span>
                        {examples.map((example) => (
                          <Button key={example.label} type="button" variant="outline" size="sm" className="h-auto min-h-0 rounded-full px-3 py-1.5 text-xs font-semibold" onClick={() => setDescription(example.text)}>
                            {example.label}
                          </Button>
                        ))}
                      </div>
                      {feedback ? <p role="alert" className="text-sm font-medium text-rose-600">{feedback}</p> : null}
                    </div>
                  </PublishStage>
                ) : null}

                {mode === "reading" ? (
                  <PublishStage
                    key="reading"
                    question="Läser din beskrivning"
                    helper={readingMessages[readingPhase]}
                    actions={<Button type="button" variant="secondary" className="h-auto px-4" onClick={cancelReading}>Avbryt inläsning</Button>}
                    {...stageProps}
                  />
                ) : null}

                {mode === "questions" ? (
                  <PublishStage
                    key={`question-${current.id}`}
                    question={current.question}
                    helper={current.helper}
                    advancing={advancing}
                    onFieldsKeyDown={handleFieldKeyDown}
                    actions={(
                      <>
                        <Button type="button" variant="secondary" className="h-auto px-4" onClick={goBack} disabled={pending || advancing}>
                          <ChevronLeft className="mr-1.5 h-4 w-4" />
                          {returnToReview ? "Till sammanfattningen" : "Föregående"}
                        </Button>
                        {current.id !== "review" ? (
                          <Button type="button" className="h-auto px-4" onClick={handleNext} disabled={busy}>
                            {returnToReview ? "Klar" : "Nästa"}
                            <ChevronRight className="ml-1.5 h-4 w-4" />
                          </Button>
                        ) : (
                          <Button type="button" className="h-auto px-4" onClick={() => void handleCreate()} disabled={busy}>
                            {pending ? "Skapar..." : "Skapa lokalprogram"}
                          </Button>
                        )}
                      </>
                    )}
                    {...stageProps}
                  >
                    {current.id === "name" ? (
                      <StepFields>
                        <StepField label="Namn" required className="max-w-md">
                          <Input value={draft.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Ex. Stockholm huvudkontor" />
                        </StepField>
                      </StepFields>
                    ) : null}

                    {current.id === "place" ? (
                      <div className="mx-auto grid w-full max-w-[26rem] grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                        <StepField label="Område">
                          <Select value={draft.district || "Alla"} onValueChange={(value) => updateField("district", value)}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {districtOptions.map((option) => <SelectItem key={option} value={option}>{anyOption(option, "Alla områden")}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </StepField>
                        <StepField label="Typ av lokal">
                          <Select value={listFromDelimitedValue(draft.type)[0] || "Alla"} onValueChange={(value) => updateField("type", value === "Alla" ? [] : [value])}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Alla">Alla typer</SelectItem>
                              {typeOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </StepField>
                      </div>
                    ) : null}

                    {current.id === "size" ? (
                      <StepFields>
                        <StepField label="Platser" className="sm:w-36">
                          <Input type="number" min="0" inputMode="numeric" value={draft.teamSize} onChange={(event) => updateField("teamSize", event.target.value)} placeholder="12" />
                        </StepField>
                        <StepField label="Minsta yta" className="sm:w-40">
                          <UnitInput unit="kvm" type="number" min="0" value={draft.minSize} onChange={(event) => updateField("minSize", event.target.value)} placeholder="150" />
                        </StepField>
                        <StepField label="Största yta" className="sm:w-40">
                          <UnitInput unit="kvm" type="number" min="0" value={draft.maxSize} onChange={(event) => updateField("maxSize", event.target.value)} placeholder="250" />
                        </StepField>
                      </StepFields>
                    ) : null}

                    {current.id === "budget" ? (
                      <StepFields>
                        <StepField label="Högsta hyra" className="sm:w-48">
                          <UnitInput unit="kr/mån" type="number" min="0" value={draft.maxBudget} onChange={(event) => updateField("maxBudget", event.target.value)} placeholder="90000" />
                        </StepField>
                        <StepField label="Lägsta hyra" className="sm:w-48">
                          <UnitInput unit="kr/mån" type="number" min="0" value={draft.minBudget} onChange={(event) => updateField("minBudget", event.target.value)} placeholder="40000" />
                        </StepField>
                      </StepFields>
                    ) : null}

                    {current.id === "timing" ? (
                      <StepFields>
                        <StepField label="Inflyttning" className="sm:w-44">
                          <Input type="date" value={draft.moveInDate || ""} onChange={(event) => updateField("moveInDate", event.target.value)} />
                        </StepField>
                        <StepField label="Avtal" className="sm:w-56">
                          <Select value={draft.contractFlex || "Alla"} onValueChange={(value) => updateField("contractFlex", value === "Alla" ? "" : value)}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {contractOptions.map((option) => <SelectItem key={option} value={option}>{anyOption(option)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </StepField>
                      </StepFields>
                    ) : null}

                    {current.id === "access" ? (
                      <div className="mx-auto grid w-full max-w-[26rem] grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                        {[
                          { label: "Kollektivtrafik", field: "transitDistance", options: transitOptions },
                          { label: "Tillgång", field: "accessHours", options: accessOptions },
                          { label: "Parkering", field: "parkingType", options: parkingOptions },
                          { label: "Planlösning", field: "layoutType", options: layoutOptions }
                        ].map(({ label, field, options }) => (
                          <StepField key={field} label={label}>
                            <Select value={draft[field] || "Alla"} onValueChange={(value) => updateField(field, value === "Alla" ? "" : value)}>
                              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {options.map((option) => <SelectItem key={option} value={option}>{anyOption(option)}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </StepField>
                        ))}
                      </div>
                    ) : null}

                    {current.id === "requirements" ? (
                      <StepFields className="gap-2">
                        <label className={checkOptionClass}>
                          <Checkbox checked={Boolean(draft.includeOperatingCosts)} onCheckedChange={(checked) => updateField("includeOperatingCosts", Boolean(checked))} />
                          Driftkostnad ingår
                        </label>
                        <label className={checkOptionClass}>
                          <Checkbox checked={Boolean(draft.accessibilityAdapted)} onCheckedChange={(checked) => updateField("accessibilityAdapted", Boolean(checked))} />
                          Tillgänglighetsanpassad
                        </label>
                        <label className={checkOptionClass}>
                          <Checkbox checked={Boolean(draft.ecoCertified)} onCheckedChange={(checked) => updateField("ecoCertified", Boolean(checked))} />
                          Miljöcertifierad
                        </label>
                      </StepFields>
                    ) : null}

                    {current.id === "amenities" ? (
                      <div className="mx-auto flex w-full max-w-xl flex-wrap justify-center gap-2">
                        {amenityOptions.map((option) => {
                          const Icon = option.icon;
                          const active = selectedAmenities.some((item) => normalizeAmenity(item) === normalizeAmenity(option.value));
                          return (
                            <Button
                              key={option.value}
                              type="button"
                              variant="outline"
                              aria-pressed={active}
                              className={`h-auto rounded-xl px-3 py-2 text-xs font-semibold ${active ? "border-strong bg-strong text-on-strong hover:bg-strong/90" : "border-veil/10 text-ink-700"}`}
                              onClick={() => toggleAmenity(option.value)}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <Icon className="h-4 w-4 shrink-0" />
                                {option.label}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    ) : null}

                    {current.id === "notes" ? (
                      <StepFields>
                        <StepField label="Egna önskemål" className="max-w-lg">
                          <Textarea
                            className="min-h-36"
                            value={draft.contextNotes?.Övrigt || ""}
                            onChange={(event) => updateField("contextNotes", { ...draft.contextNotes, Övrigt: event.target.value })}
                            placeholder="Ex. Vi tar emot besökare, så entrén ska vara tydlig och tillgänglig."
                          />
                        </StepField>
                      </StepFields>
                    ) : null}

                    {current.id === "review" ? (
                      <div className="mx-auto w-full max-w-2xl space-y-6">
                        {understood ? (
                          <div className="rounded-xl border border-veil/10 bg-canvas p-4 text-left">
                            <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                              <Sparkles aria-hidden="true" className="h-4 w-4" />
                              Så här förstod jag din beskrivning
                              <Badge variant="secondary" className="h-auto px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">AI</Badge>
                            </p>
                            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                              Jag hittade {understood.found.length} {understood.found.length === 1 ? "uppgift" : "uppgifter"}
                              {understood.missing.length > 0 ? ` och inget om ${list(understood.missing)}` : ""}. Ändra det som inte stämmer, eller lägg till det som saknas.
                            </p>
                          </div>
                        ) : null}
                        <dl className="grid gap-x-10 text-sm sm:grid-cols-2">
                          {summary.map((row) =>
                            row.id === "notes" ? (
                              <div key={row.id} className="border-b border-veil/10 py-2.5 sm:col-span-2">
                                <dt className="text-ink-500">{row.label}</dt>
                                <dd className="mt-1 flex items-start justify-between gap-3">
                                  <span className={cn("min-w-0 whitespace-pre-wrap break-words leading-relaxed", row.value ? "font-medium text-ink-900" : "text-ink-400")}>{row.value || "Inte angivet"}</span>
                                  <EditRowButton row={row} onEdit={editStep} />
                                </dd>
                              </div>
                            ) : (
                              <div key={row.id} className="flex items-baseline justify-between gap-3 border-b border-veil/10 py-2.5">
                                <dt className="shrink-0 text-ink-500">{row.label}</dt>
                                <dd className="flex min-w-0 items-baseline justify-end gap-1.5">
                                  <span className={cn("min-w-0 text-right", row.value ? "break-words font-medium text-ink-900" : "text-ink-400")}>{row.value || "Inte angivet"}</span>
                                  <EditRowButton row={row} onEdit={editStep} />
                                </dd>
                              </div>
                            )
                          )}
                        </dl>
                      </div>
                    ) : null}

                    {inlineError ? <p role="alert" className="text-center text-sm font-medium text-rose-600">{inlineError}</p> : null}
                  </PublishStage>
                ) : null}
              </div>
            )}
          </div>

          {mode !== "done" ? (
            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-surface px-5 py-3">
              <Button type="button" variant="outline" className="h-auto px-4" onClick={close} disabled={busy}>Avbryt</Button>
              <span />
            </footer>
          ) : null}
        </>
      )}
    </EditorWorkspace>
  );
}
