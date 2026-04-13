import { useLayoutEffect, useRef, useState } from "react";
import {
  BalconyIcon,
  BikeIcon,
  BuildingIcon,
  CarIcon,
  CalendarIcon,
  DumbbellIcon,
  LockerIcon,
  LoungeIcon,
  PenthouseIcon,
  PinIcon,
  ShieldIcon,
  SnowflakeIcon,
  SparklesIcon,
  StarIcon,
  UtensilsIcon,
  UserIcon
} from "../icons/UiIcons";

function formatCapacity(value) {
  if (value === null || value === undefined || value === "") return "Kapacitet saknas";
  if (typeof value === "number") return `${value} platser`;
  return String(value);
}

function buildAddress(listing) {
  const parts = [listing.address, listing.district].filter(Boolean);
  return parts.join(", ") || "Address unavailable";
}

const amenityDefinitions = [
  { icon: BikeIcon, aliases: ["cykelförråd", "cykelrum", "bike"] },
  { icon: CarIcon, aliases: ["garage", "lastzon", "lastkaj", "loading zone", "parkering"] },
  { icon: UtensilsIcon, aliases: ["kök", "kitchen", "pentry"] },
  { icon: BuildingIcon, aliases: ["mötesrum", "konferensrum", "styrelserum"] },
  { icon: UserIcon, aliases: ["reception", "väntrum"] },
  { icon: BalconyIcon, aliases: ["balkong"] },
  { icon: BuildingIcon, aliases: ["takterrass"] },
  { icon: PenthouseIcon, aliases: ["takvåning"] },
  { icon: DumbbellIcon, aliases: ["gym"] },
  { icon: LockerIcon, aliases: ["omklädningsrum"] },
  { icon: SnowflakeIcon, aliases: ["air condition", "ac"] },
  { icon: LoungeIcon, aliases: ["lounge"] },
  { icon: LockerIcon, aliases: ["förråd", "förrad", "storage", "lager"] },
  { icon: BuildingIcon, aliases: ["telefonbås", "telefonrum"] },
  { icon: BuildingIcon, aliases: ["skyltfönster", "storefront"] },
  { icon: ShieldIcon, aliases: ["säkerhetsdörr", "säkerhet", "security", "secure"] }
];

function amenityIconFor(amenity) {
  const normalized = String(amenity || "").toLowerCase();
  const match = amenityDefinitions.find((item) => item.aliases.some((alias) => normalized.includes(alias)));
  return match?.icon || BuildingIcon;
}

function ListingVisualCard({
  listing,
  shortlisted,
  onOpenListing,
  onToggleShortlist,
  compact = false,
  showMatchChip = false,
  highlightAmenities = [],
  missingAmenities = [],
  comparedAmenitiesOnly = false
}) {
  const amenities = Array.isArray(listing.amenities) ? listing.amenities : [];
  const highlightedNeedles = Array.isArray(highlightAmenities)
    ? highlightAmenities.map((item) => String(item || "").toLowerCase()).filter(Boolean)
    : [];
  const sourceAmenities = comparedAmenitiesOnly && highlightedNeedles.length > 0
    ? amenities.filter((amenity) => highlightedNeedles.some((needle) => String(amenity || "").toLowerCase().includes(needle)))
    : amenities;
  const orderedAmenities = highlightedNeedles.length > 0
    ? [...sourceAmenities].sort((a, b) => {
        const aMatch = highlightedNeedles.some((needle) => String(a || "").toLowerCase().includes(needle));
        const bMatch = highlightedNeedles.some((needle) => String(b || "").toLowerCase().includes(needle));
        if (aMatch === bMatch) return 0;
        return aMatch ? -1 : 1;
      })
    : sourceAmenities;
  const amenityRowRef = useRef(null);
  const amenityMeasureMoreRef = useRef(null);
  const amenityMeasureRefs = useRef([]);
  const [visibleAmenityCount, setVisibleAmenityCount] = useState(orderedAmenities.length);
  const visibleAmenities = orderedAmenities.slice(0, visibleAmenityCount);
  const extraAmenities = Math.max(orderedAmenities.length - visibleAmenities.length, 0);
  const visibleMissingAmenities = Array.isArray(missingAmenities)
    ? missingAmenities.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 4)
    : [];
  const hasAmenityChips = visibleAmenities.length > 0 || visibleMissingAmenities.length > 0;
  const baseAmenityChipClass = "inline-flex min-h-[42px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[0.875rem] font-semibold leading-5";

  useLayoutEffect(() => {
    if (compact) return undefined;

    const row = amenityRowRef.current;
    const moreMeasure = amenityMeasureMoreRef.current;
    if (!row || !moreMeasure) return undefined;

    const GAP_PX = 8;

    const recomputeVisibleAmenities = () => {
      const availableWidth = row.clientWidth;
      if (!availableWidth || orderedAmenities.length === 0) {
        setVisibleAmenityCount(orderedAmenities.length);
        return;
      }

      const widths = orderedAmenities.map((_, index) => amenityMeasureRefs.current[index]?.offsetWidth || 0);

      const measureMoreChipWidth = (remainingCount) => {
        if (remainingCount <= 0) return 0;
        moreMeasure.textContent = `+${remainingCount} more`;
        return moreMeasure.offsetWidth;
      };

      let nextVisibleCount = 0;
      for (let count = orderedAmenities.length; count >= 0; count -= 1) {
        const visibleWidth = widths.slice(0, count).reduce((sum, width) => sum + width, 0);
        const visibleGaps = count > 1 ? (count - 1) * GAP_PX : 0;
        const remaining = orderedAmenities.length - count;
        const moreWidth = measureMoreChipWidth(remaining);
        const moreGap = remaining > 0 && count > 0 ? GAP_PX : 0;
        const totalWidth = visibleWidth + visibleGaps + moreGap + moreWidth;

        if (totalWidth <= availableWidth) {
          nextVisibleCount = count;
          break;
        }
      }

      setVisibleAmenityCount(nextVisibleCount);
    };

    recomputeVisibleAmenities();

    const resizeObserver = new ResizeObserver(() => {
      recomputeVisibleAmenities();
    });
    resizeObserver.observe(row);

    return () => {
      resizeObserver.disconnect();
    };
  }, [orderedAmenities, compact]);

  if (compact) {
    return (
      <article className="overflow-hidden rounded-3xl border border-black/10 bg-white">
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
              className="absolute right-3 top-3 inline-flex h-9 w-9 min-h-9 min-w-9 aspect-square shrink-0 items-center justify-center rounded-full border border-black/10 bg-white p-0 text-ink-700 transition hover:border-[#0f1930] hover:text-[#0f1930]"
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

  return (
    <article className="h-full overflow-hidden rounded-[30px] border border-black/10 bg-white">
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
        className="relative flex h-full cursor-pointer flex-col text-left"
        aria-label={`Open details for ${listing.title}`}
      >
        <div className="relative">
          <img src={listing.image} alt={listing.title} className="h-44 w-full object-cover" />
        </div>
        <div className="absolute right-4 top-4 flex items-center gap-2">
          {showMatchChip ? (
            <div className="inline-flex h-10 items-center gap-1.5 rounded-full border border-black/5 bg-white px-3.5 text-sm font-semibold text-[#0f1930]">
              <SparklesIcon className="h-4 w-4 text-[#4f46e5]" />
              <span>{listing.score || 0}% match</span>
            </div>
          ) : null}
          <button
            type="button"
            aria-label={shortlisted ? "Ta bort sparad" : "Spara"}
            className="inline-flex h-10 w-10 min-h-10 min-w-10 items-center justify-center rounded-full border border-black/10 bg-white p-0 text-ink-700 transition hover:border-[#0f1930] hover:text-[#0f1930]"
            onClick={(event) => {
              event.stopPropagation();
              onToggleShortlist(listing.id);
            }}
          >
            <StarIcon className={`h-4 w-4 ${shortlisted ? "fill-current text-[#0f1930]" : ""}`} />
          </button>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold leading-tight text-[#0f1930]">{listing.title}</h3>
            <p className="flex items-center gap-1.5 text-sm text-ink-600">
              <PinIcon className="h-4 w-4 text-ink-500" />
              <span>{buildAddress(listing)}</span>
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <p className="flex items-center gap-1.5 text-sm text-ink-600">
              <UserIcon className="h-4 w-4 text-ink-500" />
              <span>{formatCapacity(listing.capacity)}</span>
            </p>
            <p className="flex items-center gap-1.5 text-sm text-ink-600">
              <CalendarIcon className="h-4 w-4 text-ink-500" />
              <span>{listing.availability || "Availability unknown"}</span>
            </p>
          </div>

          <div className={hasAmenityChips ? "mt-4 pb-3" : "mt-4 pb-3"}>
            {comparedAmenitiesOnly ? (
              <div className="flex flex-wrap gap-2">
                {visibleAmenities.map((amenity) => {
                  const Icon = amenityIconFor(amenity);
                  return (
                    <span
                      key={`matched-${listing.id}-${amenity}`}
                      className={`${baseAmenityChipClass} border-emerald-300 bg-emerald-50 text-emerald-800`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                      {amenity}
                    </span>
                  );
                })}
                {visibleMissingAmenities.map((amenity) => {
                  const Icon = amenityIconFor(amenity);
                  return (
                    <span
                      key={`missing-${listing.id}-${amenity}`}
                      className={`${baseAmenityChipClass} border-amber-300 bg-amber-50 text-amber-800`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                      {amenity}
                    </span>
                  );
                })}
              </div>
            ) : (
              <>
                <div ref={amenityRowRef} className="flex flex-nowrap gap-2 overflow-hidden">
                {visibleAmenities.map((amenity) => {
                  const Icon = amenityIconFor(amenity);
                  const normalizedAmenity = String(amenity || "").toLowerCase();
                  const isHighlighted = highlightedNeedles.some((needle) => normalizedAmenity.includes(needle));
                  return (
                    <span
                      key={amenity}
                      className={`${baseAmenityChipClass} ${
                        isHighlighted
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : "border-black/10 bg-white text-ink-700"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${isHighlighted ? "text-emerald-700" : "text-ink-700"}`} />
                      {amenity}
                    </span>
                  );
                })}
                {extraAmenities > 0 ? (
                  <span className={`${baseAmenityChipClass} border-black/10 bg-white text-ink-700`}>+{extraAmenities} more</span>
                ) : null}
                </div>
                <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] -top-[9999px] opacity-0">
                  <div className="flex gap-2">
                    {orderedAmenities.map((amenity, index) => {
                      const Icon = amenityIconFor(amenity);
                      return (
                        <span
                          key={`measure-${amenity}-${index}`}
                          ref={(element) => {
                            amenityMeasureRefs.current[index] = element;
                          }}
                          className={`${baseAmenityChipClass} border-black/10 bg-white text-ink-700`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0 text-ink-700" />
                          {amenity}
                        </span>
                      );
                    })}
                    <span
                      ref={amenityMeasureMoreRef}
                      className={`${baseAmenityChipClass} border-black/10 bg-white text-ink-700`}
                    >
                      +99 more
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </article>
  );
}

export default ListingVisualCard;
