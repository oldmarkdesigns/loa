import { useState } from "react";
import {
  BuildingIcon,
  CalendarIcon,
  PinIcon,
  RulerIcon,
  UsersGroupIcon,
  StarIcon,
} from "../icons/UiIcons";
import { Icon } from "../icons/Icon";
import { Button } from "@/components/ui/button";
import { MATCH_DISMISSAL_REASONS } from "../../lib/matchFeedback";

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

/** The "not relevant?" chips shown under a matched card — collapsed, open, or answered. Stops card clicks from firing (the whole card is a click target) so picking a reason doesn't also open the listing. */
function MatchDismissal({ listing, onDismissMatch }) {
  const [open, setOpen] = useState(false);
  const [sentReason, setSentReason] = useState(null);

  if (!onDismissMatch) return null;

  return (
    <div className="mt-1" onClick={(event) => event.stopPropagation()}>
      {sentReason ? (
        <p className="text-[11px] font-medium text-ink-500">Skickat ✓</p>
      ) : open ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {MATCH_DISMISSAL_REASONS.map((reason) => (
            <Button
              key={reason.value}
              type="button"
              variant="outline"
              className="h-auto min-h-0 !rounded-full px-2.5 py-1 text-[11px] font-medium text-ink-700 hover:border-strong/30 hover:text-strong"
              onClick={() => {
                setSentReason(reason.value);
                onDismissMatch(listing, reason.value);
              }}
            >
              {reason.label}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            className="h-auto min-h-0 px-1.5 py-1 text-[11px] font-medium text-ink-500 hover:bg-transparent hover:text-ink-700"
            onClick={() => setOpen(false)}
          >
            Avbryt
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="h-auto min-h-0 px-0 py-0 text-[11px] font-medium text-ink-500 hover:bg-transparent hover:text-ink-700 hover:underline"
          onClick={() => setOpen(true)}
        >
          Inte relevant för er?
        </Button>
      )}
    </div>
  );
}

function ListingVisualCard({
  listing,
  shortlisted,
  onOpenListing,
  onBookViewing,
  onToggleShortlist,
  onDismissMatch,
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
      <article className="property-card-hover-accent overflow-hidden rounded-3xl border border-veil/10 bg-surface">
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
          <div className="relative h-44 overflow-hidden rounded-2xl">
            <img src={listing.image} alt={listing.title} className="h-full w-full rounded-2xl object-cover" />
            <span className="absolute left-3 top-3 inline-flex min-h-[30px] items-center gap-1.5 rounded-full bg-surface px-3 text-xs font-medium text-ink-900">
              <BuildingIcon className="h-3.5 w-3.5 text-ink-700" />
              {listing.type || "Lokal"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={shortlisted ? "Ta bort sparad" : "Spara"}
              className="absolute right-3 top-3 h-9 w-9 shrink-0 rounded-full text-ink-700 hover:border-strong hover:text-strong"
              onClick={(event) => {
                event.stopPropagation();
                onToggleShortlist(listing.id);
              }}
            >
              <StarIcon className={`h-4 w-4 ${shortlisted ? "fill-current text-strong" : ""}`} />
            </Button>
          </div>
          <div className="px-4 pb-4 pt-3.5">
            <h3 className="text-base leading-tight font-medium text-strong">{listing.title}</h3>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-ink-600">
              <PinIcon className="h-3.5 w-3.5 shrink-0 text-ink-500" />
              <span>{buildAddress(listing)}</span>
            </p>
            <div className="mt-2.5 flex items-center gap-2.5 text-xs font-medium text-ink-800">
              <span className="inline-flex items-center gap-1.5">
                <RulerIcon className="h-4 w-4 text-ink-700" />
                {listing.sizeSqm} kvm
              </span>
              <span className="h-3.5 w-px bg-veil/15" />
              <span className="inline-flex items-center gap-1.5">
                <UsersGroupIcon className="h-4 w-4 text-ink-700" />
                {formatCapacity(listing.capacity)}
              </span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (horizontal) {
    return (
      <article className="group property-card-hover h-full overflow-hidden rounded-3xl border border-veil/15 bg-surface">
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
          <div className="relative isolate col-span-1 min-h-0 self-stretch overflow-hidden border-r border-veil/10">
            <div className="grid h-full min-h-[300px] grid-rows-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="relative min-h-0">
                <div className="absolute inset-0 overflow-hidden">
                  <img src={listing.image} alt={listing.title} className="h-full w-full rounded-none object-cover" />
                </div>
                <span className="absolute left-4 top-4 z-20 inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-surface px-4 text-sm font-medium text-ink-900">
                  <BuildingIcon className="h-4 w-4 text-ink-700" />
                  {listing.type || "Kontor"}
                </span>
                <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
                  {showMatchChip ? (
                    <div className="inline-flex h-10 items-center gap-1.5 rounded-full border border-veil/5 bg-surface px-3.5 text-sm font-semibold text-strong">
                      <Icon name="gauge" className="h-4 w-4 text-indigo-600" />
                      <span>{listing.score || 0}% match</span>
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={shortlisted ? "Ta bort sparad" : "Spara"}
                    className="h-10 w-10 rounded-full text-ink-700 hover:border-strong hover:text-strong"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleShortlist(listing.id);
                    }}
                  >
                    <StarIcon className={`h-4 w-4 ${shortlisted ? "fill-current text-strong" : ""}`} />
                  </Button>
                </div>
              </div>
              <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-px border-t border-veil/10 bg-veil/10">
                <div className="relative min-h-0 overflow-hidden">
                  <img src={listing.image} alt="" className="absolute inset-0 block h-full w-full min-w-0 rounded-none object-cover" />
                </div>
                <div className="relative min-h-0 overflow-hidden">
                  <img src={listing.image} alt="" className="absolute inset-0 block h-full w-full min-w-0 rounded-none object-cover" />
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 col-span-1 min-w-0 flex flex-1 flex-col gap-3 bg-surface p-5">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold leading-tight text-strong">{listing.title}</h3>
                <p className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-strong">
                  <Icon name="crown" className="h-3.5 w-3.5" />
                  <span>UTVALD</span>
                </p>
              </div>
              <p className="inline-flex items-center gap-1.5 text-sm text-ink-600">
                <PinIcon className="h-4 w-4 text-ink-600" />
                <span>{buildAddress(listing)}</span>
              </p>
              <div className="mt-1 flex items-center gap-4 text-sm text-strong">
                <p className="flex items-center gap-2 font-medium">
                  <RulerIcon className="h-5 w-5 text-strong" />
                  <span>{listing.sizeSqm} kvm</span>
                </p>
                <span className="h-5 w-px bg-veil/20" />
                <p className="flex items-center gap-2 font-medium">
                  <UsersGroupIcon className="h-5 w-5 text-strong" />
                  <span>{formatCapacity(listing.capacity)}</span>
                </p>
              </div>
              <p className="text-sm text-ink-600">
                Flexibelt kontor i centralt läge, utformat för hybridarbete och med direkt närhet till kommunikationer.
              </p>
            </div>

            <div className="mt-1 flex items-end gap-1.5">
              <p className="text-2xl font-semibold leading-none text-strong">
                från {pricePerSqm ? `${pricePerSqm} kr` : "Pris saknas"}
              </p>
              {pricePerSqm ? <p className="text-sm leading-none text-neutral-500">/ kvm</p> : null}
            </div>

            <p className="mt-1 flex items-center gap-2 text-sm text-ink-600">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#00c950]" />
              <span>{listing.availability || "Tillgänglighet saknas"}</span>
            </p>

            <p className="text-xs text-ink-600">
              Fastighetsägare: <span className="font-medium text-ink-700">{listing.advertiserName || "Hyresvärd"}</span>
            </p>

            <div className="mt-2 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-[38px] gap-1.5 rounded-full border-strong/15 px-6 text-sm font-medium text-ink-900 hover:border-strong hover:text-strong"
                onClick={(event) => {
                  event.stopPropagation();
                  onBookViewing?.(listing);
                }}
              >
                <CalendarIcon className="h-4 w-4" />
                Boka visning
              </Button>
              <div className="inline-flex items-center rounded-xl border border-veil/10 bg-canvas px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-600">
                Hyresvärd
              </div>
            </div>
            {showMatchChip ? <MatchDismissal listing={listing} onDismissMatch={onDismissMatch} /> : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group property-card-hover h-full overflow-hidden rounded-3xl border border-veil/15 bg-surface">
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
          <span className="absolute left-4 top-4 inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-surface px-4 text-sm font-medium text-ink-900">
            <BuildingIcon className="h-4 w-4 text-ink-700" />
            {listing.type || "Kontor"}
          </span>
        </div>
        <div className="absolute right-4 top-4 flex items-center gap-2">
          {showMatchChip ? (
            <div className="inline-flex h-10 items-center gap-1.5 rounded-full border border-veil/5 bg-surface px-3.5 text-sm font-semibold text-strong">
              <Icon name="gauge" className="h-4 w-4 text-indigo-600" />
              <span>{listing.score || 0}% match</span>
            </div>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={shortlisted ? "Ta bort sparad" : "Spara"}
            className="h-10 w-10 rounded-full text-ink-700 hover:border-strong hover:text-strong"
            onClick={(event) => {
              event.stopPropagation();
              onToggleShortlist(listing.id);
            }}
          >
            <StarIcon className={`h-4 w-4 ${shortlisted ? "fill-current text-strong" : ""}`} />
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold leading-tight text-strong">{listing.title}</h3>
            <p className="inline-flex items-center gap-1.5 text-sm text-ink-600">
              <PinIcon className="h-4 w-4 text-ink-600" />
              <span>{buildAddress(listing)}</span>
            </p>
            <div className="mt-1 flex items-center gap-4 text-sm text-strong">
              <p className="flex items-center gap-2 font-medium">
                <RulerIcon className="h-5 w-5 text-strong" />
                <span>{listing.sizeSqm} kvm</span>
              </p>
              <span className="h-5 w-px bg-veil/20" />
              <p className="flex items-center gap-2 font-medium">
                <UsersGroupIcon className="h-5 w-5 text-strong" />
                <span>{formatCapacity(listing.capacity)}</span>
              </p>
            </div>
          </div>

          <div className="mt-1 flex items-end gap-1.5">
            <p className="text-2xl font-semibold leading-none text-strong">
              från {pricePerSqm ? `${pricePerSqm} kr` : "Pris saknas"}
            </p>
            {pricePerSqm ? <p className="text-sm leading-none text-neutral-500">/ kvm</p> : null}
          </div>

          <p className="mt-1 flex items-center gap-2 text-sm text-ink-600">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#00c950]" />
            <span>{listing.availability || "Tillgänglighet saknas"}</span>
          </p>

          <div className="mt-2 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-[38px] gap-1.5 rounded-full border-strong/15 px-6 text-sm font-medium text-ink-900 hover:border-strong hover:text-strong"
              onClick={(event) => {
                event.stopPropagation();
                onBookViewing?.(listing);
              }}
            >
              <CalendarIcon className="h-4 w-4" />
              Boka visning
            </Button>
            <div className="inline-flex items-center rounded-xl border border-veil/10 bg-canvas px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-600">
              Hyresvärd
            </div>
          </div>
          {showMatchChip ? <MatchDismissal listing={listing} onDismissMatch={onDismissMatch} /> : null}
        </div>
      </div>
    </article>
  );
}

export default ListingVisualCard;
