import {
  BuildingIcon,
  CalendarIcon,
  PinIcon,
  RulerIcon,
  UsersGroupIcon,
  StarIcon,
} from "../icons/UiIcons";
import { Icon } from "../icons/Icon";

function formatCapacity(value) {
  if (value === null || value === undefined || value === "") return "Kapacitet saknas";
  if (typeof value === "number") return `${value} platser`;
  return String(value);
}

function buildAddress(listing) {
  const parts = [listing.address, listing.district].filter(Boolean);
  return parts.join(", ") || "Address unavailable";
}

function formatPricePerSqm(listing) {
  const priceMonthly = Number(listing?.priceMonthly);
  const sizeSqm = Number(listing?.sizeSqm);
  if (!Number.isFinite(priceMonthly) || !Number.isFinite(sizeSqm) || sizeSqm <= 0) return null;
  return Math.round(priceMonthly / sizeSqm).toLocaleString("sv-SE");
}

function ListingVisualCard({
  listing,
  shortlisted,
  onOpenListing,
  onBookViewing,
  onToggleShortlist,
  compact = false,
  horizontal = false,
  showMatchChip = false,
  onHoverStart,
  onHoverEnd,
  highlightAmenities = [],
  missingAmenities = [],
  comparedAmenitiesOnly = false
}) {
  const pricePerSqm = formatPricePerSqm(listing);

  if (compact) {
    return (
      <article className="overflow-hidden rounded-3xl border border-black/10 bg-[#fffffe]">
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenListing(listing)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpenListing(listing);
            }
          }}
          className="block w-full cursor-pointer text-left"
        >
          <div className="relative h-32 overflow-hidden rounded-2xl">
            <img src={listing.image} alt={listing.title} className="h-full w-full rounded-2xl object-cover" />
            <button
              type="button"
              aria-label={shortlisted ? "Ta bort sparad" : "Spara"}
              className="absolute right-3 top-3 inline-flex h-9 w-9 min-h-9 min-w-9 aspect-square shrink-0 items-center justify-center rounded-full border border-black/10 bg-[#fffffe] p-0 text-ink-700 transition hover:border-[#0f1930] hover:text-[#0f1930]"
              onClick={(event) => {
                event.stopPropagation();
                onToggleShortlist(listing.id);
              }}
            >
              <StarIcon className={`h-4 w-4 ${shortlisted ? "fill-current text-[#0f1930]" : ""}`} />
            </button>
          </div>
          <div className="px-3 pb-3 pt-2.5">
            <h3 className="text-sm leading-tight font-medium text-black">{listing.title}</h3>
            <p className="mt-1 text-xs text-ink-600">{buildAddress(listing)}</p>
            <p className="mt-1 text-sm font-medium text-ink-800">
              <span>{listing.type || "Lokal"}</span>
              <span aria-hidden="true" className="mx-1">•</span>
              <span>{listing.sizeSqm} kvm</span>
            </p>
          </div>
        </div>
      </article>
    );
  }

  if (horizontal) {
    return (
      <article className="group property-card-hover h-full overflow-hidden rounded-3xl border border-[#d9d9d9] bg-[#fffffe]">
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenListing(listing)}
          onMouseEnter={() => onHoverStart?.(listing)}
          onMouseLeave={() => onHoverEnd?.()}
          onFocus={() => onHoverStart?.(listing)}
          onBlur={() => onHoverEnd?.()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpenListing(listing);
            }
          }}
          className="card-click-surface relative grid [grid-template-columns:minmax(0,1fr)_minmax(0,1fr)] items-stretch cursor-pointer overflow-hidden text-left"
          aria-label={`Open details for ${listing.title}`}
        >
          <div className="relative isolate col-span-1 min-h-0 self-stretch overflow-hidden border-r border-black/10">
            <div className="grid h-full min-h-[300px] grid-rows-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="relative min-h-0">
                <div className="absolute inset-0 overflow-hidden">
                  <img src={listing.image} alt={listing.title} className="h-full w-full rounded-none object-cover" />
                </div>
                <span className="absolute left-4 top-4 z-20 inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[#fffffe] px-4 text-sm font-medium text-ink-900">
                  <BuildingIcon className="h-4 w-4 text-ink-700" />
                  {listing.type || "Kontor"}
                </span>
                <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
                  {showMatchChip ? (
                    <div className="inline-flex h-10 items-center gap-1.5 rounded-full border border-black/5 bg-[#fffffe] px-3.5 text-sm font-semibold text-[#0f1930]">
                      <Icon name="gauge" className="h-4 w-4 text-[#4f46e5]" />
                      <span>{listing.score || 0}% match</span>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    aria-label={shortlisted ? "Ta bort sparad" : "Spara"}
                    className="inline-flex h-10 w-10 min-h-10 min-w-10 items-center justify-center rounded-full border border-black/10 bg-[#fffffe] p-0 text-ink-700 transition hover:border-[#0f1930] hover:text-[#0f1930]"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleShortlist(listing.id);
                    }}
                  >
                    <StarIcon className={`h-4 w-4 ${shortlisted ? "fill-current text-[#0f1930]" : ""}`} />
                  </button>
                </div>
              </div>
              <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-px border-t border-black/10 bg-black/10">
                <div className="relative min-h-0 overflow-hidden">
                  <img src={listing.image} alt="" className="absolute inset-0 block h-full w-full min-w-0 rounded-none object-cover" />
                </div>
                <div className="relative min-h-0 overflow-hidden">
                  <img src={listing.image} alt="" className="absolute inset-0 block h-full w-full min-w-0 rounded-none object-cover" />
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 col-span-1 min-w-0 flex flex-1 flex-col gap-3 bg-[#fffffe] p-5">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold leading-tight text-[#0f1930]">{listing.title}</h3>
                <p className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#0f1930]">
                  <Icon name="crown" className="h-3.5 w-3.5" />
                  <span>UTVALD</span>
                </p>
              </div>
              <p className="inline-flex items-center gap-1.5 text-sm text-ink-600">
                <PinIcon className="h-4 w-4 text-ink-600" />
                <span>{buildAddress(listing)}</span>
              </p>
              <div className="mt-1 flex items-center gap-4 text-sm text-[#0f1930]">
                <p className="flex items-center gap-2 font-medium">
                  <RulerIcon className="h-5 w-5 text-[#0f1930]" />
                  <span>{listing.sizeSqm} kvm</span>
                </p>
                <span className="h-5 w-px bg-black/20" />
                <p className="flex items-center gap-2 font-medium">
                  <UsersGroupIcon className="h-5 w-5 text-[#0f1930]" />
                  <span>{formatCapacity(listing.capacity)}</span>
                </p>
              </div>
              <p className="text-sm text-ink-600">
                Flexibelt kontor i centralt läge, utformat för hybridarbete och med direkt närhet till kommunikationer.
              </p>
            </div>

            <div className="mt-1 flex items-end gap-1.5">
              <p className="text-2xl font-semibold leading-none text-[#0f1930]">
                från {pricePerSqm ? `${pricePerSqm} kr` : "Pris saknas"}
              </p>
              {pricePerSqm ? <p className="text-sm leading-none text-[#737373]">/ kvm</p> : null}
            </div>

            <p className="mt-1 flex items-center gap-2 text-sm text-ink-600">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#00c950]" />
              <span>{listing.availability || "Tillgänglighet saknas"}</span>
            </p>

            <p className="text-xs text-ink-600">
              Fastighetsägare: <span className="font-medium text-ink-700">{listing.advertiserName || "Hyresvärd"}</span>
            </p>

            <div className="mt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-[#0f1930]/15 px-6 text-sm font-medium text-ink-900 transition hover:border-[#0f1930] hover:text-[#0f1930]"
                onClick={(event) => {
                  event.stopPropagation();
                  onBookViewing?.(listing);
                }}
              >
                <CalendarIcon className="h-4 w-4" />
                Boka visning
              </button>
              <div className="inline-flex items-center rounded-xl border border-black/10 bg-[#f8f8f8] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-600">
                Hyresvärd
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group property-card-hover h-full overflow-hidden rounded-3xl border border-[#d9d9d9] bg-[#fffffe]">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpenListing(listing)}
        onMouseEnter={() => onHoverStart?.(listing)}
        onMouseLeave={() => onHoverEnd?.()}
        onFocus={() => onHoverStart?.(listing)}
        onBlur={() => onHoverEnd?.()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpenListing(listing);
          }
        }}
        className="card-click-surface relative flex h-full cursor-pointer flex-col text-left"
        aria-label={`Open details for ${listing.title}`}
      >
        <div className="relative">
          <img src={listing.image} alt={listing.title} className="h-44 w-full object-cover" />
          <span className="absolute left-4 top-4 inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[#fffffe] px-4 text-sm font-medium text-ink-900">
            <BuildingIcon className="h-4 w-4 text-ink-700" />
            {listing.type || "Kontor"}
          </span>
        </div>
        <div className="absolute right-4 top-4 flex items-center gap-2">
          {showMatchChip ? (
            <div className="inline-flex h-10 items-center gap-1.5 rounded-full border border-black/5 bg-[#fffffe] px-3.5 text-sm font-semibold text-[#0f1930]">
              <Icon name="gauge" className="h-4 w-4 text-[#4f46e5]" />
              <span>{listing.score || 0}% match</span>
            </div>
          ) : null}
          <button
            type="button"
            aria-label={shortlisted ? "Ta bort sparad" : "Spara"}
            className="inline-flex h-10 w-10 min-h-10 min-w-10 items-center justify-center rounded-full border border-black/10 bg-[#fffffe] p-0 text-ink-700 transition hover:border-[#0f1930] hover:text-[#0f1930]"
            onClick={(event) => {
              event.stopPropagation();
              onToggleShortlist(listing.id);
            }}
          >
            <StarIcon className={`h-4 w-4 ${shortlisted ? "fill-current text-[#0f1930]" : ""}`} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold leading-tight text-[#0f1930]">{listing.title}</h3>
            <p className="inline-flex items-center gap-1.5 text-sm text-ink-600">
              <PinIcon className="h-4 w-4 text-ink-600" />
              <span>{buildAddress(listing)}</span>
            </p>
            <div className="mt-1 flex items-center gap-4 text-sm text-[#0f1930]">
              <p className="flex items-center gap-2 font-medium">
                <RulerIcon className="h-5 w-5 text-[#0f1930]" />
                <span>{listing.sizeSqm} kvm</span>
              </p>
              <span className="h-5 w-px bg-black/20" />
              <p className="flex items-center gap-2 font-medium">
                <UsersGroupIcon className="h-5 w-5 text-[#0f1930]" />
                <span>{formatCapacity(listing.capacity)}</span>
              </p>
            </div>
          </div>

          <div className="mt-1 flex items-end gap-1.5">
            <p className="text-2xl font-semibold leading-none text-[#0f1930]">
              från {pricePerSqm ? `${pricePerSqm} kr` : "Pris saknas"}
            </p>
            {pricePerSqm ? <p className="text-sm leading-none text-[#737373]">/ kvm</p> : null}
          </div>

          <p className="mt-1 flex items-center gap-2 text-sm text-ink-600">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#00c950]" />
            <span>{listing.availability || "Tillgänglighet saknas"}</span>
          </p>

          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-[#0f1930]/15 px-6 text-sm font-medium text-ink-900 transition hover:border-[#0f1930] hover:text-[#0f1930]"
              onClick={(event) => {
                event.stopPropagation();
                onBookViewing?.(listing);
              }}
            >
              <CalendarIcon className="h-4 w-4" />
              Boka visning
            </button>
            <div className="inline-flex items-center rounded-xl border border-black/10 bg-[#f8f8f8] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-600">
              Hyresvärd
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ListingVisualCard;
