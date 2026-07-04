import { useEffect, useMemo, useState } from "react";
import { listingApi } from "../../api";
import { formatDate, formatSek } from "../../lib/formatters";
import { navigateTo } from "../../lib/router";
import { Icon } from "../../components/icons/Icon";
import Breadcrumbs from "../../components/layout/Breadcrumbs";

function seededMetric(listing, salt, min, span) {
  const seed = `${listing.id}-${salt}-${listing.sizeSqm || 0}-${listing.priceMonthly || 0}`;
  const hash = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return min + (hash % span);
}

function seededViews(listing) {
  return seededMetric(listing, "views", 120, 2200);
}

function seededSaves(listing) {
  return seededMetric(listing, "saves", 3, 65);
}

function statusPillClass(status) {
  if (status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "draft") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-black/10 bg-[#fffffe] text-ink-700";
}

function statusLabel(status) {
  if (status === "active") return "Aktiv";
  if (status === "draft") return "Utkast";
  return "Inaktiv";
}

function timeValue(dateValue) {
  const parsed = new Date(dateValue || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function PublisherOverviewPage({ app }) {
  const {
    user,
    leads
  } = app;

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("alla");
  const [cardView, setCardView] = useState("compact");
  const [publisherListings, setPublisherListings] = useState([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);

  async function refreshPublisherListings() {
    if (!user?.id) {
      setPublisherListings([]);
      setIsLoadingListings(false);
      return;
    }

    setIsLoadingListings(true);
    try {
      const { listings: allListings } = await listingApi.getListings({
        county: "Stockholms län",
        query: "",
        district: "Alla",
        type: [],
        minSize: "",
        maxSize: "",
        maxBudget: 500000,
        teamSize: "",
        requirePrice: false,
        onlyBostadsratt: false,
        daysOnMarket: "all",
        keyword: "",
        advertiser: "Alla",
        verified: false,
        readyNow: false
      });
      setPublisherListings(allListings.filter((listing) => listing.ownerId === user.id));
    } catch (_error) {
      setPublisherListings([]);
    } finally {
      setIsLoadingListings(false);
    }
  }

  useEffect(() => {
    void refreshPublisherListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const ownListings = useMemo(
    () => publisherListings.filter((listing) => listing.ownerId === user?.id),
    [publisherListings, user?.id]
  );

  const ownListingIds = useMemo(
    () => new Set(ownListings.map((listing) => String(listing.id))),
    [ownListings]
  );

  const ownLeads = useMemo(
    () => leads.filter((lead) => ownListingIds.has(String(lead.listingId))),
    [leads, ownListingIds]
  );

  const leadCountByListingId = useMemo(() => {
    const map = new Map();
    ownLeads.forEach((lead) => {
      const key = String(lead.listingId || "");
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [ownLeads]);

  const listingPerformance = useMemo(() => {
    return ownListings
      .map((listing) => {
        const views = seededViews(listing);
        const saves = seededSaves(listing);
        const listingLeads = leadCountByListingId.get(String(listing.id)) || 0;
        const conversion = views > 0 ? (listingLeads / views) * 100 : 0;

        return {
          ...listing,
          views,
          saves,
          listingLeads,
          conversion
        };
      })
      .sort((a, b) => timeValue(b.updatedAt) - timeValue(a.updatedAt));
  }, [leadCountByListingId, ownListings]);

  const filteredListings = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return listingPerformance.filter((listing) => {
      const statusMatch = statusFilter === "alla" || String(listing.status || "") === statusFilter;
      const queryMatch = !lowered || [listing.title, listing.address, listing.district, listing.type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(lowered));
      return statusMatch && queryMatch;
    });
  }, [listingPerformance, query, statusFilter]);

  const activeCount = listingPerformance.filter((listing) => listing.status === "active").length;
  const draftCount = listingPerformance.filter((listing) => listing.status !== "active").length;
  const totalViews = listingPerformance.reduce((sum, listing) => sum + listing.views, 0);
  const totalLeads = ownLeads.length;
  const conversionRate = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0;
  const averageResponse = listingPerformance.length
    ? Math.round(listingPerformance.reduce((sum, listing) => sum + Number(listing.responseHours || 0), 0) / listingPerformance.length)
    : 0;

  const pipelineEntries = useMemo(() => {
    const counts = new Map();
    ownLeads.forEach((lead) => {
      const status = String(lead.status || "Nytt");
      counts.set(status, (counts.get(status) || 0) + 1);
    });

    const fallbackOrder = ["Nytt", "Kontaktad", "Visning bokad", "Förhandlar", "Avslutad"];
    const dynamicStatuses = Array.from(counts.keys()).filter((status) => !fallbackOrder.includes(status));
    const order = [...fallbackOrder, ...dynamicStatuses];

    return order
      .filter((status) => counts.has(status))
      .map((status) => ({ status, count: counts.get(status) || 0 }));
  }, [ownLeads]);

  const topPerformers = useMemo(() => {
    return [...listingPerformance]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [listingPerformance]);

  const activityFeed = useMemo(() => {
    const listingEvents = listingPerformance.map((listing) => ({
      id: `listing-${listing.id}`,
      label: `${listing.title} uppdaterades`,
      date: listing.updatedAt,
      meta: `${statusLabel(listing.status)} • ${listing.district}`
    }));

    const leadEvents = ownLeads.map((lead) => {
      const related = ownListings.find((listing) => String(listing.id) === String(lead.listingId));
      return {
        id: `lead-${lead.id}`,
        label: `Lead: ${lead.status || "Nytt"}`,
        date: lead.updatedAt || lead.createdAt,
        meta: related ? related.title : "Objekt saknas"
      };
    });

    return [...listingEvents, ...leadEvents]
      .sort((a, b) => timeValue(b.date) - timeValue(a.date))
      .slice(0, 6);
  }, [listingPerformance, ownLeads, ownListings]);

  const maxViews = topPerformers.length > 0
    ? Math.max(...topPerformers.map((entry) => entry.views))
    : 1;

  return (
    <section className="h-full overflow-y-auto p-4 pb-8 sm:p-6">
      <div className="mx-auto w-full max-w-[1240px] space-y-5">
        <header className="px-1 py-1">
          <Breadcrumbs
            className="mb-2"
            items={[
              { label: "Startsida", to: "/" },
              { label: "Dina objekt" }
            ]}
          />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Hyresvärd</p>
              <h1 className="mt-1 text-2xl font-semibold">Dina objekt</h1>
              <p className="mt-2 text-sm text-ink-600">
                Hantera objekt, följ statistik och arbeta med leads i ett sammanhängande flöde.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn-secondary px-4" onClick={() => navigateTo("/app/leads")}>
                <Icon name="calendar" className="mr-1.5 h-4 w-4" />
                Intressen
              </button>
              <button type="button" className="btn-primary px-4" onClick={() => navigateTo("/app/publish")}>
                <span className="mr-1.5 text-base leading-none">+</span>
                Publicera ny annons
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[1.55fr_0.95fr]">
          <article className="surface self-start p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold">Hantera objekt</h2>
              <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-[280px_170px_auto]">
                <input
                  className="field"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Sök titel, adress eller område"
                />
                <select className="field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="alla">Alla statusar</option>
                  <option value="active">Aktiva</option>
                  <option value="draft">Utkast</option>
                </select>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-[#fffffe] px-3 py-2 text-xs font-semibold text-ink-700">
                  <span>Detaljvy</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={cardView === "detailed"}
                    aria-label="Detaljvy"
                    className={`relative inline-flex h-6 w-10 min-h-0 items-center rounded-full p-0.5 transition-colors ${
                      cardView === "detailed" ? "justify-end bg-[#0f1930]" : "justify-start bg-[#a8adb3]"
                    }`}
                    onClick={() => setCardView((prev) => (prev === "detailed" ? "compact" : "detailed"))}
                  >
                    <span aria-hidden="true" className="h-5 w-5 rounded-full bg-[#fffffe] shadow-[0_1px_2px_rgba(15,25,48,0.35)]" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {isLoadingListings ? (
                <div className="rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-5 text-sm text-ink-600 sm:col-span-2">
                  Laddar dina objekt...
                </div>
              ) : null}

              {!isLoadingListings && filteredListings.length === 0 ? (
                <div className="rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-5 text-sm text-ink-600 sm:col-span-2">
                  Inga objekt matchar dina filter.
                </div>
              ) : null}

              {filteredListings.map((listing) => {
                return (
                  <button
                    key={listing.id}
                    type="button"
                    className="!rounded-[24px] border border-black/10 bg-[#fffffe] p-3 text-left transition hover:border-[#0f1930]/30 hover:bg-[#fffffe] sm:p-4"
                    onClick={() => navigateTo(`/app/my-listings/${encodeURIComponent(listing.id)}`)}
                  >
                    {cardView === "compact" ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-[92px_1fr] gap-3">
                          <img
                            src={listing.image || "/object-images/object-1.jpeg"}
                            alt={listing.title}
                            className="h-20 w-full rounded-lg border border-black/10 object-cover"
                          />
                          <div className="flex min-w-0 flex-col justify-between">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-sm font-semibold">{listing.title || listing.address}</p>
                              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusPillClass(listing.status)}`}>
                                {statusLabel(listing.status)}
                              </span>
                            </div>
                            <p className="text-sm text-ink-600">{listing.district} • {listing.address}</p>
                            <p className="mt-1 text-xs text-ink-600">
                              {listing.views.toLocaleString("sv-SE")} visningar • {listing.saves.toLocaleString("sv-SE")} sparade • {listing.listingLeads} leads
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        <img
                          src={listing.image || "/object-images/object-1.jpeg"}
                          alt={listing.title}
                          className="h-36 w-full rounded-lg border border-black/10 object-cover"
                        />
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-base font-semibold leading-tight">{listing.title}</p>
                            <p className="text-sm text-ink-600">{listing.district} • {listing.address}</p>
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusPillClass(listing.status)}`}>
                            {statusLabel(listing.status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <span className="rounded-xl border border-black/10 bg-[#fffffe] px-2.5 py-2 text-center font-semibold text-ink-800 whitespace-nowrap">
                            {listing.sizeSqm} kvm
                          </span>
                          <span className="rounded-xl border border-black/10 bg-[#fffffe] px-2.5 py-2 text-center font-semibold text-ink-800 whitespace-nowrap">
                            {listing.capacity} platser
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-xl border border-black/10 bg-[#fffffe] px-2.5 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Objektstatus</p>
                            <p className="mt-0.5 text-sm font-semibold text-ink-900">{listing.status === "active" ? "Aktiv" : "Utkast"}</p>
                          </div>
                          <div className="rounded-xl border border-black/10 bg-[#fffffe] px-2.5 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Visningar</p>
                            <p className="mt-0.5 text-sm font-semibold text-ink-900">{listing.views.toLocaleString("sv-SE")}</p>
                          </div>
                          <div className="rounded-xl border border-black/10 bg-[#fffffe] px-2.5 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Leads</p>
                            <p className="mt-0.5 text-sm font-semibold text-ink-900">{listing.listingLeads}</p>
                          </div>
                        </div>

                        {Array.isArray(listing.amenities) && listing.amenities.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {listing.amenities.slice(0, 4).map((amenity) => (
                              <span key={`${listing.id}-${amenity}`} className="rounded-full border border-black/10 bg-[#fffffe] px-2 py-0.5 text-[11px] font-semibold text-ink-600">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </article>

          <div className="space-y-4">
            <article className="surface p-4 sm:p-5">
              <h3 className="text-lg font-semibold">Objektprestanda</h3>
              <p className="mt-1 text-xs text-ink-600">Visningar och leads per objekt</p>
              <div className="mt-4 space-y-3">
                {topPerformers.length === 0 ? (
                  <p className="rounded-2xl border border-black/10 bg-[#fafafa] px-3 py-4 text-sm text-ink-600">
                    Publicera ditt första objekt för att se statistik.
                  </p>
                ) : null}
                {topPerformers.map((entry) => {
                  const width = Math.max(8, Math.round((entry.views / maxViews) * 100));
                  return (
                    <div key={entry.id}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                        <span className="truncate font-semibold">{entry.title}</span>
                        <span className="text-ink-600">{entry.views.toLocaleString("sv-SE")} visningar</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[#fffffe]">
                        <div className="h-full rounded-full bg-[#0f1930]" style={{ width: `${width}%` }} />
                      </div>
                      <div className="mt-1 text-[11px] text-ink-600">
                        {entry.listingLeads} leads • konvertering {entry.conversion.toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="surface p-4">
              <h3 className="text-sm font-semibold">Överblick</h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-black/10 bg-[#fffffe] px-2.5 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Aktiva objekt</p>
                  <p className="mt-1 text-xl font-semibold leading-none">{activeCount}</p>
                  <p className="mt-1 text-[11px] text-ink-600">{draftCount} utkast</p>
                </div>
                <div className="rounded-xl border border-black/10 bg-[#fffffe] px-2.5 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Visningar</p>
                  <p className="mt-1 text-xl font-semibold leading-none">{totalViews.toLocaleString("sv-SE")}</p>
                  <p className="mt-1 text-[11px] text-ink-600">30 dagar</p>
                </div>
                <div className="rounded-xl border border-black/10 bg-[#fffffe] px-2.5 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Leads</p>
                  <p className="mt-1 text-xl font-semibold leading-none">{totalLeads}</p>
                  <p className="mt-1 text-[11px] text-ink-600">Konv. {conversionRate.toFixed(1)}%</p>
                </div>
                <div className="rounded-xl border border-black/10 bg-[#fffffe] px-2.5 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Svarstid</p>
                  <p className="mt-1 text-xl font-semibold leading-none">{averageResponse}h</p>
                  <p className="mt-1 text-[11px] text-ink-600">Genomsnitt</p>
                </div>
              </div>
            </article>

            <article className="surface p-4 sm:p-5">
              <h3 className="text-lg font-semibold">Lead-pipeline</h3>
              <p className="mt-1 text-xs text-ink-600">Status över alla inkomna intressen</p>
              <div className="mt-4 space-y-2">
                {pipelineEntries.length === 0 ? (
                  <p className="rounded-2xl border border-black/10 bg-[#fafafa] px-3 py-4 text-sm text-ink-600">
                    Inga leads ännu.
                  </p>
                ) : null}
                {pipelineEntries.map((entry) => (
                  <div key={entry.status} className="flex items-center justify-between rounded-xl border border-black/10 bg-[#fffffe] px-3 py-2">
                    <span className="text-sm text-ink-700">{entry.status}</span>
                    <span className="text-sm font-semibold text-ink-900">{entry.count}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="surface p-4 sm:p-5">
              <h3 className="text-lg font-semibold">Senaste aktivitet</h3>
              <div className="mt-3 space-y-2">
                {activityFeed.length === 0 ? (
                  <p className="rounded-2xl border border-black/10 bg-[#fafafa] px-3 py-4 text-sm text-ink-600">
                    Aktivitet visas när objekt eller leads uppdateras.
                  </p>
                ) : null}
                {activityFeed.map((event) => (
                  <div key={event.id} className="rounded-xl border border-black/10 bg-[#fffffe] px-3 py-2.5">
                    <p className="text-sm font-semibold">{event.label}</p>
                    <p className="text-xs text-ink-600">{event.meta}</p>
                    <p className="mt-1 text-[11px] text-ink-500">{formatDate(event.date)}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PublisherOverviewPage;
