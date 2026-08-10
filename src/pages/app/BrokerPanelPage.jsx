import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { leadActivitiesApi, listingApi } from "../../api";
import { formatDate } from "../../lib/formatters";
import { navigateTo } from "../../lib/router";
import AdminPanelShell from "../../components/layout/AdminPanelShell";
import StatusPill, {
  LEAD_STATUS_ORDER,
  listingStatusLabel,
  listingStatusOptions,
  leadStatusLabel,
  leadStatusOptions
} from "../../components/app/StatusPill";
import {
  BuildingIcon,
  CalendarIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  SettingsGearIcon,
  SupportIcon,
  UserIcon,
  XIcon
} from "../../components/icons/UiIcons";
import PanelProfileSection from "./PanelProfileSection";

export const BROKER_NAV_ITEMS = [
  { key: "objekt", label: "Mina objekt", path: "/app/broker", Icon: BuildingIcon },
  { key: "leads", label: "Leads", path: "/app/broker/leads", Icon: MessageSquareIcon }
];

export const BROKER_BOTTOM_NAV_ITEMS = [
  { key: "profil", label: "Profil", path: "/app/broker/profil", Icon: UserIcon },
  { key: "installningar", label: "Inställningar", path: "/app/broker/installningar", Icon: SettingsGearIcon },
  { key: "hjalp", label: "Hjälp", path: "/app/broker/hjalp", Icon: SupportIcon }
];

const BROKER_SECTION_TITLES = {
  objekt: "Mina objekt",
  leads: "Leads",
  profil: "Profil",
  installningar: "Inställningar",
  hjalp: "Hjälp"
};

function sectionFromPath(pathname) {
  const match = pathname.match(/^\/(?:app\/)?broker\/([^/?#]+)/);
  const key = match?.[1] || "objekt";
  return BROKER_SECTION_TITLES[key] ? key : "objekt";
}

function timeValue(dateValue) {
  const parsed = new Date(dateValue || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

const ACTIVITY_TYPES = [
  { value: "note", label: "Notering" },
  { value: "call", label: "Samtal" },
  { value: "email", label: "E-post" },
  { value: "viewing", label: "Visning" }
];

function initialsForName(name = "") {
  const parts = String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return (parts.map((part) => part[0]).join("") || "H").toUpperCase();
}

function relativeTime(value) {
  const time = new Date(value || 0).getTime();
  if (!Number.isFinite(time) || time <= 0) return "-";
  const diffMs = Date.now() - time;
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min sedan`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h sedan`;
  const days = Math.round(hours / 24);
  return `${days} d sedan`;
}

function isOverdueFollowUp(followUpDate) {
  if (!followUpDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(followUpDate);
  date.setHours(0, 0, 0, 0);
  return Number.isFinite(date.getTime()) && date < today;
}

function scoreClass(score) {
  if (score >= 85) return "text-emerald-700";
  if (score >= 70) return "text-amber-700";
  return "text-ink-700";
}

function SparkKpiCard({ card, series }) {
  const data = series.map((value, index) => ({ x: index + 1, y: value }));
  return (
    <article className="surface p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-ink-600">{card.label}</p>
        <span className="rounded-full border border-black/10 bg-[#ffffff] px-2 py-0.5 text-xs font-semibold text-ink-700">
          {card.delta}
        </span>
      </div>
      <p className="mt-3 text-[30px] font-semibold leading-none text-[#0b0a0e]">{card.value}</p>
      <p className="mt-2 text-xs text-ink-500">{card.meta}</p>
      <div className="mt-3 h-16">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`broker-kpi-${card.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0b0a0e" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#0b0a0e" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="y"
                stroke="#0b0a0e"
                strokeWidth={1.7}
                fill={`url(#broker-kpi-${card.key})`}
                fillOpacity={1}
              />
              <Tooltip
                cursor={{ stroke: "#0b0a0e", strokeOpacity: 0.18, strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid rgba(15,25,48,0.12)",
                  background: "#fff",
                  boxShadow: "0 8px 24px rgba(15,25,48,0.10)"
                }}
                formatter={(value) => [Number(value).toLocaleString("sv-SE"), ""]}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center rounded-xl border border-dashed border-black/15 bg-[#fafafa] text-xs font-semibold text-ink-500">
            Ingen data
          </div>
        )}
      </div>
    </article>
  );
}

function BrokerListingsSection({ app }) {
  const { user, leads = [], updateListing } = app;

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
        const views = Number(listing.views || 0);
        const inquiries = Number(listing.inquiries || 0);
        const listingLeads = leadCountByListingId.get(String(listing.id)) || 0;
        const conversion = views > 0 ? (listingLeads / views) * 100 : 0;

        return {
          ...listing,
          views,
          inquiries,
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

    const fallbackOrder = LEAD_STATUS_ORDER;
    const dynamicStatuses = Array.from(counts.keys()).filter((status) => !fallbackOrder.includes(status));
    const order = [...fallbackOrder, ...dynamicStatuses];

    return order
      .filter((status) => counts.has(status))
      .map((status) => ({ status, label: leadStatusLabel(status), count: counts.get(status) || 0 }));
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
      meta: `${listingStatusLabel(listing.status)} • ${listing.district}`
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

  const kpiCards = [
    {
      key: "active",
      label: "Aktiva objekt",
      value: activeCount.toLocaleString("sv-SE"),
      delta: `${draftCount} utkast`,
      meta: `${listingPerformance.length} objekt totalt`
    },
    {
      key: "views",
      label: "Visningar",
      value: totalViews.toLocaleString("sv-SE"),
      delta: "30 dagar",
      meta: "Riktig listingViews-data"
    },
    {
      key: "leads",
      label: "Leads",
      value: totalLeads.toLocaleString("sv-SE"),
      delta: `${conversionRate.toFixed(1)}%`,
      meta: "Konvertering från visningar"
    },
    {
      key: "response",
      label: "Snittsvarstid",
      value: `${averageResponse}h`,
      delta: "Genomsnitt",
      meta: "Från objektens svarstid"
    }
  ];
  const sparklineSeries = {
    active: [Math.max(0, activeCount - 2), Math.max(0, activeCount - 1), activeCount, activeCount, listingPerformance.length],
    views: topPerformers.slice(0, 6).map((listing) => listing.views),
    leads: topPerformers.slice(0, 6).map((listing) => listing.listingLeads),
    response: listingPerformance.slice(0, 6).map((listing) => Number(listing.responseHours || averageResponse || 0))
  };

  async function handleListingStatusChange(event, listingId) {
    event.stopPropagation();
    await updateListing?.(listingId, { status: event.target.value });
    await refreshPublisherListings();
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Hyresvärd</p>
          <h1 className="mt-1 text-2xl font-semibold">Mina objekt</h1>
          <p className="mt-2 text-sm text-ink-600">
            Hantera objekt, följ statistik och arbeta med leads i ett sammanhängande flöde.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-secondary px-4" onClick={() => navigateTo("/app/broker/leads")}>
            <CalendarIcon className="mr-1.5 h-4 w-4" />
            Intressen
          </button>
          <button type="button" className="btn-primary px-4" onClick={() => navigateTo("/app/publish")}>
            <span className="mr-1.5 text-base leading-none">+</span>
            Publicera ny annons
          </button>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <SparkKpiCard key={card.key} card={card} series={sparklineSeries[card.key] || []} />
        ))}
      </section>

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
                {listingStatusOptions().map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-[#ffffff] px-3 py-2 text-xs font-semibold text-ink-700">
                <span>Detaljvy</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={cardView === "detailed"}
                  aria-label="Detaljvy"
                  className={`relative inline-flex h-6 w-10 min-h-0 items-center rounded-full p-0.5 transition-colors ${
                    cardView === "detailed" ? "justify-end bg-[#0b0a0e]" : "justify-start bg-[#a8adb3]"
                  }`}
                  onClick={() => setCardView((prev) => (prev === "detailed" ? "compact" : "detailed"))}
                >
                  <span aria-hidden="true" className="h-5 w-5 rounded-full bg-[#ffffff] shadow-[0_1px_2px_rgba(15,25,48,0.35)]" />
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

            {filteredListings.map((listing) => (
              <article
                key={listing.id}
                role="button"
                tabIndex={0}
                className="!rounded-[24px] border border-black/10 bg-[#ffffff] p-3 text-left transition hover:border-[#0b0a0e]/30 hover:bg-[#ffffff] sm:p-4"
                onClick={() => navigateTo(`/app/my-listings/${encodeURIComponent(listing.id)}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") navigateTo(`/app/my-listings/${encodeURIComponent(listing.id)}`);
                }}
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
                          <StatusPill status={listing.status} variant="listing" className="shrink-0 text-[10px]" />
                        </div>
                        <p className="text-sm text-ink-600">{listing.district} • {listing.address}</p>
                        <p className="mt-1 text-xs text-ink-600">
                          {listing.views.toLocaleString("sv-SE")} visningar • {listing.inquiries.toLocaleString("sv-SE")} intressen • {listing.listingLeads} leads
                        </p>
                        <select
                          className="field mt-2 min-h-0 py-1.5 text-xs"
                          value={listing.status || "draft"}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => handleListingStatusChange(event, listing.id)}
                        >
                          {listingStatusOptions().map((status) => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                          ))}
                        </select>
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
                      <StatusPill status={listing.status} variant="listing" className="text-[11px]" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span className="rounded-xl border border-black/10 bg-[#ffffff] px-2.5 py-2 text-center font-semibold text-ink-800 whitespace-nowrap">
                        {listing.sizeSqm} kvm
                      </span>
                      <span className="rounded-xl border border-black/10 bg-[#ffffff] px-2.5 py-2 text-center font-semibold text-ink-800 whitespace-nowrap">
                        {listing.capacity} platser
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-2.5 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Objektstatus</p>
                        <p className="mt-0.5 text-sm font-semibold text-ink-900">{listingStatusLabel(listing.status)}</p>
                      </div>
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-2.5 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Visningar</p>
                        <p className="mt-0.5 text-sm font-semibold text-ink-900">{listing.views.toLocaleString("sv-SE")}</p>
                      </div>
                      <div className="rounded-xl border border-black/10 bg-[#ffffff] px-2.5 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Leads</p>
                        <p className="mt-0.5 text-sm font-semibold text-ink-900">{listing.listingLeads}</p>
                      </div>
                    </div>

                    {Array.isArray(listing.amenities) && listing.amenities.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {listing.amenities.slice(0, 4).map((amenity) => (
                          <span key={`${listing.id}-${amenity}`} className="rounded-full border border-black/10 bg-[#ffffff] px-2 py-0.5 text-[11px] font-semibold text-ink-600">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <select
                      className="field min-h-0 py-1.5 text-xs"
                      value={listing.status || "draft"}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => handleListingStatusChange(event, listing.id)}
                    >
                      {listingStatusOptions().map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </article>
            ))}
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
                    <div className="h-2.5 rounded-full bg-[#ffffff]">
                      <div className="h-full rounded-full bg-[#0b0a0e]" style={{ width: `${width}%` }} />
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
              <div className="rounded-xl border border-black/10 bg-[#ffffff] px-2.5 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Aktiva objekt</p>
                <p className="mt-1 text-xl font-semibold leading-none">{activeCount}</p>
                <p className="mt-1 text-[11px] text-ink-600">{draftCount} utkast</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-[#ffffff] px-2.5 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Visningar</p>
                <p className="mt-1 text-xl font-semibold leading-none">{totalViews.toLocaleString("sv-SE")}</p>
                <p className="mt-1 text-[11px] text-ink-600">30 dagar</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-[#ffffff] px-2.5 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Leads</p>
                <p className="mt-1 text-xl font-semibold leading-none">{totalLeads}</p>
                <p className="mt-1 text-[11px] text-ink-600">Konv. {conversionRate.toFixed(1)}%</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-[#ffffff] px-2.5 py-2">
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
                <div key={entry.status} className="flex items-center justify-between rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2">
                  <span className="text-sm text-ink-700">{entry.label}</span>
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
                <div key={event.id} className="rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2.5">
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
  );
}

function LeadDetailPanel({ lead, app, onClose }) {
  const [draft, setDraft] = useState({
    status: lead?.status || "new",
    followUpDate: lead?.followUpDate || "",
    notes: lead?.notes || ""
  });
  const [activities, setActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [activityType, setActivityType] = useState("note");
  const [activityBody, setActivityBody] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setDraft({
      status: lead?.status || "new",
      followUpDate: lead?.followUpDate || "",
      notes: lead?.notes || ""
    });
  }, [lead?.id, lead?.status, lead?.followUpDate, lead?.notes]);

  useEffect(() => {
    let cancelled = false;
    async function loadActivities() {
      if (!lead?.id) return;
      setIsLoadingActivities(true);
      try {
        const response = await leadActivitiesApi.getActivities(lead.id);
        if (!cancelled) setActivities(response.activities || []);
      } catch (_error) {
        if (!cancelled) setActivities([]);
      } finally {
        if (!cancelled) setIsLoadingActivities(false);
      }
    }
    void loadActivities();
    return () => {
      cancelled = true;
    };
  }, [lead?.id]);

  if (!lead) return null;

  async function saveLead() {
    setPending(true);
    try {
      await app.updateLead(lead.id, {
        status: draft.status,
        followUpDate: draft.followUpDate,
        notes: draft.notes
      });
    } finally {
      setPending(false);
    }
  }

  async function addActivity(event) {
    event.preventDefault();
    const body = activityBody.trim();
    if (!body) return;
    setPending(true);
    try {
      await leadActivitiesApi.addActivity(lead.id, activityType, body);
      setActivityBody("");
      const response = await leadActivitiesApi.getActivities(lead.id);
      setActivities(response.activities || []);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button type="button" aria-label="Stäng" className="absolute inset-0 bg-black/25" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-[min(560px,100vw)] flex-col border-l border-black/10 bg-[#ffffff] shadow-[0_24px_64px_rgba(15,25,48,0.24)]">
        <div className="border-b border-black/10 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Lead</p>
              <h2 className="mt-1 truncate text-xl font-semibold text-ink-900">{lead.renter?.name || lead.renter?.email || "Hyresgäst"}</h2>
              <p className="mt-1 truncate text-sm text-ink-600">{lead.listing?.title || "Objekt"}</p>
            </div>
            <button
              type="button"
              aria-label="Stäng"
              className="inline-flex h-10 w-10 min-h-0 shrink-0 items-center justify-center rounded-full border border-black/10 bg-[#ffffff]"
              onClick={onClose}
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Status</span>
              <select className="field" value={draft.status} onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}>
                {leadStatusOptions().map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Uppföljning</span>
              <input
                className="field"
                type="date"
                value={draft.followUpDate || ""}
                onChange={(event) => setDraft((prev) => ({ ...prev, followUpDate: event.target.value }))}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Anteckningar</span>
              <textarea
                className="field min-h-[120px]"
                value={draft.notes}
                onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Intern anteckning om behov, nästa steg eller invändningar."
              />
            </label>
          </div>

          <button type="button" className="btn-primary mt-4 px-4" disabled={pending} onClick={saveLead}>
            Spara lead
          </button>

          <section className="mt-6 border-t border-black/10 pt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Aktivitetslogg</h3>
              <span className="rounded-full border border-black/10 bg-[#f7f7f7] px-2 py-0.5 text-xs font-semibold text-ink-700">
                {activities.length}
              </span>
            </div>

            <form className="rounded-2xl border border-black/10 bg-[#fafafa] p-3" onSubmit={addActivity}>
              <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
                <select className="field min-h-0 py-2 text-sm" value={activityType} onChange={(event) => setActivityType(event.target.value)}>
                  {ACTIVITY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <input
                  className="field min-h-0 py-2 text-sm"
                  value={activityBody}
                  onChange={(event) => setActivityBody(event.target.value)}
                  placeholder="Lägg till aktivitet"
                />
              </div>
              <button type="submit" className="btn-secondary mt-2 w-full justify-center py-2 text-xs" disabled={pending || !activityBody.trim()}>
                Lägg till
              </button>
            </form>

            <div className="mt-3 space-y-2">
              {isLoadingActivities ? (
                <p className="rounded-2xl border border-black/10 bg-[#ffffff] px-3 py-4 text-sm text-ink-600">Laddar aktivitetslogg...</p>
              ) : null}
              {!isLoadingActivities && activities.length === 0 ? (
                <p className="rounded-2xl border border-black/10 bg-[#ffffff] px-3 py-4 text-sm text-ink-600">Ingen aktivitet ännu.</p>
              ) : null}
              {activities.map((activity) => (
                <article key={activity.id} className="rounded-2xl border border-black/10 bg-[#ffffff] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{ACTIVITY_TYPES.find((type) => type.value === activity.type)?.label || activity.type}</p>
                    <p className="text-[11px] font-medium text-ink-500">{relativeTime(activity.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-sm text-ink-700">{activity.body}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function BrokerLeadsSection({ app }) {
  const { leads, updateLead } = app;
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const rows = useMemo(() => {
    return [...(Array.isArray(leads) ? leads : [])]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [leads]);

  const selectedLead = rows.find((lead) => lead.id === selectedLeadId) || null;
  const overdueCount = rows.filter((lead) => isOverdueFollowUp(lead.followUpDate)).length;
  const viewingCount = rows.filter((lead) => lead.status === "viewing_booked").length;
  const avgScore = rows.length
    ? Math.round(rows.reduce((sum, lead) => sum + Number(lead.fitScore || 0), 0) / rows.length)
    : 0;

  useEffect(() => {
    if (selectedLeadId && !rows.some((lead) => lead.id === selectedLeadId)) {
      setSelectedLeadId(null);
    }
  }, [rows, selectedLeadId]);

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">LEADS</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink-900">Leads</h1>
        <p className="mt-1 text-sm text-ink-600">Inkommande intresse för dina objekt.</p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="surface p-4">
          <p className="text-sm text-ink-600">Totala leads</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#0b0a0e]">{rows.length}</p>
          <p className="mt-2 text-xs text-ink-500">Alla aktiva intresseanmälningar</p>
        </article>
        <article className="surface p-4">
          <p className="text-sm text-ink-600">Förfallna uppföljningar</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#0b0a0e]">{overdueCount}</p>
          <p className="mt-2 text-xs text-ink-500">Beräknat i klienten från dagens datum</p>
        </article>
        <article className="surface p-4">
          <p className="text-sm text-ink-600">Bokade visningar</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#0b0a0e]">{viewingCount}</p>
          <p className="mt-2 text-xs text-ink-500">Snittmatch {avgScore}%</p>
        </article>
      </section>

      <section className="surface overflow-hidden">
        <div className="border-b border-black/10 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Intresseanmälningar</p>
              <p className="mt-1 text-sm text-ink-600">Klicka på en rad för status, anteckningar, uppföljning och logg.</p>
            </div>
            <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-semibold text-ink-700">{rows.length} rader</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-[#fafafa] text-[11px] uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold sm:px-5">Hyresgäst</th>
                <th className="px-4 py-3 text-left font-semibold">Objekt</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Match</th>
                <th className="px-4 py-3 text-left font-semibold">Tid</th>
                <th className="px-4 py-3 text-right font-semibold sm:px-5">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((lead) => {
                const renterName = lead.renter?.name || lead.renter?.email || "Hyresgäst";
                const overdue = isOverdueFollowUp(lead.followUpDate);
                return (
                  <tr
                    key={lead.id}
                    className={`cursor-pointer border-t border-black/10 transition hover:bg-[#fafafa] ${
                      overdue ? "shadow-[inset_3px_0_0_#0b0a0e]" : ""
                    }`}
                    onClick={() => setSelectedLeadId(lead.id)}
                  >
                    <td className="px-4 py-3.5 align-top sm:px-5">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0b0a0e] text-sm font-semibold text-white">
                          {initialsForName(renterName)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink-900">{renterName}</span>
                          <span className="block truncate text-xs text-ink-600">
                            {lead.renter?.profile?.companyName || lead.renter?.profile?.legalEntity || lead.renter?.email || "Hyresgäst"}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-top font-semibold text-ink-800">{lead.listing?.title || "Objekt"}</td>
                    <td className="px-4 py-3.5 align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill status={lead.status} />
                        {overdue ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                            Förfallen
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className={`px-4 py-3.5 text-right font-semibold ${scoreClass(Number(lead.fitScore || 0))}`}>
                      {Number(lead.fitScore || 0)}%
                    </td>
                    <td className="px-4 py-3.5 align-top text-xs font-semibold text-ink-500">{relativeTime(lead.createdAt)}</td>
                    <td className="px-4 py-3.5 text-right sm:px-5">
                      <div className="flex justify-end gap-2">
                        <select
                          className="field min-h-0 w-[168px] py-2 text-xs"
                          value={lead.status || "new"}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            event.stopPropagation();
                            void updateLead(lead.id, { status: event.target.value });
                          }}
                        >
                          {leadStatusOptions().map((status) => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 min-h-0 items-center justify-center rounded-full border border-transparent text-ink-600 hover:border-black/10 hover:bg-[#ffffff]"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedLeadId(lead.id);
                          }}
                        >
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border-t border-black/10 px-4 py-10 text-center sm:px-5">
                    <p className="font-semibold text-ink-900">Inga intresseanmälningar ännu</p>
                    <p className="mt-1 text-sm text-ink-500">Nya förfrågningar visas här när hyresgäster bokar visning.</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {selectedLead ? <LeadDetailPanel lead={selectedLead} app={app} onClose={() => setSelectedLeadId(null)} /> : null}
    </div>
  );
}

function BrokerPlaceholder({ sectionKey }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-[#ffffff] p-6 text-sm text-ink-600">
      {BROKER_SECTION_TITLES[sectionKey] || "Sidan"} kommer snart.
    </div>
  );
}

function BrokerPanelPage({ app, pathname }) {
  const sectionKey = sectionFromPath(pathname);
  const currentSectionLabel = BROKER_SECTION_TITLES[sectionKey] || "Mina objekt";
  const leadCount = Array.isArray(app?.leads) ? app.leads.length : 0;

  return (
    <AdminPanelShell
      pathname={pathname}
      navItems={BROKER_NAV_ITEMS}
      bottomNavItems={BROKER_BOTTOM_NAV_ITEMS}
      sectionTitle={currentSectionLabel}
      onLogout={app?.logout}
      badges={{ leads: leadCount }}
    >
      {sectionKey === "objekt" ? <BrokerListingsSection app={app} /> : null}
      {sectionKey === "leads" ? <BrokerLeadsSection app={app} /> : null}
      {sectionKey === "profil" ? <PanelProfileSection app={app} basePath="/app/broker/profil" /> : null}
      {sectionKey === "installningar" || sectionKey === "hjalp" ? <BrokerPlaceholder sectionKey={sectionKey} /> : null}
    </AdminPanelShell>
  );
}

export default BrokerPanelPage;
