import { useEffect, useMemo, useState } from "react";
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

  if (!listing || !draft) {
    return (
      <section className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl p-6">
          <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => navigateTo("/app/my-listings")}>
            Tillbaka till översikt
          </button>
          <div className="mt-4 rounded-2xl border border-black/10 bg-[#fffffe] p-6">
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

  return (
    <section className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-7xl p-4 pb-8 sm:p-6">
        <Breadcrumbs
          className="mb-3"
          items={[
            { label: "Startsida", to: "/" },
            { label: "Dina objekt", to: "/app/my-listings" },
            { label: `Hantera ${listing.title || "Objekt"}` }
          ]}
        />
        <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => navigateTo("/app/my-listings")}>
          Tillbaka till översikt
        </button>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Hantera objekt</h1>

        <div className="mt-5 rounded-3xl border border-[#c8d1de] bg-[#fffffe] p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-lg text-ink-600 sm:text-xl">{draft.address}, Stockholm</p>
          <div className="flex flex-wrap gap-2">
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
                navigateTo("/app/my-listings");
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
            <h2 className="text-2xl font-semibold">Specifikationer</h2>
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
            <h2 className="text-2xl font-semibold">Bilder</h2>
            <label className="block text-sm font-medium text-ink-700">
              Omslagsfoto URL
              <input className="field mt-1" value={draft.image} onChange={(event) => setDraft((prev) => ({ ...prev, image: event.target.value }))} />
            </label>
            <img src={draft.image || "/object-images/object-1.jpeg"} alt={draft.title} className="h-80 w-full rounded-2xl border border-black/10 object-cover" />
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((index) => (
                <img key={index} src={draft.image || "/object-images/object-1.jpeg"} alt={`${draft.title} ${index + 1}`} className="h-20 w-full rounded-xl border border-black/10 object-cover" />
              ))}
            </div>
            <button type="button" className="btn-secondary w-full px-3 py-2 text-sm" onClick={() => publishListing(listing.id)}>
              Publicera objekt
            </button>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}

export default ManageListingPage;
