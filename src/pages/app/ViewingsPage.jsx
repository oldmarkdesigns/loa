import { formatDate } from "../../lib/formatters";

function statusClass(status) {
  if (status === "new") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "contacted") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "viewing_booked") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "negotiating") return "border-indigo-200 bg-indigo-50 text-indigo-800";
  if (status === "won") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "lost") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-black/10 bg-[#f7f7f7] text-ink-700";
}

function statusLabel(status) {
  if (status === "new") return "Ny";
  if (status === "contacted") return "Kontaktad";
  if (status === "viewing_booked") return "Visning bokad";
  if (status === "negotiating") return "Förhandling";
  if (status === "won") return "Vunnen";
  if (status === "lost") return "Förlorad";
  return status;
}

function statusDetail(status) {
  if (status === "new") return "Väntar på svar";
  if (status === "contacted") return "Dialog pågår";
  if (status === "viewing_booked") return "Tid är bokad";
  if (status === "negotiating") return "Förhandling pågår";
  if (status === "won") return "Avslutad affär";
  if (status === "lost") return "Ärendet är avslutat";
  return "Ärendet är avslutat";
}

function ViewingsPage({ app }) {
  const { viewings } = app;

  return (
    <section className="p-4 sm:p-6">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="mb-4">
          <h1 className="text-3xl font-semibold">Visningar</h1>
          <p className="text-sm text-ink-600">Statusflöde: Ny, Kontaktad, Visning bokad, Stängd.</p>
        </div>

        <div className="rounded-3xl border border-black/10 bg-[#ffffff] p-4">
          <div className="space-y-2">
            {viewings.length === 0 ? <p className="rounded-2xl border border-black/10 bg-[#fafafa] p-3 text-sm text-ink-500">Du har inga visningsförfrågningar ännu.</p> : null}
            {viewings.map((viewing) => (
              <article key={viewing.id} className="overflow-hidden rounded-3xl border border-black/10 bg-[#ffffff]">
                <div className="relative">
                  <img src={viewing.listing?.image || "/object-images/object-1.jpeg"} alt={viewing.listing?.title || "Objekt"} className="h-52 w-full object-cover" />
                  <div className="absolute left-3 top-3 flex items-center gap-2">
                    <span className="rounded-xl border border-white/40 bg-black/55 px-2 py-1 text-[11px] font-semibold text-white">{viewing.listing?.type || "Lokal"}</span>
                    {viewing.listing?.verified ? <span className="rounded-xl border border-white/40 bg-[#ffffff]/90 px-2 py-1 text-[11px] font-semibold text-black">Verifierad</span> : null}
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold">{viewing.listing?.title || "Objekt"}</p>
                      <p className="text-xs text-ink-500">{viewing.listing?.district || "-"} • {viewing.listing?.address || "-"}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusClass(viewing.status)}`}>
                      {statusLabel(viewing.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-2xl border border-black/10 bg-[#fafafa] px-2 py-2">Status: {statusDetail(viewing.status)}</div>
                    <div className="rounded-2xl border border-black/10 bg-[#fafafa] px-2 py-2">Skapad: {formatDate(viewing.createdAt)}</div>
                    <div className="col-span-2 rounded-2xl border border-black/10 bg-[#fafafa] px-2 py-2">Meddelande: {viewing.message || "-"}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ViewingsPage;
