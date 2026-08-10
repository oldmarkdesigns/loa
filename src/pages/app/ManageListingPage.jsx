import { useEffect, useMemo, useRef, useState } from "react";
import Breadcrumbs from "../../components/layout/Breadcrumbs";
import { parseAmenities } from "../../lib/formatters";
import { navigateTo } from "../../lib/router";

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

function ManageListingPage({ app, listingId }) {
  const { user, listings, updateListing, deleteListing, publishListing } = app;
  useEffect(() => {
    if (!user?.id) return;
    void app.refreshCoreData(user);
  }, [app, user]);

  const listing = useMemo(
    () => listings.find((item) => String(item.id) === String(listingId) && item.ownerId === user?.id),
    [listings, listingId, user?.id]
  );

  const [draft, setDraft] = useState(() => (listing ? buildDraft(listing) : null));
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef(null);

  if (!listing || !draft) {
    return (
      <section className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl p-6">
          <div className="mt-4 rounded-2xl border border-black/10 bg-[#ffffff] p-6">
            <h1 className="text-2xl font-semibold">Objektet kunde inte öppnas</h1>
            <p className="mt-2 text-sm text-ink-600">Du har inte åtkomst till objektet eller så har det tagits bort.</p>
          </div>
        </div>
      </section>
    );
  }

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
    } finally {
      setSaving(false);
    }
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

  return (
    <section className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-7xl p-4 pb-8 sm:p-6">
        <Breadcrumbs
          className="mb-3"
          items={[
            { label: "Startsida", to: "/" },
            { label: "Dina objekt", to: "/app/broker" },
            { label: `Hantera ${listing.title || "Objekt"}` }
          ]}
        />

        <div className="mt-5 rounded-3xl border border-[#c8d1de] bg-[#ffffff] p-4 sm:p-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Objektredigering</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-[#0b0a0e] sm:text-2xl">
                {draft.title || "Hantera objekt"}
              </h1>
              <p className="text-base font-medium text-ink-600">{draft.address}, Stockholm</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              className="btn-secondary px-4 py-2 text-sm"
              onClick={async () => {
                await updateListing(listing.id, { status: listing.status === "active" ? "draft" : "active" });
                app.pushToast(listing.status === "active" ? "Objekt dolt." : "Objekt aktiverat.", "info");
              }}
            >
              {listing.status === "active" ? "Dölj objekt" : "Aktivera objekt"}
            </button>
            <button
              type="button"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
              onClick={async () => {
                await deleteListing(listing.id);
                app.pushToast("Objekt raderat.", "info");
                navigateTo("/app/broker");
              }}
            >
              Radera objekt
            </button>
            <button type="button" className="btn-primary px-4 py-2 text-sm" onClick={saveChanges} disabled={saving}>
              {saving ? "Sparar..." : "Spara ändringar"}
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Detaljer</p>
              <h2 className="mt-0.5 text-xl font-semibold text-[#0b0a0e]">Specifikationer</h2>
            </div>
            <label className="block text-sm font-medium text-ink-700">
              Plats
              <input className="field mt-1" value={draft.district} onChange={(event) => setDraft((prev) => ({ ...prev, district: event.target.value }))} />
            </label>
            <label className="block text-sm font-medium text-ink-700">
              Adress
              <input className="field mt-1" value={draft.address} onChange={(event) => setDraft((prev) => ({ ...prev, address: event.target.value }))} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-ink-700">
                Storlek
                <input className="field mt-1" type="number" min="0" value={draft.sizeSqm} onChange={(event) => setDraft((prev) => ({ ...prev, sizeSqm: event.target.value }))} />
              </label>
              <label className="block text-sm font-medium text-ink-700">
                Pris
                <input className="field mt-1" type="number" min="0" value={draft.priceMonthly} onChange={(event) => setDraft((prev) => ({ ...prev, priceMonthly: event.target.value }))} />
              </label>
            </div>
            <label className="block text-sm font-medium text-ink-700">
              Faciliteter
              <input className="field mt-1" value={draft.amenities} onChange={(event) => setDraft((prev) => ({ ...prev, amenities: event.target.value }))} />
            </label>
            <label className="block text-sm font-medium text-ink-700">
              Beskrivning
              <textarea className="field mt-1 min-h-36" value={draft.description} onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))} />
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Media</p>
              <h2 className="mt-0.5 text-xl font-semibold text-[#0b0a0e]">Bilder</h2>
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleImageChange(event)}
            />
            <button
              type="button"
              className="btn-secondary w-full px-3 py-2 text-sm"
              onClick={() => imageInputRef.current?.click()}
            >
              Redigera bilder
            </button>
            <img src={draft.image || "/object-images/object-1.jpeg"} alt={draft.title} className="h-80 w-full rounded-2xl border border-black/10 object-cover" />
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((index) => (
                <img key={index} src={draft.image || "/object-images/object-1.jpeg"} alt={`${draft.title} ${index + 1}`} className="h-20 w-full rounded-xl border border-black/10 object-cover" />
              ))}
            </div>
            {listing.status !== "active" ? (
              <button type="button" className="btn-secondary w-full px-3 py-2 text-sm" onClick={() => publishListing(listing.id)}>
                Publicera objekt
              </button>
            ) : null}
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}

export default ManageListingPage;
