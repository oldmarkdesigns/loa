import { useEffect, useMemo, useRef, useState } from "react";
import { FilterIcon, ResetIcon, SaveIcon, SparklesIcon } from "../icons/UiIcons";
import FurnishingToggle from "./FurnishingToggle";

const questionOrder = ["core", "type", "size", "budget", "moveAndContract", "compliance", "amenities"];
const stepLabels = {
  core: "Grundinställningar",
  type: "Typ",
  size: "Yta",
  budget: "Budget",
  moveAndContract: "Inflytt & avtal",
  compliance: "Krav",
  amenities: "Bekvämligheter"
};
const furnishedOptions = [
  { value: "all", label: "Alla" },
  { value: "yes", label: "Möblerad" },
  { value: "no", label: "Omöblerad" }
];
const summaryChipBaseClass = "inline-flex items-center gap-1.5 rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold leading-none text-ink-700";

const sqmPerPersonByType = {
  Kontor: 12,
  Coworking: 8,
  Studio: 14,
  Butik: 18,
  Klinik: 22,
  Lager: 25,
  Restaurang: 20
};

function roundToNearestFive(value) {
  return Math.max(0, Math.round(value / 5) * 5);
}

function buildRecommendedSizeRange(type, teamSize) {
  const people = Number(teamSize || 0);
  if (!Number.isFinite(people) || people <= 0) return null;
  const sqmPerPerson = sqmPerPersonByType[type] || 12;
  const base = people * sqmPerPerson;
  const min = roundToNearestFive(base * 0.9);
  const max = roundToNearestFive(base * 1.15);
  return {
    min,
    max,
    sqmPerPerson
  };
}

function normalizeTypeValue(value) {
  if (!value || value === "Alla" || value === "Alla typer") return [];
  return [value];
}

function parseAmenityTerms(value) {
  return String(value || "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

function hasExplicitBudgetSelection(minBudget, maxBudget) {
  const minValue = String(minBudget || "").trim();
  const maxValue = String(maxBudget || "").trim();
  return minValue !== "" || maxValue !== "";
}

function buildAnswersFromInitialState(initialFilters = {}, initialAmenityQuery = "", initialFurnishedFilter = "all") {
  return {
    district: initialFilters?.district && initialFilters.district !== "Alla" ? initialFilters.district : "Alla områden",
    type: Array.isArray(initialFilters?.type) && initialFilters.type.length > 0 ? initialFilters.type[0] : "Alla typer",
    teamSize: initialFilters?.teamSize ? String(initialFilters.teamSize) : "",
    minSize: initialFilters?.minSize ? String(initialFilters.minSize) : "",
    maxSize: initialFilters?.maxSize ? String(initialFilters.maxSize) : "",
    minBudget: initialFilters?.minBudget ? String(initialFilters.minBudget) : "",
    maxBudget: hasExplicitBudgetSelection(initialFilters?.minBudget, initialFilters?.maxBudget) ? String(initialFilters?.maxBudget) : "",
    moveInDate: initialFilters?.moveInDate || "",
    contractFlex: initialFilters?.contractFlex || "Alla",
    transitDistance: initialFilters?.transitDistance || "Alla",
    accessHours: initialFilters?.accessHours || "Alla",
    parkingType: initialFilters?.parkingType || "Alla",
    layoutType: initialFilters?.layoutType || "Alla",
    advertiser: initialFilters?.advertiser || "Alla",
    includeOperatingCosts: Boolean(initialFilters?.includeOperatingCosts),
    accessibilityAdapted: Boolean(initialFilters?.accessibilityAdapted),
    ecoCertified: Boolean(initialFilters?.ecoCertified),
    furnishedFilter: initialFurnishedFilter === "yes" || initialFurnishedFilter === "no" ? initialFurnishedFilter : "all",
    amenities: parseAmenityTerms(initialAmenityQuery),
    extra: String(initialFilters?.query || "").trim()
  };
}

function composePrompt(answers) {
  const parts = [];
  if (answers.district && answers.district !== "Alla områden") parts.push(`Område: ${answers.district}`);
  if (answers.type && answers.type !== "Alla typer") parts.push(`Typ: ${answers.type}`);
  if (answers.teamSize) parts.push(`Team: minst ${answers.teamSize} platser`);
  if (answers.minSize || answers.maxSize) parts.push(`Yta: ${answers.minSize || 0}-${answers.maxSize || "∞"} kvm`);
  if (hasExplicitBudgetSelection(answers.minBudget, answers.maxBudget)) parts.push(`Budget: ${answers.minBudget || 0}-${answers.maxBudget || "∞"} kr/mån`);
  if (answers.moveInDate) parts.push(`Inflyttning: ${answers.moveInDate}`);
  if (answers.contractFlex && answers.contractFlex !== "Alla") parts.push(`Avtalsflex: ${answers.contractFlex}`);
  if (answers.furnishedFilter === "yes") parts.push("Möblering: Möblerad");
  if (answers.furnishedFilter === "no") parts.push("Möblering: Omöblerad");
  if (answers.layoutType && answers.layoutType !== "Alla") parts.push(`Planlösning: ${answers.layoutType}`);
  if (answers.transitDistance && answers.transitDistance !== "Alla") parts.push(`Kommunaltrafik: ${answers.transitDistance}`);
  if (answers.parkingType && answers.parkingType !== "Alla") parts.push(`Parkering: ${answers.parkingType}`);
  if (answers.advertiser && answers.advertiser !== "Alla") parts.push(`Annonsör: ${answers.advertiser}`);
  if (answers.includeOperatingCosts) parts.push("Driftkostnader ingår");
  if (answers.accessibilityAdapted) parts.push("Tillgänglighetsanpassad");
  if (answers.ecoCertified) parts.push("Miljöcertifierad");
  if (answers.amenities.length > 0) parts.push(`Bekvämligheter: ${answers.amenities.join(", ")}`);
  if (answers.extra?.trim()) parts.push(`Övrigt: ${answers.extra.trim()}`);
  if (parts.length === 0) return "";
  return parts.join(". ");
}

function buildNextFilters(baseFilters, answers) {
  return {
    ...baseFilters,
    district: answers.district === "Alla områden" ? "Alla" : answers.district,
    type: normalizeTypeValue(answers.type),
    teamSize: answers.teamSize || "",
    minSize: answers.minSize || "",
    maxSize: answers.maxSize || "",
    minBudget: answers.minBudget || "",
    maxBudget: answers.maxBudget ? Number(answers.maxBudget) : "",
    moveInDate: answers.moveInDate || "",
    contractFlex: answers.contractFlex === "Alla" ? "" : answers.contractFlex,
    transitDistance: answers.transitDistance === "Alla" ? "" : answers.transitDistance,
    accessHours: answers.accessHours === "Alla" ? "" : answers.accessHours,
    parkingType: answers.parkingType === "Alla" ? "" : answers.parkingType,
    layoutType: answers.layoutType === "Alla" ? "" : answers.layoutType,
    advertiser: answers.advertiser || "Alla",
    includeOperatingCosts: Boolean(answers.includeOperatingCosts),
    accessibilityAdapted: Boolean(answers.accessibilityAdapted),
    ecoCertified: Boolean(answers.ecoCertified),
    query: answers.extra?.trim() || baseFilters.query || ""
  };
}

function questionCopy(questionId) {
  if (questionId === "core") return "Låt oss börja med grundinställningarna för din sökning.";
  if (questionId === "type") return "Vilken typ av lokal söker ni, och har ni en önskad annonsör?";
  if (questionId === "amenities") return "Har du behov av några särskilda bekvämligheter?";
  if (questionId === "budget") return "Vilken budgetram ska jag utgå från?";
  if (questionId === "size") return "Vilken yta (kvm) söker ni ungefär?";
  if (questionId === "moveAndContract") return "När vill ni flytta in och hur flexibel ska avtalsperioden vara?";
  if (questionId === "compliance") return "Behöver lokalen uppfylla några särskilda krav?";
  return "Något mer jag ska ta hänsyn till innan jag söker?";
}

function hasAnswerForQuestion(questionId, answers) {
  if (questionId === "core") {
    return Boolean(
      String(answers.teamSize || "").trim() ||
      (answers.district && answers.district !== "Alla områden") ||
      answers.furnishedFilter !== "all"
    );
  }
  if (questionId === "type") {
    return Boolean(
      (answers.type && answers.type !== "Alla typer") ||
      (answers.layoutType && answers.layoutType !== "Alla") ||
      (answers.advertiser && answers.advertiser !== "Alla")
    );
  }
  if (questionId === "size") {
    return Boolean(String(answers.minSize || "").trim() || String(answers.maxSize || "").trim());
  }
  if (questionId === "budget") {
    return hasExplicitBudgetSelection(answers.minBudget, answers.maxBudget);
  }
  if (questionId === "moveAndContract") {
    return Boolean(String(answers.moveInDate || "").trim() || (answers.contractFlex && answers.contractFlex !== "Alla"));
  }
  if (questionId === "compliance") {
    return Boolean(answers.includeOperatingCosts || answers.accessibilityAdapted || answers.ecoCertified);
  }
  if (questionId === "amenities") {
    return Boolean(
      (Array.isArray(answers.amenities) && answers.amenities.length > 0) ||
      (answers.transitDistance && answers.transitDistance !== "Alla") ||
      (answers.parkingType && answers.parkingType !== "Alla")
    );
  }
  if (questionId === "extra") {
    return Boolean(String(answers.extra || "").trim());
  }
  return false;
}

function buildSearchSummaryGroups(answers) {
  const groups = [];

  const coreParts = [];
  if (answers.teamSize) coreParts.push(`${answers.teamSize} st`);
  if (answers.district && answers.district !== "Alla områden") coreParts.push(answers.district);
  if (answers.furnishedFilter === "yes") coreParts.push("Möblerad");
  if (answers.furnishedFilter === "no") coreParts.push("Omöblerad");
  if (coreParts.length > 0) groups.push({ id: "core", label: stepLabels.core, summary: coreParts.join(", ") });
  const typeParts = [];
  if (answers.type && answers.type !== "Alla typer") typeParts.push(answers.type);
  if (answers.layoutType && answers.layoutType !== "Alla") typeParts.push(`Plan: ${answers.layoutType}`);
  if (answers.advertiser && answers.advertiser !== "Alla") typeParts.push(`Annonsör: ${answers.advertiser}`);
  if (typeParts.length > 0) {
    groups.push({ id: "type", label: stepLabels.type, summary: typeParts.join(", ") });
  }

  if (answers.minSize || answers.maxSize) {
    groups.push({ id: "size", label: stepLabels.size, summary: `${answers.minSize || 0}-${answers.maxSize || "∞"} kvm` });
  }
  if (hasExplicitBudgetSelection(answers.minBudget, answers.maxBudget)) {
    groups.push({ id: "budget", label: stepLabels.budget, summary: `${answers.minBudget || 0}-${answers.maxBudget || "∞"} kr/mån` });
  }

  const moveAndContractParts = [];
  if (answers.moveInDate) moveAndContractParts.push(`Inflytt ${answers.moveInDate}`);
  if (answers.contractFlex && answers.contractFlex !== "Alla") moveAndContractParts.push(answers.contractFlex);
  if (moveAndContractParts.length > 0) groups.push({ id: "moveAndContract", label: stepLabels.moveAndContract, summary: moveAndContractParts.join(", ") });

  const complianceParts = [];
  if (answers.includeOperatingCosts) complianceParts.push("Driftkostnad");
  if (answers.accessibilityAdapted) complianceParts.push("Tillgänglighetsanp.");
  if (answers.ecoCertified) complianceParts.push("Miljöcert.");
  if (complianceParts.length > 0) groups.push({ id: "compliance", label: stepLabels.compliance, summary: complianceParts.join(", ") });

  const amenitiesParts = [];
  if (answers.transitDistance && answers.transitDistance !== "Alla") amenitiesParts.push(`Kommunaltrafik: ${answers.transitDistance}`);
  if (answers.parkingType && answers.parkingType !== "Alla") amenitiesParts.push(`Parkering: ${answers.parkingType}`);
  if (answers.amenities.length > 0) amenitiesParts.push(...answers.amenities);
  if (amenitiesParts.length > 0) {
    groups.push({ id: "amenities", label: stepLabels.amenities, summary: amenitiesParts.join(", ") });
  }

  return groups;
}

function resolveInitialStep(answers) {
  const nextUnanswered = questionOrder.find((stepId) => !hasAnswerForQuestion(stepId, answers));
  return nextUnanswered || questionOrder[0];
}

function AiGuidedAssistant({
  initialFilters,
  districtOptions = [],
  listingTypes = [],
  amenityOptions = [],
  transitDistanceOptions = [],
  contractFlexOptions = [],
  accessHoursOptions = [],
  parkingTypeOptions = [],
  layoutTypeOptions = [],
  advertiserOptions = [],
  onPreviewFilters,
  onSubmitSearch,
  onOpenInfo,
  submitLabel = "Sök med AI",
  showHeader = true,
  initialAmenityQuery = "",
  initialFurnishedFilter = "all",
  onResetSearch,
  onSaveSearch,
  onOpenEditSearch,
  onShowMatches,
  resultCount,
  defaultResultCount,
  suggestionChipLabel = "",
  requestedStepRequest = null,
  showModeSwitch = false,
  filterModeActive = false,
  onToggleFilterMode
}) {
  const [pending, setPending] = useState(false);
  const [matchCount, setMatchCount] = useState(null);
  const [showCoreNextHint, setShowCoreNextHint] = useState(false);
  const [skippedSteps, setSkippedSteps] = useState([]);
  const [answers, setAnswers] = useState(() => buildAnswersFromInitialState(initialFilters, initialAmenityQuery, initialFurnishedFilter));
  const [activeStep, setActiveStep] = useState(() => resolveInitialStep({
    ...buildAnswersFromInitialState(initialFilters, initialAmenityQuery, initialFurnishedFilter)
  }));
  const lastPreviewSignatureRef = useRef("");
  const activeQuestion = activeStep;

  const prompt = useMemo(() => composePrompt(answers), [answers]);
  const amenityQuery = useMemo(() => answers.amenities.join(", "), [answers.amenities]);
  const filterPayload = useMemo(() => buildNextFilters(initialFilters, answers), [initialFilters, answers]);
  const inputWithUnitClass = "flex w-full items-center rounded-2xl border border-black/10 bg-transparent px-3";
  const currentQuestionHasInput = useMemo(
    () => hasAnswerForQuestion(activeQuestion, answers),
    [activeQuestion, answers]
  );
  const hasValidTeamSize = useMemo(() => {
    const parsed = Number(String(answers.teamSize || "").trim());
    return Number.isFinite(parsed) && parsed > 0;
  }, [answers.teamSize]);
  const recommendedSizeRange = useMemo(
    () => buildRecommendedSizeRange(answers.type, answers.teamSize),
    [answers.type, answers.teamSize]
  );
  const hasAnyInput = useMemo(
    () => questionOrder.some((stepId) => hasAnswerForQuestion(stepId, answers)),
    [answers]
  );
  const summaryGroups = useMemo(() => {
    const groupsById = new Map(buildSearchSummaryGroups(answers).map((group) => [group.id, group]));
    skippedSteps.forEach((stepId) => {
      if (!stepLabels[stepId]) return;
      if (hasAnswerForQuestion(stepId, answers)) return;
      groupsById.set(stepId, { id: stepId, label: stepLabels[stepId], summary: "Inga preferenser" });
    });
    return questionOrder
      .filter((stepId) => groupsById.has(stepId))
      .map((stepId) => groupsById.get(stepId));
  }, [answers, skippedSteps]);
  const hasSummaryGroups = summaryGroups.length > 0;
  const canAdvanceCurrentStep = useMemo(() => {
    if (activeQuestion === "core") return hasValidTeamSize;
    return activeQuestion === "amenities" || currentQuestionHasInput;
  }, [activeQuestion, hasValidTeamSize, currentQuestionHasInput]);
  const isCoreNextDisabled = activeQuestion === "core" && !hasValidTeamSize;
  const totalSteps = questionOrder.length;
  const currentStepNumber = useMemo(() => {
    if (!activeQuestion) return totalSteps;
    const idx = questionOrder.indexOf(activeQuestion);
    if (idx === -1) return 1;
    return idx + 1;
  }, [activeQuestion, totalSteps]);
  const effectiveMatchCount = useMemo(() => {
    if (!hasAnyInput) {
      if (Number.isFinite(defaultResultCount)) return defaultResultCount;
      if (Number.isFinite(resultCount)) return resultCount;
      if (Number.isFinite(matchCount)) return matchCount;
      return 0;
    }
    if (Number.isFinite(resultCount)) return resultCount;
    if (Number.isFinite(matchCount)) return matchCount;
    return 0;
  }, [hasAnyInput, defaultResultCount, resultCount, matchCount]);

  useEffect(() => {
    const signature = JSON.stringify({
      filters: filterPayload,
      amenityQuery,
      furnishedFilter: answers.furnishedFilter,
      prompt
    });
    if (signature === lastPreviewSignatureRef.current) return;
    lastPreviewSignatureRef.current = signature;
    let cancelled = false;

    async function runPreview() {
      setPending(true);
      try {
        const count = await onPreviewFilters?.(filterPayload, {
          amenityQuery,
          furnishedFilter: answers.furnishedFilter,
          prompt
        });
        if (!cancelled && Number.isFinite(count)) {
          setMatchCount(count);
        }
      } catch {
        // no-op
      } finally {
        if (!cancelled) setPending(false);
      }
    }

    const timer = window.setTimeout(runPreview, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [filterPayload, amenityQuery, answers.furnishedFilter, prompt, onPreviewFilters]);

  useEffect(() => {
    if (!showCoreNextHint) return undefined;
    const timer = window.setTimeout(() => setShowCoreNextHint(false), 2200);
    return () => window.clearTimeout(timer);
  }, [showCoreNextHint]);

  useEffect(() => {
    setSkippedSteps((prev) => prev.filter((stepId) => !hasAnswerForQuestion(stepId, answers)));
  }, [answers]);

  useEffect(() => {
    if (!requestedStepRequest?.stepId) return;
    if (!questionOrder.includes(requestedStepRequest.stepId)) return;
    setActiveStep(requestedStepRequest.stepId);
  }, [requestedStepRequest]);

  function nextQuestion() {
    if (!activeQuestion) {
      void submitGuidedSearch();
      return;
    }
    const currentIndex = questionOrder.indexOf(activeQuestion);
    if (currentIndex === -1 || currentIndex >= questionOrder.length - 1) {
      setActiveStep(null);
      return;
    }
    setActiveStep(questionOrder[currentIndex + 1]);
  }

  function previousQuestion() {
    if (!activeQuestion) return;
    const currentIndex = questionOrder.indexOf(activeQuestion);
    if (currentIndex <= 0) return;
    setActiveStep(questionOrder[currentIndex - 1]);
  }

  async function submitGuidedSearch() {
    await onSubmitSearch?.({
      filters: filterPayload,
      amenityQuery,
      furnishedFilter: answers.furnishedFilter,
      prompt
    });
  }

  function clearGroupSelection(groupId) {
    setSkippedSteps((prev) => prev.filter((stepId) => stepId !== groupId));
    setAnswers((prev) => {
      if (groupId === "core") {
        return { ...prev, teamSize: "", district: "Alla områden", type: "Alla typer" };
      }
      if (groupId === "size") {
        return { ...prev, minSize: "", maxSize: "" };
      }
      if (groupId === "budget") {
        return { ...prev, minBudget: "", maxBudget: "" };
      }
      if (groupId === "moveAndContract") {
        return { ...prev, moveInDate: "", contractFlex: "Alla" };
      }
      if (groupId === "compliance") {
        return { ...prev, includeOperatingCosts: false, accessibilityAdapted: false, ecoCertified: false };
      }
      if (groupId === "amenities") {
        return { ...prev, amenities: [], transitDistance: "Alla", parkingType: "Alla" };
      }
      return prev;
    });
    setActiveStep(groupId);
  }

  function applyRelaxArea() {
    setAnswers((prev) => ({ ...prev, district: "Alla områden" }));
    setActiveStep("core");
  }

  function applyRelaxAmenities() {
    setAnswers((prev) => ({ ...prev, amenities: [], transitDistance: "Alla", parkingType: "Alla" }));
    setActiveStep("amenities");
  }

  function applyRaiseBudget() {
    setAnswers((prev) => {
      const currentMax = Number(prev.maxBudget || 0);
      const baseline = currentMax > 0 ? currentMax : 100000;
      return { ...prev, maxBudget: String(Math.round(baseline * 1.25)) };
    });
    setActiveStep("budget");
  }

  function openDatePicker(event) {
    const input = event.currentTarget;
    if (typeof input?.showPicker === "function") {
      try {
        input.showPicker();
      } catch {
        // Ignore browsers that block programmatic picker open in some contexts.
      }
    }
  }

  function renderInput(questionId) {
    if (questionId === "amenities") {
      return (
        <div className="w-full min-w-0 max-w-[46rem] space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block min-w-0">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Kommunaltrafik</span>
              <select
                className="select-chevron w-full rounded-2xl border border-black/10 bg-transparent px-3 py-3 pr-10 text-sm text-ink-900 focus:border-[#0f1930] focus:outline-none"
                value={answers.transitDistance}
                onChange={(event) => setAnswers((prev) => ({ ...prev, transitDistance: event.target.value }))}
              >
                {(transitDistanceOptions.length > 0 ? transitDistanceOptions : ["Alla"]).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="block min-w-0">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Parkering</span>
              <select
                className="select-chevron w-full rounded-2xl border border-black/10 bg-transparent px-3 py-3 pr-10 text-sm text-ink-900 focus:border-[#0f1930] focus:outline-none"
                value={answers.parkingType}
                onChange={(event) => setAnswers((prev) => ({ ...prev, parkingType: event.target.value }))}
              >
                {(parkingTypeOptions.length > 0 ? parkingTypeOptions : ["Alla"]).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map((option) => {
              const Icon = option.icon;
              const active = answers.amenities.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    active ? "border-[#0f1930] bg-[#0f1930] text-white" : "border-black/10 bg-white text-ink-700 hover:bg-white"
                  }`}
                  onClick={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      amenities: prev.amenities.includes(option.value)
                        ? prev.amenities.filter((value) => value !== option.value)
                        : [...prev.amenities, option.value]
                    }))
                  }
                >
                  {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                  {option.label || option.value}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (questionId === "budget") {
      return (
        <div className="max-w-[34rem]">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Budget min</span>
              <div className={inputWithUnitClass}>
                <input
                  value={answers.minBudget}
                  onChange={(event) => setAnswers((prev) => ({ ...prev, minBudget: event.target.value }))}
                  className="w-full bg-transparent py-3 text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none"
                  placeholder="Min budget"
                  type="number"
                  min="0"
                />
                <span className="ml-2 shrink-0 text-sm font-medium text-ink-700">kr/mån</span>
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Budget max</span>
              <div className={inputWithUnitClass}>
                <input
                  value={answers.maxBudget}
                  onChange={(event) => setAnswers((prev) => ({ ...prev, maxBudget: event.target.value }))}
                  className="w-full bg-transparent py-3 text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none"
                  placeholder="Max budget"
                  type="number"
                  min="0"
                />
                <span className="ml-2 shrink-0 text-sm font-medium text-ink-700">kr/mån</span>
              </div>
            </label>
          </div>
        </div>
      );
    }

    if (questionId === "moveAndContract") {
      return (
        <div className="max-w-[44rem] grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Inflyttningsdatum</span>
            <input
              value={answers.moveInDate || ""}
              onChange={(event) => setAnswers((prev) => ({ ...prev, moveInDate: event.target.value }))}
              onClick={openDatePicker}
              onFocus={openDatePicker}
              className="w-full rounded-2xl border border-black/10 bg-transparent px-3 py-3 text-sm text-ink-900 focus:border-[#0f1930] focus:outline-none"
              type="date"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Avtalsflex</span>
            <select
              className="select-chevron w-full rounded-2xl border border-black/10 bg-transparent px-3 py-3 pr-10 text-sm text-ink-900 focus:border-[#0f1930] focus:outline-none"
              value={answers.contractFlex}
              onChange={(event) => setAnswers((prev) => ({ ...prev, contractFlex: event.target.value }))}
            >
              {(contractFlexOptions.length > 0 ? contractFlexOptions : ["Alla", "Korttid", "Långtid", "Flexibelt avtal"]).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
      );
    }

    if (questionId === "compliance") {
      return (
        <div className="w-full max-w-[46rem]">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink-700 sm:col-span-2">
              <input
                type="checkbox"
                checked={Boolean(answers.includeOperatingCosts)}
                onChange={(event) => setAnswers((prev) => ({ ...prev, includeOperatingCosts: event.target.checked }))}
                className="h-5 w-5 rounded-md border border-black/25"
              />
              Driftkostnad ingår
            </label>
            <label className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink-700">
              <input
                type="checkbox"
                checked={Boolean(answers.accessibilityAdapted)}
                onChange={(event) => setAnswers((prev) => ({ ...prev, accessibilityAdapted: event.target.checked }))}
                className="h-5 w-5 rounded-md border border-black/25"
              />
              Tillgänglighetsanpassad
            </label>
            <label className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink-700">
              <input
                type="checkbox"
                checked={Boolean(answers.ecoCertified)}
                onChange={(event) => setAnswers((prev) => ({ ...prev, ecoCertified: event.target.checked }))}
                className="h-5 w-5 rounded-md border border-black/25"
              />
              Miljöcertifierad
            </label>
          </div>
        </div>
      );
    }

    if (questionId === "core") {
      return (
        <div className="w-full max-w-3xl space-y-3">
          <div className="grid gap-1.5 sm:grid-cols-[minmax(0,0.65fr)_minmax(0,1fr)]">
            <label className="block min-w-0">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Antal platser</span>
              <div className="flex h-[48px] items-center rounded-xl border border-black/10 px-3">
                <input
                  type="number"
                  min="1"
                  value={answers.teamSize}
                  onChange={(event) => setAnswers((prev) => ({ ...prev, teamSize: event.target.value }))}
                  className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none"
                  placeholder="Antal platser"
                />
                <span className="ml-2 text-sm font-medium text-ink-700">st</span>
              </div>
            </label>

            <label className="block min-w-0">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Område</span>
              <div className="h-[48px] rounded-xl border border-black/10 px-3">
                <select
                  className="select-chevron h-full w-full bg-transparent pr-9 text-sm text-ink-900 focus:outline-none"
                  value={answers.district}
                  onChange={(event) => setAnswers((prev) => ({ ...prev, district: event.target.value }))}
                >
                  <option value="Alla områden">Alla områden i Stockholm</option>
                  {districtOptions.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>
          <label className="block max-w-[18rem]">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Möblering</span>
            <FurnishingToggle
              options={furnishedOptions}
              value={answers.furnishedFilter}
              onChange={(value) => setAnswers((prev) => ({ ...prev, furnishedFilter: value }))}
            />
          </label>
        </div>
      );
    }

    if (questionId === "team") {
      return (
        <label className="block max-w-[16rem]">
          <input
            type="number"
            min="1"
            value={answers.teamSize}
            onChange={(event) => setAnswers((prev) => ({ ...prev, teamSize: event.target.value }))}
            className="w-full rounded-2xl border border-black/10 bg-transparent px-3 py-3 text-sm text-ink-900 placeholder:text-ink-500 focus:border-[#0f1930] focus:outline-none"
            placeholder="Antal platser"
          />
        </label>
      );
    }

    if (questionId === "type") {
      return (
        <div className="max-w-[46rem] space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Typ</span>
              <select
                className="select-chevron w-full rounded-2xl border border-black/10 bg-transparent px-3 py-3 pr-10 text-sm text-ink-900 focus:border-[#0f1930] focus:outline-none"
                value={answers.type}
                onChange={(event) => setAnswers((prev) => ({ ...prev, type: event.target.value }))}
              >
                <option value="Alla typer">Alla typer</option>
                {listingTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Planlösning</span>
              <select
                className="select-chevron w-full rounded-2xl border border-black/10 bg-transparent px-3 py-3 pr-10 text-sm text-ink-900 focus:border-[#0f1930] focus:outline-none"
                value={answers.layoutType}
                onChange={(event) => setAnswers((prev) => ({ ...prev, layoutType: event.target.value }))}
              >
                {(layoutTypeOptions.length > 0 ? layoutTypeOptions : ["Alla"]).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Annonsör</span>
              <select
                className="select-chevron w-full rounded-2xl border border-black/10 bg-transparent px-3 py-3 pr-10 text-sm text-ink-900 focus:border-[#0f1930] focus:outline-none"
                value={answers.advertiser}
                onChange={(event) => setAnswers((prev) => ({ ...prev, advertiser: event.target.value }))}
              >
                {(advertiserOptions.length > 0 ? advertiserOptions : ["Alla"]).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      );
    }

    if (questionId === "district") {
      return (
        <label className="block max-w-[22rem]">
          <select
            className="select-chevron w-full rounded-2xl border border-black/10 bg-transparent px-3 py-3 pr-10 text-sm text-ink-900 focus:border-[#0f1930] focus:outline-none"
            value={answers.district}
            onChange={(event) => setAnswers((prev) => ({ ...prev, district: event.target.value }))}
          >
            <option value="Alla områden">Alla områden</option>
            {districtOptions.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </label>
      );
    }

    if (questionId === "size") {
      return (
        <div className="max-w-[56rem]">
          <div className="grid min-w-0 flex-[1_1_26rem] gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Yta min</span>
              <div className={inputWithUnitClass}>
                <input
                  value={answers.minSize}
                  onChange={(event) => setAnswers((prev) => ({ ...prev, minSize: event.target.value }))}
                  className="w-full bg-transparent py-3 text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none"
                  placeholder="Min"
                  type="number"
                  min="0"
                />
                <span className="ml-2 shrink-0 text-sm font-medium text-ink-700">kvm</span>
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Yta max</span>
              <div className={inputWithUnitClass}>
                <input
                  value={answers.maxSize}
                  onChange={(event) => setAnswers((prev) => ({ ...prev, maxSize: event.target.value }))}
                  className="w-full bg-transparent py-3 text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none"
                  placeholder="Max"
                  type="number"
                  min="0"
                />
                <span className="ml-2 shrink-0 text-sm font-medium text-ink-700">kvm</span>
              </div>
            </label>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-700">
            {recommendedSizeRange ? (
              <>
                <span>
                  Rekommenderad yta för {answers.teamSize} personer i {answers.type === "Alla typer" ? "kontor" : answers.type.toLowerCase()}:
                  {" "}
                  {recommendedSizeRange.min}-{recommendedSizeRange.max} kvm
                  {" "}
                  ({recommendedSizeRange.sqmPerPerson} kvm/person)
                </span>
              </>
            ) : (
              <span>Ange antal platser i första steget för att få rekommenderad yta.</span>
            )}
          </div>
          {recommendedSizeRange && !currentQuestionHasInput ? (
            <div className="mt-3">
              <button
                type="button"
                className="inline-flex h-[40px] items-center gap-1.5 rounded-2xl border border-black/10 bg-white px-4 text-xs font-semibold text-ink-700 hover:bg-white"
                onClick={() =>
                  setAnswers((prev) => ({
                    ...prev,
                    minSize: String(recommendedSizeRange.min),
                    maxSize: String(recommendedSizeRange.max)
                  }))
                }
              >
                <SparklesIcon className="h-3.5 w-3.5 text-[#4f46e5]" />
                Fortsätt med rekommenderad yta
              </button>
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <label className="block max-w-[36rem]">
        <textarea
          value={answers.extra}
          onChange={(event) => setAnswers((prev) => ({ ...prev, extra: event.target.value }))}
          className="w-full rounded-2xl border border-black/10 bg-transparent px-3 py-3 text-sm text-ink-900 placeholder:text-ink-500 focus:border-[#0f1930] focus:outline-none"
          placeholder="Exempel: gärna nära tunnelbana och inflytt inom 30 dagar"
          rows={3}
        />
      </label>
    );
  }

  return (
    <article className="rounded-2xl border border-black/10 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-700">
          <SparklesIcon className="h-3.5 w-3.5 text-[#0f1930]" />
          {showHeader ? "AI-sök assistent" : "AI-guide"}
        </div>
        <div className="flex items-center gap-3">
          {showModeSwitch ? (
            <div className="inline-flex h-10 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-xs font-semibold text-ink-700">
              <span className="inline-flex items-center gap-1">
                <FilterIcon className="h-3.5 w-3.5 text-[#0f1930]" />
                <span>Filter-sök</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={filterModeActive}
                aria-label="Växla filter-sök"
                className={`relative inline-flex h-6 w-10 min-h-0 items-center rounded-full p-0.5 transition-colors ${
                  filterModeActive ? "bg-[#0f1930] justify-end" : "bg-[#a8adb3] justify-start"
                }`}
                onClick={onToggleFilterMode}
              >
                <span aria-hidden="true" className="h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(15,25,48,0.35)]" />
              </button>
            </div>
          ) : (
            hasAnyInput || hasSummaryGroups ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-700 hover:text-ink-900"
                onClick={onResetSearch}
              >
                <ResetIcon className="h-3.5 w-3.5" />
                Nollställ sökning
              </button>
            ) : null
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-2 flex items-center gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Din sökning</p>
          <span aria-hidden="true" className="h-3 w-px bg-black/15" />
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-600">
            {activeQuestion ? (stepLabels[activeQuestion] || `Steg ${currentStepNumber} av ${totalSteps}`) : "Klar för sökning"}
          </p>
        </div>
        {hasSummaryGroups || suggestionChipLabel ? (
          <div className="mb-3">
            <div className="mt-1 flex flex-wrap gap-2 search-summary-dissolve-in">
              {suggestionChipLabel ? (
                <div className="inline-flex items-center gap-1 rounded-full border border-[#4f46e5]/35 bg-[#eef0ff] px-2.5 py-0.5 text-xs font-semibold text-[#312e81]">
                  <SparklesIcon className="h-3.5 w-3.5 text-[#4f46e5]" />
                  {suggestionChipLabel}
                </div>
              ) : null}
              {summaryGroups.map((group) => (
                <div
                  key={group.id}
                  className={`${summaryChipBaseClass} ${activeQuestion === group.id ? "!border-[#0f1930] bg-[#eef3fa]" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveStep(group.id)}
                    className="inline-flex h-auto min-h-0 items-center border-0 bg-transparent p-0 font-semibold leading-none text-inherit"
                  >
                    <span>{group.label}: {group.summary}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Ta bort ${group.label}`}
                    className="ml-1 inline-flex h-auto min-h-0 items-center justify-center border-0 bg-transparent p-0 font-bold leading-none text-ink-500"
                    onClick={(event) => {
                      event.stopPropagation();
                      clearGroupSelection(group.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeQuestion ? (
          <div className="flex items-start gap-3">
            <div className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 search-summary-dissolve-in">
              {activeQuestion !== "core" ? (
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-700">{questionCopy(activeQuestion)}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <div className="w-full">{renderInput(activeQuestion)}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 search-summary-dissolve-in">
            <h3 className="text-base font-semibold text-ink-900">Sökningen är klar</h3>
            {effectiveMatchCount > 0 ? (
              <p className="mt-1 text-sm text-ink-700">
                Vi har matchat {effectiveMatchCount} objekt utifrån dina val. Resultatet visas i listan nedan.
              </p>
            ) : (
              <p className="mt-1 text-sm text-ink-700">
                Vi hittar inga exakta träffar med nuvarande krav. Prova att justera sökningen.
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-2xl border border-[#0f1930] bg-[#0f1930] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#16233f] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onResetSearch}
              >
                Ny sökning
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-white"
                onClick={() => setActiveStep(questionOrder[0])}
              >
                Justera sökning
              </button>
            </div>
          </div>
        )}

      </div>
      {activeQuestion ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {activeQuestion === "core" ? (
            <p className="min-w-0 flex-1 text-xs leading-tight text-ink-600">
              AI-söket uppdaterar träffarna efter varje steg. Du behöver inte fylla i allt, resultat visas live i listan.
            </p>
          ) : (
            <span className="min-w-0 flex-1" aria-hidden="true" />
          )}
          <div className="flex shrink-0 items-center justify-end gap-2">
          {activeQuestion !== questionOrder[0] ? (
            <button
              type="button"
              className="inline-flex h-[40px] items-center gap-1.5 rounded-2xl border border-black/10 bg-white px-4 text-xs font-semibold text-ink-700 hover:bg-white"
              onClick={previousQuestion}
            >
              Föregående
            </button>
          ) : null}
          <div className="relative inline-flex items-center group">
            {isCoreNextDisabled ? (
              <div
                className={`pointer-events-none absolute right-full top-1/2 z-20 mr-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-ink-700 shadow-sm transition ${
                  showCoreNextHint ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                Fyll i antal platser för att gå vidare.
              </div>
            ) : null}
            <button
              type="button"
              aria-disabled={isCoreNextDisabled}
              className={`inline-flex h-[40px] items-center gap-1.5 rounded-2xl px-4 text-xs font-semibold transition ${
                isCoreNextDisabled
                  ? "cursor-not-allowed border border-black/10 bg-[#eceff3] text-ink-500"
                  : canAdvanceCurrentStep
                  ? "border border-[#0f1930] bg-[#0f1930] text-white hover:bg-[#16233f]"
                  : "border border-black/10 bg-white text-ink-700 hover:bg-white"
              }`}
              onMouseEnter={() => {
                if (isCoreNextDisabled) setShowCoreNextHint(true);
              }}
                onClick={() => {
                  if (isCoreNextDisabled) {
                    setShowCoreNextHint(true);
                    return;
                  }
                  if (!currentQuestionHasInput && activeQuestion && activeQuestion !== "core" && activeQuestion !== "amenities") {
                    setSkippedSteps((prev) => (prev.includes(activeQuestion) ? prev : [...prev, activeQuestion]));
                  }
                  nextQuestion();
                }}
              >
                {activeQuestion === "core" ? "Nästa" : activeQuestion === "amenities" ? "Klar" : (currentQuestionHasInput ? "Nästa" : "Hoppa över")}
              </button>
          </div>
          </div>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {onSaveSearch ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-white"
            onClick={onSaveSearch}
          >
            <SaveIcon className="h-4 w-4" />
            Spara AI-sökning
          </button>
        ) : null}
        {onOpenEditSearch ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-white"
            onClick={onOpenEditSearch}
          >
            Redigera sökning
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default AiGuidedAssistant;
