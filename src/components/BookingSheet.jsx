import { useMemo, useState } from "react";

function BookingSheet({ listing, onClose, onSubmit }) {
  const [form, setForm] = useState({
    company: "",
    contact: "",
    email: "",
    date: "",
    notes: ""
  });

  const canSubmit = useMemo(
    () => form.company && form.contact && form.email && form.date,
    [form.company, form.contact, form.date, form.email]
  );

  return (
    <div className="fixed inset-0 z-50 bg-transparent p-4" onClick={onClose}>
      <div
        className="surface mx-auto mt-10 w-full max-w-xl p-5 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-brand-700">Boka visning</p>
            <h2 className="font-display text-2xl font-semibold text-ink-900">
              {listing ? listing.title : "Starta flöde"}
            </h2>
            <p className="text-sm text-ink-600">Skicka en direkt visningsförfrågan till hyresvärden.</p>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary px-3 py-1.5">
            Stäng
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <input
            className="field"
            placeholder="Företag"
            value={form.company}
            onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
          />
          <input
            className="field"
            placeholder="Kontaktperson"
            value={form.contact}
            onChange={(event) => setForm((prev) => ({ ...prev, contact: event.target.value }))}
          />
          <input
            className="field"
            type="email"
            placeholder="E-post"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <input
            className="field"
            type="date"
            value={form.date}
            onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
          />
          <textarea
            className="field min-h-24"
            placeholder="Meddelande till hyresvärden"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          />
        </div>

        <button
          type="button"
          className="btn-primary mt-4 w-full"
          disabled={!canSubmit}
          onClick={() => onSubmit(form)}
        >
          Skicka förfrågan
        </button>
      </div>
    </div>
  );
}

export default BookingSheet;
