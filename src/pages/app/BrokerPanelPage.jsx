import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { leadActivitiesApi, listingApi, prospectCommentsApi, prospectsApi } from "../../api";
import { formatDate } from "../../lib/formatters";
import { navigateTo } from "../../lib/router";
import AdminPanelShell from "../../components/layout/AdminPanelShell";
import SidePanelFrame from "../../components/layout/SidePanelFrame";
import StatusPill, {
  LEAD_STATUS_ORDER,
  listingStatusLabel,
  listingStatusOptions,
  leadStatusLabel,
  leadStatusOptions
} from "../../components/app/StatusPill";
import {
  ArchiveIcon,
  BuildingIcon,
  CalendarIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PdfIcon,
  PlusIcon,
  SearchIcon,
  SettingsGearIcon,
  SparklesIcon,
  StarIcon,
  SupportIcon,
  UserIcon,
  UsersGroupIcon,
  XIcon
} from "../../components/icons/UiIcons";
import PanelProfileSection from "./PanelProfileSection";
import MessagesPage from "./MessagesPage";
import { useListingEditorState, ListingEditorSections, ListingEditorFooterActions } from "../../components/app/ListingEditorOverlay";
import { useProspectEditorState, ProspectEditorSections, ProspectEditorFooterActions } from "../../components/app/ProspectEditorSections";
import ProspectCommentThread from "../../components/app/ProspectCommentThread";
import ProspectVersionHistoryPanel from "../../components/app/ProspectVersionHistoryPanel";
import ProspectShareSheet from "../../components/app/ProspectShareSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export const BROKER_NAV_ITEMS = [
  { key: "oversikt", label: "Översikt", path: "/app/broker", Icon: LayoutDashboardIcon },
  { key: "objekt", label: "Dina objekt", path: "/app/broker/objekt", Icon: BuildingIcon },
  { key: "leads", label: "Leads", path: "/app/broker/leads", Icon: SparklesIcon },
  { key: "prospekt", label: "Prospekt", path: "/app/broker/prospekt", Icon: PdfIcon },
  { key: "meddelanden", label: "Meddelanden", path: "/app/broker/meddelanden", Icon: MessageSquareIcon },
  { key: "sparade-objekt", label: "Sparade objekt", path: "/app/broker/sparade-objekt", Icon: StarIcon },
  { key: "sparade-sokningar", label: "Sparade sökningar", path: "/app/broker/sparade-sokningar", Icon: SearchIcon }
];

export const BROKER_BOTTOM_NAV_ITEMS = [
  { key: "profil", label: "Profil", path: "/app/broker/profil", Icon: UserIcon },
  { key: "installningar", label: "Inställningar", path: "/app/broker/installningar", Icon: SettingsGearIcon },
  { key: "hjalp", label: "Hjälp", path: "/app/broker/hjalp", Icon: SupportIcon }
];

const BROKER_SECTION_TITLES = {
  oversikt: "Översikt",
  objekt: "Dina objekt",
  leads: "Leads",
  prospekt: "Prospekt",
  meddelanden: "Meddelanden",
  "sparade-objekt": "Sparade objekt",
  "sparade-sokningar": "Sparade sökningar",
  profil: "Profil",
  installningar: "Inställningar",
  hjalp: "Hjälp"
};

function sectionFromPath(pathname) {
  const match = pathname.match(/^\/(?:app\/)?broker\/([^/?#]+)/);
  const key = match?.[1] || "oversikt";
  return BROKER_SECTION_TITLES[key] ? key : "oversikt";
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

function useBrokerListingsData(app) {
  const { user, leads = [], updateListing } = app;

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

  return { user, updateListing, isLoadingListings, listingPerformance, ownLeads, ownListings, refreshPublisherListings };
}

function BrokerOverviewSection({ app }) {
  const { isLoadingListings, listingPerformance, ownLeads, ownListings } = useBrokerListingsData(app);

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

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Hyresvärd</p>
          <h1 className="mt-1 text-2xl font-semibold">Översikt</h1>
          <p className="mt-2 text-sm text-ink-600">
            Statistik och prestanda för dina objekt och leads.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" className="h-auto px-4 py-2" onClick={() => navigateTo("/app/broker/leads")}>
            <CalendarIcon className="mr-1.5 h-4 w-4" />
            Intressen
          </Button>
          <Button type="button" className="h-auto px-4 py-2" onClick={() => navigateTo("/app/publish")}>
            <span className="mr-1.5 text-base leading-none">+</span>
            Publicera ny annons
          </Button>
        </div>
      </header>

      {isLoadingListings ? (
        <div className="rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-5 text-sm text-ink-600">
          Laddar statistik...
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <SparkKpiCard key={card.key} card={card} series={sparklineSeries[card.key] || []} />
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
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
  );
}

function BrokerListingsSection({ app }) {
  const { isLoadingListings, listingPerformance, refreshPublisherListings } = useBrokerListingsData(app);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("alla");
  const [selectedListingId, setSelectedListingId] = useState(null);

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

  const selectedListing = selectedListingId
    ? filteredListings.find((listing) => String(listing.id) === String(selectedListingId)) || null
    : null;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Hyresvärd</p>
          <h1 className="mt-1 text-2xl font-semibold">Dina objekt</h1>
          <p className="mt-2 text-sm text-ink-600">
            Hantera dina aktiva och inaktiva objekt.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" className="h-auto px-4 py-2" onClick={() => navigateTo("/app/broker/leads")}>
            <CalendarIcon className="mr-1.5 h-4 w-4" />
            Intressen
          </Button>
          <Button type="button" className="h-auto px-4 py-2" onClick={() => navigateTo("/app/publish")}>
            <span className="mr-1.5 text-base leading-none">+</span>
            Publicera ny annons
          </Button>
        </div>
      </header>

      <section className="surface overflow-hidden">
        <div className="border-b border-black/10 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Hantera objekt</p>
              <p className="mt-1 text-sm text-ink-600">Klicka på en rad för att öppna objektet.</p>
            </div>
            <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-semibold text-ink-700">{filteredListings.length} rader</span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[280px_170px]">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Sök titel, adress eller område"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alla">Alla statusar</SelectItem>
                {listingStatusOptions().map((status) => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="hidden border-b border-black/10 bg-[#fafafa] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-500 sm:grid sm:grid-cols-[minmax(0,1fr)_100px_96px_72px_84px] sm:items-center sm:gap-4 sm:px-5">
          <span>Objekt</span>
          <span>Status</span>
          <span className="text-right">Visningar</span>
          <span className="text-right">Leads</span>
          <span className="text-right">Yta</span>
        </div>

        <div className="divide-y divide-black/10">
          {filteredListings.map((listing) => (
            <button
              key={listing.id}
              type="button"
              className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition hover:bg-[#fafafa] sm:grid sm:grid-cols-[minmax(0,1fr)_100px_96px_72px_84px] sm:px-5"
              onClick={() => setSelectedListingId(listing.id)}
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={listing.image || "/object-images/object-1.jpeg"}
                  alt={listing.title}
                  className="h-12 w-16 shrink-0 rounded-lg border border-black/10 object-cover"
                />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink-900">{listing.title || listing.address}</span>
                  <span className="block truncate text-xs text-ink-600">{listing.district} • {listing.address}</span>
                </span>
              </div>
              <span className="hidden sm:block">
                <StatusPill status={listing.status} variant="listing" />
              </span>
              <span className="hidden text-right text-sm font-semibold text-ink-800 sm:block">{listing.views.toLocaleString("sv-SE")}</span>
              <span className="hidden text-right text-sm font-semibold text-ink-800 sm:block">{listing.listingLeads}</span>
              <span className="hidden text-right text-xs font-semibold text-ink-500 sm:block">{listing.sizeSqm} kvm</span>
            </button>
          ))}
          {!isLoadingListings && filteredListings.length === 0 ? (
            <div className="px-4 py-10 text-center sm:px-5">
              <p className="font-semibold text-ink-900">Inga objekt matchar dina filter</p>
              <p className="mt-1 text-sm text-ink-500">Publicera en annons för att se den här.</p>
            </div>
          ) : null}
          {isLoadingListings ? (
            <div className="px-4 py-10 text-center text-sm text-ink-600 sm:px-5">
              Laddar dina objekt...
            </div>
          ) : null}
        </div>
      </section>

      {selectedListing ? (
        <ListingEditorSidePanel
          listing={selectedListing}
          app={app}
          onClose={() => setSelectedListingId(null)}
          onMutated={refreshPublisherListings}
        />
      ) : null}
    </div>
  );
}

function ListingEditorSidePanel({ listing, app, onClose, onMutated }) {
  const editor = useListingEditorState(listing, app, { onMutated });

  return (
    <SidePanelFrame widthClassName="w-[min(700px,100vw)]" onClose={onClose}>
      {(handleClose) => (
        <>
          <div className="border-b border-black/10 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Objektredigering</p>
                <h2 className="mt-1 truncate text-xl font-semibold text-ink-900">{editor.draft.title || "Hantera objekt"}</h2>
                <p className="mt-1 truncate text-sm text-ink-600">{editor.draft.address}, Stockholm</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Stäng"
                className="h-10 w-10 shrink-0 rounded-full"
                onClick={handleClose}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <ListingEditorSections listing={listing} editor={editor} />
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-black/10 px-5 py-4">
            <ListingEditorFooterActions listing={listing} editor={editor} onClosed={handleClose} />
          </div>
        </>
      )}
    </SidePanelFrame>
  );
}

function ProspectWorkspaceCard({ title, children }) {
  return (
    <section className="surface p-4 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{title}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

const PROSPECT_WORKSPACE_TABS = [
  { key: "prospekt", label: "Prospekt", Icon: PdfIcon },
  { key: "samarbete", label: "Samarbete", Icon: UsersGroupIcon },
  { key: "installningar", label: "Inställningar", Icon: SettingsGearIcon }
];

function ProspectWorkspaceTabNav({ tabs, activeKey, onSelect }) {
  const navRef = useRef(null);
  const hasAnimatedRef = useRef(false);
  const [indicator, setIndicator] = useState(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const activeEl = nav.querySelector('[data-active="true"]');
    if (!activeEl) {
      setIndicator((prev) => (prev ? { ...prev, visible: false } : prev));
      return;
    }
    setIndicator({
      left: activeEl.offsetLeft,
      width: activeEl.offsetWidth,
      visible: true,
      animate: hasAnimatedRef.current
    });
    hasAnimatedRef.current = true;
  }, [activeKey, tabs]);

  return (
    <nav ref={navRef} className="relative flex gap-1">
      <span
        aria-hidden="true"
        className={`admin-nav-indicator-h ${indicator?.animate ? "is-animated" : ""}`}
        style={
          indicator?.visible
            ? { transform: `translateX(${indicator.left}px)`, width: `${indicator.width}px`, opacity: 1 }
            : { opacity: 0 }
        }
      />
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            data-active={active ? "true" : "false"}
            className={`admin-nav-row menu-hover-row relative z-[1] inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold ${
              active ? "text-white" : "text-ink-700 hover:bg-black/5"
            }`}
            onClick={() => onSelect(tab.key)}
          >
            <tab.Icon className="h-4 w-4 shrink-0" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

function ProspectWorkspaceSidePanel({ prospectId, listingId, app, onClose, onMutated }) {
  const [prospect, setProspect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("prospekt");
  const [comments, setComments] = useState([]);
  const [commentsPending, setCommentsPending] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function loadProspect() {
    setLoading(true);
    try {
      const { prospect: loaded } = await prospectsApi.getProspect(prospectId);
      setProspect(loaded);
    } finally {
      setLoading(false);
    }
  }

  async function loadComments() {
    const { comments: list } = await prospectCommentsApi.listComments(prospectId);
    setComments(list);
  }

  useEffect(() => {
    void loadProspect();
    void loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospectId]);

  const editor = useProspectEditorState(prospect || { id: prospectId, title: "", draftSections: [], publishedSections: [], currentVersion: 0 }, app, {
    onMutated: async () => {
      await loadProspect();
      await onMutated?.();
    }
  });

  async function addComment(sectionId, body) {
    setCommentsPending(true);
    try {
      await prospectCommentsApi.addComment(prospectId, sectionId, body);
      await loadComments();
    } finally {
      setCommentsPending(false);
    }
  }

  async function archiveProspect(handleClose) {
    setArchiving(true);
    try {
      await prospectsApi.archiveProspect(prospectId);
      app.pushToast("Prospekt arkiverat.", "info");
      await onMutated?.();
      handleClose();
    } finally {
      setArchiving(false);
    }
  }

  return (
    <SidePanelFrame widthClassName="w-[min(560px,100vw)]" onClose={onClose}>
      {(handleClose) => (
        <>
          <div className="border-b border-black/10 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Titel</p>
            <div className="mt-1.5 flex items-center gap-3">
              {prospect ? (
                <Input
                  className="flex-1"
                  value={editor.title}
                  onChange={(event) => editor.setTitle(event.target.value)}
                  placeholder="Namnge prospektet..."
                  aria-label="Titel"
                />
              ) : (
                <p className="flex-1 py-2 text-[15px] text-ink-500">Laddar...</p>
              )}
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Stäng"
                className="h-10 w-10 shrink-0 rounded-full"
                onClick={handleClose}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3">
              <ProspectWorkspaceTabNav tabs={PROSPECT_WORKSPACE_TABS} activeKey={activeTab} onSelect={setActiveTab} />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {loading || !prospect ? (
              <p className="text-sm text-ink-500">Laddar prospekt...</p>
            ) : (
              <div className="space-y-4">
                {activeTab === "prospekt" ? (
                  <>
                    <ProspectEditorSections editor={editor} listingSummary={prospect.listingSummary} />
                    <ProspectWorkspaceCard title="Kommentarer">
                      <div className="h-72">
                        <ProspectCommentThread
                          sections={editor.sections}
                          comments={comments}
                          onAddComment={addComment}
                          pending={commentsPending}
                        />
                      </div>
                    </ProspectWorkspaceCard>
                  </>
                ) : null}

                {activeTab === "samarbete" ? (
                  <ProspectShareSheet prospectId={prospect.id} listingId={listingId} prospect={prospect} app={app} />
                ) : null}

                {activeTab === "installningar" ? (
                  <div className="space-y-4">
                    {prospect.status !== "archived" ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                        <div>
                          <p className="text-sm font-semibold text-rose-900">Arkivera prospekt</p>
                          <p className="mt-1 text-xs text-rose-700">Döljer prospektet från din lista.</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto shrink-0 gap-1.5 rounded-xl border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 hover:text-rose-700"
                          onClick={() => archiveProspect(handleClose)}
                          disabled={archiving}
                        >
                          <ArchiveIcon className="h-4 w-4" />
                          {archiving ? "Arkiverar..." : "Arkivera"}
                        </Button>
                      </div>
                    ) : null}
                    <ProspectWorkspaceCard title="Versionshistorik">
                      <ProspectVersionHistoryPanel prospectId={prospect.id} app={app} onRestored={loadProspect} />
                    </ProspectWorkspaceCard>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {prospect && activeTab === "prospekt" ? (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-black/10 px-5 py-4">
              <ProspectEditorFooterActions editor={editor} />
            </div>
          ) : null}
        </>
      )}
    </SidePanelFrame>
  );
}

function BrokerProspectsSection({ app }) {
  const { ownListings } = useBrokerListingsData(app);
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProspectId, setSelectedProspectId] = useState(null);
  const [creatingListingId, setCreatingListingId] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadProspects() {
    setLoading(true);
    try {
      const { prospects: list } = await prospectsApi.listMine();
      setProspects(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProspects();
  }, []);

  const listingById = new Map(ownListings.map((listing) => [String(listing.id), listing]));
  const selectedProspect = prospects.find((prospect) => prospect.id === selectedProspectId) || null;

  async function createProspect() {
    const listingId = creatingListingId || ownListings[0]?.id;
    if (!listingId) return;
    setCreating(true);
    try {
      const { prospect } = await prospectsApi.createProspect(listingId);
      app.pushToast("Prospekt skapat.", "success");
      await loadProspects();
      setSelectedProspectId(prospect.id);
    } catch (error) {
      app.pushToast(error.message || "Kunde inte skapa prospektet.", "error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Hyresvärd</p>
        <h1 className="mt-1 text-2xl font-semibold">Prospekt</h1>
        <p className="mt-2 text-sm text-ink-600">Skapa, dela och versionshantera prospekt för dina objekt.</p>
      </header>

      <section className="surface overflow-hidden">
        <div className="border-b border-black/10 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Prospekt</p>
              {ownListings.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Select
                    value={creatingListingId || ownListings[0]?.id || ""}
                    onValueChange={setCreatingListingId}
                  >
                    <SelectTrigger className="w-auto min-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ownListings.map((listing) => (
                        <SelectItem key={listing.id} value={listing.id}>{listing.title || listing.address}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" className="h-auto px-4 py-2" onClick={createProspect} disabled={creating}>
                    <PlusIcon className="mr-1.5 h-4 w-4" />
                    {creating ? "Skapar..." : "Nytt prospekt"}
                  </Button>
                </div>
              ) : (
                <p className="mt-1 text-sm text-ink-600">Du har inga objekt än.</p>
              )}
            </div>
            <span className="shrink-0 rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-semibold text-ink-700">{prospects.length} rader</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[860px]">
            <TableHeader className="bg-[#fafafa] text-[11px] uppercase tracking-wide text-ink-500">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 sm:px-5">Prospekt</TableHead>
                <TableHead className="px-4 py-3">Objekt</TableHead>
                <TableHead className="px-4 py-3">Status</TableHead>
                <TableHead className="px-4 py-3">Version</TableHead>
                <TableHead className="px-4 py-3">Uppdaterad</TableHead>
                <TableHead className="px-4 py-3 text-right sm:px-5">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prospects.map((prospect) => {
                const listing = listingById.get(String(prospect.listingId));
                return (
                  <TableRow
                    key={prospect.id}
                    className="cursor-pointer border-t border-black/10 transition hover:bg-[#fafafa]"
                    onClick={() => setSelectedProspectId(prospect.id)}
                  >
                    <TableCell className="whitespace-normal px-4 py-3.5 align-top sm:px-5">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0b0a0e] text-white">
                          <PdfIcon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink-900">{prospect.title}</span>
                          <span className="block truncate text-xs text-ink-600">{listing?.title || listing?.address || prospect.listingId}</span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 align-top font-semibold text-ink-800">{listing?.title || "Objekt"}</TableCell>
                    <TableCell className="px-4 py-3.5 align-top">
                      <StatusPill status={prospect.status} variant="prospect" />
                    </TableCell>
                    <TableCell className="px-4 py-3.5 align-top text-sm font-semibold text-ink-700">
                      {prospect.currentVersion ? `v${prospect.currentVersion}` : "Utkast"}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 align-top text-xs font-semibold text-ink-500">{relativeTime(prospect.updatedAt)}</TableCell>
                    <TableCell className="px-4 py-3.5 text-right sm:px-5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full text-ink-600 hover:bg-[#ffffff]"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedProspectId(prospect.id);
                        }}
                      >
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && prospects.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="whitespace-normal border-t border-black/10 px-4 py-10 text-center sm:px-5">
                    <p className="font-semibold text-ink-900">Inga prospekt än</p>
                    <p className="mt-1 text-sm text-ink-500">Skapa ett prospekt för ett av dina objekt.</p>
                  </TableCell>
                </TableRow>
              ) : null}
              {loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="whitespace-normal border-t border-black/10 px-4 py-10 text-center text-sm text-ink-600 sm:px-5">
                    Laddar prospekt...
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </section>

      {selectedProspect ? (
        <ProspectWorkspaceSidePanel
          prospectId={selectedProspect.id}
          listingId={selectedProspect.listingId}
          app={app}
          onClose={() => setSelectedProspectId(null)}
          onMutated={loadProspects}
        />
      ) : null}
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
    <SidePanelFrame widthClassName="w-[min(560px,100vw)]" onClose={onClose}>
      {(handleClose) => (
        <>
        <div className="border-b border-black/10 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Lead</p>
              <h2 className="mt-1 truncate text-xl font-semibold text-ink-900">{lead.renter?.name || lead.renter?.email || "Hyresgäst"}</h2>
              <p className="mt-1 truncate text-sm text-ink-600">{lead.listing?.title || "Objekt"}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Stäng"
              className="h-10 w-10 shrink-0 rounded-full"
              onClick={handleClose}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Status</span>
              <Select value={draft.status} onValueChange={(value) => setDraft((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {leadStatusOptions().map((status) => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Uppföljning</span>
              <Input
                type="date"
                value={draft.followUpDate || ""}
                onChange={(event) => setDraft((prev) => ({ ...prev, followUpDate: event.target.value }))}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Anteckningar</span>
              <Textarea
                className="min-h-[120px]"
                value={draft.notes}
                onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Intern anteckning om behov, nästa steg eller invändningar."
              />
            </label>
          </div>

          <Button type="button" className="h-auto mt-4 px-4 py-2" disabled={pending} onClick={saveLead}>
            Spara lead
          </Button>

          <section className="mt-6 border-t border-black/10 pt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Aktivitetslogg</h3>
              <span className="rounded-full border border-black/10 bg-[#f7f7f7] px-2 py-0.5 text-xs font-semibold text-ink-700">
                {activities.length}
              </span>
            </div>

            <form className="rounded-2xl border border-black/10 bg-[#fafafa] p-3" onSubmit={addActivity}>
              <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="text-sm"
                  value={activityBody}
                  onChange={(event) => setActivityBody(event.target.value)}
                  placeholder="Lägg till aktivitet"
                />
              </div>
              <Button type="submit" variant="secondary" className="h-auto mt-2 w-full justify-center py-2 text-xs" disabled={pending || !activityBody.trim()}>
                Lägg till
              </Button>
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
        </>
      )}
    </SidePanelFrame>
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
        <article className="rounded-3xl bg-[#F3F7F7] p-4">
          <p className="text-sm text-ink-600">Totala leads</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#0b0a0e]">{rows.length}</p>
          <p className="mt-2 text-xs text-ink-500">Alla aktiva intresseanmälningar</p>
        </article>
        <article className="rounded-3xl bg-[#F3F7F7] p-4">
          <p className="text-sm text-ink-600">Förfallna uppföljningar</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#0b0a0e]">{overdueCount}</p>
          <p className="mt-2 text-xs text-ink-500">Beräknat i klienten från dagens datum</p>
        </article>
        <article className="rounded-3xl bg-[#F3F7F7] p-4">
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
          <Table className="min-w-[900px]">
            <TableHeader className="bg-[#fafafa] text-[11px] uppercase tracking-wide text-ink-500">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 sm:px-5">Hyresgäst</TableHead>
                <TableHead className="px-4 py-3">Objekt</TableHead>
                <TableHead className="px-4 py-3">Status</TableHead>
                <TableHead className="px-4 py-3 text-right">Match</TableHead>
                <TableHead className="px-4 py-3">Tid</TableHead>
                <TableHead className="px-4 py-3 text-right sm:px-5">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((lead) => {
                const renterName = lead.renter?.name || lead.renter?.email || "Hyresgäst";
                const overdue = isOverdueFollowUp(lead.followUpDate);
                return (
                  <TableRow
                    key={lead.id}
                    className={`cursor-pointer border-t border-black/10 transition hover:bg-[#fafafa] ${
                      overdue ? "shadow-[inset_3px_0_0_#0b0a0e]" : ""
                    }`}
                    onClick={() => setSelectedLeadId(lead.id)}
                  >
                    <TableCell className="whitespace-normal px-4 py-3.5 align-top sm:px-5">
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
                    </TableCell>
                    <TableCell className="px-4 py-3.5 align-top font-semibold text-ink-800">{lead.listing?.title || "Objekt"}</TableCell>
                    <TableCell className="whitespace-normal px-4 py-3.5 align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill status={lead.status} />
                        {overdue ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                            Förfallen
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className={`px-4 py-3.5 text-right font-semibold ${scoreClass(Number(lead.fitScore || 0))}`}>
                      {Number(lead.fitScore || 0)}%
                    </TableCell>
                    <TableCell className="px-4 py-3.5 align-top text-xs font-semibold text-ink-500">{relativeTime(lead.createdAt)}</TableCell>
                    <TableCell className="whitespace-normal px-4 py-3.5 text-right sm:px-5">
                      <div className="flex justify-end gap-2">
                        <Select
                          value={lead.status || "new"}
                          onValueChange={(value) => {
                            void updateLead(lead.id, { status: value });
                          }}
                        >
                          <SelectTrigger
                            className="w-[168px] text-xs"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {leadStatusOptions().map((status) => (
                              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-full text-ink-600 hover:bg-[#ffffff]"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedLeadId(lead.id);
                          }}
                        >
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="whitespace-normal border-t border-black/10 px-4 py-10 text-center sm:px-5">
                    <p className="font-semibold text-ink-900">Inga intresseanmälningar ännu</p>
                    <p className="mt-1 text-sm text-ink-500">Nya förfrågningar visas här när hyresgäster bokar visning.</p>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
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
  const currentSectionLabel = BROKER_SECTION_TITLES[sectionKey] || "Översikt";
  const leadCount = Array.isArray(app?.leads) ? app.leads.length : 0;

  return (
    <AdminPanelShell
      pathname={pathname}
      navItems={BROKER_NAV_ITEMS}
      bottomNavItems={BROKER_BOTTOM_NAV_ITEMS}
      sectionTitle={currentSectionLabel}
      onLogout={app?.logout}
      badges={{ leads: leadCount }}
      fullBleedContent={sectionKey === "meddelanden"}
      contentKey={sectionKey}
    >
      {sectionKey === "oversikt" ? <BrokerOverviewSection app={app} /> : null}
      {sectionKey === "objekt" ? <BrokerListingsSection app={app} /> : null}
      {sectionKey === "leads" ? <BrokerLeadsSection app={app} /> : null}
      {sectionKey === "prospekt" ? <BrokerProspectsSection app={app} /> : null}
      {sectionKey === "meddelanden" ? <MessagesPage app={app} /> : null}
      {sectionKey === "sparade-objekt" ? <PanelProfileSection app={app} basePath="/app/broker/profil" forcedTab="favorites" /> : null}
      {sectionKey === "sparade-sokningar" ? <PanelProfileSection app={app} basePath="/app/broker/profil" forcedTab="history" /> : null}
      {sectionKey === "profil" ? <PanelProfileSection app={app} basePath="/app/broker/profil" /> : null}
      {sectionKey === "installningar" || sectionKey === "hjalp" ? <BrokerPlaceholder sectionKey={sectionKey} /> : null}
    </AdminPanelShell>
  );
}

export default BrokerPanelPage;
