import { useMemo, useState } from "react";

function ViewingRequestModal({ listing, onClose, onSubmit }) {
  const [form, setForm] = useState({
    preferredDate: "",
    message: "",
    budget: "",
    teamSize: ""
  });

  const canSubmit = useMemo(() => form.preferredDate, [form.preferredDate]);

  if (!listing) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/45 p-4 sm:items-center" onClick={onClose}>
      <div className="surface w-full max-w-xl p-5" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Visningsförfrågan</p>
            <h2 className="text-2xl font-semibold text-ink-900">{listing.title}</h2>
            <p className="text-sm text-ink-600">Fyll i förfrågan så skickas den direkt till hyresvärden.</p>
          </div>
          <button type="button" className="btn-secondary px-3 py-1.5" onClick={onClose}>Stäng</button>
        </div>

        <div className="mt-4 grid gap-3">
          <input
            className="field"
            type="datetime-local"
            value={form.preferredDate}
            onChange={(event) => setForm((prev) => ({ ...prev, preferredDate: event.target.value }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="field" type="number" placeholder="Teamstorlek" value={form.teamSize} onChange={(event) => setForm((prev) => ({ ...prev, teamSize: event.target.value }))} />
            <input className="field" type="number" placeholder="Budget / mån (SEK)" value={form.budget} onChange={(event) => setForm((prev) => ({ ...prev, budget: event.target.value }))} />
          </div>
          <textarea className="field min-h-24" placeholder="Meddelande till hyresvärden" value={form.message} onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))} />
        </div>

        <button
          type="button"
          className="btn-primary mt-4 w-full"
          disabled={!canSubmit}
          onClick={() => {
            onSubmit({
              listingId: listing.id,
              preferredSlots: [new Date(form.preferredDate).toISOString()],
              message: form.message,
              budget: Number(form.budget || 0),
              teamSize: Number(form.teamSize || 0)
            });
          }}
        >
          Skicka visningsförfrågan
        </button>
      </div>
    </div>
  );
}

export default ViewingRequestModal;
