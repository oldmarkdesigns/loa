import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "cn";
import FurnishingToggle from "../../components/app/FurnishingToggle";
import AssistantOrb from "../../components/app/AssistantOrb";
import PublishStage from "../../components/app/PublishStage";
import PublishStart from "../../components/app/PublishStart";
import { StepField, StepFields, UnitInput, checkOptionClass } from "../../components/app/StepFields";
import PublishImportUpload from "../../components/app/PublishImportUpload";
import PublishImportReading from "../../components/app/PublishImportReading";
import ImportedListingEditor from "../../components/app/ImportedListingEditor";
import PublishImportReview, { PublishImportDone } from "../../components/app/PublishImportReview";
import EditorWorkspace from "../../components/layout/EditorWorkspace";
import { ChevronLeft, ChevronRight, XIcon } from "lucide-react";
import FieldLabel from "../../components/app/FieldLabel";
import ListingPreview from "../../components/app/ListingPreview";
import { amenityIconFor, propertyAmenityOptions } from "../../lib/propertyAmenityIcons";
import { navigateTo, normalizeAppRole } from "../../lib/router";
import { districtOptions, listingTypes } from "../../data/mockData";
import { buildPayload, computeQualityScore, getStepErrors, initialDraft, listMissingFields, mergeAmenities } from "../../lib/listingDraft";
import { MAX_IMAGES, fileToImageEntry } from "../../lib/listingImages";
import { accessHoursOptions, availabilityOptions, contractFlexOptions, furnishedOptions, layoutTypeOptions, parkingTypeOptions, termOptions, transitDistanceOptions } from "../../lib/listingOptions";
import { classifyImportFiles, parseListingDocuments, sampleImportFiles, takeQueuedImportFiles } from "../../lib/listingImport";
import {
  BuildingIcon,
  CheckBadgeIcon,
  ExternalLinkIcon,
  LightbulbIcon,
  SaveIcon,
  UploadIcon,
} from "../../components/icons/UiIcons";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const publishSteps = [
  { id: "title", label: "Rubrik", question: "Vad ska annonsen heta?", helper: "Skriv en kort rubrik som säger typ, område och största fördelen." },
  { id: "place", label: "Plats", question: "Var ligger lokalen?", helper: "Välj område, lokaltyp och skriv adressen." },
  { id: "size", label: "Storlek", question: "Hur stor är lokalen och hur många passar den för?", helper: "Ange yta och ungefärlig teamkapacitet." },
  { id: "rent", label: "Hyra", question: "Vad kostar lokalen och hur ser avtalet ut?", helper: "Ange månadshyra och normal avtalstid." },
  { id: "availability", label: "Tillgänglighet", question: "När kan en hyresgäst flytta in?", helper: "Välj tillgänglighet och hur snabbt ni brukar svara." },
  { id: "access", label: "Läge", question: "Vad behöver hyresgästen veta om vardagen i lokalen?", helper: "Lägg till kommunikationer, access, parkering och planlösning." },
  { id: "requirements", label: "Krav", question: "Vilka viktiga villkor ska synas?", helper: "Markera bara det som gäller för lokalen." },
  { id: "photos", label: "Bilder", question: "Vilka bilder ska sälja in lokalen?", helper: "Första bilden används som omslagsfoto." },
  { id: "amenities", label: "Innehåll", question: "Vad ingår eller utmärker lokalen?", helper: "Välj bekvämligheter och lägg till egna nyckelord vid behov." },
  { id: "description", label: "Beskrivning", question: "Hur skulle du beskriva lokalen för rätt hyresgäst?", helper: "Skriv kort om planlösning, känsla, läge och vad som ingår." },
  { id: "review", label: "Granska", question: "Ser allt rätt ut?", helper: "Kontrollera sammanfattningen innan annonsen publiceras." }
];

const amenityOptions = propertyAmenityOptions;
const propertyCardAmenityChipClass = "inline-flex min-h-[42px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-veil/10 bg-control px-3 py-1.5 text-[0.875rem] font-semibold leading-5 text-ink-700";
// Between questions the orb first acknowledges the answer ("received"), then works on it
// with an animation that fits the step ("processing"). All nine orb states are in play.
const ORB_IDLE_STATE = "breathing";
const ORB_RECEIVED_STATE = "listening";
const ORB_SAVING_STATE = "connecting";
const ORB_UPLOAD_STATE = "searching";
const orbStateByStep = {
  title: "composing",
  place: "searching",
  size: "shaping",
  rent: "solving",
  availability: "working",
  access: "connecting",
  requirements: "solving",
  photos: "searching",
  amenities: "weaving",
  description: "composing"
};
const RECEIVED_MS = 380;
const PROCESSING_MS = 640;
const textEntrySelector = "input[type=text], input[type=number], input[type=date], input:not([type]), textarea";
const firstControlSelector = `${textEntrySelector}, input[type=checkbox], button:not([disabled]), [role=combobox], [role=checkbox]`;
const publishFaqItems = [
  {
    q: "Hur många bilder bör en annons ha?",
    a: "Sikta på 5-8 bilder med både översikt och detaljer för högre kvalitet."
  },
  {
    q: "Vad ska rubriken innehålla?",
    a: "Område, typ av lokal och en tydlig fördel. Exempel: \"Kontor i Norrmalm med mötesrum\"."
  },
  {
    q: "Hur får jag fler relevanta leads?",
    a: "Var tydlig med storlek, teamkapacitet, prisnivå och vad som ingår i hyran."
  },
  {
    q: "När ska jag uppdatera annonsen?",
    a: "Uppdatera bilder och text när något ändras för att hålla annonsen relevant."
  },
  {
    q: "Hur detaljerad ska beskrivningen vara?",
    a: "Beskriv läge, planlösning och vad som ingår så hyresgäster kan ta beslut snabbare."
  }
];
const publishTips = [
  "Visa omslagsbilden med mest dagsljus och tydlig rumsöverblick.",
  "Beskriv planlösning och vad som är flexibelt i lokalen.",
  "Lägg till bekvämligheter som hyresgäster faktiskt filtrerar på."
];

// While documents are read, the orb works through four phases; each has its own animation and message.
const importStageOrbStates = { reading: "searching", identifying: "weaving", extracting: "composing", verifying: "solving" };

function importStageMessage(progress) {
  if (progress.stage === "identifying") return "Hittar objekt och uppgifter…";
  if (progress.stage === "extracting") return "Hämtar yta, hyra, adress och bilder…";
  if (progress.stage === "verifying") return "Kontrollerar att allt stämmer…";
  return progress.currentName ? `Läser ${progress.currentName}…` : "Läser dina filer…";
}

function PublishPage({ app, onClose }) {
  const { createListing, updateListing, publishListing, pushToast } = app;
  const activeRole = normalizeAppRole(app.user?.role);
  const isCompanyAdmin = activeRole === "company_admin";
  const myListingsPath = isCompanyAdmin ? "/app/admin/annonser" : "/app/broker/objekt";

  // choose → manual | upload → reading → review → imported. "manual" is also where a single imported listing gets edited.
  const [mode, setMode] = useState("choose");
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState(initialDraft);
  const [savedDraft, setSavedDraft] = useState(JSON.stringify(initialDraft));
  const [draftListingId, setDraftListingId] = useState(null);
  const [publishedListing, setPublishedListing] = useState(null);
  const [pending, setPending] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [attemptedByStep, setAttemptedByStep] = useState({});
  // The beat between two questions: null → "received" → "processing" → null.
  const [advancePhase, setAdvancePhase] = useState(null);
  const [importFiles, setImportFiles] = useState([]);
  const [readOnArrival, setReadOnArrival] = useState(false);
  const [importError, setImportError] = useState("");
  const [importProgress, setImportProgress] = useState({ files: {}, stage: "reading", value: 0, currentName: "" });
  const [importItems, setImportItems] = useState([]);
  const [importSelected, setImportSelected] = useState({});
  const [importBusy, setImportBusy] = useState(false);
  const [editingImportId, setEditingImportId] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [orbPulse, setOrbPulse] = useState(null);
  const stepRef = useRef(null);
  const headingRef = useRef(null);
  const advanceTimers = useRef([]);
  const pulseTimer = useRef(null);
  const readingAbort = useRef(null);

  const advancing = advancePhase !== null;
  const busy = pending || uploadingImages || advancing || importBusy;
  const draftDirty = JSON.stringify(draft) !== savedDraft;
  const importDirty = importItems.some((item) => item.status === "review" || item.status === "error");
  const dirty = !publishedListing && (
    mode === "manual" ? draftDirty
      : mode === "review" ? importDirty
        : false
  );
  const currentStep = publishSteps[stepIndex];
  const qualityScore = useMemo(() => computeQualityScore(draft), [draft]);

  const orbState = pending || importBusy
    ? ORB_SAVING_STATE
    : uploadingImages
      ? ORB_UPLOAD_STATE
      : mode === "reading"
        ? importStageOrbStates[importProgress.stage] || "searching"
        : dragActive
          ? ORB_RECEIVED_STATE
          : orbPulse
            ? orbPulse
            : advancePhase === "received"
              ? ORB_RECEIVED_STATE
              : advancePhase === "processing"
                ? orbStateByStep[currentStep.id] || "working"
                : ORB_IDLE_STATE;
  const orbEngaged = busy || mode === "reading" || dragActive || Boolean(orbPulse);
  const statusMessage = advancing
    ? "Tar emot ditt svar…"
    : mode === "reading"
      ? importStageMessage(importProgress)
      : importBusy
        ? "Sparar annonserna…"
        : uploadingImages
          ? "Bearbetar bilder…"
          : pending
            ? "Sparar annonsen…"
            : "";

  const currentErrors = useMemo(() => {
    if (!attemptedByStep[currentStep.id]) {
      return [];
    }
    return getStepErrors(currentStep.id, draft);
  }, [attemptedByStep, currentStep.id, draft]);
  const inlineError = feedback || (currentErrors.length > 0 ? `Fyll i obligatoriska fält: ${currentErrors.join(", ")}.` : "");

  const firstInvalidStepIndex = useMemo(() => {
    for (let index = 0; index < publishSteps.length - 1; index += 1) {
      const errors = getStepErrors(publishSteps[index].id, draft);
      if (errors.length > 0) {
        return index;
      }
    }
    return null;
  }, [draft]);

  function clearAdvanceTimers() {
    advanceTimers.current.forEach((timer) => window.clearTimeout(timer));
    advanceTimers.current = [];
  }

  useEffect(() => () => {
    clearAdvanceTimers();
    window.clearTimeout(pulseTimer.current);
    readingAbort.current?.abort();
  }, []);

  // Files attached in the broker assistant arrive already chosen: show them and start reading straight away.
  useEffect(() => {
    const queued = takeQueuedImportFiles();
    if (queued.length === 0) return;
    setImportFiles(queued);
    setMode("upload");
    setReadOnArrival(true);
  }, []);

  useEffect(() => {
    if (!readOnArrival || mode !== "upload" || importFiles.length === 0) return;
    setReadOnArrival(false);
    void startReading();
  }, [readOnArrival, mode, importFiles]);

  // Each new screen takes focus: a text field when it leads the screen, otherwise the question
  // itself so screen readers announce it before the controls.
  useEffect(() => {
    if (publishedListing || mode === "imported") return undefined;
    const timer = window.setTimeout(() => {
      // Never yank focus from a control the person has already reached themselves.
      if (stepRef.current?.contains(document.activeElement)) return;
      const first = stepRef.current?.querySelector(firstControlSelector);
      const target = first?.matches(textEntrySelector) ? first : headingRef.current;
      target?.focus({ preventScroll: true });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [mode, stepIndex, publishedListing]);

  function pulseOrb(state = ORB_RECEIVED_STATE, duration = 900) {
    window.clearTimeout(pulseTimer.current);
    setOrbPulse(state);
    pulseTimer.current = window.setTimeout(() => setOrbPulse(null), duration);
  }

  function markStepAttempt(stepId) {
    setAttemptedByStep((prev) => ({ ...prev, [stepId]: true }));
  }

  function updateField(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAmenity(amenity) {
    setDraft((prev) => {
      const selected = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: selected
          ? prev.amenities.filter((entry) => entry !== amenity)
          : [...prev.amenities, amenity]
      };
    });
  }

  async function handleAddImages(event) {
    const selected = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/"));
    event.target.value = "";

    if (selected.length === 0) return;

    const slotsLeft = Math.max(0, MAX_IMAGES - draft.images.length);
    if (slotsLeft === 0) {
      pushToast(`Max ${MAX_IMAGES} bilder kan laddas upp.`, "info");
      return;
    }

    const filesToAdd = selected.slice(0, slotsLeft);
    if (filesToAdd.length < selected.length) {
      pushToast(`Endast ${slotsLeft} bilder kunde läggas till.`, "info");
    }

    setUploadingImages(true);
    try {
      const entries = await Promise.all(filesToAdd.map((file) => fileToImageEntry(file)));
      setDraft((prev) => ({
        ...prev,
        images: [...prev.images, ...entries]
      }));
    } catch (_error) {
      setFeedback("Kunde inte läsa en eller flera bilder.");
    } finally {
      setUploadingImages(false);
    }
  }

  async function handleReplaceImage(index, event) {
    const file = Array.from(event.target.files || []).find((entry) => entry.type.startsWith("image/"));
    event.target.value = "";
    if (!file) return;

    setUploadingImages(true);
    try {
      const nextEntry = await fileToImageEntry(file);
      setDraft((prev) => {
        const nextImages = [...prev.images];
        if (!nextImages[index]) return prev;
        nextImages[index] = nextEntry;
        return { ...prev, images: nextImages };
      });
    } catch (_error) {
      setFeedback("Kunde inte ersätta bilden.");
    } finally {
      setUploadingImages(false);
    }
  }

  function moveImage(index, direction) {
    setDraft((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.images.length) return prev;
      const nextImages = [...prev.images];
      const current = nextImages[index];
      nextImages[index] = nextImages[target];
      nextImages[target] = current;
      return { ...prev, images: nextImages };
    });
  }

  function setCoverImage(index) {
    if (index <= 0) return;
    setDraft((prev) => {
      if (!prev.images[index]) return prev;
      const nextImages = [...prev.images];
      const [selected] = nextImages.splice(index, 1);
      nextImages.unshift(selected);
      return { ...prev, images: nextImages };
    });
  }

  function removeImage(index) {
    setDraft((prev) => ({
      ...prev,
      images: prev.images.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function resetManualDraft() {
    setDraft(initialDraft);
    setSavedDraft(JSON.stringify(initialDraft));
    setDraftListingId(null);
    setPublishedListing(null);
    setFeedback("");
    setDuplicateWarning(false);
    setAttemptedByStep({});
    setStepIndex(0);
  }

  async function saveDraft() {
    if (mode === "review") {
      await saveImportDrafts();
      return;
    }
    setPending(true);
    setFeedback("");
    try {
      const payload = buildPayload(draft, "draft");
      if (draftListingId) {
        const response = await updateListing(draftListingId, payload);
        setDuplicateWarning(Boolean(response?.duplicateWarning));
      } else {
        const response = await createListing(payload);
        setDraftListingId(response.listing.id);
        setDuplicateWarning(Boolean(response?.duplicateWarning));
      }
      setSavedDraft(JSON.stringify(draft));
      pushToast("Utkast sparat.", "success");
    } catch (error) {
      setFeedback(error.message || "Kunde inte spara utkastet.");
    } finally {
      setPending(false);
    }
  }

  function goToStep(nextIndex) {
    setFeedback("");
    setStepIndex(Math.max(0, Math.min(nextIndex, publishSteps.length - 1)));
  }

  function startManual() {
    pulseOrb();
    setMode("manual");
  }

  function goBack() {
    if (stepIndex > 0) {
      goToStep(stepIndex - 1);
    } else {
      setMode("choose");
    }
  }

  function handleNextStep() {
    if (advancing || stepIndex >= publishSteps.length - 1) return;

    const errors = getStepErrors(currentStep.id, draft);
    if (errors.length > 0) {
      markStepAttempt(currentStep.id);
      setFeedback("");
      return;
    }

    setFeedback("");
    clearAdvanceTimers();
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      goToStep(stepIndex + 1);
      return;
    }
    setAdvancePhase("received");
    advanceTimers.current = [
      window.setTimeout(() => setAdvancePhase("processing"), RECEIVED_MS),
      window.setTimeout(() => {
        goToStep(stepIndex + 1);
        setAdvancePhase(null);
      }, RECEIVED_MS + PROCESSING_MS)
    ];
  }

  // Enter in a text field answers the question, like the Nästa button.
  function handleFieldKeyDown(event) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    if (!event.target.matches?.("input[type=text], input[type=number], input[type=date], input:not([type])")) return;
    event.preventDefault();
    handleNextStep();
  }

  async function handlePublish() {
    setFeedback("");
    const firstInvalid = firstInvalidStepIndex;
    if (firstInvalid !== null) {
      const invalidStep = publishSteps[firstInvalid];
      markStepAttempt(invalidStep.id);
      setStepIndex(firstInvalid);
      setFeedback(`Slutför steget "${invalidStep.label}" innan publicering.`);
      return;
    }

    setPending(true);
    try {
      const payload = buildPayload(draft, "draft");
      let listingId = draftListingId;

      if (listingId) {
        await updateListing(listingId, payload);
      } else {
        const created = await createListing(payload);
        listingId = created.listing.id;
        setDraftListingId(listingId);
        setDuplicateWarning(Boolean(created?.duplicateWarning));
      }

      const published = await publishListing(listingId);
      setPublishedListing(published.listing);
      setStepIndex(publishSteps.length - 1);
      setAttemptedByStep({});
    } catch (error) {
      setFeedback(error.message || "Publicering misslyckades.");
    } finally {
      setPending(false);
    }
  }

  function resetFlow() {
    clearAdvanceTimers();
    readingAbort.current?.abort();
    resetManualDraft();
    setPending(false);
    setUploadingImages(false);
    setAdvancePhase(null);
    setImportFiles([]);
    setImportError("");
    setImportItems([]);
    setImportSelected({});
    setImportBusy(false);
    setEditingImportId(null);
    setMode("choose");
  }

  // ── Import from documents ────────────────────────────────────────────────────────────────

  function addImportFiles(fileList) {
    const { accepted, problems } = classifyImportFiles(fileList, importFiles);
    setImportError(problems.join(" "));
    if (accepted.length > 0) {
      setImportFiles((prev) => [...prev, ...accepted]);
      pulseOrb();
    }
  }

  function useSampleFiles() {
    setImportError("");
    setImportFiles(sampleImportFiles());
    pulseOrb();
  }

  function removeImportFile(id) {
    setImportError("");
    setImportFiles((prev) => prev.filter((file) => file.id !== id));
  }

  function handleReadingProgress(event, total) {
    setImportProgress((prev) => {
      const files = { ...prev.files };
      let { stage, value, currentName } = prev;
      if (event.phase === "file-start") {
        files[event.file.id] = { status: "reading" };
        stage = "reading";
        currentName = event.file.name;
      } else if (event.phase === "identifying") {
        stage = "identifying";
      } else if (event.phase === "file-done") {
        files[event.file.id] = { status: "done", count: event.count };
      } else if (event.phase === "extracting") {
        stage = "extracting";
        value = 84;
      } else if (event.phase === "verifying") {
        stage = "verifying";
        value = 95;
      }
      if (event.phase === "file-start" || event.phase === "identifying" || event.phase === "file-done") {
        const done = Object.values(files).filter((file) => file.status === "done").length;
        value = 6 + Math.round((done / total) * 68);
      }
      return { files, stage, value, currentName };
    });
  }

  async function startReading() {
    if (importFiles.length === 0) return;
    const controller = new AbortController();
    readingAbort.current = controller;
    const total = importFiles.length;
    setImportError("");
    setImportProgress({ files: {}, stage: "reading", value: 4, currentName: importFiles[0].name });
    setMode("reading");
    try {
      const { listings } = await parseListingDocuments(importFiles, {
        signal: controller.signal,
        onProgress: (event) => handleReadingProgress(event, total)
      });
      setImportItems(listings);
      setImportSelected(Object.fromEntries(listings.map((item) => [item.id, true])));
      setMode("review");
    } catch (error) {
      if (error?.name === "AbortError") return;
      setImportError("Kunde inte läsa dokumenten. Försök igen.");
      setMode("upload");
    }
  }

  function cancelReading() {
    readingAbort.current?.abort();
    setMode("upload");
  }

  function patchImportItem(id, patch) {
    setImportItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function toggleImportItem(id, checked) {
    setImportSelected((prev) => ({ ...prev, [id]: checked }));
  }

  function toggleAllImportItems(checked) {
    setImportSelected(Object.fromEntries(importItems.filter((item) => item.status !== "published").map((item) => [item.id, checked])));
  }

  function removeImportItem(id) {
    const remaining = importItems.filter((item) => item.id !== id);
    setImportItems(remaining);
    setImportSelected((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (remaining.length === 0) setMode("upload");
  }

  function startImportEdit(id) {
    setEditingImportId(id);
  }

  // Approving hands the edited draft back: the reviewer has looked at it, so nothing is left to double-check, and a
  // listing with everything filled in is selected for publishing.
  function approveImportItem(id, nextDraft) {
    setImportItems((prev) => prev.map((item) => (
      item.id === id ? { ...item, draft: nextDraft, uncertain: [], error: "", status: item.status === "error" ? "review" : item.status } : item
    )));
    if (listMissingFields(nextDraft).length === 0) setImportSelected((prev) => ({ ...prev, [id]: true }));
  }

  // Saves or publishes every selected listing one after the other; a failure only marks that listing.
  async function runImportBatch(publish) {
    const targets = importItems.filter((item) => importSelected[item.id] && item.status !== "published");
    if (targets.length === 0) return { done: 0, failed: 0 };
    setImportBusy(true);
    let failed = 0;
    for (const item of targets) {
      let listingId = item.listingId;
      patchImportItem(item.id, { status: publish ? "publishing" : "saving", error: "" });
      try {
        const payload = buildPayload(item.draft, "draft");
        if (listingId) {
          await updateListing(listingId, payload);
        } else {
          const created = await createListing(payload);
          listingId = created.listing.id;
        }
        if (publish) await publishListing(listingId);
        patchImportItem(item.id, { status: publish ? "published" : "draft", listingId });
      } catch (error) {
        failed += 1;
        patchImportItem(item.id, { status: "error", listingId, error: error?.message || "Kunde inte spara annonsen." });
      }
    }
    setImportBusy(false);
    return { done: targets.length - failed, failed };
  }

  async function publishImportItems() {
    const { done, failed } = await runImportBatch(true);
    if (done > 0 && failed === 0) setMode("imported");
  }

  async function saveImportDrafts() {
    const { done } = await runImportBatch(false);
    if (done > 0) pushToast(done === 1 ? "Utkast sparat." : `${done} utkast sparade.`, "success");
  }

  const selectedImportItems = importItems.filter((item) => importSelected[item.id] && item.status !== "published");
  const blockedImportItems = selectedImportItems.filter((item) => listMissingFields(item.draft).length > 0);
  const canPublishImport = selectedImportItems.length > 0 && blockedImportItems.length === 0 && !busy;
  const importHint = blockedImportItems.length === 0
    ? ""
    : blockedImportItems.length === 1
      ? "1 valt objekt saknar uppgifter. Välj Granska för att komplettera det."
      : `${blockedImportItems.length} valda objekt saknar uppgifter. Välj Granska för att komplettera dem.`;
  const publishedImportItems = importItems.filter((item) => item.status === "published");
  const unpublishedImportCount = importItems.length - publishedImportItems.length;
  const editingImportItem = importItems.find((item) => item.id === editingImportId) || null;

  const phaseLabel = publishedListing || mode === "imported"
    ? null
    : mode === "manual"
      ? `Fråga ${stepIndex + 1} av ${publishSteps.length}`
      : { upload: "Ladda upp", reading: "Läser in", review: "Granska" }[mode] || null;
  const progressValue = mode === "manual"
    ? ((stepIndex + 1) / publishSteps.length) * 100
    : { choose: 0, upload: 20, reading: 45, review: 75, imported: 100 }[mode];
  const showSaveDraft = mode === "manual" || mode === "review";

  const reviewRows = [
    ["Rubrik", draft.title || "-"],
    ["Område", draft.district || "-"],
    ["Typ", draft.type || "-"],
    ["Yta", `${draft.sizeSqm || "-"} kvm`],
    ["Team", `${draft.capacity || "-"} platser`],
    ["Inflyttning", draft.moveInDate || "-"],
    ["Kommunaltrafik", draft.transitDistance || "-"],
    ["Avtalsflex", draft.contractFlex || "-"],
    ["Access", draft.accessHours || "-"],
    ["Parkering", draft.parkingType || "-"],
    ["Planlösning", draft.layoutType || "-"],
    ["Driftkostnader ingår", draft.includeOperatingCosts ? "Ja" : "Nej"],
    ["Tillgänglighetsanpassad", draft.accessibilityAdapted ? "Ja" : "Nej"],
    ["Miljöcertifierad", draft.ecoCertified ? "Ja" : "Nej"],
    ["Bilder", String(draft.images.length)],
    ["Omslagsfoto", draft.images[0]?.name || "Valt"]
  ];

  const stageProps = { groupRef: stepRef, headingRef };

  return (
    <EditorWorkspace size="focus" title="Publicera annons" dirty={dirty} busy={busy} onClose={onClose} onSaveDraft={saveDraft}>
      {(close) => (
        <>
          <header className="shrink-0 bg-surface">
            <div className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="flex min-w-0 items-baseline gap-2.5">
                <p className="text-sm font-semibold text-ink-900">Publicera annons</p>
                {phaseLabel ? <p className="truncate text-xs font-semibold text-ink-500">{phaseLabel}</p> : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {mode === "manual" && !publishedListing ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button type="button" variant="outline" size="icon" aria-label="FAQ och tips" />}>
                      <LightbulbIcon className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="bottom" className="w-80">
                      <div className="space-y-3 p-2">
                        <div>
                          <p className="text-sm font-semibold text-strong">FAQ och tips</p>
                          <p className="mt-1 text-xs text-ink-500">Snabb hjälp medan du fyller i annonsen.</p>
                        </div>
                        <div className="grid gap-2">
                          {publishFaqItems.slice(0, 3).map((item) => (
                            <div key={item.q} className="rounded-lg border border-veil/10 bg-surface px-3 py-2">
                              <p className="text-xs font-semibold text-ink-900">{item.q}</p>
                              <p className="mt-1 text-xs leading-relaxed text-ink-600">{item.a}</p>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-lg border border-veil/10 bg-canvas px-3 py-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-ink-700">Snabba tips</p>
                          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-600">
                            {publishTips.map((tip) => (
                              <li key={tip}>• {tip}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
                <Button type="button" variant="outline" size="icon" aria-label="Stäng publicering" disabled={busy} onClick={close}>
                  <XIcon />
                </Button>
              </div>
            </div>
            {!publishedListing ? (
              <Progress
                value={progressValue}
                aria-label="Framsteg i publiceringen"
                className="gap-0 [&_[data-slot=progress-track]]:h-0.5 [&_[data-slot=progress-track]]:rounded-none [&_[data-slot=progress-indicator]]:duration-500"
              />
            ) : (
              <div className="h-0.5 bg-border" />
            )}
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto bg-surface">
            {publishedListing ? (
              <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-5 pb-8 pt-[clamp(1.25rem,6vh,3rem)] text-center">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <CheckBadgeIcon className="h-7 w-7" />
                </span>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight text-strong sm:text-3xl">Annonsen är publicerad</h2>
                <p className="mt-3 max-w-md text-base leading-relaxed text-ink-600">
                  Objektet är nu aktivt i sökflödet och kan ses av hyresgäster. Förhandsgranskningen nedan visar hur annonsen presenteras.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  <Button type="button" className="h-auto px-4" onClick={() => navigateTo(`/app/listings/${encodeURIComponent(publishedListing.id)}`)}>
                    Visa annons live
                    <ExternalLinkIcon className="ml-1.5 h-4 w-4" />
                  </Button>
                  <Button type="button" variant="secondary" className="h-auto px-4" onClick={() => navigateTo(myListingsPath)}>
                    Gå till mina objekt
                  </Button>
                  <Button type="button" variant="secondary" className="h-auto px-4" onClick={resetFlow}>
                    Publicera ytterligare annons
                  </Button>
                </div>
                <div className="mt-10 w-full text-left">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Förhandsgranskning</p>
                    <Badge variant="outline" className="h-auto rounded-full bg-control px-3 py-1 text-xs font-semibold text-ink-700">
                      Kvalitet {qualityScore}
                    </Badge>
                  </div>
                  <ListingPreview draft={draft} />
                </div>
              </div>
            ) : mode === "imported" ? (
              <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-5 pb-8 pt-[clamp(1.25rem,6vh,3rem)] text-center">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <CheckBadgeIcon className="h-7 w-7" />
                </span>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight text-strong sm:text-3xl">
                  {publishedImportItems.length === 1 ? "1 annons är publicerad" : `${publishedImportItems.length} annonser är publicerade`}
                </h2>
                <p className="mt-3 max-w-md text-base leading-relaxed text-ink-600">Objekten är nu aktiva i sökflödet och kan ses av hyresgäster.</p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  <Button type="button" className="h-auto px-4" onClick={() => navigateTo(myListingsPath)}>
                    Gå till mina objekt
                  </Button>
                  {unpublishedImportCount > 0 ? (
                    <Button type="button" variant="secondary" className="h-auto px-4" onClick={() => setMode("review")}>
                      Granska resterande ({unpublishedImportCount})
                    </Button>
                  ) : (
                    <Button type="button" variant="secondary" className="h-auto px-4" onClick={resetFlow}>
                      Publicera fler
                    </Button>
                  )}
                </div>
                <div className="mt-10 w-full">
                  <PublishImportDone items={publishedImportItems} onOpenListing={(listingId) => navigateTo(`/app/listings/${encodeURIComponent(listingId)}`)} />
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-5 pb-8 pt-[clamp(1.25rem,6vh,3rem)] text-center">
                <AssistantOrb state={orbState} speed={busy || mode === "reading" ? 1.3 : 1} engaged={orbEngaged} />
                <p role="status" aria-live="polite" className="sr-only">{statusMessage}</p>

                {mode === "choose" ? (
                  <PublishStage
                    key="choose"
                    question="Hur vill du skapa annonsen?"
                    helper="Fyll i uppgifterna själv eller låt oss läsa in dina befintliga dokument."
                    {...stageProps}
                  >
                    <PublishStart onManual={startManual} onUpload={() => setMode("upload")} />
                  </PublishStage>
                ) : null}

                {mode === "upload" ? (
                  <PublishStage
                    key="upload"
                    question="Vilka dokument vill du läsa in?"
                    helper="Lägg till Excel-ark, prospekt eller annan data. Flera filer och flera objekt går bra."
                    actions={(
                      <>
                        <Button type="button" variant="secondary" className="h-auto px-4" onClick={() => setMode("choose")}>
                          <ChevronLeft className="mr-1.5 h-4 w-4" />
                          Föregående
                        </Button>
                        <Button type="button" className="h-auto px-4" onClick={() => void startReading()} disabled={importFiles.length === 0}>
                          {importFiles.length === 0 ? "Läs in filer" : importFiles.length === 1 ? "Läs in 1 fil" : `Läs in ${importFiles.length} filer`}
                          <ChevronRight className="ml-1.5 h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {...stageProps}
                  >
                    <PublishImportUpload
                      files={importFiles}
                      error={importError}
                      onAddFiles={addImportFiles}
                      onRemoveFile={removeImportFile}
                      onUseSamples={useSampleFiles}
                      onDragActiveChange={setDragActive}
                    />
                  </PublishStage>
                ) : null}

                {mode === "reading" ? (
                  <PublishStage
                    key="reading"
                    question="Läser in dina dokument"
                    helper={importStageMessage(importProgress)}
                    actions={(
                      <Button type="button" variant="secondary" className="h-auto px-4" onClick={cancelReading}>
                        Avbryt inläsning
                      </Button>
                    )}
                    {...stageProps}
                  >
                    <PublishImportReading files={importFiles} progress={importProgress} />
                  </PublishStage>
                ) : null}

                {mode === "review" ? (
                  <PublishStage
                    key="review-import"
                    question={`Vi hittade ${importItems.length} objekt`}
                    helper="Granska uppgifterna innan något publiceras. Komplettera det som saknas med Granska."
                    actions={(
                      <>
                        {importHint ? <p className="w-full text-center text-sm font-medium text-amber-700">{importHint}</p> : null}
                        <Button type="button" variant="secondary" className="h-auto px-4" onClick={() => setMode("upload")} disabled={busy}>
                          <ChevronLeft className="mr-1.5 h-4 w-4" />
                          Föregående
                        </Button>
                        <Button type="button" className="h-auto px-4" onClick={() => void publishImportItems()} disabled={!canPublishImport}>
                          <BuildingIcon className="mr-1.5 h-4 w-4" />
                          {importBusy
                            ? "Publicerar..."
                            : selectedImportItems.length === 1
                              ? "Publicera 1 annons"
                              : `Publicera ${selectedImportItems.length} annonser`}
                        </Button>
                      </>
                    )}
                    {...stageProps}
                  >
                    <PublishImportReview
                      items={importItems}
                      selected={importSelected}
                      onToggle={toggleImportItem}
                      onToggleAll={toggleAllImportItems}
                      onEdit={startImportEdit}
                      onRemove={removeImportItem}
                    />
                  </PublishStage>
                ) : null}

                {mode === "manual" ? (
                  <PublishStage
                    key={`manual-${currentStep.id}`}
                    question={currentStep.question}
                    helper={currentStep.helper}
                    advancing={advancing}
                    onFieldsKeyDown={handleFieldKeyDown}
                    actions={(
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-auto px-4"
                          onClick={goBack}
                          disabled={pending || advancing}
                        >
                          <ChevronLeft className="mr-1.5 h-4 w-4" />
                          Föregående
                        </Button>

                        {currentStep.id !== "review" ? (
                          <Button type="button" className="h-auto px-4" onClick={handleNextStep} disabled={busy}>
                            Nästa
                            <ChevronRight className="ml-1.5 h-4 w-4" />
                          </Button>
                        ) : (
                          <Button type="button" className="h-auto px-4" onClick={() => void handlePublish()} disabled={busy}>
                            <BuildingIcon className="mr-1.5 h-4 w-4" />
                            {pending ? "Publicerar..." : "Publicera annons"}
                          </Button>
                        )}
                      </>
                    )}
                    {...stageProps}
                  >
                    {currentStep.id === "title" ? (
                      <StepFields>
                        <StepField label="Rubrik" required className="max-w-md">
                          <Input value={draft.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Ex. Modernt kontor nära T-centralen" />
                        </StepField>
                      </StepFields>
                    ) : null}

                    {currentStep.id === "place" ? (
                      <div className="mx-auto grid w-full max-w-[26rem] grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                        <StepField label="Område" required>
                          <Select value={draft.district} onValueChange={(value) => updateField("district", value)}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {districtOptions.map((district) => <SelectItem key={district} value={district}>{district}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </StepField>
                        <StepField label="Typ" required>
                          <Select value={draft.type} onValueChange={(value) => updateField("type", value)}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {listingTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </StepField>
                        <StepField label="Adress" required className="sm:col-span-2">
                          <Input value={draft.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Ex. Kungsgatan 12, Stockholm" />
                        </StepField>
                      </div>
                    ) : null}

                    {currentStep.id === "size" ? (
                      <StepFields>
                        <StepField label="Storlek" required className="sm:w-40">
                          <UnitInput unit="kvm" type="number" min="0" value={draft.sizeSqm} onChange={(event) => updateField("sizeSqm", event.target.value)} placeholder="180" />
                        </StepField>
                        <StepField label="Team / platser" required className="sm:w-40">
                          <Input type="number" min="1" inputMode="numeric" value={draft.capacity} onChange={(event) => updateField("capacity", event.target.value)} placeholder="16" />
                        </StepField>
                      </StepFields>
                    ) : null}

                    {currentStep.id === "rent" ? (
                      <StepFields>
                        <StepField label="Månadshyra" required className="sm:w-48">
                          <UnitInput unit="kr/mån" type="number" min="0" value={draft.priceMonthly} onChange={(event) => updateField("priceMonthly", event.target.value)} placeholder="75000" />
                        </StepField>
                        <StepField label="Avtalstid" required className="sm:w-52">
                          <Select value={draft.term} onValueChange={(value) => updateField("term", value)}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {termOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </StepField>
                      </StepFields>
                    ) : null}

                    {currentStep.id === "availability" ? (
                      <StepFields>
                        <StepField label="Tillgänglighet" required className="sm:w-56">
                          <Select value={draft.availability} onValueChange={(value) => updateField("availability", value)}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {availabilityOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </StepField>
                        <StepField label="Svarstid" className="sm:w-32">
                          <UnitInput unit="tim" type="number" min="1" value={draft.responseHours} onChange={(event) => updateField("responseHours", event.target.value)} placeholder="2" />
                        </StepField>
                        <StepField label="Inflyttning" className="sm:w-44">
                          <Input type="date" value={draft.moveInDate || ""} onChange={(event) => updateField("moveInDate", event.target.value)} />
                        </StepField>
                      </StepFields>
                    ) : null}

                    {currentStep.id === "access" ? (
                      <StepFields>
                        <StepField label="Kommunaltrafik" className="sm:w-44">
                          <Select value={draft.transitDistance || "Alla"} onValueChange={(value) => updateField("transitDistance", value === "Alla" ? "" : value)}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {transitDistanceOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </StepField>
                        <StepField label="Avtalsflex" className="sm:w-44">
                          <Select value={draft.contractFlex || "Alla"} onValueChange={(value) => updateField("contractFlex", value === "Alla" ? "" : value)}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {contractFlexOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </StepField>
                        <StepField label="Access" className="sm:w-44">
                          <Select value={draft.accessHours || "Alla"} onValueChange={(value) => updateField("accessHours", value === "Alla" ? "" : value)}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {accessHoursOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </StepField>
                        <StepField label="Parkering" className="sm:w-44">
                          <Select value={draft.parkingType || "Alla"} onValueChange={(value) => updateField("parkingType", value === "Alla" ? "" : value)}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {parkingTypeOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </StepField>
                        <StepField label="Planlösning" className="sm:w-44">
                          <Select value={draft.layoutType || "Alla"} onValueChange={(value) => updateField("layoutType", value === "Alla" ? "" : value)}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {layoutTypeOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </StepField>
                      </StepFields>
                    ) : null}

                    {currentStep.id === "requirements" ? (
                      <StepFields className="gap-2">
                        <label className={checkOptionClass}>
                          <Checkbox checked={Boolean(draft.includeOperatingCosts)} onCheckedChange={(checked) => updateField("includeOperatingCosts", Boolean(checked))} />
                          Driftkostnader ingår
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

                    {currentStep.id === "photos" ? (
                      <div className="mx-auto w-full max-w-xl space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Button type="button" variant="secondary" className="h-auto cursor-pointer gap-1.5 px-3 py-2 text-xs" nativeButton={false} render={<label />}>
                            <UploadIcon className="h-4 w-4" />
                            Ladda upp bilder
                            <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => void handleAddImages(event)} />
                          </Button>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-ink-600">{draft.images.length}/{MAX_IMAGES} bilder</span>
                            {uploadingImages ? <span className="font-semibold text-ink-700">Bearbetar bilder...</span> : null}
                          </div>
                        </div>
                        <p className="text-xs text-ink-600">
                          Första bilden är omslagsfoto. Du kan välja omslag, ändra ordning, ersätta och radera bilder.
                        </p>

                        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
                          {draft.images.map((image, index) => (
                            <div key={image.id} className="space-y-2">
                              <div className="relative">
                                <img src={image.src} alt={image.name || `Bild ${index + 1}`} className="h-36 w-full rounded-xl object-cover ring-1 ring-veil/10" />
                                {index === 0 ? (
                                  <Badge className="h-auto absolute left-2 top-2 rounded-full bg-strong px-2 py-0.5 text-[10px] font-semibold text-on-strong">
                                    Omslagsfoto
                                  </Badge>
                                ) : null}
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap gap-1.5">
                                  {index !== 0 ? (
                                    <Button type="button" variant="outline" className="h-auto rounded-md px-2.5 py-1 text-[11px] font-semibold text-ink-700" onClick={() => setCoverImage(index)}>
                                      Sätt som omslag
                                    </Button>
                                  ) : null}

                                  <Button type="button" variant="outline" className="h-auto cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-semibold text-ink-700" nativeButton={false} render={<label />}>
                                    Ersätt bild
                                    <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleReplaceImage(index, event)} />
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  <Button type="button" variant="outline" className="h-auto rounded-md px-2.5 py-1 text-[11px] font-semibold text-ink-700" onClick={() => moveImage(index, -1)} disabled={index === 0}>
                                    Flytta vänster
                                  </Button>
                                  <Button type="button" variant="outline" className="h-auto rounded-md px-2.5 py-1 text-[11px] font-semibold text-ink-700" onClick={() => moveImage(index, 1)} disabled={index === draft.images.length - 1}>
                                    Flytta höger
                                  </Button>
                                  <Button type="button" variant="outline" className="h-auto rounded-md border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 hover:text-rose-700" onClick={() => removeImage(index)}>
                                    Radera
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {currentStep.id === "amenities" ? (
                      <div className="mx-auto w-full max-w-xl space-y-6">
                        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-[18rem_minmax(0,1fr)]">
                          <div>
                            <FieldLabel>Möblering</FieldLabel>
                            <FurnishingToggle
                              options={furnishedOptions}
                              value={draft.furnished}
                              onChange={(nextValue) => updateField("furnished", nextValue)}
                            />
                          </div>
                          <StepField label="Egna nyckelord">
                            <Input
                              value={draft.additionalAmenities}
                              onChange={(event) => updateField("additionalAmenities", event.target.value)}
                              placeholder="Komma-separerade, t.ex. showroom"
                            />
                          </StepField>
                        </div>

                        <div>
                          <FieldLabel required>Bekvämligheter</FieldLabel>
                          <div className="flex flex-wrap gap-2">
                            {amenityOptions.map((amenity) => {
                              const active = draft.amenities.includes(amenity.value);
                              const Icon = amenity.icon;
                              return (
                                <Button
                                  key={amenity.value}
                                  type="button"
                                  variant="outline"
                                  className={`h-auto rounded-xl px-3 py-2 text-xs font-semibold ${
                                    active
                                      ? "border-strong bg-strong text-on-strong hover:bg-strong/90"
                                      : "border-veil/10 text-ink-700"
                                  }`}
                                  onClick={() => toggleAmenity(amenity.value)}
                                >
                                  <span className="inline-flex items-center gap-1.5">
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {amenity.label}
                                  </span>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {currentStep.id === "description" ? (
                      <StepFields>
                        <StepField label="Beskrivning" required className="max-w-lg">
                          <Textarea
                            className="min-h-36"
                            value={draft.description}
                            onChange={(event) => updateField("description", event.target.value)}
                            placeholder="Beskriv lokalen, planlösning, vad som ingår och varför den passar rätt hyresgäst."
                          />
                        </StepField>
                      </StepFields>
                    ) : null}

                    {currentStep.id === "review" ? (
                      <div className="mx-auto w-full max-w-2xl space-y-6">
                        <p className="text-center text-sm font-semibold text-ink-700">
                          Granska annonsen. När du publicerar blir objektet synligt direkt för hyresgäster.
                        </p>
                        <dl className="grid gap-x-10 text-sm sm:grid-cols-2">
                          {reviewRows.map(([label, value]) => (
                            <div key={label} className="flex items-baseline justify-between gap-4 border-b border-veil/10 py-2.5">
                              <dt className="shrink-0 text-ink-500">{label}</dt>
                              <dd className="min-w-0 break-words text-right font-medium text-ink-900">{value}</dd>
                            </div>
                          ))}
                        </dl>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Beskrivning</p>
                          <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{draft.description || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Bekvämligheter</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {mergeAmenities(draft).map((amenity) => {
                              const Icon = amenityIconFor(amenity);
                              return (
                                <span key={amenity} className={propertyCardAmenityChipClass}>
                                  <Icon className="h-3.5 w-3.5 shrink-0 text-ink-700" />
                                  {amenity}
                                </span>
                              );
                            })}
                            {mergeAmenities(draft).length === 0 ? <span className="text-xs text-ink-500">Inga valda.</span> : null}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {inlineError ? <p role="alert" className="text-center text-sm font-medium text-rose-600">{inlineError}</p> : null}
                    {duplicateWarning ? <p className="text-center text-sm text-amber-700">Liknande annons hittad. Kontrollera rubrik/adress innan publicering.</p> : null}
                  </PublishStage>
                ) : null}
              </div>
            )}
          </div>

          {editingImportItem ? (
            <ImportedListingEditor
              key={editingImportItem.id}
              item={editingImportItem}
              position={importItems.findIndex((entry) => entry.id === editingImportItem.id) + 1}
              total={importItems.length}
              others={app.listings || []}
              app={app}
              onApprove={(nextDraft) => approveImportItem(editingImportItem.id, nextDraft)}
              onClose={() => setEditingImportId(null)}
            />
          ) : null}

          {!publishedListing && mode !== "imported" ? (
            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-surface px-5 py-3">
              <Button type="button" variant="outline" className="h-auto px-4" onClick={close} disabled={busy}>
                Avbryt
              </Button>
              {showSaveDraft ? (
                <Button type="button" variant="secondary" className="h-auto px-4" onClick={() => void saveDraft()} disabled={busy}>
                  <SaveIcon className="mr-1.5 h-4 w-4" />
                  {pending || importBusy ? "Sparar..." : "Spara utkast"}
                </Button>
              ) : <span />}
            </footer>
          ) : null}
        </>
      )}
    </EditorWorkspace>
  );
}

export default PublishPage;
