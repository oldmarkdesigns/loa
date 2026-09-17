import { formatDate } from "../../lib/formatters";
import StatusPill from "../../components/app/StatusPill";

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
                    <StatusPill status={viewing.status} variant="lead" />
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
