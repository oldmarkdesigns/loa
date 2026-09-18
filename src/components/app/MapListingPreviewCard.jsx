import { Icon } from "../icons/Icon";
import { Button } from "@/components/ui/button";

function buildAddress(listing) {
  const parts = [listing.address, listing.district].filter(Boolean);
  return parts.join(", ") || "Adress saknas";
}

function MapListingPreviewCard({ listing, onOpen, className = "" }) {
  if (!listing) return null;

  const content = (
    <div className={`overflow-hidden rounded-[24px] border border-black/10 bg-[#ffffff] shadow-[0_16px_34px_rgba(15,25,48,0.16)] ${className}`.trim()}>
      <img src={listing.image} alt={listing.title} className="h-28 w-full object-cover" />
      <div className="flex items-center gap-2 px-3 py-3">
        <Icon name="pin" className="h-4 w-4 shrink-0 text-ink-500" />
        <p className="text-sm font-medium leading-tight text-[#0b0a0e]">{buildAddress(listing)}</p>
      </div>
    </div>
  );

  if (!onOpen) {
    return content;
  }

  return (
    <Button type="button" variant="ghost" onClick={() => onOpen(listing)} className="h-auto block w-full p-0 text-left hover:bg-transparent">
      {content}
    </Button>
  );
}

export default MapListingPreviewCard;
