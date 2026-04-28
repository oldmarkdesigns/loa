import { useMemo } from "react";
import Breadcrumbs from "../../components/layout/Breadcrumbs";

const statuses = ["Ny", "Kontaktad", "Visning bokad", "Stängd"];

function viewingStatusClass(status) {
  if (status === "Ny") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "Kontaktad") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "Visning bokad") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  return "border-black/10 bg-[#f7f7f7] text-ink-700";
}

function viewingStatusDetail(status) {
  if (status === "Ny") return "Väntar på svar";
  if (status === "Kontaktad") return "Dialog pågår";
  if (status === "Visning bokad") return "Tid är bokad";
  return "Ärendet är avslutat";
}

function LeadsPage({ app }) {
  const { user, leads, viewings, updateLead } = app;
  const roles = (Array.isArray(user?.roles) ? user.roles : [user?.role || "renter"])
    .map((role) => role === "publisher" ? "broker" : role);
  const hasPublisherAccess = roles.includes("broker") || roles.includes("company_admin");
  const viewingItems = useMemo(() => {
    const bookedLeadViewings = leads
      .filter((lead) => String(lead.status || "").trim().toLowerCase() === "visning bokad")
      .map((lead) => ({
        id: `lead-${lead.id}`,
        listingId: lead.listingId,
        renterId: lead.renterId,
        status: lead.status,
        message: lead.notes || "",
        createdAt: lead.updatedAt || lead.createdAt,
        listing: lead.listing
      }));

    const allItems = [...bookedLeadViewings, ...viewings];
    const seen = new Set();
    return allItems.filter((item) => {
      const dedupeKey = `${item.listingId || item.listing?.id || "x"}-${item.renterId || "x"}-${item.status || "x"}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });
  }, [leads, viewings]);

  if (!hasPublisherAccess) {
    return (
      <section className="h-full overflow-y-auto p-4 pb-8 sm:p-6">
        <div className="mx-auto w-full max-w-[1240px] space-y-3">
          <Breadcrumbs
            className="mb-2"
            items={[
              { label: "Startsida", to: "/" },
              { label: "Intresse och visningar" }
            ]}
          />
          <div className="rounded-3xl border border-black/10 bg-[#fffffe] p-6 text-sm text-ink-600">
            Intressehantering är tillgänglig i hyresvärdsläge.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="h-full overflow-y-auto p-4 pb-8 sm:p-6">
      <div className="mx-auto w-full max-w-[1240px]">
        <header className="mb-4 px-1 py-1">
          <Breadcrumbs
            className="mb-2"
            items={[
              { label: "Startsida", to: "/" },
              { label: "Intresse och visningar" }
            ]}
          />
          <h1 className="text-2xl font-semibold">Intresse och visningar</h1>
          <p className="text-sm text-ink-600">Kombinerad hyresvärdsvy för pipeline och inkomna visningsförfrågningar.</p>
        </header>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl border border-black/10 bg-[#fffffe] p-4 text-sm text-ink-700">
              <p className="font-semibold">Vad är en intresseanmälan?</p>
              <p className="mt-1 text-ink-600">En intresseanmälan är en kvalificerad intressepost kopplad till ett specifikt objekt.</p>
              <p className="mt-2 text-ink-600">
                En intresseanmälan skapas när en hyresgäst skickar en visningsförfrågan. Du flyttar sedan status mellan
                <span className="font-semibold"> Ny</span>,
                <span className="font-semibold"> Kontaktad</span>,
                <span className="font-semibold"> Visning bokad</span> och
                <span className="font-semibold"> Stängd</span>.
              </p>
            </div>

            <section className="rounded-3xl border border-black/10 bg-[#fffffe] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-xl font-semibold">Intresseanmälningar</h2>
                <span className="rounded-full border border-black/10 bg-[#f7f7f7] px-2 py-1 text-xs font-semibold">{leads.length}</span>
              </div>
              <div className="space-y-2">
                {leads.length === 0 ? <p className="rounded-2xl border border-black/10 bg-[#fafafa] p-3 text-sm text-ink-500">Inga intresseanmälningar ännu.</p> : null}
                {leads.map((lead) => (
                  <article key={lead.id} className="rounded-2xl border border-black/10 bg-[#fafafa] p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{lead.listing?.title || "Objekt"}</p>
                        <p className="text-xs text-ink-600">Intressent: {lead.renter?.name || "Okänd"}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select className="field min-w-[180px]" value={lead.status} onChange={(event) => updateLead(lead.id, { status: event.target.value })}>
                          {statuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-black/10 bg-[#fffffe] p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">Visningar</h2>
              <span className="rounded-full border border-black/10 bg-[#f7f7f7] px-2 py-1 text-xs font-semibold">{viewingItems.length}</span>
            </div>
            <div className="space-y-2">
              {viewingItems.length === 0 ? <p className="rounded-2xl border border-black/10 bg-[#fafafa] p-3 text-sm text-ink-500">Du har inga visningsförfrågningar ännu.</p> : null}
              {viewingItems.map((viewing) => (
                <article key={viewing.id} className="overflow-hidden rounded-3xl border border-black/10 bg-[#fffffe]">
                  <div className="relative">
                    <img src={viewing.listing?.image || "/object-images/object-1.jpeg"} alt={viewing.listing?.title || "Objekt"} className="h-44 w-full object-cover" />
                    <div className="absolute left-3 top-3 flex items-center gap-2">
                      <span className="rounded-xl border border-white/40 bg-black/55 px-2 py-1 text-[11px] font-semibold text-white">{viewing.listing?.type || "Lokal"}</span>
                      {viewing.listing?.verified ? <span className="rounded-xl border border-white/40 bg-[#fffffe]/90 px-2 py-1 text-[11px] font-semibold text-black">Verifierad</span> : null}
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{viewing.listing?.title || "Objekt"}</p>
                        <p className="text-xs text-ink-600">{viewing.listing?.district || "-"} • {viewing.listing?.address || "-"}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${viewingStatusClass(viewing.status)}`}>
                        {viewing.status}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-black/10 bg-[#fafafa] px-2 py-2 text-xs text-ink-700">
                      Status: {viewingStatusDetail(viewing.status)}
                    </div>
                    <p className="rounded-2xl border border-black/10 bg-[#fafafa] px-2 py-2 text-xs text-ink-600">Meddelande: {viewing.message || "-"}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export default LeadsPage;
