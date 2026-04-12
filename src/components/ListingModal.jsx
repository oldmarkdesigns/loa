function formatSek(value) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0
  }).format(value);
}

function ListingModal({ listing, onClose, onToggleShortlist, shortlisted, onBookViewing }) {
  if (!listing) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 p-4 backdrop-blur-[2px] sm:items-center" onClick={onClose}>
      <div
        className="surface max-h-[92vh] w-full max-w-4xl overflow-hidden border-black/10 p-0"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
          <div className="relative">
            <img src={listing.image} alt={listing.title} className="h-72 w-full object-cover md:h-full" />
            <div className="absolute left-3 top-3 flex gap-2">
              <span className="rounded-xl border border-white/30 bg-black/65 px-2 py-1 text-[11px] font-semibold text-white">{listing.type}</span>
              {listing.verified ? (
                <span className="rounded-xl border border-white/50 bg-white/90 px-2 py-1 text-[11px] font-semibold text-black">Verifierad</span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-sm font-semibold text-ink-800"
            >
              Stäng
            </button>
          </div>

          <div className="space-y-5 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Objektsdetaljer</p>
              <h2 className="font-display text-2xl font-semibold text-ink-900">{listing.title}</h2>
              <p className="text-sm text-ink-600">
                {listing.district} • {listing.address}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-ink-700">
              <div className="rounded-2xl border border-black/5 bg-white px-3 py-2">
                <p className="text-xs text-ink-500">Månadshyra</p>
                <p className="font-semibold text-ink-900">{formatSek(listing.priceMonthly)}</p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white px-3 py-2">
                <p className="text-xs text-ink-500">Yta</p>
                <p className="font-semibold text-ink-900">{listing.sizeSqm} kvm</p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white px-3 py-2">
                <p className="text-xs text-ink-500">Kapacitet</p>
                <p className="font-semibold text-ink-900">{listing.capacity} platser</p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white px-3 py-2">
                <p className="text-xs text-ink-500">Tillgänglighet</p>
                <p className="font-semibold text-ink-900">{listing.availability}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-ink-800">Nyckelfunktioner</p>
              <div className="flex flex-wrap gap-2">
                {(listing.amenities || []).map((amenity) => (
                  <span key={amenity} className="chip rounded-full bg-white">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900">
              <p className="font-semibold">Snabb sammanfattning</p>
              <p className="mt-1 text-brand-800">
                Passar team som behöver {listing.capacity} platser, svar inom {listing.responseHours}h och {listing.term}.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => onBookViewing(listing)} className="btn-primary">
                Boka visning
              </button>
              <button type="button" onClick={() => onToggleShortlist(listing)} className="btn-secondary">
                {shortlisted ? "Ta bort sparat objekt" : "Spara objekt"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListingModal;
