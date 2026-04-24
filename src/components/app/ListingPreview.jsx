import { parseAmenities } from "../../lib/formatters";
import { amenityIconFor } from "../../lib/propertyAmenityIcons";

function mergeAmenities(draft) {
  const textAmenities = parseAmenities(draft.additionalAmenities);
  const furnishedAmenity = draft.furnished === "yes"
    ? ["Möblerad"]
    : draft.furnished === "no"
      ? ["Omöblerad"]
      : [];

  return Array.from(new Set([...(draft.amenities || []), ...textAmenities, ...furnishedAmenity]));
}

function ListingPreview({ draft }) {
  const mergedAmenities = mergeAmenities(draft);
  const coverImage = draft.images?.[0]?.src || "/object-images/object-1.jpeg";
  const amenityChipClass = "inline-flex min-h-[42px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-black/10 bg-white px-3 py-1.5 text-[0.875rem] font-semibold leading-5 text-ink-700";

  return (
    <article className="overflow-hidden rounded-2xl border border-black/10 bg-white">
      <img
        src={coverImage}
        alt={draft.title || "Objekt"}
        className="h-44 w-full object-cover"
      />
      <div className="space-y-5 p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <p className="text-lg font-semibold">{draft.title || "Rubrik saknas"}</p>
            <span className="chip shrink-0">{draft.type || "-"}</span>
          </div>
          <p className="mt-2 text-sm text-ink-600">{draft.district || "Område saknas"} • {draft.address || "Adress saknas"}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Yta</p>
            <input
              readOnly
              aria-label="Storlek"
              className="field py-2 text-sm"
              value={`${draft.sizeSqm || "-"} kvm`}
            />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Platser</p>
            <input
              readOnly
              aria-label="Kapacitet"
              className="field py-2 text-sm"
              value={`${draft.capacity || "-"} platser`}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <p className="w-full text-[11px] font-semibold uppercase tracking-wide text-ink-500">Bekvämligheter</p>
          {mergedAmenities.length === 0 ? <span className="text-xs text-ink-500">Inga bekvämligheter valda.</span> : null}
          {mergedAmenities.slice(0, 8).map((amenity) => {
            const Icon = amenityIconFor(amenity);
            return (
              <span key={amenity} className={amenityChipClass}>
                <Icon className="h-3.5 w-3.5 shrink-0 text-ink-700" />
                {amenity}
              </span>
            );
          })}
        </div>

        <p className="text-sm text-ink-700">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-500">Beskrivning</span>
          {draft.description.trim() || "Lägg till en tydlig objektbeskrivning för att öka kvalitet och konvertering."}
        </p>
      </div>
    </article>
  );
}

export default ListingPreview;
