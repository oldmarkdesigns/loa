import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarIcon } from "../icons/UiIcons";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function formatDateLabel(isoDate) {
  if (!isoDate) return "Välj datum";
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" });
}

function ViewingRequestModal({ listing, onClose, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    inquiryType: "viewing",
    preferredDate: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const lastListingRef = useRef(null);
  if (listing) lastListingRef.current = listing;
  const displayListing = listing || lastListingRef.current;

  const canSubmit = useMemo(() => {
    if (form.inquiryType === "viewing") return Boolean(form.preferredDate);
    return String(form.message || "").trim().length > 0;
  }, [form.inquiryType, form.preferredDate, form.message]);

  useEffect(() => {
    if (!listing) return;
    setForm({ inquiryType: "viewing", preferredDate: "", message: "" });
    setCalendarOpen(false);
    setSubmitting(false);
    setError("");
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  if (!displayListing) return null;

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        listingId: displayListing.id,
        preferredSlots: form.preferredDate ? [new Date(form.preferredDate).toISOString()] : [],
        message: form.message
      });
      setOpen(false);
    } catch (submitError) {
      setError(submitError?.message || "Kunde inte skicka förfrågan.");
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) onClose?.();
      }}
    >
      <DialogContent className="max-w-xl rounded-3xl border border-black/10 bg-[#ffffff] p-5 sm:p-6">
        <DialogHeader className="gap-1 text-left">
          <DialogTitle className="text-2xl font-semibold text-ink-900">Skicka till uthyrare</DialogTitle>
          <DialogDescription className="text-[1.05rem] text-ink-700">{displayListing.title}</DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Ärendetyp</span>
              <Select
                value={form.inquiryType}
                onValueChange={(value) => setForm((prev) => ({ ...prev, inquiryType: value === "viewing" ? "viewing" : "contact" }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewing">Boka visning</SelectItem>
                  <SelectItem value="contact">Kontaktförfrågan</SelectItem>
                </SelectContent>
              </Select>
            </label>

            {form.inquiryType === "viewing" ? (
              <div className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Önskat datum</span>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto w-full justify-between rounded-md px-3 py-2 text-left text-sm font-normal"
                      />
                    }
                  >
                    <span className={form.preferredDate ? "text-ink-900" : "text-ink-500"}>
                      {formatDateLabel(form.preferredDate)}
                    </span>
                    <CalendarIcon className="h-4 w-4 shrink-0 text-ink-700" />
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-auto p-2">
                    <Calendar
                      mode="single"
                      className="calendar-scope"
                      selected={form.preferredDate ? new Date(`${form.preferredDate}T00:00:00`) : undefined}
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
                      }}
                      style={{ "--cell-size": "2rem" }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            ) : (
              <div className="hidden sm:block" aria-hidden="true" />
            )}
          </div>

          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Meddelande</span>
            <Textarea
              className="min-h-24"
              placeholder={form.inquiryType === "viewing" ? "Skriv önskad tid och övriga detaljer." : "Skriv ditt meddelande till uthyraren."}
              value={form.message}
              onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            />
          </label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="h-auto rounded-full px-7 py-2.5 text-sm font-semibold" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button
            type="button"
            className="h-auto rounded-full bg-[#0b0a0e] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#0b0a0e]/90"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Skickar..." : "Skicka"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ViewingRequestModal;
