import { useState } from "react";
import { Search, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatSek } from "../../lib/formatters";
import { buildHistoryChips, formatTimestamp } from "../../lib/profileHelpers";

// The two cards on the profile that replace the standalone pages "Sparade objekt" and "Sparade sökningar".

const VISIBLE_ROWS = 4;
const cardClass = "scroll-mt-4 gap-0 p-5 sm:p-6";

function CardHeader({ title, description, count }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-semibold text-strong">{title}</h2>
        <p className="mt-1 text-xs text-ink-500">{description}</p>
      </div>
      <Badge variant="outline" className="h-auto rounded-full bg-control px-3 py-1 text-xs font-semibold text-ink-700">
        {count} {count === 1 ? "sparad" : "sparade"}
      </Badge>
    </div>
  );
}

function EmptyState({ children, actionLabel, onAction }) {
  return (
    <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-veil/10 bg-canvas px-4 py-4">
      <p className="text-sm text-ink-600">{children}</p>
      <Button type="button" variant="outline" size="sm" className="min-h-0 bg-control shadow-none" onClick={onAction}>
        <Search className="mr-1.5 h-3.5 w-3.5" />
        {actionLabel}
      </Button>
    </div>
  );
}

function ShowAll({ total, expanded, onToggle }) {
  if (total <= VISIBLE_ROWS) return null;
  return (
    <Button type="button" variant="ghost" size="sm" className="mt-3 min-h-0 px-2 text-ink-600" aria-expanded={expanded} onClick={onToggle}>
      {expanded ? "Visa färre" : `Visa alla ${total}`}
    </Button>
  );
}

/** Listings the person has starred: open one, book a viewing, or take it off the list. */
export function SavedListingsCard({ listings, onOpen, onBook, onRemove, onBrowse, className }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? listings : listings.slice(0, VISIBLE_ROWS);
  return (
    <Card id="sparade-objekt" className={`${cardClass} ${className || ""}`} aria-label="Sparade objekt">
      <CardHeader title="Sparade objekt" description="Objekt du har sparat för uppföljning." count={listings.length} />
      {listings.length === 0 ? (
        <EmptyState actionLabel="Utforska lokaler" onAction={onBrowse}>Inga sparade objekt ännu.</EmptyState>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-veil/10">
            {rows.map((listing) => {
              const cover = listing.image || listing.images?.[0]?.url || listing.images?.[0];
              const facts = [
                listing.district,
                Number(listing.sizeSqm) > 0 ? `${listing.sizeSqm} kvm` : "",
                Number(listing.priceMonthly) > 0 ? `${formatSek(listing.priceMonthly)} / mån` : ""
              ].filter(Boolean).join(" · ");
              return (
                <li key={listing.id} className="flex items-center gap-2 py-3 first:pt-0 last:pb-0">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto min-h-0 min-w-0 flex-1 justify-start gap-3 whitespace-normal p-0 text-left font-normal hover:bg-transparent"
                    onClick={() => onOpen(listing)}
                  >
                    {cover ? (
                      <img src={cover} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-veil/10" />
                    ) : (
                      <span aria-hidden="true" className="h-12 w-12 shrink-0 rounded-lg bg-veil/[0.05] ring-1 ring-veil/10" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink-900">{listing.title || "Objekt"}</span>
                      {facts ? <span className="block truncate text-xs text-ink-500">{facts}</span> : null}
                    </span>
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="min-h-0 shrink-0 bg-control shadow-none" onClick={() => onBook(listing)}>
                    Boka visning
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="min-h-0 shrink-0"
                    aria-label={`Ta bort ${listing.title || "objektet"} från sparade`}
                    onClick={() => onRemove(listing.id)}
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </Button>
                </li>
              );
            })}
          </ul>
          <ShowAll total={listings.length} expanded={expanded} onToggle={() => setExpanded((value) => !value)} />
        </>
      )}
    </Card>
  );
}

/** Searches the person has saved: run one again, or delete it. */
export function SavedSearchesCard({ presets, onSearch, onDelete, onBrowse, className }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? presets : presets.slice(0, VISIBLE_ROWS);
  return (
    <Card id="sparade-sokningar" className={`${cardClass} ${className || ""}`} aria-label="Sparade sökningar">
      <CardHeader title="Sparade sökningar" description="Sökningar du har sparat för uppföljning." count={presets.length} />
      {presets.length === 0 ? (
        <EmptyState actionLabel="Sök lokaler" onAction={onBrowse}>Inga sparade sökningar ännu.</EmptyState>
      ) : (
        <>
          <ul className="mt-4 space-y-2.5">
            {rows.map((preset) => {
              const chips = buildHistoryChips(preset.filters).slice(0, 4);
              const title = preset.title || "Sparad sökning";
              return (
                <li key={preset.id} className="rounded-xl border border-veil/10 bg-surface px-3.5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">{title}</p>
                      <p className="text-xs text-ink-500">Uppdaterad {formatTimestamp(preset.updatedAt || preset.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button type="button" variant="outline" size="sm" className="min-h-0 bg-control shadow-none" onClick={() => onSearch(preset)}>
                        Sök igen
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" className="min-h-0" aria-label={`Radera ${title}`} onClick={() => onDelete(preset.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {chips.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {chips.map((chip) => (
                        <span key={`${preset.id}-${chip}`} className="rounded-full border border-veil/10 bg-canvas px-2.5 py-1 text-[11px] font-semibold text-ink-700">
                          {chip}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <ShowAll total={presets.length} expanded={expanded} onToggle={() => setExpanded((value) => !value)} />
        </>
      )}
    </Card>
  );
}
