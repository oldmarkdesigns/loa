import { formatDate, formatSek } from "../../lib/formatters";

function typeLabel(type) {
  if (Array.isArray(type) && type.length > 0) {
    return `${type.length} typ${type.length > 1 ? "er" : ""} vald`;
  }
  if (typeof type === "string" && type && type !== "Alla") {
    return type;
  }
  return "Alla typer";
}

function FilterPresetCard({ item, onApply, onDelete }) {
  const filters = item.filters || {};

  return (
    <article className="rounded-2xl border border-black/10 bg-[#ffffff] p-3">
      <p className="text-sm font-semibold text-black">{item.title || "Sparat filter"}</p>
      <p className="mt-1 text-[11px] text-ink-500">Sparat {formatDate(item.updatedAt || item.createdAt)}</p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="chip">{filters.district || "Alla områden"}</span>
        <span className="chip">{typeLabel(filters.type)}</span>
        <span className="chip">{formatSek(filters.maxBudget || 0)}</span>
        {filters.teamSize ? <span className="chip">{filters.teamSize} platser+</span> : null}
        {filters.verified ? <span className="chip">Verifierade</span> : null}
        {filters.readyNow ? <span className="chip">Ledig nu</span> : null}
      </div>

      <div className="mt-3 flex gap-2">
        <button type="button" className="rounded-xl border border-[#0b0a0e] bg-[#0b0a0e] px-3 py-2 text-xs font-semibold text-white" onClick={() => onApply(item)}>
          Använd filter
        </button>
        <button type="button" className="rounded-xl border border-black/20 bg-[#ffffff] px-3 py-2 text-xs font-semibold" onClick={() => onDelete(item.id)}>
          Ta bort
        </button>
      </div>
    </article>
  );
}

function SavedAiSearchCard({ item, onRun, onDelete }) {
  return (
    <article className="rounded-2xl border border-black/10 bg-[#ffffff] p-3">
      <p className="text-sm font-semibold text-black">{item.prompt}</p>
      <p className="mt-1 text-[11px] text-ink-500">Sparat {formatDate(item.updatedAt || item.createdAt)}</p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="chip">{item.filters?.district || "Alla områden"}</span>
        <span className="chip">{typeLabel(item.filters?.type)}</span>
        <span className="chip">{formatSek(item.filters?.maxBudget || 0)}</span>
      </div>

      <div className="mt-3 flex gap-2">
        <button type="button" className="rounded-xl border border-[#0b0a0e] bg-[#0b0a0e] px-3 py-2 text-xs font-semibold text-white" onClick={() => onRun(item)}>
          Kör AI-sök
        </button>
        <button type="button" className="rounded-xl border border-black/20 bg-[#ffffff] px-3 py-2 text-xs font-semibold" onClick={() => onDelete(item.id)}>
          Ta bort
        </button>
      </div>
    </article>
  );
}

function SavedSearchesPanel({
  filterPresets,
  onApplyFilterPreset,
  onDeleteFilterPreset,
  savedAiSearches,
  onRunSavedAiSearch,
  onDeleteSavedAiSearch
}) {
  return (
    <section className="surface flex h-full min-h-0 flex-col border-[#c8d1de] bg-gradient-to-br from-[#edf2f7] via-[#eef2f8] to-[#f5f8fc] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink-900">Sökhistorik</p>
          <p className="text-xs text-ink-600">Snabb åtkomst till sparade filter och AI-sökningar.</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-[#ffffff] px-2 py-1 text-xs font-semibold text-ink-700">
          {filterPresets.length + savedAiSearches.length} totalt
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Sparade filter</p>
            <span className="text-xs text-ink-500">{filterPresets.length}</span>
          </div>
          {filterPresets.length === 0 ? <p className="rounded-2xl border border-black/10 bg-[#ffffff] p-3 text-xs text-ink-500">Inga sparade filter ännu.</p> : null}
          {filterPresets.map((item) => (
            <FilterPresetCard key={item.id} item={item} onApply={onApplyFilterPreset} onDelete={onDeleteFilterPreset} />
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Sparade AI-sökningar</p>
            <span className="text-xs text-ink-500">{savedAiSearches.length}</span>
          </div>
          {savedAiSearches.length === 0 ? <p className="rounded-2xl border border-black/10 bg-[#ffffff] p-3 text-xs text-ink-500">Inga sparade AI-sökningar ännu.</p> : null}
          {savedAiSearches.map((item) => (
            <SavedAiSearchCard key={item.id} item={item} onRun={onRunSavedAiSearch} onDelete={onDeleteSavedAiSearch} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default SavedSearchesPanel;
