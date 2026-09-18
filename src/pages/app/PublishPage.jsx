import { useMemo, useState } from "react";
import FurnishingToggle from "../../components/app/FurnishingToggle";
import AdminPanelShell from "../../components/layout/AdminPanelShell";
import FieldLabel from "../../components/app/FieldLabel";
import ListingPreview from "../../components/app/ListingPreview";
import { formatSek, parseAmenities } from "../../lib/formatters";
import { amenityIconFor, propertyAmenityOptions } from "../../lib/propertyAmenityIcons";
import { navigateTo, normalizeAppRole } from "../../lib/router";
import { districtOptions, listingTypes } from "../../data/mockData";
import { ADMIN_NAV_ITEMS, ADMIN_BOTTOM_NAV_ITEMS } from "./AdminPanelPage";
import { BROKER_NAV_ITEMS, BROKER_BOTTOM_NAV_ITEMS } from "./BrokerPanelPage";
import {
  ArrowLeftIcon,
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
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const publishSteps = [
  { id: "basic", label: "Grundinfo" },
  { id: "terms", label: "Villkor" },
  { id: "media", label: "Media & innehåll" },
  { id: "review", label: "Granska & publicera" }
];

const termOptions = ["3 månader", "6 månader", "12 månader", "24 månader", "36 månader", "Flexibelt avtal"];
const availabilityOptions = ["Ledig nu", "Inom 2 veckor", "Inom 1 månad", "Inom 2 månader", "Efter överenskommelse"];
const amenityOptions = propertyAmenityOptions;
const propertyCardAmenityChipClass = "inline-flex min-h-[42px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-black/10 bg-[#ffffff] px-3 py-1.5 text-[0.875rem] font-semibold leading-5 text-ink-700";
const furnishedOptions = [
  { value: "all", label: "Alla" },
  { value: "yes", label: "Möblerad" },
  { value: "no", label: "Omöblerad" }
];
const transitDistanceOptions = ["Alla", "0-3 min", "3-7 min", "7-12 min", "12+ min"];
const contractFlexOptions = ["Alla", "Korttid", "Långtid", "Flexibelt avtal", "Break option"];
const accessHoursOptions = ["Alla", "24/7", "Kontorstid", "Kväll/helg"];
const parkingTypeOptions = ["Alla", "Ingen parkering", "Garage", "Gatuparkering", "Laddplatser"];
const layoutTypeOptions = ["Alla", "Öppet landskap", "Cellkontor", "Hybrid", "Showroom"];
const MAX_IMAGES = 10;
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

const initialDraft = {
  title: "",
  district: "Norrmalm",
  address: "",
  type: "Kontor",
  description: "",
  priceMonthly: "",
  sizeSqm: "",
  capacity: "",
  term: "12 månader",
  availability: "Ledig nu",
  responseHours: "2",
  transitDistance: "",
  moveInDate: "",
  contractFlex: "",
  accessHours: "",
  parkingType: "",
  layoutType: "",
  includeOperatingCosts: false,
  accessibilityAdapted: false,
  ecoCertified: false,
  images: [
    {
      id: "seed-cover",
      src: "/object-images/object-4.jpeg",
      name: "Omslagsbild"
    }
  ],
  amenities: ["Mötesrum", "Fiber", "Kök"],
  additionalAmenities: "",
  furnished: "all"
};

function toNumber(value) {
  return Number(value || 0);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Kunde inte läsa bilden."));
    image.src = src;
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Kunde inte läsa filen."));
    reader.readAsDataURL(file);
  });
}

async function optimizeImageFile(file) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(image.width || 1, image.height || 1));
    const width = Math.max(1, Math.round((image.width || 1) * scale));
    const height = Math.max(1, Math.round((image.height || 1) * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return await readFileAsDataUrl(file);
    }
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch (_error) {
    return await readFileAsDataUrl(file);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function fileToImageEntry(file) {
  const src = await optimizeImageFile(file);
  return {
    id: crypto.randomUUID(),
    src,
    name: file.name || "Uppladdad bild"
  };
}

function mergeAmenities(draft) {
  const textAmenities = parseAmenities(draft.additionalAmenities);
  const furnishedAmenity = draft.furnished === "yes"
    ? ["Möblerad"]
    : draft.furnished === "no"
      ? ["Omöblerad"]
      : [];
  return Array.from(new Set([...(draft.amenities || []), ...textAmenities, ...furnishedAmenity]));
}

function computeQualityScore(draft) {
  let score = 0;
  if (draft.title.trim()) score += 14;
  if (draft.address.trim()) score += 12;
  if (draft.district) score += 8;
  if (draft.type) score += 8;
  if (toNumber(draft.priceMonthly) > 0) score += 14;
  if (toNumber(draft.sizeSqm) > 0) score += 12;
  if (toNumber(draft.capacity) > 0) score += 10;
  if (draft.term) score += 5;
  if (draft.availability) score += 5;
  if (toNumber(draft.responseHours) > 0) score += 4;
  if (draft.transitDistance) score += 3;
  if (draft.moveInDate) score += 3;
  if (draft.contractFlex) score += 3;
  if (draft.accessHours) score += 2;
  if (draft.parkingType) score += 2;
  if (draft.layoutType) score += 2;
  if (draft.includeOperatingCosts) score += 2;
  if (draft.accessibilityAdapted) score += 2;
  if (draft.ecoCertified) score += 2;
  if (draft.description.trim().length >= 40) score += 10;
  if (Array.isArray(draft.images) && draft.images.length > 0) score += 8;
  if (mergeAmenities(draft).length > 0) score += 10;
  return Math.min(100, score);
}

function getStepErrors(stepId, draft) {
  if (stepId === "basic") {
    const missing = [];
    if (!draft.title.trim()) missing.push("Rubrik");
    if (!draft.address.trim()) missing.push("Adress");
    if (!draft.district) missing.push("Område");
    if (!draft.type) missing.push("Typ");
    return missing;
  }

  if (stepId === "terms") {
    const missing = [];
    if (toNumber(draft.priceMonthly) <= 0) missing.push("Månadshyra");
    if (toNumber(draft.sizeSqm) <= 0) missing.push("Storlek");
    if (toNumber(draft.capacity) <= 0) missing.push("Team / platser");
    if (!draft.term) missing.push("Avtalstid");
    if (!draft.availability) missing.push("Tillgänglighet");
    return missing;
  }

  if (stepId === "media") {
    const missing = [];
    if (!Array.isArray(draft.images) || draft.images.length === 0) missing.push("Minst en bild");
    if (!draft.description.trim()) missing.push("Beskrivning");
    if (mergeAmenities(draft).length === 0) missing.push("Minst en bekvämlighet");
    return missing;
  }

  return [];
}

function buildPayload(draft, status = "draft") {
  const imageList = Array.isArray(draft.images) ? draft.images.map((image) => image.src).filter(Boolean) : [];
  return {
    title: draft.title.trim(),
    district: draft.district,
    address: draft.address.trim(),
    type: draft.type,
    description: draft.description.trim(),
    priceMonthly: toNumber(draft.priceMonthly),
    sizeSqm: toNumber(draft.sizeSqm),
    capacity: toNumber(draft.capacity),
    term: draft.term,
    availability: draft.availability,
    responseHours: Math.max(1, toNumber(draft.responseHours || 2)),
    transitDistance: draft.transitDistance || "",
    moveInDate: draft.moveInDate || "",
    contractFlex: draft.contractFlex || "",
    accessHours: draft.accessHours || "",
    parkingType: draft.parkingType || "",
    layoutType: draft.layoutType || "",
    includeOperatingCosts: Boolean(draft.includeOperatingCosts),
    accessibilityAdapted: Boolean(draft.accessibilityAdapted),
    ecoCertified: Boolean(draft.ecoCertified),
    image: imageList[0] || "",
    images: imageList,
    amenities: mergeAmenities(draft),
    status
  };
}

function StepPills({ currentIndex, onSelect }) {
  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {publishSteps.map((step, index) => {
        const active = currentIndex === index;
        const complete = index < currentIndex;
        return (
          <Button
            key={step.id}
            type="button"
            variant="outline"
            className={`h-auto flex-col items-start rounded-2xl px-3 py-2 text-left text-xs font-semibold ${
              active
                ? "border-[#0b0a0e] bg-[#0b0a0e] text-white hover:bg-[#0b0a0e]/90"
                : complete
                  ? "border-[#c8d1de] text-ink-800"
                  : "border-black/10 text-ink-600"
            }`}
            onClick={() => onSelect(index)}
          >
            <span className="opacity-80">Steg {index + 1}</span>
            <p className="mt-0.5">{step.label}</p>
          </Button>
        );
      })}
    </div>
  );
}

function PublishPage({ app, pathname = "/app/publish" }) {
  const { createListing, updateListing, publishListing, pushToast } = app;
  const activeRole = normalizeAppRole(app.user?.role);
  const isCompanyAdmin = activeRole === "company_admin";
  const panelNavItems = isCompanyAdmin ? ADMIN_NAV_ITEMS : BROKER_NAV_ITEMS;
  const panelBottomNavItems = isCompanyAdmin ? ADMIN_BOTTOM_NAV_ITEMS : BROKER_BOTTOM_NAV_ITEMS;
  const myListingsPath = isCompanyAdmin ? "/app/admin/annonser" : "/app/broker/objekt";

  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState(initialDraft);
  const [draftListingId, setDraftListingId] = useState(null);
  const [publishedListing, setPublishedListing] = useState(null);
  const [pending, setPending] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showFaqTips, setShowFaqTips] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [attemptedByStep, setAttemptedByStep] = useState({});

  const currentStep = publishSteps[stepIndex];
  const qualityScore = useMemo(() => computeQualityScore(draft), [draft]);

  const currentErrors = useMemo(() => {
    if (!attemptedByStep[currentStep.id]) {
      return [];
    }
    return getStepErrors(currentStep.id, draft);
  }, [attemptedByStep, currentStep.id, draft]);

  const firstInvalidStepIndex = useMemo(() => {
    for (let index = 0; index < publishSteps.length - 1; index += 1) {
      const errors = getStepErrors(publishSteps[index].id, draft);
      if (errors.length > 0) {
        return index;
      }
    }
    return null;
  }, [draft]);

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

  async function saveDraft() {
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
      pushToast("Utkast sparat.", "success");
    } catch (error) {
      setFeedback(error.message || "Kunde inte spara utkastet.");
    } finally {
      setPending(false);
    }
  }

  function handleNextStep() {
    if (stepIndex >= publishSteps.length - 1) {
      return;
    }

    const errors = getStepErrors(currentStep.id, draft);
    if (errors.length > 0) {
      markStepAttempt(currentStep.id);
      setFeedback(`Fyll i obligatoriska fält: ${errors.join(", ")}.`);
      return;
    }

    setFeedback("");
    setStepIndex((index) => Math.min(index + 1, publishSteps.length - 1));
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
    setDraft(initialDraft);
    setDraftListingId(null);
    setPublishedListing(null);
    setPending(false);
    setUploadingImages(false);
    setFeedback("");
    setDuplicateWarning(false);
    setAttemptedByStep({});
    setStepIndex(0);
  }

  return (
    <AdminPanelShell
      pathname={myListingsPath}
      navItems={panelNavItems}
      bottomNavItems={panelBottomNavItems}
      sectionTitle="Publicera annons"
      onLogout={app?.logout}
    >
      <div className="space-y-5">
        <header className="px-1 py-1">
          <Button
            type="button"
            variant="ghost"
            className="mb-2 h-auto gap-1.5 px-0 text-sm font-semibold text-ink-700 hover:bg-transparent hover:text-[#0b0a0e]"
            onClick={() => navigateTo(myListingsPath)}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Tillbaka till mina lokaler
          </Button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Annonsflöde</p>
              <h1 className="mt-1 text-2xl font-semibold">Publicera annons</h1>
              <p className="mt-2 text-sm text-ink-600">
                Lägg upp en komplett annons steg för steg. Utkast sparas löpande och du publicerar när allt är klart.
              </p>
            </div>
          </div>
        </header>

        <div className={publishedListing ? "grid items-start gap-4" : "grid items-start gap-4 xl:grid-cols-[1.35fr_0.9fr]"}>
          <div className="space-y-4">
          <article className="surface self-start p-4 sm:p-5">
            {!publishedListing ? (
              <StepPills
                currentIndex={stepIndex}
                onSelect={(index) => {
                  if (index <= stepIndex) {
                    setStepIndex(index);
                    return;
                  }
                  const errors = getStepErrors(currentStep.id, draft);
                  if (errors.length > 0) {
                    markStepAttempt(currentStep.id);
                    setFeedback(`Fyll i obligatoriska fält i "${currentStep.label}" innan du går vidare.`);
                    return;
                  }
                  setFeedback("");
                  setStepIndex(index);
                }}
              />
            ) : null}

            {!publishedListing ? (
              <div className="mt-5 space-y-5">
                {currentStep.id === "basic" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <FieldLabel required>Rubrik</FieldLabel>
                      <Input value={draft.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Ex. Modernt kontor nära T-centralen" />
                    </label>
                    <label>
                      <FieldLabel required>Område</FieldLabel>
                      <Select value={draft.district} onValueChange={(value) => updateField("district", value)}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {districtOptions.map((district) => <SelectItem key={district} value={district}>{district}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </label>
                    <label>
                      <FieldLabel required>Typ</FieldLabel>
                      <Select value={draft.type} onValueChange={(value) => updateField("type", value)}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {listingTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </label>
                    <label className="sm:col-span-2">
                      <FieldLabel required>Adress</FieldLabel>
                      <Input value={draft.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Ex. Kungsgatan 12, Stockholm" />
                    </label>
                  </div>
                ) : null}

                {currentStep.id === "terms" ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <label>
                        <FieldLabel required>Månadshyra</FieldLabel>
                        <Input type="number" min="0" value={draft.priceMonthly} onChange={(event) => updateField("priceMonthly", event.target.value)} placeholder="Ex. 75000" />
                      </label>
                      <label>
                        <FieldLabel required>Storlek (kvm)</FieldLabel>
                        <Input type="number" min="0" value={draft.sizeSqm} onChange={(event) => updateField("sizeSqm", event.target.value)} placeholder="Ex. 180" />
                      </label>
                      <label>
                        <FieldLabel required>Team / platser</FieldLabel>
                        <Input type="number" min="1" value={draft.capacity} onChange={(event) => updateField("capacity", event.target.value)} placeholder="Ex. 16" />
                      </label>
                      <label>
                        <FieldLabel required>Avtalstid</FieldLabel>
                        <Select value={draft.term} onValueChange={(value) => updateField("term", value)}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {termOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </label>
                      <label>
                        <FieldLabel required>Tillgänglighet</FieldLabel>
                        <Select value={draft.availability} onValueChange={(value) => updateField("availability", value)}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {availabilityOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </label>
                      <label>
                        <FieldLabel>Svarstid (timmar)</FieldLabel>
                        <Input type="number" min="1" value={draft.responseHours} onChange={(event) => updateField("responseHours", event.target.value)} placeholder="Ex. 2" />
                      </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <label>
                        <FieldLabel>Inflyttning</FieldLabel>
                        <Input type="date" value={draft.moveInDate || ""} onChange={(event) => updateField("moveInDate", event.target.value)} />
                      </label>
                      <label>
                        <FieldLabel>Kommunaltrafik</FieldLabel>
                        <Select value={draft.transitDistance || "Alla"} onValueChange={(value) => updateField("transitDistance", value === "Alla" ? "" : value)}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {transitDistanceOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </label>
                      <label>
                        <FieldLabel>Avtalsflex</FieldLabel>
                        <Select value={draft.contractFlex || "Alla"} onValueChange={(value) => updateField("contractFlex", value === "Alla" ? "" : value)}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {contractFlexOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </label>
                      <label>
                        <FieldLabel>Access</FieldLabel>
                        <Select value={draft.accessHours || "Alla"} onValueChange={(value) => updateField("accessHours", value === "Alla" ? "" : value)}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {accessHoursOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </label>
                      <label>
                        <FieldLabel>Parkering</FieldLabel>
                        <Select value={draft.parkingType || "Alla"} onValueChange={(value) => updateField("parkingType", value === "Alla" ? "" : value)}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {parkingTypeOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </label>
                      <label>
                        <FieldLabel>Planlösning</FieldLabel>
                        <Select value={draft.layoutType || "Alla"} onValueChange={(value) => updateField("layoutType", value === "Alla" ? "" : value)}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {layoutTypeOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </label>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <label className="inline-flex h-[46px] items-center gap-2 rounded-2xl border border-black/10 bg-[#ffffff] px-3 text-xs font-semibold text-ink-700">
                        <Checkbox checked={Boolean(draft.includeOperatingCosts)} onCheckedChange={(checked) => updateField("includeOperatingCosts", Boolean(checked))} />
                        Driftkostn. ingår
                      </label>
                      <label className="inline-flex h-[46px] items-center gap-2 rounded-2xl border border-black/10 bg-[#ffffff] px-3 text-xs font-semibold text-ink-700">
                        <Checkbox checked={Boolean(draft.accessibilityAdapted)} onCheckedChange={(checked) => updateField("accessibilityAdapted", Boolean(checked))} />
                        Tillgänglighetsanp.
                      </label>
                      <label className="inline-flex h-[46px] items-center gap-2 rounded-2xl border border-black/10 bg-[#ffffff] px-3 text-xs font-semibold text-ink-700">
                        <Checkbox checked={Boolean(draft.ecoCertified)} onCheckedChange={(checked) => updateField("ecoCertified", Boolean(checked))} />
                        Miljöcertifierad
                      </label>
                    </div>
                  </div>
                ) : null}

                {currentStep.id === "media" ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-black/10 bg-[#ffffff] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Button type="button" variant="secondary" className="h-auto cursor-pointer gap-1.5 px-3 py-2 text-xs" render={<label />}>
                          <UploadIcon className="h-4 w-4" />
                          Ladda upp bilder
                          <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => void handleAddImages(event)} />
                        </Button>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-ink-600">{draft.images.length}/{MAX_IMAGES} bilder</span>
                          {uploadingImages ? <span className="font-semibold text-ink-700">Bearbetar bilder...</span> : null}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-ink-600">
                        Första bilden är omslagsfoto. Du kan välja omslag, ändra ordning, ersätta och radera bilder.
                      </p>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {draft.images.map((image, index) => (
                          <article key={image.id} className="rounded-2xl border border-black/10 bg-[#ffffff] p-2.5">
                            <div className="relative">
                              <img src={image.src} alt={image.name || `Bild ${index + 1}`} className="h-32 w-full rounded-xl border border-black/10 object-cover" />
                              {index === 0 ? (
                                <Badge className="h-auto absolute left-2 top-2 rounded-full bg-[#0b0a0e] px-2 py-0.5 text-[10px] font-semibold text-white">
                                  Omslagsfoto
                                </Badge>
                              ) : null}
                            </div>
                            <div className="mt-2 space-y-1.5">
                              <div className="flex flex-wrap gap-1.5">
                                {index !== 0 ? (
                                  <Button type="button" variant="outline" className="h-auto rounded-xl px-2.5 py-1 text-[11px] font-semibold text-ink-700" onClick={() => setCoverImage(index)}>
                                    Sätt som omslag
                                  </Button>
                                ) : null}

                                <Button type="button" variant="outline" className="h-auto cursor-pointer rounded-xl px-2.5 py-1 text-[11px] font-semibold text-ink-700" render={<label />}>
                                  Ersätt bild
                                  <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleReplaceImage(index, event)} />
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                <Button type="button" variant="outline" className="h-auto rounded-xl px-2.5 py-1 text-[11px] font-semibold text-ink-700" onClick={() => moveImage(index, -1)} disabled={index === 0}>
                                  Flytta vänster
                                </Button>
                                <Button type="button" variant="outline" className="h-auto rounded-xl px-2.5 py-1 text-[11px] font-semibold text-ink-700" onClick={() => moveImage(index, 1)} disabled={index === draft.images.length - 1}>
                                  Flytta höger
                                </Button>
                                <Button type="button" variant="outline" className="h-auto rounded-xl border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 hover:text-rose-700" onClick={() => removeImage(index)}>
                                  Radera
                                </Button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Möblering</FieldLabel>
                        <FurnishingToggle
                          options={furnishedOptions}
                          value={draft.furnished}
                          onChange={(nextValue) => updateField("furnished", nextValue)}
                        />
                      </div>
                      <label>
                        <FieldLabel>Egna nyckelord (komma-separerat)</FieldLabel>
                        <Input
                          value={draft.additionalAmenities}
                          onChange={(event) => updateField("additionalAmenities", event.target.value)}
                          placeholder="Ex. showroom, takterrass, säkerhetsdörr"
                        />
                      </label>
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
                                  ? "border-[#0b0a0e] bg-[#0b0a0e] text-white hover:bg-[#0b0a0e]/90"
                                  : "border-black/10 text-ink-700"
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

                    <label className="mt-2 block">
                      <FieldLabel required>Beskrivning</FieldLabel>
                      <Textarea
                        className="min-h-32"
                        value={draft.description}
                        onChange={(event) => updateField("description", event.target.value)}
                        placeholder="Beskriv lokalen, planlösning, vad som ingår och varför den passar rätt hyresgäst."
                      />
                    </label>
                  </div>
                ) : null}

                {currentStep.id === "review" ? (
                  <div className="space-y-4 rounded-2xl border border-black/10 bg-[#ffffff] p-4">
                    <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2 text-sm font-semibold text-ink-700">
                      Granska annonsen. När du publicerar blir objektet synligt direkt för hyresgäster.
                    </div>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2"><span className="text-ink-500">Rubrik:</span> {draft.title || "-"}</div>
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2"><span className="text-ink-500">Område:</span> {draft.district || "-"}</div>
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2"><span className="text-ink-500">Typ:</span> {draft.type || "-"}</div>
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2"><span className="text-ink-500">Yta:</span> {draft.sizeSqm || "-"} kvm</div>
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2"><span className="text-ink-500">Team:</span> {draft.capacity || "-"} platser</div>
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2"><span className="text-ink-500">Inflyttning:</span> {draft.moveInDate || "-"}</div>
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2"><span className="text-ink-500">Kommunaltrafik:</span> {draft.transitDistance || "-"}</div>
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2"><span className="text-ink-500">Avtalsflex:</span> {draft.contractFlex || "-"}</div>
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2"><span className="text-ink-500">Access:</span> {draft.accessHours || "-"}</div>
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2"><span className="text-ink-500">Parkering:</span> {draft.parkingType || "-"}</div>
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2"><span className="text-ink-500">Planlösning:</span> {draft.layoutType || "-"}</div>
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2"><span className="text-ink-500">Driftkostn. ingår:</span> {draft.includeOperatingCosts ? "Ja" : "Nej"}</div>
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2"><span className="text-ink-500">Tillgänglighetsanp.:</span> {draft.accessibilityAdapted ? "Ja" : "Nej"}</div>
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2"><span className="text-ink-500">Miljöcertifierad:</span> {draft.ecoCertified ? "Ja" : "Nej"}</div>
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2"><span className="text-ink-500">Bilder:</span> {draft.images.length}</div>
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2"><span className="text-ink-500">Omslagsfoto:</span> {draft.images[0]?.name || "Valt"}</div>
                    </div>
                    <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Beskrivning</p>
                      <p className="mt-1 text-ink-700">{draft.description || "-"}</p>
                    </div>
                    <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2">
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

                {feedback ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{feedback}</p> : null}
                {currentErrors.length > 0 ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">Saknade fält: {currentErrors.join(", ")}.</p> : null}
                {duplicateWarning ? <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Liknande annons hittad. Kontrollera rubrik/adress innan publicering.</p> : null}

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/10 pt-4">
                  {stepIndex > 0 ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-auto px-4"
                      onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
                      disabled={pending}
                    >
                      Föregående
                    </Button>
                  ) : null}

                  <div className="ml-auto flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" className="h-auto px-4" onClick={() => void saveDraft()} disabled={pending || uploadingImages}>
                      <SaveIcon className="mr-1.5 h-4 w-4" />
                      {pending ? "Sparar..." : "Spara utkast"}
                    </Button>

                    {currentStep.id !== "review" ? (
                      <Button type="button" className="h-auto px-4" onClick={handleNextStep} disabled={pending || uploadingImages}>
                        Nästa steg
                      </Button>
                    ) : (
                      <Button type="button" className="h-auto px-4" onClick={() => void handlePublish()} disabled={pending || uploadingImages}>
                        <BuildingIcon className="mr-1.5 h-4 w-4" />
                        {pending ? "Publicerar..." : "Publicera annons"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-[#ffffff] p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <CheckBadgeIcon className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Publicerad</p>
                      <h2 className="mt-1 text-3xl font-semibold leading-tight text-[#0b0a0e]">Annonsen är publicerad</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-700">
                        Objektet är nu aktivt i sökflödet och kan ses av hyresgäster. Förhandsgranskningen nedan visar hur annonsen presenteras.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="h-auto shrink-0 px-5"
                    onClick={() => navigateTo(`/app/listings/${encodeURIComponent(publishedListing.id)}`)}
                  >
                    Visa annons live
                    <ExternalLinkIcon className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(280px,0.45fr)]">
                  <article className="rounded-3xl border border-black/10 bg-[#ffffff] p-4 sm:p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Förhandsgranskning</p>
                        <h3 className="mt-1 text-xl font-semibold text-[#0b0a0e]">Publicerad annons</h3>
                      </div>
                      <Badge variant="outline" className="h-auto rounded-full bg-[#ffffff] px-3 py-1 text-xs font-semibold text-ink-700">
                        Kvalitet {qualityScore}
                      </Badge>
                    </div>
                    <ListingPreview draft={draft} />
                  </article>

                  <aside className="rounded-3xl border border-black/10 bg-[#ffffff] p-4 sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Nästa steg</p>
                    <h3 className="mt-1 text-lg font-semibold text-[#0b0a0e]">Annonsen är live</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-700">
                      Du kan öppna den publika sidan, gå tillbaka till dina objekt eller skapa en ny annons.
                    </p>
                    <div className="mt-5 grid gap-2">
                      <Button
                        type="button"
                        className="h-auto w-full px-4"
                        onClick={() => navigateTo(`/app/listings/${encodeURIComponent(publishedListing.id)}`)}
                      >
                        Visa annons live
                      </Button>
                      <Button type="button" variant="secondary" className="h-auto w-full px-4" onClick={() => navigateTo(myListingsPath)}>
                        Gå till mina objekt
                      </Button>
                      <Button type="button" variant="secondary" className="h-auto w-full px-4" onClick={resetFlow}>
                        Publicera ytterligare annons
                      </Button>
                    </div>
                  </aside>
                </div>
              </div>
            )}
          </article>

            {!publishedListing ? (
            <article className="surface p-4">
              <Accordion
                value={showFaqTips ? ["faq-tips"] : []}
                onValueChange={(next) => setShowFaqTips(next.length > 0)}
              >
                <AccordionItem value="faq-tips" className="border-b-0">
                  <AccordionTrigger className="items-center p-0 hover:no-underline [&>svg]:hidden">
                    <h3 className="text-base font-semibold">FAQ och tips</h3>
                    <span
                      aria-hidden="true"
                      className="ui-chevron transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-180"
                    />
                  </AccordionTrigger>
                  <AccordionContent className="p-0">
                    <div className="grid gap-3 pt-3 sm:grid-cols-2">
                      {publishFaqItems.slice(0, 4).map((item) => (
                        <div key={item.q} className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2.5">
                          <p className="text-xs font-semibold text-ink-900">{item.q}</p>
                          <p className="mt-1 text-xs text-ink-600">{item.a}</p>
                        </div>
                      ))}
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2.5">
                        <p className="text-xs font-semibold text-ink-900">{publishFaqItems[4].q}</p>
                        <p className="mt-1 text-xs text-ink-600">{publishFaqItems[4].a}</p>
                      </div>
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2.5">
                        <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-700">
                          Snabba tips
                          <LightbulbIcon className="h-4 w-4 text-[#0b0a0e]" />
                        </p>
                        <ul className="mt-2 space-y-1.5 text-xs text-ink-600">
                          {publishTips.map((tip) => (
                            <li key={tip}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </article>
            ) : null}
          </div>

          {!publishedListing ? (
          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <article className="surface p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-semibold text-[#0b0a0e]">Förhandsvisning</h3>
                <div className="min-w-[120px] rounded-xl border border-black/10 bg-[#ffffff] px-2.5 py-2">
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Kvalitet</span>
                    <span className="text-base font-semibold leading-none text-ink-900">{qualityScore}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#dce3ef]">
                    <div className="h-full rounded-full bg-[#0b0a0e]" style={{ width: `${qualityScore}%` }} />
                  </div>
                </div>
              </div>
              <ListingPreview draft={draft} />
            </article>
          </aside>
          ) : null}
        </div>
      </div>
    </AdminPanelShell>
  );
}

export default PublishPage;
