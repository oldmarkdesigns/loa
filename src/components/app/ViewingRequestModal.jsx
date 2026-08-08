import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { CalendarIcon } from "../icons/UiIcons";

function ViewingRequestModal({ listing, onClose, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    inquiryType: "viewing",
    preferredDate: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const preferredDateInputRef = useRef(null);
  const calendarPopoverRef = useRef(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const canSubmit = useMemo(() => {
    if (form.inquiryType === "viewing") return Boolean(form.preferredDate);
    return String(form.message || "").trim().length > 0;
  }, [form.inquiryType, form.preferredDate, form.message]);

  useEffect(() => {
    if (!listing) return;
    setForm((prev) => ({ ...prev, inquiryType: "viewing" }));
    setCalendarOpen(false);
    setSubmitting(false);
    setError("");
    const id = window.setTimeout(() => setOpen(true), 16);
    return () => window.clearTimeout(id);
  }, [listing?.id]);

  useEffect(() => {
    if (!calendarOpen) return undefined;
    function handleClickOutside(event) {
      if (!calendarPopoverRef.current) return;
      if (!calendarPopoverRef.current.contains(event.target)) setCalendarOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarOpen]);

  if (!listing) {
    return null;
  }

  const closeWithAnimation = () => {
    setOpen(false);
    window.setTimeout(() => onClose?.(), 220);
  };

  return (
    <div
      className={`fixed inset-0 z-[96] flex items-center justify-center bg-[#ffffff]/0 p-4 backdrop-blur-[2px] transition-all duration-200 sm:p-5 ${
        open ? "opacity-100" : "opacity-0"
      }`}
      onClick={closeWithAnimation}
    >
      <div
        className={`w-full max-w-xl rounded-3xl border border-black/10 bg-[#ffffff] p-5 shadow-[0_16px_40px_rgba(15,25,48,0.12)] transition-all duration-200 sm:p-6 ${
          open ? "translate-y-0 scale-100" : "translate-y-2 scale-[0.985]"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-ink-900">Skicka till uthyrare</h2>
            <p className="mt-1 text-[1.05rem] text-ink-700">{listing.title}</p>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Ärendetyp</span>
              <select
                className="field select-chevron"
                value={form.inquiryType}
                onChange={(event) => setForm((prev) => ({ ...prev, inquiryType: event.target.value === "viewing" ? "viewing" : "contact" }))}
              >
                <option value="viewing">Boka visning</option>
                <option value="contact">Kontaktförfrågan</option>
              </select>
            </label>

            {form.inquiryType === "viewing" ? (
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Önskat datum</span>
                <div className="relative">
                  <input
                    ref={preferredDateInputRef}
                    className="field date-field-no-picker pr-12"
                    type="date"
                    value={form.preferredDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, preferredDate: event.target.value }))}
                    onFocus={() => setCalendarOpen(false)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-700"
                    aria-label="Öppna kalender"
                    onClick={() => setCalendarOpen((prev) => !prev)}
                  >
                    <CalendarIcon className="h-5 w-5" />
                  </button>
                  {calendarOpen ? (
                    <div ref={calendarPopoverRef} className="booking-calendar-popover absolute right-0 top-[calc(100%+8px)] z-[110]">
                      <DayPicker
                        mode="single"
                        selected={form.preferredDate ? new Date(form.preferredDate) : undefined}
                        onSelect={(selectedDate) => {
                          if (!selectedDate) return;
                          const safeDate = new Date(
                            selectedDate.getFullYear(),
                            selectedDate.getMonth(),
                            selectedDate.getDate()
                          );
                          const isoDate = safeDate.toISOString().slice(0, 10);
                          setForm((prev) => ({ ...prev, preferredDate: isoDate }));
                          setCalendarOpen(false);
                          preferredDateInputRef.current?.focus();
                        }}
                        className="booking-day-picker"
                      />
                    </div>
                  ) : null}
                </div>
              </label>
            ) : (
              <div className="hidden sm:block" aria-hidden="true" />
            )}
          </div>

          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Meddelande</span>
            <textarea
              className="field min-h-24"
              placeholder={form.inquiryType === "viewing" ? "Skriv önskad tid och övriga detaljer." : "Skriv ditt meddelande till uthyraren."}
              value={form.message}
              onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" className="rounded-full border border-black/10 bg-[#ffffff] px-7 py-2.5 text-sm font-semibold text-ink-700 hover:bg-[#ffffff]" onClick={closeWithAnimation}>
            Avbryt
          </button>
          <button
            type="button"
            className="rounded-full border border-[#0b0a0e] bg-[#0b0a0e] px-8 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canSubmit || submitting}
            onClick={async () => {
              if (submitting) return;
              setSubmitting(true);
              setError("");
              try {
                await onSubmit({
                  listingId: listing.id,
                  preferredSlots: form.preferredDate ? [new Date(form.preferredDate).toISOString()] : [],
                  message: form.message
                });
              } catch (submitError) {
                setError(submitError?.message || "Kunde inte skicka förfrågan.");
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "Skickar..." : "Skicka"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewingRequestModal;
