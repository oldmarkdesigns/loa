import { ExternalLink, XIcon } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { listMissingFields, toNumber } from "../../lib/listingDraft";

const toneClasses = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  neutral: "border-veil/10 bg-subtle text-ink-700"
};

function Chip({ tone, children }) {
  return <Badge variant="outline" className={cn("h-auto rounded-full border px-2 py-0.5 text-[11px] font-semibold", toneClasses[tone])}>{children}</Badge>;
}

function formatRent(value) {
  const amount = toNumber(value);
  return amount > 0 ? `${amount.toLocaleString("sv-SE")} kr/mån` : "";
}

/** What the person still needs to look at for one extracted listing. */
export function importItemIssues(item) {
  return { missing: listMissingFields(item.draft), uncertain: item.uncertain || [] };
}

function ImportRow({ item, selected, onToggle, onEdit, onRemove }) {
  const { draft } = item;
  const { missing, uncertain } = importItemIssues(item);
  const locked = item.status === "published";
  const facts = [
    [draft.district, draft.type, draft.address].filter(Boolean).join(" · "),
    [toNumber(draft.sizeSqm) > 0 ? `${draft.sizeSqm} kvm` : "", formatRent(draft.priceMonthly)].filter(Boolean).join(" · ")
  ].filter(Boolean);
  const title = draft.title || "Annons utan rubrik";

  return (
    <li className="flex items-start gap-3 py-4 text-left">
      <Checkbox
        className="mt-1"
        checked={selected}
        disabled={locked}
        aria-label={`Välj ${title}`}
        onCheckedChange={(checked) => onToggle(item.id, Boolean(checked))}
      />
      {draft.images[0]?.src ? (
        <img src={draft.images[0].src} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover ring-1 ring-veil/10" />
      ) : (
        <span aria-hidden="true" className="h-14 w-20 shrink-0 rounded-lg bg-subtle ring-1 ring-veil/10" />
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-semibold text-ink-900">{title}</p>
        {facts.map((line) => (
          <p key={line} className="truncate text-xs text-ink-600">{line}</p>
        ))}
        <p className="truncate text-xs text-ink-500">Från {item.sourceName} · {item.sourceRef}</p>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {item.status === "published" ? <Chip tone="emerald">Publicerad</Chip> : null}
          {item.status === "draft" ? <Chip tone="neutral">Utkast sparat</Chip> : null}
          {item.status === "saving" || item.status === "publishing" ? <Chip tone="neutral">{item.status === "saving" ? "Sparar…" : "Publicerar…"}</Chip> : null}
          {!locked && missing.length > 0 ? <Chip tone="amber">Saknar: {missing.join(", ")}</Chip> : null}
          {!locked && missing.length === 0 && uncertain.length > 0 ? <Chip tone="amber">Kontrollera: {uncertain.join(", ")}</Chip> : null}
          {!locked && missing.length === 0 && uncertain.length === 0 && item.status === "review" ? <Chip tone="emerald">Klar att publicera</Chip> : null}
        </div>
        {item.error ? <p role="alert" className="text-xs font-medium text-rose-600">{item.error}</p> : null}
      </div>
      {!locked ? (
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="outline" size="sm" className="h-auto px-3 py-1.5 text-xs" onClick={() => onEdit(item.id)}>
            Granska
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Ta bort ${title}`} onClick={() => onRemove(item.id)}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </li>
  );
}

/** The listings found in the documents, ready to be looked over, fixed, and published together. */
export default function PublishImportReview({ items, selected, onToggle, onToggleAll, onEdit, onRemove }) {
  const selectable = items.filter((item) => item.status !== "published");
  const selectedCount = selectable.filter((item) => selected[item.id]).length;
  const allSelected = selectable.length > 0 && selectedCount === selectable.length;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-veil/10 pb-3 text-xs">
        <label className="flex cursor-pointer items-center gap-2 font-semibold text-ink-700">
          <Checkbox checked={allSelected} onCheckedChange={(checked) => onToggleAll(Boolean(checked))} aria-label="Markera alla objekt" />
          Markera alla
        </label>
        <span className="font-medium text-ink-500">{selectedCount} av {selectable.length} valda</span>
      </div>
      <ul className="divide-y divide-veil/10" aria-label="Importerade objekt">
        {items.map((item) => (
          <ImportRow key={item.id} item={item} selected={Boolean(selected[item.id])} onToggle={onToggle} onEdit={onEdit} onRemove={onRemove} />
        ))}
      </ul>
    </div>
  );
}

/** Summary shown once the selected listings have been published. */
export function PublishImportDone({ items, onOpenListing }) {
  return (
    <ul className="mx-auto w-full max-w-lg divide-y divide-veil/10 border-y border-veil/10" aria-label="Publicerade annonser">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-3 text-left">
          {item.draft.images[0]?.src ? (
            <img src={item.draft.images[0].src} alt="" className="h-11 w-16 shrink-0 rounded-lg object-cover ring-1 ring-veil/10" />
          ) : null}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink-900">{item.draft.title}</span>
            <span className="block truncate text-xs text-ink-500">{[item.draft.district, item.draft.address].filter(Boolean).join(" · ")}</span>
          </span>
          <Button type="button" variant="outline" size="sm" className="h-auto gap-1.5 px-3 py-1.5 text-xs" onClick={() => onOpenListing(item.listingId)}>
            Visa live
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
