function ListingCard({ listing, shortlisted, onOpen, onToggleShortlist }) {
  return (
    <article className="surface group property-card-hover overflow-hidden border border-[#d9d9d9] p-3 animate-rise">
      <button type="button" className="relative block w-full overflow-hidden rounded-2xl" onClick={() => onOpen(listing)}>
        <img
          src={listing.image}
          alt={listing.title}
          className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="chip border-0 bg-[#fffffe]/90 text-ink-800">{listing.type}</span>
          {listing.verified ? (
            <span className="chip border-0 bg-brand-600 text-white">Verifierad</span>
          ) : (
            <span className="chip border-0 bg-ink-800 text-white">Overifierad</span>
          )}
        </div>
      </button>

      <div className="mt-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-900">{listing.title}</h3>
            <p className="text-sm text-ink-600">
              {listing.district} • {listing.address}
            </p>
          </div>
          <div className="rounded-xl bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">{listing.score} poäng</div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-ink-700">
          <div className="rounded-xl bg-[#fffffe] px-2 py-2">{listing.sizeSqm} kvm</div>
          <div className="rounded-xl bg-[#fffffe] px-2 py-2">{listing.capacity} platser</div>
          <div className="rounded-xl bg-[#fffffe] px-2 py-2">Svar inom {listing.responseHours}h</div>
        </div>

        <div className="flex flex-wrap gap-2">
          {listing.tags.map((tag) => (
            <span key={tag} className="chip">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => onOpen(listing)} className="btn-primary flex-1">
            Visa detaljer
          </button>
          <button
            type="button"
            onClick={() => onToggleShortlist(listing)}
            className={`flex-1 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              shortlisted
                ? "border-brand-200 bg-brand-100 text-brand-800"
                : "border-ink-200 bg-[#fffffe] text-ink-800 hover:border-brand-300"
            }`}
          >
            {shortlisted ? "Sparad" : "Spara"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ListingCard;
