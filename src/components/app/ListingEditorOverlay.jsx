import { useMemo, useRef, useState } from "react";
import { CameraIcon } from "../icons/UiIcons";
import { parseAmenities } from "../../lib/formatters";
import { amenityOptions, listFromDelimitedValue, normalizeAmenity } from "../../lib/profileHelpers";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function buildDraft(listing) {
  return {
    title: listing.title || "",
    district: listing.district || "Norrmalm",
    address: listing.address || "",
    sizeSqm: String(listing.sizeSqm || ""),
    priceMonthly: String(listing.priceMonthly || ""),
    amenities: Array.isArray(listing.amenities) ? listing.amenities.join(", ") : "",
    description: listing.description || "",
    image: listing.image || "/object-images/object-1.jpeg"
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Kunde inte läsa bilden."));
    reader.readAsDataURL(file);
  });
}

export function useListingEditorState(listing, app, { onMutated } = {}) {
  const { updateListing, deleteListing, publishListing } = app;
  const [draft, setDraft] = useState(() => buildDraft(listing));
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef(null);

  const selectedAmenities = useMemo(() => listFromDelimitedValue(draft.amenities), [draft.amenities]);

  async function saveChanges() {
    setSaving(true);
    try {
      await updateListing(listing.id, {
        title: draft.title,
        district: draft.district,
        address: draft.address,
        sizeSqm: Number(draft.sizeSqm || 0),
        priceMonthly: Number(draft.priceMonthly || 0),
        amenities: parseAmenities(draft.amenities),
        description: draft.description,
        image: draft.image
      });
      app.pushToast("Objekt uppdaterat.", "success");
      await onMutated?.();
    } finally {
      setSaving(false);
    }
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

  async function handleImageChange(event) {
    const file = Array.from(event.target.files || []).find((entry) => entry.type.startsWith("image/"));
    event.target.value = "";
    if (!file) return;
    try {
      const image = await readFileAsDataUrl(file);
      setDraft((prev) => ({ ...prev, image }));
    } catch (error) {
      app.pushToast(error.message || "Kunde inte läsa bilden.", "error");
    }
  }

  function toggleAmenity(value) {
    setDraft((prev) => {
      const currentList = listFromDelimitedValue(prev.amenities);
      const normalizedTarget = normalizeAmenity(value);
      const hasAmenity = currentList.some((item) => normalizeAmenity(item) === normalizedTarget);
      const nextList = hasAmenity
        ? currentList.filter((item) => normalizeAmenity(item) !== normalizedTarget)
        : [...currentList, value];
      return { ...prev, amenities: nextList.join(", ") };
    });
  }

  return {
    draft,
    setDraft,
    saving,
    imageInputRef,
    selectedAmenities,
    saveChanges,
    toggleStatus,
    removeListing,
    publish,
    handleImageChange,
    toggleAmenity
  };
}

export function ListingEditorSections({ listing, editor }) {
  const { draft, setDraft, selectedAmenities, toggleAmenity, imageInputRef, handleImageChange, publish } = editor;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-black/10 bg-[#ffffff] p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Detaljer</p>
        <h2 className="mt-0.5 text-lg font-semibold text-[#0b0a0e]">Grunduppgifter</h2>
        <div className="mt-4 grid gap-3">
          <label className="block text-sm font-medium text-ink-700">
            Titel
            <Input className="mt-1" value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-ink-700">
              Område
              <Input className="mt-1" value={draft.district} onChange={(event) => setDraft((prev) => ({ ...prev, district: event.target.value }))} />
            </label>
            <label className="block text-sm font-medium text-ink-700">
              Adress
              <Input className="mt-1" value={draft.address} onChange={(event) => setDraft((prev) => ({ ...prev, address: event.target.value }))} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-ink-700">
              Storlek (kvm)
              <Input className="mt-1" type="number" min="0" value={draft.sizeSqm} onChange={(event) => setDraft((prev) => ({ ...prev, sizeSqm: event.target.value }))} />
            </label>
            <label className="block text-sm font-medium text-ink-700">
              Pris (kr/mån)
              <Input className="mt-1" type="number" min="0" value={draft.priceMonthly} onChange={(event) => setDraft((prev) => ({ ...prev, priceMonthly: event.target.value }))} />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-[#ffffff] p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Utrustning</p>
        <h2 className="mt-0.5 text-lg font-semibold text-[#0b0a0e]">Bekvämligheter</h2>
        <p className="mt-1 text-sm text-ink-600">Välj vad som finns i lokalen.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {amenityOptions.map((option) => {
            const Icon = option.icon;
            const active = selectedAmenities.some((item) => normalizeAmenity(item) === normalizeAmenity(option.value));
            return (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                className={`h-auto shrink-0 gap-2 whitespace-nowrap rounded-full px-3.5 py-2.5 text-sm font-semibold ${
                  active ? "border-[#0b0a0e] bg-[#0b0a0e] text-white hover:bg-[#0b0a0e]/90" : "border-black/10 text-ink-700 hover:bg-[#ffffff]"
                }`}
                onClick={() => toggleAmenity(option.value)}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {option.label}
              </Button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-[#ffffff] p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Media</p>
        <h2 className="mt-0.5 text-lg font-semibold text-[#0b0a0e]">Bilder</h2>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void handleImageChange(event)}
        />
        <div className="relative mt-3">
          <img src={draft.image || "/object-images/object-1.jpeg"} alt={draft.title} className="h-56 w-full rounded-xl border border-black/10 object-cover sm:h-64" />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute right-2 top-2 h-9 w-9 rounded-full border-black/10 text-ink-700 shadow-[0_1px_2px_rgba(15,25,48,0.15)] hover:border-[#0b0a0e] hover:bg-[#ffffff] hover:text-[#0b0a0e]"
            aria-label="Byt bild"
            onClick={() => imageInputRef.current?.click()}
          >
            <CameraIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {[0, 1, 2, 3].map((index) => (
            <img key={index} src={draft.image || "/object-images/object-1.jpeg"} alt={`${draft.title} ${index + 1}`} className="h-16 w-full rounded-lg border border-black/10 object-cover sm:h-20" />
          ))}
        </div>
        {listing.status !== "active" ? (
          <Button type="button" variant="secondary" className="mt-3 h-auto px-3 py-2 text-sm" onClick={publish}>
            Publicera objekt
          </Button>
        ) : null}
      </section>

      <section className="rounded-2xl border border-black/10 bg-[#ffffff] p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Om lokalen</p>
        <h2 className="mt-0.5 text-lg font-semibold text-[#0b0a0e]">Beskrivning</h2>
        <Textarea
          className="mt-3 min-h-32"
          value={draft.description}
          onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Beskriv lokalen, läget och vad som gör den attraktiv."
        />
      </section>
    </div>
  );
}

export function ListingEditorFooterActions({ listing, editor, onClosed }) {
  return (
    <>
      <Button type="button" variant="secondary" className="h-auto px-4 py-2 text-sm" onClick={editor.toggleStatus}>
        {listing.status === "active" ? "Dölj objekt" : "Aktivera objekt"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-auto rounded-xl border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 hover:text-rose-700"
        onClick={async () => {
          await editor.removeListing();
          onClosed?.();
        }}
      >
        Radera objekt
      </Button>
      <Button type="button" className="h-auto px-4 py-2 text-sm" onClick={editor.saveChanges} disabled={editor.saving}>
        {editor.saving ? "Sparar..." : "Spara ändringar"}
      </Button>
    </>
  );
}

function ListingEditorOverlay({ listing, app, onClose }) {
  const editor = useListingEditorState(listing, app);
  const [open, setOpen] = useState(true);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) onClose?.();
      }}
    >
      <DialogContent
        showCloseButton
        className="flex max-h-[90vh] w-full max-w-[1000px] flex-col gap-0 overflow-hidden rounded-3xl border border-black/10 bg-[#ffffff] p-0 shadow-[0_24px_64px_rgba(15,25,48,0.28)]"
      >
        <DialogHeader className="shrink-0 gap-1 border-b border-black/10 p-5 text-left sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Objektredigering</p>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <DialogTitle className="text-xl font-semibold tracking-tight text-[#0b0a0e] sm:text-2xl">
              {editor.draft.title || "Hantera objekt"}
            </DialogTitle>
            <DialogDescription className="text-base font-medium text-ink-600">
              {editor.draft.address}, Stockholm
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <ListingEditorSections listing={listing} editor={editor} />
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-black/10 p-4 sm:p-5">
          <ListingEditorFooterActions listing={listing} editor={editor} onClosed={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ListingEditorOverlay;
