import { Icon } from "../icons/Icon";

function buildAddress(listing) {
  const parts = [listing.address, listing.district].filter(Boolean);
  return parts.join(", ") || "Adress saknas";
}

function MapListingPreviewCard({ listing, onOpen, className = "" }) {
  if (!listing) return null;

  const content = (
    <div className={`overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_16px_34px_rgba(15,25,48,0.16)] ${className}`.trim()}>
      <img src={listing.image} alt={listing.title} className="h-28 w-full object-cover" />
      <div className="flex items-center gap-2 px-3 py-3">
        <Icon name="pin" className="h-4 w-4 shrink-0 text-ink-500" />
        <p className="text-sm font-medium leading-tight text-[#0f1930]">{buildAddress(listing)}</p>
      </div>
    </div>
  );

  if (!onOpen) {
    return content;
  }

  return (
    <button type="button" onClick={() => onOpen(listing)} className="block w-full text-left">
      {content}
    </button>
  );
}

export default MapListingPreviewCard;
