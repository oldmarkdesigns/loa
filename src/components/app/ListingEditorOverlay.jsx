import EditorWorkspace from "../layout/EditorWorkspace";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useMemo, useState } from "react";
import { CalendarDays, Coins, FileText, Images, Info, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "cn";
import ListingAssistant from "./ListingAssistant";
import FieldLabel from "./FieldLabel";
import FurnishingToggle from "./FurnishingToggle";
import { CheckOption, ChoiceSelect, Field, UnitInput } from "./ListingFields";
import { UploadIcon, XIcon } from "../icons/UiIcons";
import { districtOptions, listingTypes } from "../../data/mockData";
import { parseAmenities } from "../../lib/formatters";
import { fieldTargets } from "../../lib/listingAssistant";
import { MAX_IMAGES, fileToImageEntry } from "../../lib/listingImages";
import { accessHoursOptions, availabilityOptions, contractFlexOptions, furnishedOptions, layoutTypeOptions, parkingTypeOptions, termOptions, transitDistanceOptions } from "../../lib/listingOptions";
import { amenityOptions, listFromDelimitedValue, normalizeAmenity } from "../../lib/profileHelpers";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// "Redigera objekt" offers every field "Publicera annons" asks for, grouped into the categories of the sidebar.

const furnishedMarkers = { möblerad: "yes", omöblerad: "no" };

function imagesOf(listing) {
  const listed = (Array.isArray(listing.images) ? listing.images : []).map((image) => (typeof image === "string" ? image : image?.url)).filter(Boolean);
  const urls = listed.length > 0 ? listed : listing.image ? [listing.image] : [];
  return urls.map((src, index) => ({ id: `image-${index}`, src, name: `Bild ${index + 1}` }));
}

function buildDraft(listing) {
  const stored = Array.isArray(listing.amenities) ? listing.amenities : [];
  const known = new Set(amenityOptions.map((option) => normalizeAmenity(option.value)));
  const marker = stored.map(normalizeAmenity).find((item) => item in furnishedMarkers);
  return {
    title: listing.title || "",
    type: listing.type || "Kontor",
    district: listing.district || "Norrmalm",
    address: listing.address || "",
    sizeSqm: String(listing.sizeSqm || ""),
    capacity: String(listing.capacity || ""),
    priceMonthly: String(listing.priceMonthly || ""),
    term: listing.term || "12 månader",
    contractFlex: listing.contractFlex || "",
    includeOperatingCosts: Boolean(listing.includeOperatingCosts),
    availability: listing.availability || "Ledig nu",
    moveInDate: listing.moveInDate || "",
    responseHours: String(listing.responseHours ?? 2),
    transitDistance: listing.transitDistance || "",
    accessHours: listing.accessHours || "",
    parkingType: listing.parkingType || "",
    layoutType: listing.layoutType || "",
    accessibilityAdapted: Boolean(listing.accessibilityAdapted),
    ecoCertified: Boolean(listing.ecoCertified),
    furnished: marker ? furnishedMarkers[marker] : "all",
    amenities: stored.filter((item) => known.has(normalizeAmenity(item))).join(", "),
    additionalAmenities: stored.filter((item) => !known.has(normalizeAmenity(item)) && !(normalizeAmenity(item) in furnishedMarkers)).join(", "),
    description: listing.description || "",
    images: imagesOf(listing)
  };
}

/** What gets saved: the fields of the form, in the shape the backend stores them. */
function payloadFromDraft(draft) {
  const images = draft.images.map((image) => image.src).filter(Boolean);
  const furnishedMarker = draft.furnished === "yes" ? ["Möblerad"] : draft.furnished === "no" ? ["Omöblerad"] : [];
  return {
    title: draft.title.trim(),
    type: draft.type,
    district: draft.district,
    address: draft.address.trim(),
    sizeSqm: Number(draft.sizeSqm || 0),
    capacity: Number(draft.capacity || 0),
    priceMonthly: Number(draft.priceMonthly || 0),
    term: draft.term,
    contractFlex: draft.contractFlex,
    includeOperatingCosts: Boolean(draft.includeOperatingCosts),
    availability: draft.availability,
    moveInDate: draft.moveInDate,
    responseHours: Math.max(1, Number(draft.responseHours || 2)),
    transitDistance: draft.transitDistance,
    accessHours: draft.accessHours,
    parkingType: draft.parkingType,
    layoutType: draft.layoutType,
    accessibilityAdapted: Boolean(draft.accessibilityAdapted),
    ecoCertified: Boolean(draft.ecoCertified),
    amenities: Array.from(new Set([...parseAmenities(draft.amenities), ...parseAmenities(draft.additionalAmenities), ...furnishedMarker])),
    description: draft.description.trim(),
    image: images[0] || "",
    images
  };
}

/** The form back in the shape of a draft in "Publicera annons"; anything the form does not hold is kept from `base`. */
export function publishDraftFromEditorDraft(draft, base = {}) {
  return {
    ...base,
    title: draft.title,
    type: draft.type,
    district: draft.district,
    address: draft.address,
    sizeSqm: draft.sizeSqm,
    capacity: draft.capacity,
    priceMonthly: draft.priceMonthly,
    term: draft.term,
    contractFlex: draft.contractFlex,
    includeOperatingCosts: draft.includeOperatingCosts,
    availability: draft.availability,
    moveInDate: draft.moveInDate,
    responseHours: draft.responseHours,
    transitDistance: draft.transitDistance,
    accessHours: draft.accessHours,
    parkingType: draft.parkingType,
    layoutType: draft.layoutType,
    accessibilityAdapted: draft.accessibilityAdapted,
    ecoCertified: draft.ecoCertified,
    furnished: draft.furnished,
    amenities: parseAmenities(draft.amenities),
    additionalAmenities: draft.additionalAmenities,
    description: draft.description,
    images: draft.images
  };
}

// Comparing whole drafts would mean comparing every image's data URL on each keystroke.
const signatureOf = (draft) => JSON.stringify({ ...draft, images: draft.images.map((image) => [image.id, image.src.length, image.src.slice(-24)]) });

/** `save(draft)` replaces the default saving of the listing, for a listing that is not stored yet (an import waiting for approval). */
export function useListingEditorState(listing, app, { onMutated, save } = {}) {
  const { updateListing, deleteListing, publishListing } = app;
  const [draft, setDraft] = useState(() => buildDraft(listing));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedSignature, setSavedSignature] = useState(() => signatureOf(buildDraft(listing)));
  const [tab, setTab] = useState("details");
  const [uploadingImages, setUploadingImages] = useState(false);
  const signature = useMemo(() => signatureOf(draft), [draft]);
  const dirty = signature !== savedSignature;

  const selectedAmenities = useMemo(() => listFromDelimitedValue(draft.amenities), [draft.amenities]);

  /** Saves the form, or `nextDraft` when the change has only just been made and the state has not caught up. Resolves to whether it worked. */
  async function saveChanges(nextDraft) {
    const target = nextDraft && typeof nextDraft.title === "string" ? nextDraft : draft;
    setSaveError("");
    if (
      !target.title.trim() ||
      ![target.sizeSqm, target.priceMonthly, target.capacity || "0"].every((value) => Number.isFinite(Number(value)) && Number(value) >= 0)
    ) {
      setSaveError("Ange en titel och giltiga positiva värden för yta, hyra och platser.");
      return false;
    }
    setSaving(true);
    try {
      if (save) {
        await save(target);
        setSavedSignature(signatureOf(target));
      } else {
        await updateListing(listing.id, payloadFromDraft(target));
        setSavedSignature(signatureOf(target));
        app.pushToast("Objekt uppdaterat.", "success");
        await onMutated?.();
      }
      return true;
    } catch (error) {
      setSaveError(error.message || "Kunde inte spara objektet.");
      app.pushToast(error.message || "Kunde inte spara objektet.", "error");
      return false;
    } finally {
      setSaving(false);
    }
  }

  /** Opens the tab a field lives on, moves to the field and outlines it for a moment. */
  function focusField(field) {
    const target = fieldTargets[field];
    if (!target) return;
    setTab(target.tab);
    window.setTimeout(() => {
      const element = document.querySelector(`[data-field="${field}"]`);
      if (!element) return;
      element.scrollIntoView({ block: "center", behavior: "smooth" });
      if (element.matches("input, textarea")) element.focus({ preventScroll: true });
      element.setAttribute("data-flash", "true");
      window.setTimeout(() => element.removeAttribute("data-flash"), 1600);
    }, 80);
  }

  async function toggleStatus() {
    await updateListing(listing.id, { status: listing.status === "active" ? "draft" : "active" });
    app.pushToast(listing.status === "active" ? "Objekt dolt." : "Objekt aktiverat.", "info");
    await onMutated?.();
  }

  async function removeListing() {
    await deleteListing(listing.id);
    app.pushToast("Objekt raderat.", "info");
    await onMutated?.();
  }

  async function publish() {
    await publishListing(listing.id);
    await onMutated?.();
  }

  async function addImages(event) {
    const picked = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/"));
    event.target.value = "";
    if (picked.length === 0) return;
    const room = Math.max(0, MAX_IMAGES - draft.images.length);
    if (room === 0) {
      app.pushToast(`Max ${MAX_IMAGES} bilder kan laddas upp.`, "info");
      return;
    }
    setUploadingImages(true);
    try {
      const entries = await Promise.all(picked.slice(0, room).map((file) => fileToImageEntry(file)));
      setDraft((prev) => ({ ...prev, images: [...prev.images, ...entries].slice(0, MAX_IMAGES) }));
    } catch (error) {
      app.pushToast(error.message || "Kunde inte läsa bilden.", "error");
    } finally {
      setUploadingImages(false);
    }
  }

  async function replaceImage(index, event) {
    const file = Array.from(event.target.files || []).find((entry) => entry.type.startsWith("image/"));
    event.target.value = "";
    if (!file) return;
    setUploadingImages(true);
    try {
      const entry = await fileToImageEntry(file);
      setDraft((prev) => ({ ...prev, images: prev.images.map((image, position) => (position === index ? entry : image)) }));
    } catch (error) {
      app.pushToast(error.message || "Kunde inte läsa bilden.", "error");
    } finally {
      setUploadingImages(false);
    }
  }

  function moveImage(index, direction) {
    setDraft((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.images.length) return prev;
      const images = [...prev.images];
      [images[index], images[target]] = [images[target], images[index]];
      return { ...prev, images };
    });
  }

  function setCoverImage(index) {
    setDraft((prev) => ({ ...prev, images: [prev.images[index], ...prev.images.filter((_, position) => position !== index)] }));
  }

  function removeImage(index) {
    setDraft((prev) => ({ ...prev, images: prev.images.filter((_, position) => position !== index) }));
  }

  function toggleAmenity(value) {
    setDraft((prev) => {
      const currentList = listFromDelimitedValue(prev.amenities);
      const normalizedTarget = normalizeAmenity(value);
      const hasAmenity = currentList.some((item) => normalizeAmenity(item) === normalizedTarget);
      const nextList = hasAmenity ? currentList.filter((item) => normalizeAmenity(item) !== normalizedTarget) : [...currentList, value];
      return { ...prev, amenities: nextList.join(", ") };
    });
  }

  return {
    draft,
    dirty,
    saveError,
    setDraft,
    saving,
    uploadingImages,
    selectedAmenities,
    tab,
    setTab,
    focusField,
    saveChanges,
    toggleStatus,
    removeListing,
    publish,
    addImages,
    replaceImage,
    moveImage,
    setCoverImage,
    removeImage,
    toggleAmenity
  };
}

const categories = [
  { id: "details", label: "Grunduppgifter", Icon: Info },
  { id: "pricing", label: "Hyra & avtal", Icon: Coins },
  { id: "availability", label: "Tillgänglighet", Icon: CalendarDays },
  { id: "location", label: "Läge & vardag", Icon: MapPin },
  { id: "terms", label: "Villkor", Icon: ShieldCheck },
  { id: "amenities", label: "Bekvämligheter", Icon: Sparkles },
  { id: "media", label: "Bilder", Icon: Images },
  { id: "description", label: "Beskrivning", Icon: FileText }
];

/** Which categories still lack something the publish flow asks for. */
function categoryIssues(draft) {
  return {
    details: !draft.title.trim() || !draft.address.trim() || !(Number(draft.sizeSqm) > 0) || !(Number(draft.capacity) > 0),
    pricing: !(Number(draft.priceMonthly) > 0) || !draft.term,
    availability: !draft.availability,
    amenities: parseAmenities(draft.amenities).length + parseAmenities(draft.additionalAmenities).length === 0,
    media: draft.images.length === 0,
    description: !draft.description.trim()
  };
}

const cardClass = "gap-0 py-0 p-4 sm:p-5";

function CardHead({ eyebrow, title, hint }) {
  return (
    <>
      <p className="text-[11px] font-semibold text-ink-500">{eyebrow}</p>
      <h2 className="mt-0.5 text-lg font-semibold text-strong">{title}</h2>
      {hint ? <p className="mt-1 text-sm text-ink-600">{hint}</p> : null}
    </>
  );
}

const imageButtonClass = "h-auto rounded-md px-2.5 py-1 text-[11px] font-semibold text-ink-700";

export function ListingEditorSections({ listing, editor }) {
  const { draft, setDraft, selectedAmenities, toggleAmenity } = editor;
  const sidebar = useMediaQuery("(min-width: 1024px)");
  const issues = categoryIssues(draft);
  const set = (key) => (value) => setDraft((prev) => ({ ...prev, [key]: value }));
  const onInput = (key) => (event) => set(key)(event.target.value);

  return (
    <Tabs value={editor.tab} onValueChange={editor.setTab} orientation={sidebar ? "vertical" : "horizontal"} className="min-h-0 min-w-0 flex-1 gap-0">
      <div className="shrink-0 border-b border-veil/10 bg-surface lg:w-[248px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <p className="hidden px-5 pt-5 text-[11px] font-semibold text-ink-500 lg:block">Kategorier</p>
        <TabsList aria-label="Objektets innehåll" className="!h-auto w-full max-w-full justify-start gap-1 overflow-x-auto bg-transparent p-3 lg:flex-col lg:items-stretch lg:overflow-visible">
          {categories.map(({ id, label, Icon }) => (
            <TabsTrigger key={id} value={id} className="!h-10 flex-none shrink-0 justify-start gap-2.5 px-3 text-sm font-semibold lg:w-full">
              <Icon aria-hidden="true" className="h-4 w-4" />
              <span className="truncate">{label}</span>
              {issues[id] ? <span role="img" aria-label="Uppgifter saknas" className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" /> : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-canvas p-5 sm:p-8">
        <fieldset disabled={editor.saving} className="mx-auto min-w-0 max-w-3xl">
          <TabsContent value="details">
            <Card className={cardClass}>
              <CardHead eyebrow="Detaljer" title="Grunduppgifter" />
              <div className="mt-4 grid gap-4">
                <Field label="Titel" required>
                  <Input data-field="title" value={draft.title} onChange={onInput("title")} placeholder="Ex. Modernt kontor nära T-centralen" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Typ" required>
                    <ChoiceSelect data-field="type" value={draft.type} options={listingTypes} onChange={set("type")} />
                  </Field>
                  <Field label="Område" required>
                    <ChoiceSelect data-field="district" value={draft.district} options={districtOptions} onChange={set("district")} />
                  </Field>
                </div>
                <Field label="Adress" required>
                  <Input data-field="address" value={draft.address} onChange={onInput("address")} placeholder="Ex. Kungsgatan 12, Stockholm" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Storlek" required>
                    <UnitInput data-field="sizeSqm" unit="kvm" min="0" value={draft.sizeSqm} onChange={onInput("sizeSqm")} />
                  </Field>
                  <Field label="Team / platser" required>
                    <Input data-field="capacity" type="number" min="0" inputMode="numeric" value={draft.capacity} onChange={onInput("capacity")} />
                  </Field>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <Card className={cardClass}>
              <CardHead eyebrow="Ekonomi" title="Hyra & avtal" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Månadshyra" required>
                  <UnitInput data-field="priceMonthly" unit="kr/mån" min="0" value={draft.priceMonthly} onChange={onInput("priceMonthly")} />
                </Field>
                <Field label="Avtalstid" required>
                  <ChoiceSelect data-field="term" value={draft.term} options={termOptions} onChange={set("term")} />
                </Field>
                <Field label="Avtalsflex">
                  <ChoiceSelect data-field="contractFlex" value={draft.contractFlex} options={contractFlexOptions} emptyLabel="Alla" onChange={set("contractFlex")} />
                </Field>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="availability">
            <Card className={cardClass}>
              <CardHead eyebrow="Inflyttning" title="Tillgänglighet" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Tillgänglighet" required>
                  <ChoiceSelect data-field="availability" value={draft.availability} options={availabilityOptions} onChange={set("availability")} />
                </Field>
                <Field label="Inflyttning">
                  <Input data-field="moveInDate" type="date" value={draft.moveInDate} onChange={onInput("moveInDate")} />
                </Field>
                <Field label="Svarstid">
                  <UnitInput data-field="responseHours" unit="tim" min="1" value={draft.responseHours} onChange={onInput("responseHours")} />
                </Field>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="location">
            <Card className={cardClass}>
              <CardHead eyebrow="Vardagen" title="Läge & vardag" hint="Vad hyresgästen behöver veta om kommunikationer, access, parkering och planlösning." />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Kommunaltrafik">
                  <ChoiceSelect data-field="transitDistance" value={draft.transitDistance} options={transitDistanceOptions} emptyLabel="Alla" onChange={set("transitDistance")} />
                </Field>
                <Field label="Access">
                  <ChoiceSelect data-field="accessHours" value={draft.accessHours} options={accessHoursOptions} emptyLabel="Alla" onChange={set("accessHours")} />
                </Field>
                <Field label="Parkering">
                  <ChoiceSelect data-field="parkingType" value={draft.parkingType} options={parkingTypeOptions} emptyLabel="Alla" onChange={set("parkingType")} />
                </Field>
                <Field label="Planlösning">
                  <ChoiceSelect data-field="layoutType" value={draft.layoutType} options={layoutTypeOptions} emptyLabel="Alla" onChange={set("layoutType")} />
                </Field>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="terms">
            <Card className={cardClass}>
              <CardHead eyebrow="Krav" title="Villkor" hint="Markera bara det som gäller för lokalen." />
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <CheckOption data-field="includeOperatingCosts" checked={draft.includeOperatingCosts} onChange={set("includeOperatingCosts")}>Driftkostnader ingår</CheckOption>
                <CheckOption data-field="accessibilityAdapted" checked={draft.accessibilityAdapted} onChange={set("accessibilityAdapted")}>Tillgänglighetsanpassad</CheckOption>
                <CheckOption data-field="ecoCertified" checked={draft.ecoCertified} onChange={set("ecoCertified")}>Miljöcertifierad</CheckOption>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="amenities">
            <Card data-field="amenities" className={cardClass}>
              <CardHead eyebrow="Utrustning" title="Bekvämligheter" hint="Välj vad som finns i lokalen." />
              <div className="mt-4 grid gap-4 sm:grid-cols-[18rem_minmax(0,1fr)]">
                <div>
                  <FieldLabel>Möblering</FieldLabel>
                  <FurnishingToggle options={furnishedOptions} value={draft.furnished} onChange={set("furnished")} />
                </div>
                <Field label="Egna nyckelord">
                  <Input data-field="additionalAmenities" value={draft.additionalAmenities} onChange={onInput("additionalAmenities")} placeholder="Komma-separerade, t.ex. showroom" />
                </Field>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {amenityOptions.map((option) => {
                  const Icon = option.icon;
                  const active = selectedAmenities.some((item) => normalizeAmenity(item) === normalizeAmenity(option.value));
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant="outline"
                      className={`h-auto shrink-0 gap-2 whitespace-nowrap rounded-md px-3.5 py-2.5 text-sm font-semibold ${
                        active
                          ? "border-strong bg-strong text-on-strong hover:bg-strong/90"
                          : "border-veil/10 text-ink-700 hover:bg-control"
                      }`}
                      aria-pressed={active}
                      onClick={() => toggleAmenity(option.value)}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="media">
            <Card data-field="image" className={cardClass}>
              <CardHead eyebrow="Media" title="Bilder" hint="Första bilden är omslagsfoto. Du kan välja omslag, ändra ordning, ersätta och radera bilder." />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <Button type="button" variant="secondary" className="h-auto cursor-pointer gap-1.5 px-3 py-2 text-xs" nativeButton={false} render={<label />}>
                  <UploadIcon className="h-4 w-4" />
                  Ladda upp bilder
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => void editor.addImages(event)} />
                </Button>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-ink-600">{draft.images.length}/{MAX_IMAGES} bilder</span>
                  {editor.uploadingImages ? <span className="font-semibold text-ink-700">Bearbetar bilder...</span> : null}
                </div>
              </div>
              {draft.images.length === 0 ? (
                <p className="mt-4 rounded-xl border border-veil/10 bg-canvas px-4 py-6 text-center text-sm text-ink-600">Inga bilder ännu. Ladda upp minst en bild.</p>
              ) : (
                <div className="mt-4 grid gap-x-4 gap-y-5 sm:grid-cols-2">
                  {draft.images.map((image, index) => (
                    <div key={image.id} className="space-y-2">
                      <div className="relative">
                        <img src={image.src} alt={image.name || `Bild ${index + 1}`} className="h-40 w-full rounded-xl object-cover ring-1 ring-veil/10" />
                        {index === 0 ? (
                          <Badge className="absolute left-2 top-2 h-auto rounded-full bg-strong px-2 py-0.5 text-[10px] font-semibold text-on-strong">Omslagsfoto</Badge>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {index !== 0 ? <Button type="button" variant="outline" className={imageButtonClass} onClick={() => editor.setCoverImage(index)}>Sätt som omslag</Button> : null}
                        <Button type="button" variant="outline" className={cn(imageButtonClass, "cursor-pointer")} nativeButton={false} render={<label />}>
                          Ersätt bild
                          <input type="file" accept="image/*" className="hidden" onChange={(event) => void editor.replaceImage(index, event)} />
                        </Button>
                        <Button type="button" variant="outline" className={imageButtonClass} onClick={() => editor.moveImage(index, -1)} disabled={index === 0}>Flytta vänster</Button>
                        <Button type="button" variant="outline" className={imageButtonClass} onClick={() => editor.moveImage(index, 1)} disabled={index === draft.images.length - 1}>Flytta höger</Button>
                        <Button type="button" variant="outline" className={cn(imageButtonClass, "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-700")} onClick={() => editor.removeImage(index)}>Radera</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="description">
            <Card className={cardClass}>
              <CardHead eyebrow="Om lokalen" title="Beskrivning" hint="Skriv kort om planlösning, känsla, läge och vad som ingår." />
              <Textarea
                data-field="description"
                className="mt-3 min-h-48"
                value={draft.description}
                onChange={onInput("description")}
                placeholder="Beskriv lokalen, läget och vad som gör den attraktiv."
              />
            </Card>
          </TabsContent>
        </fieldset>
      </div>
    </Tabs>
  );
}

export function ListingEditorFooterActions({ listing, editor, onClosed, onPendingChange }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function run(action) {
    setPending(true);
    onPendingChange?.(true);
    setError("");
    try {
      await action();
    } catch (error) {
      setError(error.message || "Åtgärden misslyckades. Försök igen.");
    } finally {
      setPending(false);
      onPendingChange?.(false);
    }
  }
  return (
    <>
      <div className="mr-auto flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          disabled={pending || editor.saving || editor.dirty}
          onClick={() => run(listing.status === "active" ? editor.toggleStatus : editor.publish)}
        >
          {listing.status === "active" ? "Dölj objekt" : "Publicera objekt"}
        </Button>
        <Button variant="ghost" className="text-rose-700" disabled={pending || editor.saving} onClick={() => setConfirmDelete(true)}>
          Radera
        </Button>
      </div>
      {error || editor.saveError ? (
        <p role="alert" className="w-full text-sm text-rose-700">
          {error || editor.saveError}
        </p>
      ) : null}
      <span role="status" className="text-xs text-ink-500">
        {editor.dirty ? "Osparade ändringar" : "Alla ändringar sparade"}
      </span>
      <Button onClick={() => editor.saveChanges()} disabled={editor.saving || pending || !editor.dirty}>
        {editor.saving ? "Sparar..." : "Spara ändringar"}
      </Button>
      <AlertDialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!pending) setConfirmDelete(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Radera objektet?</AlertDialogTitle>
            <AlertDialogDescription>Objektet ”{listing.title}” tas bort. Åtgärden kan inte ångras.</AlertDialogDescription>
          </AlertDialogHeader>
          {error || editor.saveError ? (
            <p role="alert" className="w-full text-sm text-rose-700">
              {error || editor.saveError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await editor.removeListing();
                  setConfirmDelete(false);
                  onClosed?.();
                })
              }
            >
              {pending ? "Raderar..." : "Radera objekt"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * The inside of the editor window: header, category sidebar with the form, the assistant, and a footer of the caller's
 * choosing. Shared by "Redigera objekt" and the review of imported listings in "Publicera annons".
 */
export function ListingEditorFrame({ editor, listing, others, subtitle, note, onClose, footer, assistant }) {
  // From the lg breakpoint the assistant sits beside the form; below it, it takes the form's place while open.
  const [assistantOpen, setAssistantOpen] = useState(false);
  return (
    <>
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-veil/10 bg-surface px-5 py-5 sm:px-8">
        <div className="min-w-0">
          {note}
          <h2 className="mt-1 truncate text-xl font-semibold">{editor.draft.title || "Hantera objekt"}</h2>
          <p className="mt-1 text-sm text-ink-500">{subtitle ?? editor.draft.address}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" className="lg:hidden" aria-pressed={assistantOpen} onClick={() => setAssistantOpen((open) => !open)}>
            <Sparkles className="mr-1.5 h-4 w-4" />
            Assistent
          </Button>
          <Button variant="outline" size="icon" aria-label="Stäng redigering" onClick={onClose}>
            <XIcon />
          </Button>
        </div>
      </header>
      <div className="relative flex min-h-0 flex-1">
        <ListingEditorSections listing={listing} editor={editor} />
        <aside
          aria-label="Assistent"
          className={cn(
            "min-h-0 w-full shrink-0 border-l border-veil/10 bg-canvas p-3 lg:w-[360px]",
            assistantOpen ? "flex max-lg:absolute max-lg:inset-0 max-lg:z-10" : "hidden lg:flex"
          )}
        >
          <ListingAssistant editor={editor} listing={listing} others={others} className="w-full" {...assistant} />
        </aside>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-veil/10 bg-surface p-4 sm:px-8">{footer}</footer>
    </>
  );
}

function ListingEditorOverlay({ listing, app, onClose, onMutated }) {
  const editor = useListingEditorState(listing, app, { onMutated });
  const [actionPending, setActionPending] = useState(false);
  const others = useMemo(() => (Array.isArray(app.listings) ? app.listings.filter((item) => item.id !== listing.id) : []), [app.listings, listing.id]);
  return (
    <EditorWorkspace size="wide" title="Redigera objekt" dirty={editor.dirty} busy={editor.saving || actionPending} onClose={onClose}>
      {(close) => (
        <ListingEditorFrame
          editor={editor}
          listing={listing}
          others={others}
          onClose={close}
          footer={<ListingEditorFooterActions listing={listing} editor={editor} onClosed={onClose} onPendingChange={setActionPending} />}
        />
      )}
    </EditorWorkspace>
  );
}

export default ListingEditorOverlay;
