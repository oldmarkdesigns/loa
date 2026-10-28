import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";
import AssistantOrb from "../app/AssistantOrb";
import PublishStage from "../app/PublishStage";
import { StepField, StepFields, UnitInput } from "../app/StepFields";
import { Button } from "@/components/ui/button";
import { calculateTotalOccupancyCost } from "../../lib/tocCalculator";
import { formatSek } from "../../lib/formatters";

// One question per step, in the order calculateTotalOccupancyCost expects its keys — same
// one-question-at-a-time shape as "Nytt lokalprogram" / "Publicera annons" (PublishStage +
// StepField, an orb that acknowledges then works between steps). See LocalProgramFlow.jsx.
const QUESTIONS = [
  { key: "baseRentPerYear", fieldLabel: "Bashyra", unit: "kr/år", question: "Vad blir bashyran per år?", helper: "Bashyran innan drift, skatt och andra tillägg.", placeholder: "450000", orb: "composing" },
  { key: "sizeSqm", fieldLabel: "Yta", unit: "kvm", question: "Hur många kvadratmeter gäller det?", helper: "Lokalens uthyrningsbara yta.", placeholder: "300", orb: "shaping" },
  { key: "operatingCostPerYear", fieldLabel: "Drift", unit: "kr/år", question: "Vad kostar driften per år?", helper: "Uppvärmning, el, vatten och liknande driftskostnader.", placeholder: "70000", orb: "working" },
  { key: "propertyTaxPerYear", fieldLabel: "Fastighetsskatt", unit: "kr/år", question: "Vad blir fastighetsskatten per år?", helper: "Skriv 0 om ni är osäkra — det går att ändra senare.", placeholder: "35000", orb: "solving" },
  { key: "oneTimeFitOutCost", fieldLabel: "Anpassning", unit: "kr", question: "Någon engångskostnad för anpassning av lokalen?", helper: "Skriv 0 om ingen anpassning behövs.", placeholder: "250000", orb: "weaving" },
  { key: "depositAmount", fieldLabel: "Deposition", unit: "kr", question: "Hur stor är depositionen?", helper: "Skriv 0 om ingen deposition krävs.", placeholder: "150000", orb: "connecting" },
  { key: "termYears", fieldLabel: "Avtalslängd", unit: "år", question: "Sist: hur många år är avtalet?", helper: "Avtalets längd i hela år.", placeholder: "5", orb: "searching" }
];
const lastStep = QUESTIONS.length - 1;

// The preview rows shown (blank until answered) in the result card while the wizard is still
// running — the cost breakdown only, not sizeSqm/depositAmount/termYears which feed the total
// rather than being a line of it themselves.
const PREVIEW_FIELDS = [
  { key: "baseRentPerYear", label: "Bashyra", perYear: true },
  { key: "operatingCostPerYear", label: "Drift", perYear: true },
  { key: "propertyTaxPerYear", label: "Fastighetsskatt", perYear: true },
  { key: "oneTimeFitOutCost", label: "Anpassning (engångs)", perYear: false }
];

// Same choreography and timings as LocalProgramFlow/PublishPage: the orb first acknowledges the
// answer ("listening"), then works on it with an animation that fits the question, before the
// next question fades in.
const RECEIVED_MS = 380;
const PROCESSING_MS = 640;
const textEntrySelector = "input[type=text], input[type=number], input:not([type])";

function parseNumberAnswer(text) {
  const digits = String(text || "").replace(/[^\d]/g, "");
  if (!digits) return null;
  return Number(digits);
}

function PreviewResultCard({ answers }) {
  return (
    <article className="rounded-3xl bg-[#080d18] p-6 text-white sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Total Occupancy Cost</p>
      <dl className="mt-5 space-y-3">
        {PREVIEW_FIELDS.map((field) => {
          const value = answers[field.key];
          return (
            <div key={field.key} className="flex items-center justify-between gap-3 text-sm">
              <dt className="text-white/75">{field.label}</dt>
              <dd className={cn("font-medium", value === undefined && "text-white/25")}>
                {value === undefined ? "—" : `${formatSek(value)}${field.perYear ? "/år" : ""}`}
              </dd>
            </div>
          );
        })}
      </dl>
      <div className="mt-5 border-t border-white/15 pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-white/75">Totalt över avtalstiden</p>
          <p className="text-2xl font-semibold text-white/25">—</p>
        </div>
      </div>
    </article>
  );
}

/**
 * A fristående (standalone) TOC calculator: no listing, no login, nothing from the platform's
 * own data. Guides the visitor through one question at a time using the exact same pattern as
 * "Nytt lokalprogram" / "Publicera annons" (PublishStage, StepField/UnitInput, an orb that
 * acknowledges then works between steps), with the result card visible from the start — blank
 * until answered, filling in row by row, then a short calculating beat before the total.
 * Rule-based throughout, like every other assistant in this app — no model call, just addition.
 */
function TocCalculatorSection() {
  const [mode, setMode] = useState("questions"); // questions | calculating | done
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [fieldValue, setFieldValue] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [advancePhase, setAdvancePhase] = useState(null); // null | received | processing
  const [calcOrbState, setCalcOrbState] = useState("solving");
  const [calcLabel, setCalcLabel] = useState("Analyserar underlaget…");
  const [result, setResult] = useState(null);
  const timers = useRef([]);
  const stepRef = useRef(null);
  const headingRef = useRef(null);

  const current = QUESTIONS[stepIndex];
  const advancing = advancePhase !== null;

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  // Each new question takes focus: the field if it leads the screen, otherwise the question
  // itself, exactly like LocalProgramFlow's own step transitions.
  useEffect(() => {
    if (mode !== "questions") return undefined;
    const timer = window.setTimeout(() => {
      if (stepRef.current?.contains(document.activeElement)) return;
      const first = stepRef.current?.querySelector(textEntrySelector);
      (first || headingRef.current)?.focus({ preventScroll: true });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [mode, stepIndex]);

  useEffect(() => {
    setFieldValue(answers[current?.key] !== undefined ? String(answers[current.key]) : "");
    setFieldError("");
  }, [stepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }

  function runCalculation(finalAnswers) {
    setMode("calculating");
    setCalcOrbState("solving");
    setCalcLabel("Analyserar underlaget…");
    timers.current.push(window.setTimeout(() => {
      setCalcOrbState("searching");
      setCalcLabel("Räknar ihop totalkostnaden…");
    }, 700));
    timers.current.push(window.setTimeout(() => {
      setResult(calculateTotalOccupancyCost(finalAnswers));
      setMode("done");
    }, 1500));
  }

  function handleNext() {
    if (advancing) return;
    const parsed = parseNumberAnswer(fieldValue);
    if (parsed === null) {
      setFieldError("Ange gärna bara siffran, t.ex. 450000.");
      return;
    }
    setFieldError("");
    const nextAnswers = { ...answers, [current.key]: parsed };
    setAnswers(nextAnswers);
    const isLast = stepIndex === lastStep;

    const arrive = () => {
      setAdvancePhase(null);
      if (isLast) runCalculation(nextAnswers);
      else setStepIndex((index) => index + 1);
    };

    clearTimers();
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      arrive();
      return;
    }
    setAdvancePhase("received");
    timers.current = [
      window.setTimeout(() => setAdvancePhase("processing"), RECEIVED_MS),
      window.setTimeout(arrive, RECEIVED_MS + PROCESSING_MS)
    ];
  }

  function goBack() {
    if (advancing || stepIndex === 0) return;
    setStepIndex((index) => index - 1);
  }

  function handleFieldKeyDown(event) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    if (!event.target.matches?.(textEntrySelector)) return;
    event.preventDefault();
    handleNext();
  }

  function resetFlow() {
    clearTimers();
    setAnswers({});
    setFieldValue("");
    setFieldError("");
    setStepIndex(0);
    setAdvancePhase(null);
    setResult(null);
    setMode("questions");
  }

  const orbState = mode === "calculating"
    ? calcOrbState
    : advancePhase === "received"
      ? "listening"
      : advancePhase === "processing"
        ? current.orb
        : "breathing";

  return (
    <section id="toc-kalkylator" className="relative scroll-mt-28 px-6 py-20 sm:px-14 sm:py-24 lg:px-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">TOC-kalkylator</p>
        <h2 className="font-display-serif mt-4 text-4xl font-semibold leading-[0.95] text-[#0b0a0e] sm:text-5xl">
          Vad kostar er lokal egentligen?
        </h2>
        <p className="mt-4 text-base text-ink-600">
          Bashyran är sällan hela sanningen. Svara på några snabba frågor så räknar vi ut totalkostnaden över hela
          avtalstiden — inte bara kr/kvm i annonsen.
        </p>
      </div>

      {mode === "done" ? (
        <div className="mx-auto mt-12 max-w-xl">
          <article className="rounded-3xl bg-[#080d18] p-6 text-white sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Total Occupancy Cost</p>

            <dl className="mt-5 space-y-3">
              {result.breakdown.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-white/75">{row.label}</dt>
                  <dd className="font-medium">
                    {formatSek(row.total)}
                    {row.perYear !== null ? <span className="ml-1.5 text-white/50">({formatSek(row.perYear)}/år)</span> : null}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 border-t border-white/15 pt-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm text-white/75">Totalt över {result.termYears} år</p>
                <p className="text-2xl font-semibold">{formatSek(result.totalTermCost)}</p>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-sm text-white/60">
                <span>Snitt per år</span>
                <span>{formatSek(result.averageAnnualCost)}</span>
              </div>
              {result.costPerSqmPerYear !== null ? (
                <div className="mt-1 flex items-center justify-between gap-3 text-sm text-white/60">
                  <span>Per kvm och år</span>
                  <span>{formatSek(result.costPerSqmPerYear)}</span>
                </div>
              ) : null}
            </div>

            <p className="mt-5 text-xs leading-relaxed text-white/50">
              Deposition ({formatSek(result.deposit)}) räknas inte in ovan — det är en återbetalningsbar säkerhet, inte en
              kostnad. Indexuppräkning och eventuell break-option är inte medräknade i den här enkla versionen.
            </p>

            <Button
              type="button"
              variant="ghost"
              className="mt-5 h-auto min-h-0 px-0 py-0 text-xs font-medium text-white/60 hover:bg-transparent hover:text-white"
              onClick={resetFlow}
            >
              Börja om
            </Button>
          </article>
        </div>
      ) : (
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-2">
          <article className="flex flex-col items-center rounded-3xl border border-black/10 bg-[#ffffff] p-6 text-center sm:p-7">
            <AssistantOrb state={orbState} speed={advancing ? 1.3 : 1} engaged={advancing || mode === "calculating"} size={56} />

            {mode === "calculating" ? (
              <p className="mt-6 text-sm font-medium text-ink-700" aria-live="polite">{calcLabel}</p>
            ) : (
              <PublishStage
                key={current.key}
                question={current.question}
                helper={current.helper}
                groupRef={stepRef}
                headingRef={headingRef}
                onFieldsKeyDown={handleFieldKeyDown}
                advancing={advancing}
                actions={(
                  <>
                    <Button type="button" variant="secondary" className="h-auto px-4" onClick={goBack} disabled={advancing || stepIndex === 0}>
                      <ChevronLeft className="mr-1.5 h-4 w-4" />
                      Föregående
                    </Button>
                    <Button type="button" className="h-auto px-4" onClick={handleNext} disabled={advancing}>
                      {stepIndex === lastStep ? "Kalkylera" : "Nästa"}
                      <ChevronRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </>
                )}
              >
                <StepFields className="mx-auto max-w-xs">
                  <StepField label={current.fieldLabel}>
                    <UnitInput
                      unit={current.unit}
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={fieldValue}
                      onChange={(event) => setFieldValue(event.target.value)}
                      placeholder={current.placeholder}
                      disabled={advancing}
                    />
                  </StepField>
                </StepFields>
                {fieldError ? <p role="alert" className="text-center text-sm font-medium text-rose-600">{fieldError}</p> : null}
              </PublishStage>
            )}
          </article>

          <PreviewResultCard answers={answers} />
        </div>
      )}
    </section>
  );
}

export default TocCalculatorSection;
