import { parseAmenities } from "../../lib/formatters";

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

  return (
    <article className="overflow-hidden rounded-2xl border border-black/10 bg-white">
      <img
        src={coverImage}
        alt={draft.title || "Objekt"}
        className="h-44 w-full object-cover"
      />
      <div className="space-y-3 p-4">
        <div>
          <p className="text-lg font-semibold">{draft.title || "Rubrik saknas"}</p>
          <p className="text-sm text-ink-600">{draft.district || "Område saknas"} • {draft.address || "Adress saknas"}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-black/10 bg-white px-2.5 py-2">{draft.sizeSqm || "-"} kvm</div>
          <div className="rounded-xl border border-black/10 bg-white px-2.5 py-2">{draft.capacity || "-"} platser</div>
          <div className="rounded-xl border border-black/10 bg-white px-2.5 py-2">{draft.type || "-"}</div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {mergedAmenities.length === 0 ? <span className="text-xs text-ink-500">Inga bekvämligheter valda.</span> : null}
          {mergedAmenities.slice(0, 8).map((amenity) => (
            <span key={amenity} className="rounded-full border border-black/10 bg-white px-2 py-1 text-[11px] font-semibold text-ink-700">
              {amenity}
            </span>
          ))}
        </div>

        <p className="text-sm text-ink-700">
          {draft.description.trim() || "Lägg till en tydlig objektbeskrivning för att öka kvalitet och konvertering."}
        </p>
      </div>
    </article>
  );
}

export default ListingPreview;
