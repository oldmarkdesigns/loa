import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bot } from "lucide-react";
import { navigateTo, normalizeAppRole, routeMatches } from "../../lib/router";
import { formatDate, formatSek } from "../../lib/formatters";
import AdminPanelShell from "../../components/layout/AdminPanelShell";
import { BrokerAssistantPage, BrokerAssistantProvider } from "../../components/app/BrokerAssistant";
import AccountWindow from "../../components/account/AccountWindow";
import { accountBackgroundPath, parseAccountPath } from "../../lib/accountPages";
import MessagesPage from "./MessagesPage";
import ProspectIcon from "../../components/app/ProspectIcon";
import StatusPill, { listingStatusLabel } from "../../components/app/StatusPill";
import { prospectsApi } from "../../api";
import BarInteractive from "../../components/charts/bar-interactive";
import TypeDistributionDonut from "../../components/charts/type-distribution-donut";
import {
  BrokerRadarChart,
  ConversionFunnelChart,
  DistrictPerformanceChart,
  MetricBars,
  MetricFunnel,
  MetricGauge,
  MetricSparkline,
  SegmentTrendChart,
  WeeklyHeatmapChart
} from "../../components/admin/StatisticsCharts";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ArrowUpIcon,
  BarChart3Icon,
  BellIcon,
  BuildingIcon,
  CalendarIcon,
  ChevronRightIcon,
  CheckBadgeIcon,
  ClockIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FilterIcon,
  HistoryIcon,
  InfoCircleIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PdfIcon,
  PencilIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  SendHorizontalIcon,
  SettingsGearIcon,
  SparklesIcon,
  StarIcon,
  SupportIcon,
  UsersGroupIcon,
  UserIcon,
  XIcon
} from "../../components/icons/UiIcons";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const ADMIN_NAV_ITEMS = [
  { key: "oversikt", label: "Översikt", path: "/app/admin", Icon: LayoutDashboardIcon, group: "Arbetsyta" },
  { key: "assistent", label: "AI-assistent", path: "/app/admin/assistent", Icon: Bot, group: "Arbetsyta" },
  { key: "annonser", label: "Annonser", path: "/app/admin/annonser", Icon: BuildingIcon, group: "Annonser" },
  { key: "prospekt", label: "Prospekt", path: "/app/admin/prospekt", Icon: PdfIcon, group: "Annonser" },
  { key: "leads", label: "Leads & Matchningar", path: "/app/admin/leads", Icon: SparklesIcon, group: "Hyresgäster" },
  { key: "meddelanden", label: "Meddelanden", path: "/app/admin/meddelanden", Icon: MessageSquareIcon, group: "Hyresgäster" },
  { key: "notifikationer", label: "Notifikationer", path: "/app/admin/notifikationer", Icon: BellIcon, group: "Hyresgäster" },
  { key: "maklare", label: "Mäklare", path: "/app/admin/maklare", Icon: UsersGroupIcon, group: "Företag" },
  { key: "aktivitet", label: "Aktivitet", path: "/app/admin/aktivitet", Icon: HistoryIcon, group: "Företag" },
  { key: "statistik", label: "Statistik", path: "/app/admin/statistik", Icon: BarChart3Icon, group: "Företag" }
];

export const ADMIN_BOTTOM_NAV_ITEMS = [
  { key: "profil", label: "Profil", path: "/app/admin/profil", Icon: UserIcon },
  { key: "adminprofil", label: "Adminprofil", path: "/app/admin/adminprofil", Icon: BuildingIcon },
  { key: "installningar", label: "Inställningar", path: "/app/admin/installningar", Icon: SettingsGearIcon },
  { key: "hjalp", label: "Hjälp", path: "/app/admin/hjalp", Icon: SupportIcon }
];

const SECTION_TITLES = {
  oversikt: "Översikt",
  assistent: "AI-assistent",
  profil: "Profil",
  adminprofil: "Adminprofil",
  annonser: "Annonser",
  leads: "Leads & Matchningar",
  prospekt: "Prospekt",
  meddelanden: "Meddelanden",
  inkorg: "Inkorg",
  notifikationer: "Notifikationer",
  maklare: "Mäklare",
  aktivitet: "Aktivitet",
  statistik: "Statistik",
  hjalp: "Hjälp",
  installningar: "Inställningar"
};

const kpiCards = [
  { key: "active", label: "Aktiva annonser", value: "0", delta: "0", deltaTone: "flat", meta: "Ingen data", unit: "annonser" },
  { key: "views", label: "Visningar totalt", value: "0", delta: "0", deltaTone: "flat", meta: "Ingen data", unit: "visningar" },
  { key: "inquiries", label: "Förfrågningar", value: "0", delta: "0", deltaTone: "flat", meta: "Ingen data", unit: "förfrågningar" },
  { key: "matches", label: "Matchade hyresgäster", value: "0", delta: "0", deltaTone: "flat", meta: "Ingen data", unit: "matchningar" }
];

const kpiSparklineSeries = {
  active: [],
  views: [],
  inquiries: [],
  matches: []
};

const kpiAxisLabels = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

const chartSeries = {
  "7d": [],
  "30d": [],
  "90d": []
};

const distributionData = [];

const districtPerformance = [];

const funnelData = [];

const brokerPerformanceRadar = [];

const segmentTrend = [];

const weeklyHeatmap = [];

const statisticsSectionLinks = [
  { key: "kpi", id: "stats-kpi", label: "KPI-översikt", moduleKey: "kpi" },
  { key: "trend", id: "stats-trend", label: "Visningar & förfrågningar", moduleKey: "trend" },
  { key: "distribution", id: "stats-distribution", label: "Fördelning", moduleKey: "distribution" },
  { key: "district", id: "stats-district", label: "Prestanda per område", moduleKey: "district" },
  { key: "funnel", id: "stats-funnel", label: "Konverteringstratt", moduleKey: "funnel" },
  { key: "brokerRadar", id: "stats-broker-radar", label: "Mäklarprestanda", moduleKey: "brokerRadar" },
  { key: "heatmap", id: "stats-heatmap", label: "Veckoaktivitet", moduleKey: "heatmap" },
  { key: "segment", id: "stats-segment", label: "Trend per lokaltyp", moduleKey: "segment" },
  { key: "extended", id: "stats-extended", label: "Fördjupade nyckeltal", moduleKey: "extended" }
];

const extendedStatCards = [];

const activeListings = [];

function companyNameForAdmin(user) {
  return (
    user?.profile?.legalEntity ||
    user?.profile?.companyName ||
    user?.profile?.company ||
    user?.profile?.organizationName ||
    "Ditt bolag"
  );
}

function adminStatusLabel(status) {
  if (status === "active") return "Aktiv";
  if (status === "pending") return "Väntande";
  return listingStatusLabel(status || "draft");
}

function adminListingFromListing(listing, app) {
  const listingLeads = Array.isArray(app?.leads)
    ? app.leads.filter((lead) => lead.listingId === listing.id || lead.listing?.id === listing.id)
    : [];

  return {
    id: listing.id,
    title: listing.title || "Namnlös annons",
    image: listing.image || listing.images?.[0]?.url || listing.images?.[0] || "/object-images/object-1.jpeg",
    district: listing.district || "-",
    type: listing.type || "Övrigt",
    size: listing.sizeSqm || listing.size || 0,
    priceMonthly: listing.priceMonthly || 0,
    status: adminStatusLabel(listing.status),
    views: listing.views || 0,
    inquiries: listing.inquiries || listingLeads.length || 0,
    ownerId: listing.ownerId || "",
    responsible: listing.advertiserName || "Ej tilldelad"
  };
}

function ownedAdminListingRecords(app) {
  const userId = app?.user?.id;
  const companyId = app?.adminCompany?.id || app?.user?.profile?.companyId;
  const activeBrokerIds = new Set(
    (Array.isArray(app?.companyBrokers) ? app.companyBrokers : [])
      .filter((broker) => broker.status === "active")
      .map((broker) => broker.userId)
      .filter(Boolean)
  );
  if (!userId) return [];
  return (app?.listings || []).filter((listing) => (
    listing.ownerId === userId
    || (companyId && listing.companyId === companyId)
    || activeBrokerIds.has(listing.ownerId)
  ));
}

function ownedAdminListings(app) {
  return ownedAdminListingRecords(app).map((listing) => adminListingFromListing(listing, app));
}

function buildAdminStats(app) {
  const listings = ownedAdminListings(app);
  const activeListingsCount = listings.filter((listing) => listing.status === "Aktiv").length;
  const totalViews = listings.reduce((sum, listing) => sum + Number(listing.views || 0), 0);
  const totalInquiries = listings.reduce((sum, listing) => sum + Number(listing.inquiries || 0), 0);
  const leadCount = Array.isArray(app?.leads) ? app.leads.length : 0;
  const hasData = listings.length > 0 || totalViews > 0 || totalInquiries > 0 || leadCount > 0;
  const cards = [
    { key: "active", label: "Aktiva annonser", value: String(activeListingsCount), delta: "0", deltaTone: "flat", meta: hasData ? "Faktisk data" : "Ingen data", unit: "annonser" },
    { key: "views", label: "Visningar totalt", value: totalViews.toLocaleString("sv-SE"), delta: "0", deltaTone: "flat", meta: totalViews > 0 ? "Faktisk data" : "Ingen data", unit: "visningar" },
    { key: "inquiries", label: "Förfrågningar", value: totalInquiries.toLocaleString("sv-SE"), delta: "0", deltaTone: "flat", meta: totalInquiries > 0 ? "Faktisk data" : "Ingen data", unit: "förfrågningar" },
    { key: "matches", label: "Matchade hyresgäster", value: String(leadCount), delta: "0", deltaTone: "flat", meta: leadCount > 0 ? "Faktisk data" : "Ingen data", unit: "matchningar" }
  ];
  const sparklineSeries = {
    active: activeListingsCount > 0 ? [activeListingsCount] : [],
    views: totalViews > 0 ? [totalViews] : [],
    inquiries: totalInquiries > 0 ? [totalInquiries] : [],
    matches: leadCount > 0 ? [leadCount] : []
  };
  const currentSeries = totalViews > 0 || totalInquiries > 0
    ? [{ label: "Nu", views: totalViews, inquiries: totalInquiries }]
    : [];
  const typeTotals = new Map();
  listings.forEach((listing) => {
    const type = listing.type || "Övrigt";
    typeTotals.set(type, (typeTotals.get(type) || 0) + 1);
  });
  const distribution = Array.from(typeTotals.entries()).map(([name, value], index) => ({
    key: name.toLowerCase(),
    name,
    value
  }));
  const districtTotals = new Map();
  listings.forEach((listing) => {
    const district = listing.district || "-";
    const current = districtTotals.get(district) || { district, views: 0, inquiries: 0 };
    current.views += Number(listing.views || 0);
    current.inquiries += Number(listing.inquiries || 0);
    districtTotals.set(district, current);
  });

  return {
    cards,
    sparklineSeries,
    chartSeries: { "7d": currentSeries, "30d": currentSeries, "90d": currentSeries },
    distributionData: distribution,
    districtPerformance: Array.from(districtTotals.values()).filter((item) => item.views > 0 || item.inquiries > 0)
  };
}

function countAdminNotifications(app) {
  const backendNotifications = (Array.isArray(app?.notifications) ? app.notifications : [])
    .filter((item) => item.status !== "handled");
  const backendDedupeKeys = new Set(
    backendNotifications.map((item) => (
      item.type === "broker_verification_requested" && item.metadata?.brokerUserId
        ? `broker-request-${item.metadata.brokerUserId}-${item.metadata.companyId || ""}`
        : `notification-${item.id}`
    ))
  );
  const pendingBrokerCount = (Array.isArray(app?.companyBrokers) ? app.companyBrokers : [])
    .filter((broker) => broker.status === "pending")
    .filter((broker) => !backendDedupeKeys.has(`broker-request-${broker.userId}-${broker.companyId || ""}`))
    .length;

  return backendNotifications.length + pendingBrokerCount;
}

const adminNotifications = [];

const activityItems = [];

const brokerTeam = [];

const matchedRenters = [];

const adminInquiryThreads = [];

// Saved listings and searches used to be pages of their own; they are cards on the profile now.
const LEGACY_SECTIONS = { "sparade-objekt": "profil", "sparade-sokningar": "profil" };

function sectionFromPath(pathname) {
  const match = pathname.match(/^\/(?:app\/)?admin\/([^/?#]+)/);
  const key = LEGACY_SECTIONS[match?.[1]] || match?.[1] || "oversikt";
  return SECTION_TITLES[key] ? key : "oversikt";
}

function greetingForHour(hour) {
  if (hour < 12) return "God morgon";
  if (hour < 18) return "God eftermiddag";
  return "God kväll";
}

function statusClass(status) {
  if (status === "Aktiv") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Väntande") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function statusToggleOnClass(status) {
  if (status === "Alla") return "data-[state=on]:border-strong data-[state=on]:bg-strong data-[state=on]:text-on-strong data-[state=on]:hover:bg-strong data-[state=on]:hover:text-on-strong";
  if (status === "Aktiv") return "data-[state=on]:border-emerald-200 data-[state=on]:bg-emerald-50 data-[state=on]:text-emerald-700";
  if (status === "Väntande") return "data-[state=on]:border-amber-200 data-[state=on]:bg-amber-50 data-[state=on]:text-amber-700";
  return "data-[state=on]:border-slate-200 data-[state=on]:bg-slate-100 data-[state=on]:text-slate-700";
}

function deltaClass(tone) {
  if (tone === "up") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (tone === "down") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-veil/10 bg-subtle text-ink-700";
}

function inquiryStatusClass(status) {
  if (status === "Ny") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Pågående") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function inquiryPriorityClass(priority) {
  if (priority === "Hög") return "border-rose-200 bg-rose-50 text-rose-700";
  if (priority === "Medel") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function matchScoreClass(score) {
  if (score >= 85) return "text-emerald-700";
  if (score >= 70) return "text-amber-700";
  return "text-ink-500";
}

function matchScoreBadgeClass(score) {
  if (score >= 85) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (score >= 70) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function interestClass(type) {
  if (type === "Förfrågan") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (type === "Sparad") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function matchCriteriaValue(renter, label, fallback = "-") {
  return renter.matchCriteria.find((item) => item.label === label)?.value || fallback;
}

function moveInLabelForRenter(renter) {
  const texts = adminInquiryThreads
    .filter((inquiry) => inquiry.renterId === renter.id)
    .flatMap((inquiry) => inquiry.messages.map((message) => message.text.toLowerCase()));
  if (texts.some((text) => text.includes("juni"))) return "Juni 2026";
  if (texts.some((text) => text.includes("september"))) return "September 2026";
  return "Enligt profil";
}

function moveInSortValue(renter) {
  const label = moveInLabelForRenter(renter);
  if (label.includes("Juni")) return 6;
  if (label.includes("September")) return 9;
  return 12;
}

function initialsForAdminLead(value) {
  return String(value || "??")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "??";
}

function relativeAdminTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Nyss";
  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (diffMinutes < 1) return "Nyss";
  if (diffMinutes < 60) return `${diffMinutes} min sedan`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h sedan`;
  return parsed.toLocaleDateString("sv-SE", { month: "short", day: "numeric" });
}

function buildAdminLeadRows(app) {
  return (Array.isArray(app?.leads) ? app.leads : [])
    .map((lead, index) => {
      const renterName = lead.renter?.name || lead.renter?.email || "Hyresgäst";
      const listing = lead.listing || {};
      return {
        id: lead.id,
        inquiryId: "",
        renter: {
          id: lead.renter?.id || lead.renterId,
          name: renterName,
          company: lead.renter?.profile?.companyName || lead.renter?.profile?.legalEntity || lead.renter?.email || "Hyresgäst",
          initials: initialsForAdminLead(renterName)
        },
        listing: {
          id: listing.id || lead.listingId,
          title: listing.title || "Namnlös annons"
        },
        interest: lead.status || "Förfrågan",
        score: Number(lead.fitScore || 0),
        time: relativeAdminTime(lead.createdAt),
        isUnread: String(lead.status || "").toLowerCase() === "ny",
        sortOrder: index
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function sendToBroker(app, renter, listing) {
  app?.pushToast?.(
    `${renter.name} skickad till mäklarteamet för ${listing.title}.`,
    "success"
  );
}

function openLeadConversation(app, lead) {
  if (lead.inquiryId) {
    navigateTo(`/app/admin/inkorg/${lead.inquiryId}`);
    return;
  }

  navigateTo("/app/admin/leads");
}

function latestMessageForInquiry(inquiry) {
  return inquiry.messages[inquiry.messages.length - 1] || null;
}

function latestRenterMessageForInquiry(inquiry) {
  return [...inquiry.messages].reverse().find((message) => message.sender === "renter") || inquiry.messages[0] || null;
}

function buildSuggestedPrompts(inquiry, renter, listing) {
  const latestRenterMessage = latestRenterMessageForInquiry(inquiry)?.text.toLowerCase() || "";
  const prompts = [];

  if (latestRenterMessage.includes("visning") || latestRenterMessage.includes("digital") || latestRenterMessage.includes("möte")) {
    prompts.push({
      id: `${inquiry.id}-reply-viewing`,
      kind: "answer",
      label: "Föreslå tider",
      text: `Hej ${renter.name.split(" ")[0]}! Vi kan ordna en digital avstämning först. Jag kan erbjuda tisdag 10:00 eller onsdag 14:30 för en snabb genomgång av ${listing.title}. Vilken tid passar bäst?`
    });
    prompts.push({
      id: `${inquiry.id}-question-viewing`,
      kind: "question",
      label: "Klargör upplägg",
      text: `Tack! För att boka rätt upplägg: vill ni börja med digital genomgång eller gå direkt på fysisk visning, och vilka från teamet deltar?`
    });
  }

  if (latestRenterMessage.includes("planritning") || latestRenterMessage.includes("bindningstid") || latestRenterMessage.includes("driftkostnad")) {
    prompts.push({
      id: `${inquiry.id}-reply-docs`,
      kind: "answer",
      label: "Skicka underlag",
      text: `Jag skickar planritning, uppskattad driftkostnad och nuvarande avtalsram för ${listing.title} i nästa meddelande. Om ni vill kan jag även sammanfatta de viktigaste villkoren direkt här i chatten.`
    });
    prompts.push({
      id: `${inquiry.id}-question-lease`,
      kind: "question",
      label: "Fråga om avtal",
      text: "Vilken bindningstid och vilken tillträdesnivå behöver ni för att affären ska vara realistisk internt?"
    });
  }

  if (latestRenterMessage.includes("september") || latestRenterMessage.includes("inflyttning")) {
    prompts.push({
      id: `${inquiry.id}-reply-timing`,
      kind: "answer",
      label: "Bekräfta timing",
      text: `September kan fungera beroende på nuvarande uthyrningsläge. Jag kan reservera fortsatt dialog kring ${listing.title}, men behöver förstå hur fast ert inflyttningsfönster är.`
    });
    prompts.push({
      id: `${inquiry.id}-question-timing`,
      kind: "question",
      label: "Kvalificera datum",
      text: "Är september ett absolut krav, eller finns möjlighet att tidigarelägga om rätt lokal blir tillgänglig före sommaren?"
    });
  }

  if (latestRenterMessage.includes("parkering") || latestRenterMessage.includes("lastintag") || latestRenterMessage.includes("anpass")) {
    prompts.push({
      id: `${inquiry.id}-reply-logistics`,
      kind: "answer",
      label: "Bekräfta logistik",
      text: `Jag återkommer med bekräftade svar om lastintag, kundparkering och vilka anpassningar som normalt godkänns i ${listing.title}. Så fort jag har allt samlat skickar jag en tydlig punktlista här.`
    });
    prompts.push({
      id: `${inquiry.id}-question-fit`,
      kind: "question",
      label: "Fråga om behov",
      text: "Vilka anpassningar är viktigast för er i entré och kundflöde, så att jag kan kontrollera rätt saker med förvaltaren?"
    });
  }

  if (prompts.length < 3) {
    prompts.push({
      id: `${inquiry.id}-reply-default`,
      kind: "answer",
      label: "Bekräfta intresse",
      text: `Tack för tydlig återkoppling. ${listing.title} ser fortsatt relevant ut för ert behov, och jag hjälper gärna vidare med nästa steg så att ni snabbt kan bedöma om lokalen är rätt match.`
    });
  }

  return prompts.slice(0, 4);
}

function inquirySummaryLine(inquiry, renter, listing) {
  const latestRenterMessage = latestRenterMessageForInquiry(inquiry)?.text.toLowerCase() || "";

  if (latestRenterMessage.includes("visning") || latestRenterMessage.includes("digital") || latestRenterMessage.includes("möte")) {
    return `Vill boka visning av ${listing.title}`;
  }
  if (latestRenterMessage.includes("planritning") || latestRenterMessage.includes("bindningstid") || latestRenterMessage.includes("driftkostnad")) {
    return "Efterfrågar planritning och avtalsvillkor";
  }
  if (latestRenterMessage.includes("september") || latestRenterMessage.includes("inflyttning")) {
    return "Behöver senare inflyttning";
  }
  if (latestRenterMessage.includes("parkering") || latestRenterMessage.includes("lastintag") || latestRenterMessage.includes("anpass")) {
    return "Vill få logistik och anpassningar bekräftade";
  }
  return `${renter.preferredType} i ${renter.district}`;
}

function inquiryNeedsResponse(inquiry) {
  const lastMessage = latestMessageForInquiry(inquiry);
  return lastMessage?.sender === "renter";
}

function ExtendedMetricSparkline({ data = [], labels = [], direction = "up" }) {
  if (!Array.isArray(data) || data.length === 0) return null;

  return (
    <Card className="gap-0 py-0 rounded-xl border border-veil/5 bg-canvas px-3 py-2.5">
      <MetricSparkline data={data} direction={direction} />
      <div className="mt-1 flex items-center justify-between text-[10px] font-semibold  tracking-[0.16em] text-ink-400">
        <span>{labels[0] || "start"}</span>
        <span>{labels[1] || "nu"}</span>
      </div>
    </Card>
  );
}

function ExtendedMetricGauge({ value = 0, target, inverse = false, footer }) {
  const targetValue = typeof target === "number" ? Math.max(0, Math.min(target, 100)) : null;

  return (
    <Card className="gap-0 py-0 rounded-xl border border-veil/5 bg-canvas px-3 py-3">
      {targetValue !== null ? (
        <div className="mb-2 flex justify-end">
          <div className="rounded-full border border-veil/10 bg-control px-2 py-1 text-[10px] font-semibold text-ink-600">
            mål {targetValue}%
          </div>
        </div>
      ) : null}
      <MetricGauge value={value} inverse={inverse} />
      {footer ? <p className="mt-2 text-[11px] text-ink-500">{footer}</p> : null}
    </Card>
  );
}

function ExtendedMetricFunnel({ steps = [] }) {
  if (!Array.isArray(steps) || steps.length === 0) return null;

  return (
    <Card className="gap-0 py-0 rounded-xl border border-veil/5 bg-canvas px-3 py-3">
      <MetricFunnel steps={steps} />
    </Card>
  );
}

function ExtendedMetricBars({ items = [], compact = false }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className={`rounded-2xl border border-veil/5 bg-canvas px-3 ${compact ? "py-2.5" : "py-3"}`}>
      <MetricBars items={items} />
    </div>
  );
}

function ExtendedMetricLeaderboard({ items = [] }) {
  return <ExtendedMetricBars items={items} compact />;
}

function ExtendedStatCard({ item }) {
  let visual = null;

  if (item.visualType === "sparkline") {
    visual = <ExtendedMetricSparkline {...item.visual} />;
  } else if (item.visualType === "gauge") {
    visual = <ExtendedMetricGauge {...item.visual} />;
  } else if (item.visualType === "funnel") {
    visual = <ExtendedMetricFunnel {...item.visual} />;
  } else if (item.visualType === "bars") {
    visual = <ExtendedMetricBars {...item.visual} />;
  } else if (item.visualType === "leaderboard") {
    visual = <ExtendedMetricLeaderboard {...item.visual} />;
  }

  return (
    <article className="rounded-[28px] border border-veil/10 bg-surface p-4 shadow-[0_12px_30px_rgba(15,25,48,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-ink-600">{item.label}</p>
          <p className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.04em] text-strong">{item.value}</p>
        </div>
        <Badge variant="outline" className="h-auto shrink-0 rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          {item.delta}
        </Badge>
      </div>
      <p className="mt-2 text-[11px] text-ink-500">{item.meta}</p>
      <div className="mt-4">{visual}</div>
    </article>
  );
}

function KpiCardsSection({ showMatchLink = false, cards = kpiCards } = {}) {
  return (
    <section aria-label="Nyckeltal" className="loa-kpi-strip">
      {cards.map(card => <article key={card.key} className="loa-kpi-item">
        <p className="loa-kpi-label">{card.label}</p>
        <p className="loa-kpi-value">{card.value}</p>
        {showMatchLink && card.key === "matches"
          ? <Button variant="link" className="loa-kpi-link" onClick={() => navigateTo("/app/admin/leads#matchningar")}>Visa matchningar →</Button>
          : <p className="loa-kpi-unit">{card.unit}</p>}
      </article>)}
    </section>
  );
}

function activityIcon(type) {
  if (type === "inquiry") return MessageSquareIcon;
  if (type === "views") return BarChart3Icon;
  if (type === "listing") return BuildingIcon;
  return UsersGroupIcon;
}

function hasChartSeriesData(datasets) {
  return Object.values(datasets || {}).some((items) => Array.isArray(items) && items.length > 0);
}

function NoDataPanel({ title = "Ingen data", subtitle, className = "" }) {
  return <section className={`loa-data-section ${className}`}>
    <h3>{title}</h3>
    {subtitle && <p className="loa-section-description">{subtitle}</p>}
    <div className="loa-chart-empty"><span aria-hidden="true">—</span><p>Data visas här när aktivitet registreras.</p></div>
  </section>;
}

function WeeklyActivityHeatmap() {
  if (weeklyHeatmap.length === 0) {
    return <NoDataPanel title="Veckoaktivitet" />;
  }

  const labels = ["06-10", "10-14", "14-18", "18-22"];

  return (
    <Card className="gap-0 py-0 p-4 sm:p-5">
      <h3 className="text-lg font-semibold text-ink-900">Veckoaktivitet</h3>
      <p className="mt-1 text-sm text-ink-600">Visningsintensitet per veckodag och tidsfönster</p>
      <div className="mt-4">
        <WeeklyHeatmapChart rows={weeklyHeatmap} labels={labels} />
      </div>
    </Card>
  );
}

function AdminListingsPage({ listings = [] }) {
  const [query, setQuery] = useState("");
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("Alla");
  const statusFilters = ["Alla", "Aktiv", "Väntande", "Utkast", "Förhandling", "Uthyrd", "Inaktiv"].filter((status) => ["Alla", "Aktiv", "Utkast"].includes(status) || listings.some((listing) => listing.status === status));
  const listingRows = Array.isArray(listings) ? listings : [];
  const filteredListings = listingRows.filter((item) => (selectedStatus === "Alla" || item.status === selectedStatus) && [item.title, item.district, item.responsible].some((value) => String(value || "").toLocaleLowerCase("sv").includes(query.trim().toLocaleLowerCase("sv"))));

  function previewListing(listingId) {
    if (typeof window === "undefined") return;
    window.open(`/app/listings/${encodeURIComponent(listingId)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-4">


      <Card className="gap-0 py-0 overflow-hidden"><div className="flex flex-wrap items-center justify-end gap-2 border-b border-border p-4 sm:px-5"><Button type="button" className="h-auto px-4 py-2" onClick={() => navigateTo("/app/publish")}>
              <PlusIcon className="mr-1.5 h-4 w-4" />
              Ny annons
            </Button></div>
        <div className="border-b border-veil/10 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">Alla annonser</h2>
              <p className="mt-1 text-sm text-ink-600">Överblick över status, visningar och förfrågningar.</p>
              <ToggleGroup
                variant="outline"
                spacing={2}
                value={[selectedStatus]}
                onValueChange={(next) => next[0] && setSelectedStatus(next[0])}
                className="mt-3 flex-wrap justify-start"
              >
                {statusFilters.map((status) => {
                  const count = status === "Alla"
                    ? listingRows.length
                    : listingRows.filter((item) => item.status === status).length;
                  return (
                    <ToggleGroupItem
                      key={status}
                      value={status}
                      className={`h-auto gap-2 rounded-full border-veil/10 px-3 py-1.5 text-sm font-semibold text-ink-700 shadow-none hover:bg-veil/5 ${statusToggleOnClass(status)}`}
                    >
                      <span className="font-medium">{status === "Alla" ? "Alla" : status === "Aktiv" ? "Aktiva" : status}</span>
                      <span className="font-medium -ml-1">:</span>
                      <span className="font-semibold">{count}</span>
                    </ToggleGroupItem>
                  );
                })}
              </ToggleGroup>
            </div>
            <Input aria-label="Sök annonser" className="w-full sm:w-72" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sök annons, område eller ansvarig..." />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[780px]">

            <TableHeader className="bg-canvas text-[11px] text-ink-500">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 sm:px-5">Annons</TableHead>
                <TableHead className="px-4 py-3">Status</TableHead>
                <TableHead className="px-4 py-3 text-right">Visningar</TableHead>
                <TableHead className="px-4 py-3 text-right">Förfr.</TableHead>
                <TableHead className="px-4 py-3">Ansvarig</TableHead>
                <TableHead className="px-4 py-3 text-right sm:px-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredListings.map((item) => (
                <TableRow key={item.id} className="border-t border-veil/10">
                  <TableCell className="whitespace-normal px-4 py-3.5 align-top sm:px-5">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.title} className="h-11 w-16 shrink-0 rounded-lg border border-veil/10 object-cover" loading="lazy" />
                      <div className="min-w-0">
                        <Button variant="link" className="h-auto max-w-full justify-start truncate p-0 font-semibold text-ink-900" onClick={() => setSelectedListing(item)}>{item.title}</Button>
                        <p className="mt-1 text-xs text-ink-600">{item.district} · {item.size} m² · {formatSek(item.priceMonthly)}/mån</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 align-top">
                    <Badge variant="outline" className={`h-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(item.status)}`}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right font-semibold text-ink-800">{item.views.toLocaleString("sv-SE")}</TableCell>
                  <TableCell className="px-4 py-3.5 text-right font-semibold text-ink-800">{item.inquiries}</TableCell>
                  <TableCell className="px-4 py-3.5 text-xs text-ink-700">
                    <span className="block truncate">{item.responsible}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right sm:px-5">
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-md text-ink-600 hover:bg-control"
                              aria-label={`Förhandsgranska ${item.title}`}
                              onClick={() => previewListing(item.id)}
                            />
                          }
                        >
                          <ExternalLinkIcon className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>Förhandsgranska i nytt fönster</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredListings.length === 0 ? (
                <TableRow className="border-t border-veil/10">
                  <TableCell className="whitespace-normal px-4 py-6 text-sm text-ink-500 sm:px-5" colSpan={6}>
                    Inga annonser matchar din sökning.
                    <Button variant="link" onClick={() => { setQuery(""); setSelectedStatus("Alla"); }}>Rensa filter</Button>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </Card>
      <Sheet open={Boolean(selectedListing)} onOpenChange={(open) => { if (!open) setSelectedListing(null); }}>
        <SheetContent className="admin-workspace data-[side=right]:w-full data-[side=right]:sm:max-w-xl gap-0 p-0">
          <SheetHeader className="border-b border-veil/10 p-6 pr-12">
            <SheetTitle className="text-xl">{selectedListing?.title}</SheetTitle>
            <SheetDescription>Annonsöversikt · {selectedListing?.district}</SheetDescription>
          </SheetHeader>
          {selectedListing ? <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
            <img src={selectedListing.image} alt={selectedListing.title} className="aspect-video w-full rounded-lg object-cover" />
            <Badge variant="outline" className={statusClass(selectedListing.status)}>{selectedListing.status}</Badge>
            <dl className="grid grid-cols-2 gap-6 text-sm">
              {[["Yta", `${selectedListing.size} m²`], ["Hyra", `${formatSek(selectedListing.priceMonthly)}/mån`], ["Visningar", selectedListing.views], ["Förfrågningar", selectedListing.inquiries], ["Ansvarig", selectedListing.responsible], ["Lokaltyp", selectedListing.type]].map(([label, value]) => <div key={label}><dt className="text-ink-500">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
            </dl>
            <p className="text-sm text-ink-500">Ansvarig mäklare hanterar innehåll och publicering i sin objektpanel.</p>
          </div> : null}
          <div className="border-t border-veil/10 p-5"><Button className="w-full" onClick={() => previewListing(selectedListing.id)}>Visa hela annonsen<ExternalLinkIcon /></Button></div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function notificationToneClass(tone) {
  if (tone === "new") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (tone === "live") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-veil/10 bg-subtle text-ink-700";
}

function AdminNotificationsPage({ app }) {
  const [seenNotificationIds, setSeenNotificationIds] = useState([]);
  const brokerRequestNotifications = (Array.isArray(app?.companyBrokers) ? app.companyBrokers : [])
    .filter((broker) => broker.status === "pending")
    .map((broker) => ({
      id: `broker-request-${broker.userId}`,
      dedupeKey: `broker-request-${broker.userId}-${broker.companyId || ""}`,
      title: "Mäklarförfrågan",
      body: broker.name || broker.email,
      time: broker.requestedAt ? new Date(broker.requestedAt).toLocaleString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Nyss",
      tone: "new",
      actionPath: "/app/admin/maklare"
    }));
  const backendNotifications = (Array.isArray(app?.notifications) ? app.notifications : [])
    .filter((item) => item.status !== "handled")
    .map((item) => ({
    id: item.id,
    dedupeKey: item.type === "broker_verification_requested" && item.metadata?.brokerUserId
      ? `broker-request-${item.metadata.brokerUserId}-${item.metadata.companyId || ""}`
      : `notification-${item.id}`,
    title: item.type === "broker_verification_requested" ? "Mäklarförfrågan" : item.title,
    body: item.type === "broker_verification_requested"
      ? String(item.body || "").replace(/^(.+?) vill bli verifierad.*$/, "$1").trim()
      : item.body,
    time: item.createdAt ? new Date(item.createdAt).toLocaleString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Nyss",
    tone: item.status === "unread" ? "new" : "activity",
    actionPath: item.type === "broker_verification_requested" ? "/app/admin/maklare" : "/app/admin/notifikationer"
  }));
  const notificationItems = [...brokerRequestNotifications, ...backendNotifications]
    .filter((item, index, list) => list.findIndex((candidate) => candidate.dedupeKey === item.dedupeKey) === index);

  return (
    <div className="space-y-4">


      <Card className="gap-0 py-0 p-3 sm:p-4">
        {notificationItems.length === 0 ? (
          <div>
            <p className="rounded-2xl border border-veil/10 bg-canvas px-4 py-4 text-sm text-ink-600">
              Inga notifikationer
            </p>
          </div>
        ) : (
          <Card className="gap-0 py-0 overflow-hidden rounded-xl border border-veil/10 bg-surface">
            <div className="divide-y divide-veil/10">
              {notificationItems.map((item) => (
                <article
                  key={item.id}
                  className="cursor-pointer px-4 py-3.5 transition hover:bg-canvas sm:px-5"
                  onClick={() => {
                    setSeenNotificationIds((current) => Array.from(new Set([...current, item.id])));
                    navigateTo(item.actionPath || "/app/admin/notifikationer");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSeenNotificationIds((current) => Array.from(new Set([...current, item.id])));
                      navigateTo(item.actionPath || "/app/admin/notifikationer");
                    }
                  }}
                  tabIndex={0}
                  aria-label={`Öppna notis: ${item.title}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${seenNotificationIds.includes(item.id) ? "bg-ink-300" : "bg-strong"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-baseline gap-3">
                        <p className="shrink-0 truncate text-sm font-semibold text-ink-900">{item.title}</p>
                        <p className="min-w-0 flex-1 truncate text-sm leading-snug text-ink-600">{item.body}</p>
                        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-ink-500">
                          {item.time}
                          <ChevronRightIcon className="h-3.5 w-3.5 text-ink-500" />
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
}

function AdminBrokersPage({ app }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [pendingApprovalUserId, setPendingApprovalUserId] = useState("");
  const [brokerManagerOpen, setBrokerManagerOpen] = useState(false);
  const [activityOverlayOpen, setActivityOverlayOpen] = useState(false);
  const [deleteBrokerCandidate, setDeleteBrokerCandidate] = useState(null);
  const [deleteBrokerConfirmName, setDeleteBrokerConfirmName] = useState("");
  const [selectedBrokerId, setSelectedBrokerId] = useState("");
  const [brokerDraft, setBrokerDraft] = useState({ name: "", phone: "", fmiNumber: "" });
  const [savingBrokerId, setSavingBrokerId] = useState("");
  const [removingBrokerId, setRemovingBrokerId] = useState("");
  const companyBrokers = Array.isArray(app?.companyBrokers) ? app.companyBrokers : [];
  const pendingBrokerRequests = companyBrokers.filter((broker) => broker.status === "pending");
  const activeBrokers = companyBrokers.filter((broker) => broker.status === "active");
  const selectedBroker = activeBrokers.find((broker) => broker.userId === selectedBrokerId) || activeBrokers[0] || null;

  const inviteCode = useMemo(() => "BROKER-" + String(Math.floor(100000 + Math.random() * 900000)), []);
  const formatRequestTime = (value) => {
    if (!value) return "Nyss";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Nyss";
    return parsed.toLocaleString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };
  const formatJoinedDate = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" });
  };

  async function approveBroker(userId) {
    setPendingApprovalUserId(userId);
    try {
      await app?.approveBrokerRequest?.(userId);
    } finally {
      setPendingApprovalUserId("");
    }
  }

  async function rejectBroker(userId) {
    setPendingApprovalUserId(userId);
    try {
      await app?.rejectBrokerRequest?.(userId);
    } finally {
      setPendingApprovalUserId("");
    }
  }

  function openBrokerManager(broker = activeBrokers[0]) {
    const nextBroker = broker || null;
    setSelectedBrokerId(nextBroker?.userId || "");
    setBrokerDraft({
      name: nextBroker?.name || "",
      phone: nextBroker?.phone || "",
      fmiNumber: nextBroker?.fmiNumber || ""
    });
    setBrokerManagerOpen(true);
  }

  function selectBrokerForEdit(broker) {
    setSelectedBrokerId(broker.userId);
    setBrokerDraft({
      name: broker.name || "",
      phone: broker.phone || "",
      fmiNumber: broker.fmiNumber || ""
    });
  }

  async function saveBrokerChanges(event) {
    event.preventDefault();
    if (!selectedBroker) return;
    setSavingBrokerId(selectedBroker.userId);
    try {
      await app?.updateCompanyBroker?.(selectedBroker.userId, brokerDraft);
    } finally {
      setSavingBrokerId("");
    }
  }

  function openDeleteBrokerConfirmation(broker) {
    setDeleteBrokerCandidate(broker);
    setDeleteBrokerConfirmName("");
  }

  async function removeBroker(broker = deleteBrokerCandidate) {
    if (!broker) return;
    setRemovingBrokerId(broker.userId);
    try {
      await app?.removeCompanyBroker?.(broker.userId);
      const nextBroker = activeBrokers.find((item) => item.userId !== broker.userId) || null;
      if (nextBroker) {
        selectBrokerForEdit(nextBroker);
      } else {
        setBrokerManagerOpen(false);
      }
      setDeleteBrokerCandidate(null);
      setDeleteBrokerConfirmName("");
    } finally {
      setRemovingBrokerId("");
    }
  }

  return (
    <div className="space-y-4">


      {pendingBrokerRequests.length > 0 ? (
        <Card className="gap-0 py-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">Väntar på godkännande</h2>
              <p className="mt-1 text-sm text-ink-600">
                Mäklare som har begärt verifiering för {app?.adminCompany?.organizationNumber || "ert organisationsnummer"}.
              </p>
            </div>
            <Badge variant="outline" className="h-auto rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {pendingBrokerRequests.length} väntar
            </Badge>
          </div>

          <div className="mt-4 grid gap-3">
            {pendingBrokerRequests.map((broker) => {
              const initials = String(broker.name || broker.email || "AA")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase();
              const isBusy = pendingApprovalUserId === broker.userId;
              return (
                <Card key={broker.id} className="gap-0 py-0 p-4 shadow-[0_1px_0_rgba(15,25,48,0.03)]">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-strong text-xs font-semibold text-on-strong">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-900">{broker.name || broker.email}</p>
                        <p className="mt-0.5 truncate text-xs text-ink-600">{broker.email}</p>
                        <p className="mt-2 text-sm text-ink-700">
                          Vill bli verifierad som mäklare för{" "}
                          <span className="font-semibold text-strong">{broker.companyName} ({broker.organizationNumber})</span>.
                        </p>
                        <p className="mt-1 text-xs text-ink-500">Skickad {formatRequestTime(broker.requestedAt)}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-auto px-4 py-2 text-sm"
                        disabled={isBusy}
                        onClick={() => rejectBroker(broker.userId)}
                      >
                        Avslå
                      </Button>
                      <Button
                        type="button"
                        className="h-auto px-4 py-2 text-sm"
                        disabled={isBusy}
                        onClick={() => approveBroker(broker.userId)}
                      >
                        {isBusy ? "Sparar..." : "Godkänn"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="gap-0 py-0 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-ink-900">Bjud in mäklare</h2>
          <p className="mt-1 text-sm text-ink-600">Använd samma inbjudningsflöde som onboarding, anpassat för adminpanelen.</p>

          <Card className="gap-0 py-0 mt-4 rounded-xl border border-veil/10 bg-canvas px-4 py-4">
            <p className="text-xs font-semibold text-ink-500">Inbjudningskod</p>
            <p className="mt-2 text-[1.2rem] font-semibold text-strong">{inviteCode}</p>
            <p className="mt-1 text-sm text-ink-500">Dela med mäklare via e-post eller internt system.</p>
          </Card>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_150px]">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="kollega@bolag.se"
            />
            <Button
              type="button"
              className="h-auto w-full px-4 py-2"
              onClick={() => {
                const email = String(inviteEmail || "").trim();
                if (!email) return;
                app?.pushToast?.("Inbjudningar är inte kopplade till e-post ännu. Använd verifieringsflödet tills mailutskick finns.", "info");
                setInviteEmail("");
              }}
            >
              + Bjud in
            </Button>
          </div>
        </Card>

        <Card className="gap-0 py-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">Teamaktivitet</h2>
              <p className="mt-1 text-sm text-ink-600">Senaste händelser relaterade till mäklarteamet.</p>
            </div>
            <Button type="button" variant="secondary" className="h-auto px-4 py-2 text-sm" onClick={() => setActivityOverlayOpen(true)}>
              Visa all aktivitet
            </Button>
          </div>
          <ul className="mt-4 space-y-3">
            {activityItems.filter((item) => item.type === "team" || item.type === "inquiry").slice(0, 4).map((item, index, list) => {
              const Icon = activityIcon(item.type);
              const hasNext = index < list.length - 1;
              return (
                <li key={item.id} className="relative pl-10">
                  <span className="absolute left-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-veil/10 bg-control text-ink-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  {hasNext ? <span className="absolute left-[15px] top-8 h-[calc(100%+0.75rem)] w-px bg-veil/10" /> : null}
                  <p className="text-sm font-semibold text-ink-800">{item.text}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{item.timestamp}</p>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      <Card className="gap-0 py-0 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Aktiva mäklare</h2>
            <p className="mt-1 text-sm text-ink-600">Verifierade mäklare som kan arbeta för bolaget.</p>
          </div>
          {activeBrokers.length > 0 ? (
            <Button
              type="button"
              variant="secondary"
              className="h-auto px-4 py-2 text-sm"
              onClick={() => openBrokerManager()}
            >
              Hantera mäklare
            </Button>
          ) : null}
        </div>
        <Card className="gap-0 py-0 mt-4 overflow-hidden rounded-xl border border-veil/10 bg-surface">
          {activeBrokers.length === 0 ? (
            <p className="bg-canvas px-4 py-4 text-sm text-ink-600">
              Inga verifierade mäklare ännu.
            </p>
          ) : (
            <div className="divide-y divide-veil/10">
              {activeBrokers.map((broker) => {
                const initials = String(broker.name || broker.email || "AA")
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase();
                return (
                  <div key={broker.id} className="grid gap-3 px-4 py-3.5 md:grid-cols-[minmax(0,1.4fr)_170px_180px_auto] md:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-strong text-xs font-semibold text-on-strong">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink-900">{broker.name || broker.email}</span>
                        <span className="block truncate text-xs text-ink-600">{broker.email}</span>
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-ink-500">Mäklarnummer (FMI)</p>
                      <p className="mt-0.5 text-sm font-medium text-ink-800">{broker.fmiNumber || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-ink-500">Gick med</p>
                      <p className="mt-0.5 text-sm font-medium text-ink-800">{formatJoinedDate(broker.approvedAt || broker.requestedAt)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-auto px-3.5 py-2 text-sm"
                        onClick={() => openBrokerManager(broker)}
                      >
                        Redigera
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-auto px-3.5 py-2 text-sm"
                        onClick={() => openDeleteBrokerConfirmation(broker)}
                      >
                        Ta bort
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </Card>

      <Dialog
        open={activityOverlayOpen}
        onOpenChange={(open) => {
          if (!open) setActivityOverlayOpen(false);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="z-[80] w-full max-w-[720px] gap-0 overflow-hidden rounded-[28px] border border-veil/10 bg-popover p-0 shadow-[0_24px_70px_rgba(15,25,48,0.25)] ring-0"
        >
          <div className="flex items-start justify-between gap-4 border-b border-veil/10 px-5 py-4">
            <div>
              <p className="text-xs font-semibold text-ink-500">Mäklarteam</p>
              <h2 className="mt-1 text-xl font-semibold text-ink-900">All teamaktivitet</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="close-circle-button leading-none text-ink-700 hover:border-strong hover:text-strong"
              aria-label="Stäng"
              onClick={() => setActivityOverlayOpen(false)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-[68vh] overflow-y-auto p-5">
            <ul className="space-y-4">
              {activityItems.filter((item) => item.type === "team" || item.type === "inquiry").map((item, index, list) => {
                const Icon = activityIcon(item.type);
                const hasNext = index < list.length - 1;
                return (
                  <li key={item.id} className="relative pl-10">
                    <span className="absolute left-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-veil/10 bg-control text-ink-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    {hasNext ? <span className="absolute left-[15px] top-8 h-[calc(100%+1rem)] w-px bg-veil/10" /> : null}
                    <p className="text-sm font-semibold text-ink-800">{item.text}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{item.timestamp}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteBrokerCandidate)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteBrokerCandidate(null);
            setDeleteBrokerConfirmName("");
          }
        }}
      >
        <AlertDialogContent className="max-w-[520px] rounded-[28px]">
          {deleteBrokerCandidate ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Ta bort mäklare?</AlertDialogTitle>
                <AlertDialogDescription>
                  Detta tar bort <span className="font-semibold text-strong">{deleteBrokerCandidate.name || deleteBrokerCandidate.email}</span> från bolagets mäklarteam. Mäklaren kan inte längre arbeta för bolaget.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <label className="block text-left">
                <span className="text-xs font-semibold text-ink-500">Skriv mäklarens namn för att bekräfta</span>
                <Input
                  className="mt-1.5"
                  value={deleteBrokerConfirmName}
                  onChange={(event) => setDeleteBrokerConfirmName(event.target.value)}
                  placeholder={deleteBrokerCandidate.name || deleteBrokerCandidate.email}
                />
              </label>
              <AlertDialogFooter>
                <AlertDialogCancel variant="secondary" className="h-auto px-4 py-2 text-sm">Avbryt</AlertDialogCancel>
                <AlertDialogAction
                  className="h-auto px-4 py-2 text-sm disabled:cursor-not-allowed disabled:border-veil/10 disabled:bg-tint-3 disabled:text-ink-500"
                  disabled={
                    deleteBrokerConfirmName.trim() !== String(deleteBrokerCandidate.name || deleteBrokerCandidate.email || "").trim()
                    || removingBrokerId === deleteBrokerCandidate.userId
                  }
                  onClick={() => removeBroker(deleteBrokerCandidate)}
                >
                  {removingBrokerId === deleteBrokerCandidate.userId ? "Tar bort..." : "Ta bort"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={brokerManagerOpen}
        onOpenChange={(open) => {
          if (!open) setBrokerManagerOpen(false);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="z-[80] w-full max-w-[880px] gap-0 overflow-hidden rounded-[28px] border border-veil/10 bg-popover p-0 shadow-[0_24px_70px_rgba(15,25,48,0.25)] ring-0"
        >
          <div className="flex items-start justify-between gap-4 border-b border-veil/10 px-5 py-4">
            <div>
              <p className="text-xs font-semibold text-ink-500">Mäklarteam</p>
              <h2 className="mt-1 text-xl font-semibold text-ink-900">Hantera mäklare</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="close-circle-button leading-none text-ink-700 hover:border-strong hover:text-strong"
              aria-label="Stäng"
              onClick={() => setBrokerManagerOpen(false)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid max-h-[72vh] min-h-[420px] overflow-hidden md:grid-cols-[280px_1fr]">
            <aside className="overflow-y-auto border-b border-veil/10 p-3 md:border-b-0 md:border-r">
              <div className="space-y-2">
                {activeBrokers.map((broker) => {
                  const initials = String(broker.name || broker.email || "AA")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase();
                  const selected = broker.userId === selectedBroker?.userId;
                  return (
                    <Button
                      key={broker.userId}
                      type="button"
                      variant="ghost"
                      className={`menu-hover-row h-auto w-full justify-start gap-3 px-3 py-2.5 text-left font-normal ${selected ? "bg-tint-2 hover:bg-tint-2" : "bg-transparent"}`}
                      onClick={() => selectBrokerForEdit(broker)}
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-strong text-xs font-semibold text-on-strong">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink-900">{broker.name || broker.email}</span>
                        <span className="block truncate text-xs text-ink-600">{broker.email}</span>
                      </span>
                    </Button>
                  );
                })}
              </div>
            </aside>

            <form className="overflow-y-auto p-5" onSubmit={saveBrokerChanges}>
              {selectedBroker ? (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold text-ink-900">{selectedBroker.name || selectedBroker.email}</h3>
                    <p className="mt-1 text-sm text-ink-600">Uppdatera mäklarinformation eller ta bort behörigheten från bolaget.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-semibold text-ink-500">Namn</span>
                      <Input
                        className="mt-1.5"
                        value={brokerDraft.name}
                        onChange={(event) => setBrokerDraft((current) => ({ ...current, name: event.target.value }))}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-ink-500">Telefon</span>
                      <Input
                        className="mt-1.5"
                        value={brokerDraft.phone}
                        onChange={(event) => setBrokerDraft((current) => ({ ...current, phone: event.target.value }))}
                        placeholder="Telefonnummer"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-ink-500">Mäklarnummer (FMI)</span>
                      <Input
                        className="mt-1.5"
                        value={brokerDraft.fmiNumber}
                        onChange={(event) => setBrokerDraft((current) => ({ ...current, fmiNumber: event.target.value }))}
                        placeholder="Ex. 2024001234"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-ink-500">E-post</span>
                      <Input className="mt-1.5 bg-subtle text-ink-600" value={selectedBroker.email || ""} disabled />
                    </label>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-veil/10 pt-5 sm:flex-row sm:items-center sm:justify-end">
                    <div className="flex gap-2 sm:justify-end">
                      <Button type="button" variant="secondary" className="h-auto px-4 py-2 text-sm" onClick={() => setBrokerManagerOpen(false)}>
                        Avbryt
                      </Button>
                      <Button
                        type="submit"
                        className="h-auto px-4 py-2 text-sm"
                        disabled={savingBrokerId === selectedBroker.userId}
                      >
                        {savingBrokerId === selectedBroker.userId ? "Sparar..." : "Spara ändringar"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="rounded-2xl border border-veil/10 bg-canvas px-4 py-4 text-sm text-ink-600">
                  Inga aktiva mäklare att hantera.
                </p>
              )}
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminInquiriesPage({ pathname = "/app/admin/inkorg" }) {
  const initialInquiryId = pathname.match(/^\/app\/admin\/inkorg\/([^/?#]+)/)?.[1] || adminInquiryThreads[0]?.id || null;
  const [inquiries, setInquiries] = useState(adminInquiryThreads);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeInquiryId, setActiveInquiryId] = useState(initialInquiryId);
  const [draftByInquiryId, setDraftByInquiryId] = useState(() =>
    Object.fromEntries(adminInquiryThreads.map((inquiry) => [inquiry.id, ""]))
  );

  const filteredInquiries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return inquiries.filter((inquiry) => {
      const renter = matchedRenters.find((item) => item.id === inquiry.renterId);
      const listing = activeListings.find((item) => item.id === inquiry.listingId);
      const haystack = [
        renter?.name,
        renter?.company,
        listing?.title,
        latestMessageForInquiry(inquiry)?.text,
        inquiry.assignedBroker
      ].join(" ").toLowerCase();

      const matchesQuery = query ? haystack.includes(query) : true;

      if (!matchesQuery) return false;
      if (filter === "unread") return inquiry.unreadCount > 0;
      if (filter === "priority") return inquiry.priority === "Hög";
      if (filter === "needs_reply") return inquiryNeedsResponse(inquiry);
      return true;
    });
  }, [filter, inquiries, searchQuery]);

  const activeInquiry = useMemo(
    () => filteredInquiries.find((inquiry) => inquiry.id === activeInquiryId)
      || inquiries.find((inquiry) => inquiry.id === activeInquiryId)
      || filteredInquiries[0]
      || inquiries[0]
      || null,
    [activeInquiryId, filteredInquiries, inquiries]
  );

  const activeRenter = useMemo(
    () => matchedRenters.find((item) => item.id === activeInquiry?.renterId) || null,
    [activeInquiry]
  );

  const activeListing = useMemo(
    () => activeListings.find((item) => item.id === activeInquiry?.listingId) || null,
    [activeInquiry]
  );

  const suggestedPrompts = useMemo(() => {
    if (!activeInquiry || !activeRenter || !activeListing) return [];
    return buildSuggestedPrompts(activeInquiry, activeRenter, activeListing);
  }, [activeInquiry, activeListing, activeRenter]);

  useEffect(() => {
    if (filteredInquiries.length === 0) return;
    if (!activeInquiryId || !filteredInquiries.some((inquiry) => inquiry.id === activeInquiryId)) {
      setActiveInquiryId(filteredInquiries[0].id);
    }
  }, [activeInquiryId, filteredInquiries]);

  function setDraftValue(inquiryId, value) {
    setDraftByInquiryId((current) => ({ ...current, [inquiryId]: value }));
  }

  function applySuggestedPrompt(text) {
    if (!activeInquiry) return;
    setDraftValue(activeInquiry.id, text);
  }

  function selectInquiry(inquiryId) {
    setActiveInquiryId(inquiryId);
    setInquiries((current) => current.map((item) => (
      item.id === inquiryId ? { ...item, unreadCount: 0 } : item
    )));
  }

  function sendReply() {
    if (!activeInquiry) return;
    const draft = draftByInquiryId[activeInquiry.id]?.trim();
    if (!draft) return;

    setInquiries((current) => current.map((item) => {
      if (item.id !== activeInquiry.id) return item;
      return {
        ...item,
        status: "Pågående",
        unreadCount: 0,
        receivedAt: "Nu",
        messages: [
          ...item.messages,
          {
            id: `${item.id}-m${item.messages.length + 1}`,
            sender: "admin",
            text: draft,
            timestamp: "Nu"
          }
        ]
      };
    }));
    setDraftValue(activeInquiry.id, "");
  }

  const draftValue = activeInquiry ? draftByInquiryId[activeInquiry.id] || "" : "";
  const activeSummary = activeInquiry && activeRenter && activeListing
    ? inquirySummaryLine(activeInquiry, activeRenter, activeListing)
    : "";
  const quickPromptChips = suggestedPrompts.slice(0, 3);
  const filterTabs = [
    { key: "all", label: "Alla", count: inquiries.length },
    { key: "unread", label: "Olästa", count: inquiries.filter((item) => item.unreadCount > 0).length },
    { key: "needs_reply", label: "Svar krävs", count: inquiries.filter((item) => inquiryNeedsResponse(item)).length },
    { key: "priority", label: "Hög prioritet", count: inquiries.filter((item) => item.priority === "Hög").length }
  ];

  return (
    <div className="space-y-4">


      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="gap-0 py-0 p-4">
          <p className="text-xs font-semibold text-ink-500">Nya</p>
          <p className="mt-2 text-2xl font-semibold text-strong">{inquiries.filter((item) => item.status === "Ny").length}</p>
        </Card>
        <Card className="gap-0 py-0 p-4">
          <p className="text-xs font-semibold text-ink-500">Pågående</p>
          <p className="mt-2 text-2xl font-semibold text-strong">{inquiries.filter((item) => item.status === "Pågående").length}</p>
        </Card>
        <Card className="gap-0 py-0 p-4">
          <p className="text-xs font-semibold text-ink-500">Hög prioritet</p>
          <p className="mt-2 text-2xl font-semibold text-strong">{inquiries.filter((item) => item.priority === "Hög").length}</p>
        </Card>
      </section>

      <Card className="gap-0 py-0 overflow-hidden">
        <div className="grid lg:h-[calc(100vh-11rem)] lg:grid-cols-[360px,minmax(0,1fr)] xl:grid-cols-[360px,minmax(0,1fr),336px]">
          <aside className="border-b border-veil/10 bg-canvas lg:border-b-0 lg:border-r">
            <div className="border-b border-veil/10 p-4">
              <p className="text-xs font-semibold  tracking-[0.18em] text-ink-500">Inkorg</p>
              <h2 className="mt-1 text-lg font-semibold text-strong">Konversationer</h2>
              <div className="mt-3">
                <label className="relative block">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <Input
                    className="!rounded-2xl !bg-control pl-9"
                    placeholder="Sök namn, bolag eller annons"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {filterTabs.map((tab) => {
                  const active = filter === tab.key;
                  return (
                    <Button
                      key={tab.key}
                      type="button"
                      variant="outline"
                      onClick={() => setFilter(tab.key)}
                      className={`h-auto gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                        active
                          ? "border-transparent bg-strong text-on-strong hover:bg-strong hover:text-on-strong"
                          : "border-veil/10 text-ink-700 hover:border-line-2"
                      }`}
                    >
                      {tab.label}
                      <Badge className={`h-auto min-w-5 rounded-full px-1.5 py-0.5 text-[10px] ${
                        active ? "bg-on-strong/15 text-on-strong" : "bg-tint-2 text-brand-600"
                      }`}>
                        {tab.count}
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-y-auto lg:h-[calc(100vh-18rem)]">
              {filteredInquiries.map((inquiry) => {
                const renter = matchedRenters.find((item) => item.id === inquiry.renterId);
                const listing = activeListings.find((item) => item.id === inquiry.listingId);
                const latestMessage = latestMessageForInquiry(inquiry);
                if (!renter || !listing || !latestMessage) return null;
                const isActive = inquiry.id === activeInquiry?.id;
                return (
                  <Button
                    key={inquiry.id}
                    type="button"
                    variant="ghost"
                    onClick={() => selectInquiry(inquiry.id)}
                    className={`h-auto flex w-full items-start gap-3 border-b border-veil/5 px-4 py-4 text-left font-normal transition ${
                      isActive ? "bg-control shadow-[inset_3px_0_0_rgb(var(--strong))] hover:bg-control" : "hover:bg-control/80"
                    }`}
                  >
                    <Avatar className="h-11 w-11 shrink-0">
                      <AvatarFallback className={`text-sm font-semibold ${isActive ? "bg-strong text-on-strong" : "bg-tint-3 text-strong"}`}>
                        {renter.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink-900">{renter.name}</p>
                          <p className="truncate text-[11px] text-ink-500">{inquirySummaryLine(inquiry, renter, listing)}</p>
                        </div>
                        <span className="shrink-0 text-[11px] font-semibold text-ink-500">{inquiry.receivedAt}</span>
                      </div>
                      <p className="mt-2 text-sm leading-snug text-ink-700">{latestMessage.text}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={`h-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${inquiryStatusClass(inquiry.status)}`}>{inquiry.status}</Badge>
                        <Badge variant="outline" className={`h-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${inquiryPriorityClass(inquiry.priority)}`}>{inquiry.priority}</Badge>
                        {inquiryNeedsResponse(inquiry) ? (
                          <Badge className="h-auto rounded-full bg-tint-2 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
                            Svar krävs
                          </Badge>
                        ) : null}
                        {inquiry.unreadCount > 0 ? (
                          <Badge className="min-w-5 rounded-full bg-[#d96757] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {inquiry.unreadCount}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </Button>
                );
              })}
              {filteredInquiries.length === 0 ? (
                <div className="p-6 text-sm text-ink-600">
                  Ingen konversation matchar nuvarande filter.
                </div>
              ) : null}
            </div>
          </aside>

          <div className="min-w-0 border-b border-veil/10 lg:border-b-0 xl:border-r">
            {activeInquiry && activeRenter && activeListing ? (
              <div className="flex h-full min-h-[760px] flex-col bg-surface">
                <div className="border-b border-veil/10 bg-surface px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarFallback className="bg-strong text-sm font-semibold text-on-strong">{activeRenter.initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-semibold text-strong">{activeRenter.name}</h3>
                          <Badge variant="outline" className={`h-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${inquiryStatusClass(activeInquiry.status)}`}>{activeInquiry.status}</Badge>
                        </div>
                        <p className="truncate text-sm text-ink-600">{activeRenter.company} · {activeSummary}</p>
                        <p className="mt-1 text-xs text-ink-500">Ansvarig mäklare: {activeInquiry.assignedBroker} · Senast aktiv {activeInquiry.receivedAt}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-ink-500">
                      <Badge variant="outline" className="h-auto gap-1 rounded-full bg-canvas px-2.5 py-1 text-sm font-normal">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {activeInquiry.stage}
                      </Badge>
                      <Badge variant="outline" className={`h-auto rounded-full px-2.5 py-1 ${inquiryPriorityClass(activeInquiry.priority)}`}>
                        {activeInquiry.priority}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="border-b border-veil/10 bg-canvas px-4 py-3 sm:px-5 xl:hidden">
                  <Card className="gap-0 py-0 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-3">
                    <img src={activeListing.image} alt={activeListing.title} className="h-16 w-24 rounded-2xl border border-veil/10 object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-brand-600">Matchad annons</p>
                      <p className="mt-1 truncate text-sm font-semibold text-strong">{activeListing.title}</p>
                      <p className="mt-1 text-xs text-ink-600">{activeListing.district} · {activeListing.size} m² · {formatSek(activeListing.priceMonthly)}/mån</p>
                    </div>
                    <Card className="gap-0 py-0 rounded-xl border border-line bg-tint-2 px-3 py-2 text-center">
                      <p className="text-[11px] font-semibold text-ink-500">Match</p>
                      <p className="mt-1 text-lg font-semibold text-strong">{activeRenter.score}%</p>
                    </Card>
                  </Card>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfa_100%)] px-4 py-5 sm:px-5">
                  <Card className="gap-0 py-0 mx-auto max-w-3xl rounded-xl border border-line bg-tint-2 p-4">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-brand-600">Dialogsammanfattning</p>
                        <p className="mt-1 text-sm font-semibold text-strong">{activeSummary}</p>
                        <p className="mt-2 text-sm leading-relaxed text-ink-700">
                          {activeRenter.name.split(" ")[0]} söker {activeRenter.preferredType.toLowerCase()} i {activeRenter.district} för {activeRenter.teamSize.toLowerCase()} med budget {activeRenter.budget}.
                        </p>
                      </div>
                      <Card className="gap-0 py-0 rounded-xl border border-line-2 bg-surface px-3 py-2">
                        <p className="text-[11px] font-semibold text-ink-500">Nästa steg</p>
                        <p className="mt-1 text-sm font-semibold text-strong">{activeInquiry.stage}</p>
                      </Card>
                    </div>
                  </Card>

                  <div className="mx-auto max-w-3xl space-y-4">
                    {activeInquiry.messages.map((message) => {
                      const isAdmin = message.sender === "admin";
                      const isSystem = message.sender === "system";
                      return (
                        <div key={message.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                          <div className={`flex max-w-[85%] flex-col gap-1 ${isAdmin ? "items-end" : "items-start"}`}>
                            {!isSystem ? (
                              <span className="px-1 text-[11px] font-semibold text-ink-400">
                                {isAdmin ? "Bolagsadmin" : activeRenter.name}
                              </span>
                            ) : null}
                            <div className={`rounded-[26px] px-4 py-3 text-sm leading-relaxed shadow-[0_12px_28px_rgba(15,25,48,0.06)] ${
                              isSystem
                                ? "border border-dashed border-veil/10 bg-canvas text-ink-600"
                                : isAdmin
                                  ? "rounded-br-md bg-strong text-on-strong"
                                  : "rounded-bl-md border border-veil/10 bg-surface text-ink-800"
                            }`}>
                              {message.text}
                            </div>
                            <span className="px-1 text-[11px] text-ink-400">{message.timestamp}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-veil/10 bg-surface px-4 py-4 sm:px-5">
                  <div className="mx-auto max-w-3xl">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {quickPromptChips.map((prompt) => (
                        <Button
                          key={prompt.id}
                          type="button"
                          variant="outline"
                          onClick={() => applySuggestedPrompt(prompt.text)}
                          className="h-auto gap-2 rounded-full border-line-2 bg-tint-2 px-3 py-2 text-xs font-semibold text-strong hover:bg-tint-2"
                        >
                          <SparklesIcon className="h-3.5 w-3.5" />
                          {prompt.label}
                        </Button>
                      ))}
                    </div>
                    <div className="rounded-[28px] border border-veil/10 bg-canvas p-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <textarea
                          className="min-h-[104px] w-full resize-none rounded-[22px] border-0 bg-transparent px-3 py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-400"
                          placeholder="Skriv svar till hyresgästen..."
                          value={draftValue}
                          onChange={(event) => setDraftValue(activeInquiry.id, event.target.value)}
                        />
                        <Button type="button" className="h-auto rounded-[20px] px-4 py-3 text-sm" onClick={sendReply}>
                          Skicka svar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[520px] items-center justify-center p-8 text-sm text-ink-600">
                Välj en konversation för att öppna chatten.
              </div>
            )}
          </div>

          <aside className="hidden bg-canvas xl:block">
            {activeInquiry && activeRenter && activeListing ? (
              <div className="h-full space-y-4 overflow-y-auto p-4 sm:p-5">
                <article className="rounded-[28px] border border-line bg-surface p-4">
                  <img src={activeListing.image} alt={activeListing.title} className="h-40 w-full rounded-[22px] border border-veil/10 object-cover" loading="lazy" />
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-brand-600">Matchad annons</p>
                    <h3 className="mt-1 text-base font-semibold text-strong">{activeListing.title}</h3>
                    <p className="mt-1 text-sm text-ink-600">{activeListing.district} · {activeListing.size} m² · {formatSek(activeListing.priceMonthly)}/mån</p>
                  </div>
                </article>

                <article className="rounded-[28px] border border-line bg-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold text-ink-500">Hyresgäst</p>
                      <h3 className="mt-1 text-base font-semibold text-strong">{activeRenter.name}</h3>
                    </div>
                    <Card className="gap-0 py-0 rounded-xl border border-line bg-tint-2 px-3 py-2 text-center">
                      <p className="text-[11px] font-semibold text-ink-500">Match</p>
                      <p className="mt-1 text-lg font-semibold text-strong">{activeRenter.score}%</p>
                    </Card>
                  </div>
                  <div className="mt-3 grid gap-2">
                    <Card className="gap-0 py-0 rounded-xl border border-veil/10 bg-canvas px-3 py-2.5">
                      <p className="text-[11px] font-semibold text-ink-500">Bolag</p>
                      <p className="mt-1 text-sm font-semibold text-ink-900">{activeRenter.company}</p>
                    </Card>
                    <div className="grid grid-cols-2 gap-2">
                      <Card className="gap-0 py-0 rounded-xl border border-veil/10 bg-canvas px-3 py-2.5">
                        <p className="text-[11px] font-semibold text-ink-500">Team</p>
                        <p className="mt-1 text-sm font-semibold text-ink-900">{activeRenter.teamSize}</p>
                      </Card>
                      <Card className="gap-0 py-0 rounded-xl border border-veil/10 bg-canvas px-3 py-2.5">
                        <p className="text-[11px] font-semibold text-ink-500">Budget</p>
                        <p className="mt-1 text-sm font-semibold text-ink-900">{activeRenter.budget}</p>
                      </Card>
                    </div>
                  </div>
                </article>

                <article className="rounded-[28px] border border-line bg-surface p-4">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4 text-brand-600" />
                    <h3 className="text-sm font-semibold text-strong">Föreslagna svar</h3>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-600">Direkt baserat på senaste hyresgästmeddelandet.</p>
                  <div className="mt-3 space-y-2.5">
                    {suggestedPrompts.map((prompt) => (
                      <Button
                        key={prompt.id}
                        type="button"
                        variant="outline"
                        onClick={() => applySuggestedPrompt(prompt.text)}
                        className="h-auto block w-full rounded-xl border-veil/10 bg-canvas p-3 text-left font-normal hover:border-line-2 hover:bg-control"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge className={`h-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            prompt.kind === "question" ? "bg-tint-2 text-brand-600" : "bg-[#f3ebe6] text-[#9b5d3f] dark:bg-[#3a2c25] dark:text-[#e2b8a0]"
                          }`}>
                            {prompt.kind === "question" ? "Fråga" : "Svar"}
                          </Badge>
                          <span className="text-[11px] font-semibold text-ink-400">{prompt.label}</span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-ink-800">{prompt.text}</p>
                      </Button>
                    ))}
                  </div>
                </article>

                <article className="rounded-[28px] border border-line bg-surface p-4">
                  <h3 className="text-sm font-semibold text-strong">Matchkriterier</h3>
                  <div className="mt-3 space-y-2">
                    {activeRenter.matchCriteria.map((item) => (
                      <Card key={`${activeInquiry.id}-${item.label}`} className="gap-0 py-0 flex items-start justify-between gap-3 rounded-xl border border-veil/10 bg-canvas px-3 py-2.5">
                        <div>
                          <p className="text-[11px] font-semibold text-ink-500">{item.label}</p>
                          <p className="mt-1 text-sm font-semibold text-ink-900">{item.value}</p>
                        </div>
                        <Badge className={`h-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          item.status === "match" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {item.status === "match" ? "Match" : "Delvis"}
                        </Badge>
                      </Card>
                    ))}
                  </div>
                </article>

                <article className="rounded-[28px] border border-line bg-surface p-4">
                  <h3 className="text-sm font-semibold text-strong">Snabböversikt</h3>
                  <ul className="mt-3 space-y-2">
                    <li className="flex items-center gap-2 text-sm text-ink-700">
                      <ClockIcon className="h-4 w-4 text-ink-500" />
                      Senaste aktivitet: {activeInquiry.receivedAt}
                    </li>
                    <li className="flex items-center gap-2 text-sm text-ink-700">
                      <CheckBadgeIcon className="h-4 w-4 text-ink-500" />
                      Ansvarig mäklare: {activeInquiry.assignedBroker}
                    </li>
                    <li className="flex items-center gap-2 text-sm text-ink-700">
                      <InfoCircleIcon className="h-4 w-4 text-ink-500" />
                      Nuvarande steg: {activeInquiry.stage}
                    </li>
                    <li className="flex items-center gap-2 text-sm text-ink-700">
                      <PinIcon className="h-4 w-4 text-ink-500" />
                      Väntar på svar: {inquiryNeedsResponse(activeInquiry) ? "Ja" : "Nej"}
                    </li>
                  </ul>
                </article>
              </div>
            ) : null}
          </aside>
        </div>
      </Card>
    </div>
  );
}

function AdminStatistics({ app }) {
  const adminStats = useMemo(() => buildAdminStats(app), [app?.listings, app?.leads, app?.companyBrokers, app?.adminCompany]);
  const statsChartSeries = adminStats.chartSeries;
  const statsDistributionData = adminStats.distributionData;
  const statsDistrictPerformance = adminStats.districtPerformance;
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const rootRef = useRef(null);
  const [visibleModules, setVisibleModules] = useState({
    kpi: true,
    trend: true,
    distribution: true,
    district: true,
    funnel: true,
    brokerRadar: true,
    heatmap: true,
    segment: true,
    extended: true
  });
  const [visibleExtendedCards, setVisibleExtendedCards] = useState(() => {
    const allVisible = {};
    extendedStatCards.forEach((item) => {
      allVisible[item.id] = true;
    });
    return allVisible;
  });
  const [activeSectionId, setActiveSectionId] = useState("stats-kpi");

  function closeCustomize() {
    setCustomizeOpen(false);
  }

  const displayedExtendedCards = extendedStatCards.filter((item) => visibleExtendedCards[item.id] !== false);
  const visibleSectionLinks = useMemo(
    () => statisticsSectionLinks.filter((item) => Boolean(visibleModules[item.moduleKey])),
    [visibleModules]
  );

  function getScrollContainer() {
    return rootRef.current?.closest("[data-admin-scroll-container='true']") || null;
  }

  function getScrollTopOffset() {
    return window.innerWidth >= 640 ? 24 : 16;
  }

  function scrollToStatisticsSection(sectionId, smooth = true) {
    const section = document.getElementById(sectionId);
    const scrollContainer = getScrollContainer();
    if (!section || !scrollContainer) return false;

    const topOffset = getScrollTopOffset();
    const top = section.getBoundingClientRect().top
      - scrollContainer.getBoundingClientRect().top
      + scrollContainer.scrollTop
      - topOffset;

    scrollContainer.scrollTo({ top: Math.max(top, 0), behavior: smooth ? "smooth" : "auto" });
    return true;
  }

  function handleSectionLinkClick(event, sectionId) {
    event.preventDefault();
    const nextHash = `#${sectionId}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
    }
    scrollToStatisticsSection(sectionId, true);
  }

  useEffect(() => {
    if (visibleSectionLinks.length === 0) return undefined;

    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return undefined;

    const updateActiveSection = () => {
      const threshold = getScrollTopOffset() + 28;
      let nextActive = visibleSectionLinks[0]?.id || null;

      visibleSectionLinks.forEach((item) => {
        const element = document.getElementById(item.id);
        if (!element) return;
        const relativeTop = element.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top;
        if (relativeTop <= threshold) {
          nextActive = item.id;
        }
      });

      if (nextActive) setActiveSectionId(nextActive);
    };

    updateActiveSection();
    scrollContainer.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      scrollContainer.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [visibleSectionLinks]);

  useEffect(() => {
    if (visibleSectionLinks.length === 0) return undefined;

    const validIds = new Set(visibleSectionLinks.map((item) => item.id));
    const syncHashSection = (smooth) => {
      const sectionId = window.location.hash.replace(/^#/, "");
      if (!validIds.has(sectionId)) return;
      requestAnimationFrame(() => {
        scrollToStatisticsSection(sectionId, smooth);
        setActiveSectionId(sectionId);
      });
    };

    syncHashSection(false);

    const onHashChange = () => syncHashSection(true);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [visibleSectionLinks]);

  return (
    <div ref={rootRef} className="relative">
      <aside className="hidden xl:absolute xl:left-[-264px] xl:top-0 xl:block xl:h-full xl:w-[240px]">
        <nav className="sticky top-6 rounded-[28px] border border-veil/10 bg-transparent p-3 shadow-[0_10px_24px_rgba(15,25,48,0.05)]">
          <p className="px-2 pb-2 text-[11px] font-semibold  tracking-[0.16em] text-ink-400">Snabblänkar</p>
          <div className="space-y-0.5">
            {visibleSectionLinks.map((item) => {
              const active = item.id === activeSectionId;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`menu-hover-row block whitespace-nowrap rounded-2xl px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-strong font-semibold text-on-strong"
                      : "text-ink-600 hover:bg-veil/5 hover:text-ink-900"
                  }`}
                  onClick={(event) => handleSectionLinkClick(event, item.id)}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        </nav>
      </aside>

      <div className="space-y-4">
        <Card className="gap-0 p-0"><div className="flex flex-wrap items-center justify-end gap-2 border-b border-border p-4 sm:px-5"><Button type="button" variant="secondary" className="h-auto gap-1.5 px-4 py-2" onClick={() => setCustomizeOpen(true)}>
              <FilterIcon className="h-4 w-4" />
              Anpassa
            </Button></div></Card>

        {visibleModules.kpi ? (
          <section id="stats-kpi">
            <KpiCardsSection cards={adminStats.cards} sparklineSeries={adminStats.sparklineSeries} />
          </section>
        ) : null}

        {(visibleModules.trend || visibleModules.distribution) ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {visibleModules.trend ? (
            <div id="stats-trend">
              {hasChartSeriesData(statsChartSeries) ? (
                <BarInteractive title="Visningar & förfrågningar" subtitle="Senaste period" datasets={statsChartSeries} defaultRange="30d" />
              ) : (
                <NoDataPanel title="Visningar & förfrågningar" />
              )}
            </div>
          ) : <div />}
          {visibleModules.distribution ? (
            <div id="stats-distribution">
              {statsDistributionData.length > 0 ? (
                <TypeDistributionDonut title="Fördelning" subtitle="Typ av lokal" data={statsDistributionData} />
              ) : (
                <NoDataPanel title="Fördelning" />
              )}
            </div>
          ) : <div />}
          </section>
        ) : null}

        {(visibleModules.district || visibleModules.funnel) ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {visibleModules.district ? (
            statsDistrictPerformance.length > 0 ? (
              <Card id="stats-district" className="gap-0 py-0 p-4 sm:p-5">
                <h3 className="text-lg font-semibold text-ink-900">Prestanda per område</h3>
                <p className="mt-1 text-sm text-ink-600">Visningar och förfrågningar för era starkaste delmarknader</p>
                <div className="mt-4">
                  <DistrictPerformanceChart data={statsDistrictPerformance} />
                </div>
              </Card>
            ) : (
              <div id="stats-district">
                <NoDataPanel title="Prestanda per område" />
              </div>
            )
          ) : <div />}

          {visibleModules.funnel ? (
            funnelData.length > 0 ? (
              <Card id="stats-funnel" className="gap-0 py-0 p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-ink-900">Konverteringstratt</h3>
              <p className="mt-1 text-sm text-ink-600">Från visning till signerat avtal</p>
              <div className="mt-4">
                <ConversionFunnelChart data={funnelData} />
              </div>
            </Card>
            ) : (
              <div id="stats-funnel">
                <NoDataPanel title="Konverteringstratt" />
              </div>
            )
          ) : <div />}
          </section>
        ) : null}

        {(visibleModules.brokerRadar || visibleModules.heatmap) ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {visibleModules.brokerRadar ? (
            brokerPerformanceRadar.length > 0 ? (
              <Card id="stats-broker-radar" className="gap-0 py-0 p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-ink-900">Mäklarprestanda</h3>
              <p className="mt-1 text-sm text-ink-600">Jämförelse av teamets nyckelområden (index)</p>
              <div className="mt-4">
                <BrokerRadarChart data={brokerPerformanceRadar} />
              </div>
            </Card>
            ) : (
              <div id="stats-broker-radar">
                <NoDataPanel title="Mäklarprestanda" />
              </div>
            )
          ) : <div />}

          {visibleModules.heatmap ? (
            <div id="stats-heatmap">
              <WeeklyActivityHeatmap />
            </div>
          ) : <div />}
          </section>
        ) : null}

        {visibleModules.segment ? (
          segmentTrend.length > 0 ? (
            <Card id="stats-segment" className="gap-0 py-0 p-4 sm:p-5">
          <h3 className="text-lg font-semibold text-ink-900">Trend per lokaltyp</h3>
          <p className="mt-1 text-sm text-ink-600">Utveckling av efterfrågan i respektive segment</p>
          <div className="mt-4">
            <SegmentTrendChart data={segmentTrend} />
          </div>
          </Card>
          ) : (
            <section id="stats-segment">
              <NoDataPanel title="Trend per lokaltyp" />
            </section>
          )
        ) : null}

        {visibleModules.extended ? (
          <Card id="stats-extended" className="gap-0 py-0 p-4 sm:p-5">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-ink-900">Fördjupade nyckeltal</h3>
            <p className="mt-1 text-sm text-ink-600">Operativa och kommersiella KPI:er för portföljstyrning</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {displayedExtendedCards.length > 0 ? (
              displayedExtendedCards.map((item) => <ExtendedStatCard key={item.id} item={item} />)
            ) : (
              <NoDataPanel title="Fördjupade nyckeltal" className="md:col-span-2 xl:col-span-4" />
            )}
          </div>
          </Card>
        ) : null}

        <Dialog
          open={customizeOpen}
          onOpenChange={(open) => {
            if (!open) closeCustomize();
          }}
        >
          <DialogContent
            showCloseButton={false}
            className="z-[95] w-full max-w-2xl rounded-xl border border-veil/10 bg-popover p-5 shadow-[0_24px_64px_rgba(15,25,48,0.22)] ring-0"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-ink-500">Anpassa statistik</p>
                <h3 className="mt-1 text-xl font-semibold text-ink-900">Välj vilka nyckeltal som ska visas</h3>
              </div>
              <Button type="button" variant="outline" size="icon" className="close-circle-button text-xl leading-none text-ink-700" onClick={closeCustomize}>
                ×
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="gap-0 py-0 p-3">
                <p className="text-sm font-semibold text-ink-800">Diagramsektioner</p>
                <div className="mt-3 space-y-2 text-sm">
                  {[
                    { key: "kpi", label: "KPI-kort" },
                    { key: "extended", label: "Fördjupade nyckeltal" },
                    { key: "trend", label: "Visningar & förfrågningar" },
                    { key: "distribution", label: "Fördelning (donut)" },
                    { key: "district", label: "Prestanda per område" },
                    { key: "funnel", label: "Konverteringstratt" },
                    { key: "brokerRadar", label: "Mäklarprestanda (radar)" },
                    { key: "heatmap", label: "Veckoaktivitet (heatmap)" },
                    { key: "segment", label: "Trend per lokaltyp" }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 text-ink-700">
                      <Checkbox
                        checked={Boolean(visibleModules[item.key])}
                        onCheckedChange={(checked) => setVisibleModules((prev) => ({ ...prev, [item.key]: Boolean(checked) }))}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </Card>

              <Card className="gap-0 py-0 p-3">
                <p className="text-sm font-semibold text-ink-800">Fördjupade nyckeltal</p>
                <div className="mt-3 max-h-[280px] space-y-2 overflow-y-auto pr-1 text-sm">
                  {extendedStatCards.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 text-ink-700">
                      <Checkbox
                        checked={visibleExtendedCards[item.id] !== false}
                        onCheckedChange={(checked) => setVisibleExtendedCards((prev) => ({ ...prev, [item.id]: Boolean(checked) }))}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </Card>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" className="h-auto px-4 py-2" onClick={closeCustomize}>Spara</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function AdminLeadMatchesPage({ app }) {
  const companyListings = ownedAdminListings(app);
  const leadRows = useMemo(() => buildAdminLeadRows(app), [app?.leads]);
  const [sortMode, setSortMode] = useState("best");
  const [listingFilter, setListingFilter] = useState("all");

  const activeListingOptions = useMemo(
    () => companyListings.filter((listing) => listing.status === "Aktiv"),
    [companyListings]
  );

  const suggestedMatches = useMemo(() => {
    const rows = matchedRenters.filter((renter) => (
      listingFilter === "all" || renter.matchListingId === listingFilter
    ));

    return [...rows].sort((a, b) => {
      if (sortMode === "newest") return b.id.localeCompare(a.id);
      if (sortMode === "movein") return moveInSortValue(a) - moveInSortValue(b);
      return b.score - a.score;
    });
  }, [listingFilter, sortMode]);

  useEffect(() => {
    if (window.location.hash !== "#matchningar") return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("matchningar")?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const sortTabs = [
    { key: "best", label: "Bäst match" },
    { key: "newest", label: "Nyast profil" },
    { key: "movein", label: "Tidigast inflytt" }
  ];

  return (
    <div className="space-y-4">


      <Card className="gap-0 py-0 overflow-hidden"><div className="flex flex-wrap items-center justify-end gap-2 border-b border-border p-4 sm:px-5"><Button
              type="button"
              variant="secondary"
              className="h-auto px-4 py-2"
              onClick={() => app?.pushToast?.("Ingen data att exportera.", "info")}
            >
              <DownloadIcon className="mr-1.5 h-4 w-4" />
              Exportera
            </Button>
<Button
              type="button"
              className="h-auto px-4 py-2"
              onClick={() => app?.pushToast?.("Ingen data att skicka.", "info")}
            >
              + Skicka urval till mäklare
            </Button></div>
        <div className="border-b border-veil/10 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold text-ink-500">LEADS</p>
                <Badge variant="outline" className="h-auto rounded-full bg-veil/10 px-2 py-0.5 text-[11px] font-semibold text-ink-700">
                  {leadRows.length} nya
                </Badge>
              </div>
              <p className="mt-1 text-sm text-ink-600">Hyresgäster som aktivt visat intresse för era lokaler</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-canvas text-[11px] text-ink-500">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 sm:px-5">Hyresgäst</TableHead>
                <TableHead className="px-4 py-3">Lokal</TableHead>
                <TableHead className="px-4 py-3">Intresse</TableHead>
                <TableHead className="px-4 py-3 text-right">Match</TableHead>
                <TableHead className="px-4 py-3">Tid</TableHead>
                <TableHead className="px-4 py-3 text-right sm:px-5">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadRows.map((lead) => (
                <TableRow
                  key={lead.id}
                  className={`cursor-pointer border-t border-veil/10 transition hover:bg-canvas ${
                    lead.isUnread ? "shadow-[inset_3px_0_0_rgb(var(--strong))]" : ""
                  }`}
                  onClick={() => openLeadConversation(app, lead)}
                >
                  <TableCell className="whitespace-normal px-4 py-3.5 align-top sm:px-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-strong text-sm font-semibold text-on-strong">{lead.renter.initials}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink-900">{lead.renter.name}</span>
                        <span className="block truncate text-xs text-ink-600">{lead.renter.company}</span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 align-top font-semibold text-ink-800">{lead.listing.title}</TableCell>
                  <TableCell className="whitespace-normal px-4 py-3.5 align-top">
                    <Badge variant="outline" className={`h-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${interestClass(lead.interest)}`}>
                      {lead.interest}
                    </Badge>
                  </TableCell>
                  <TableCell className={`px-4 py-3.5 text-right font-semibold ${matchScoreClass(lead.score)}`}>
                    {lead.score}%
                  </TableCell>
                  <TableCell className="px-4 py-3.5 align-top text-xs font-semibold text-ink-500">{lead.time}</TableCell>
                  <TableCell className="whitespace-normal px-4 py-3.5 text-right sm:px-5">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-auto w-auto gap-1.5 px-3 py-2 text-xs"
                        onClick={(event) => {
                          event.stopPropagation();
                          sendToBroker(app, lead.renter, lead.listing);
                        }}
                      >
                        <SendHorizontalIcon className="h-3.5 w-3.5" />
                        Skicka till mäklare
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md text-ink-600 hover:bg-control"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {leadRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="whitespace-normal border-t border-veil/10 px-4 py-10 text-center sm:px-5">
                    <p className="font-semibold text-ink-900">Inga aktiva leads just nu</p>
                    <p className="mt-1 text-sm text-ink-500">Leads visas här när hyresgäster interagerar med era annonser</p>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-veil/10" />
        <span className="text-[11px] font-semibold text-ink-400">Föreslagna av systemet</span>
        <span className="h-px flex-1 bg-veil/10" />
      </div>

      <Card id="matchningar" className="gap-0 py-0 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold text-ink-500">MATCHNINGAR</p>
              <Badge variant="outline" className="h-auto rounded-full bg-veil/10 px-2 py-0.5 text-[11px] font-semibold text-ink-700">
                {suggestedMatches.length} föreslagna
              </Badge>
            </div>
            <p className="mt-1 text-sm text-ink-600">Hyresgäster vars sökprofil matchar era lokaler — de har inte kontaktat er än</p>
          </div>
          <Select value={sortMode} onValueChange={setSortMode}>
            <SelectTrigger className="min-w-[190px] rounded-full text-sm font-semibold text-ink-800" aria-label="Sortera matchningar">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortTabs.map((tab) => (
                <SelectItem key={tab.key} value={tab.key}>{tab.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className={`h-auto rounded-md px-3 py-1.5 text-xs font-semibold ${
              listingFilter === "all"
                ? "border-transparent bg-strong text-on-strong hover:bg-strong hover:text-on-strong"
                : "border-veil/10 text-ink-700 hover:border-line-2"
            }`}
            onClick={() => setListingFilter("all")}
          >
            Alla lokaler
          </Button>
          {activeListingOptions.map((listing) => {
            const active = listingFilter === listing.id;
            return (
              <Button
                key={listing.id}
                type="button"
                variant="outline"
                className={`h-auto rounded-md px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "border-transparent bg-strong text-on-strong hover:bg-strong hover:text-on-strong"
                    : "border-veil/10 text-ink-700 hover:border-line-2"
                }`}
                onClick={() => setListingFilter(listing.id)}
              >
                {listing.title}
              </Button>
            );
          })}
        </div>

        {suggestedMatches.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {suggestedMatches.map((renter) => {
              const matchedListing = activeListings.find((listing) => listing.id === renter.matchListingId) || activeListings[0];
              return (
                <Card key={renter.id} className="gap-0 py-0 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-strong text-sm font-semibold text-on-strong">{renter.initials}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink-900">{renter.name}</span>
                        <span className="block truncate text-xs text-ink-600">{renter.company}</span>
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md text-ink-600 hover:bg-control"
                      onClick={() => app?.pushToast?.(`${renter.name} flaggad för senare.`, "success")}
                    >
                      <StarIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-veil/10 pt-3">
                    <div>
                      <p className="text-[10px] font-semibold text-ink-500">Match</p>
                      <p className={`mt-1 text-3xl font-semibold leading-none ${matchScoreClass(renter.score)}`}>{renter.score}%</p>
                    </div>
                    <Badge variant="outline" className={`h-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${matchScoreBadgeClass(renter.score)}`}>
                      {renter.preferredType}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 border-t border-veil/10 pt-3">
                    <Card className="gap-0 py-0 rounded-xl border border-veil/10 bg-canvas px-3 py-2.5">
                      <p className="text-[10px] font-semibold text-ink-500">Område</p>
                      <p className="mt-1 truncate text-sm font-semibold text-ink-900">{renter.district}</p>
                    </Card>
                    <Card className="gap-0 py-0 rounded-xl border border-veil/10 bg-canvas px-3 py-2.5">
                      <p className="text-[10px] font-semibold text-ink-500">Storlek</p>
                      <p className="mt-1 truncate text-sm font-semibold text-ink-900">{matchCriteriaValue(renter, "Yta", renter.teamSize)}</p>
                    </Card>
                    <Card className="gap-0 py-0 rounded-xl border border-veil/10 bg-canvas px-3 py-2.5">
                      <p className="text-[10px] font-semibold text-ink-500">Budget</p>
                      <p className="mt-1 truncate text-sm font-semibold text-ink-900">{renter.budget}</p>
                    </Card>
                  </div>

                  <p className="mt-3 text-xs text-ink-500">Önskad inflytt: {moveInLabelForRenter(renter)}</p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-auto mt-4 w-full gap-1.5 py-2 text-xs"
                    onClick={() => sendToBroker(app, renter, matchedListing)}
                  >
                    <SendHorizontalIcon className="h-3.5 w-3.5" />
                    Skicka till mäklare
                  </Button>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="gap-0 py-0 rounded-xl border border-veil/10 bg-canvas px-4 py-10 text-center">
            <p className="font-semibold text-ink-900">Inga matchningar hittades för era nuvarande lokaler</p>
            <p className="mt-1 text-sm text-ink-500">Publicera fler annonser för att bredda matchningsunderlaget.</p>
          </Card>
        )}
      </Card>
    </div>
  );
}

function AdminActivityPage() {
  return (
    <Card className="gap-0 py-0 p-5 sm:p-6">

      <ul className="space-y-3">
        {activityItems.map((item, index) => {
          const Icon = activityIcon(item.type);
          const hasNext = index < activityItems.length - 1;
          return (
            <li key={item.id} className="relative pl-10">
              <span className="absolute left-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-veil/10 bg-control text-ink-700">
                <Icon className="h-4 w-4" />
              </span>
              {hasNext ? <span className="absolute left-[15px] top-8 h-[calc(100%+0.75rem)] w-px bg-veil/10" /> : null}
              <p className="text-sm font-semibold text-ink-800">{item.text}</p>
              <p className="mt-0.5 text-xs text-ink-500">{item.timestamp}</p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function EmptyCompanyAdminPage({ app, sectionKey }) {
  const companyName = companyNameForAdmin(app?.user);
  const title = SECTION_TITLES[sectionKey] || "Översikt";

  return (
    <div className="space-y-4">


      <Card className="gap-0 py-0 p-6 sm:p-8"><div className="flex flex-wrap items-center justify-end gap-2 border-b border-border p-4 sm:px-5"><Button type="button" variant="secondary" className="h-auto px-4 py-2" onClick={() => navigateTo("/app/admin/adminprofil")}>
            <PencilIcon className="mr-1.5 h-4 w-4" />
            Hantera adminprofil
          </Button></div>
        <div className="mx-auto max-w-[560px] py-8 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-veil/10 bg-control text-ink-700">
            <BuildingIcon className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-xl font-semibold text-ink-900">Inget innehåll ännu</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            Bolagets adminyta är tom tills ni skapar första annonsen, bjuder in mäklare eller får inkommande intresse.
          </p>
        </div>
      </Card>
    </div>
  );
}

function AdminOverview({ app }) {
  const now = useMemo(() => new Date(), []);
  const companyListings = ownedAdminListings(app);
  const adminStats = useMemo(() => buildAdminStats(app), [app?.listings, app?.leads, app?.companyBrokers, app?.adminCompany]);
  const greeting = useMemo(() => greetingForHour(now.getHours()), [now]);
  const dateLabel = useMemo(() => (
    new Intl.DateTimeFormat("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long"
    }).format(now)
  ), [now]);
  return (
    <div className="loa-overview space-y-10">


      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink-900">Statistik</h2>
        <Button type="button" variant="secondary" className="h-auto px-4 py-2" onClick={() => navigateTo("/app/admin/statistik")}>
          <BarChart3Icon className="mr-1.5 h-4 w-4" />
          Se all statistik
        </Button>
      </div>

      <KpiCardsSection showMatchLink cards={adminStats.cards} sparklineSeries={adminStats.sparklineSeries} />

      <section className="loa-overview-columns grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {hasChartSeriesData(adminStats.chartSeries) ? (
          <BarInteractive title="Visningar & förfrågningar" subtitle="Senaste period" datasets={adminStats.chartSeries} defaultRange="7d" />
        ) : (
          <NoDataPanel title="Visningar & förfrågningar" />
        )}
        {adminStats.distributionData.length > 0 ? (
          <TypeDistributionDonut title="Fördelning" subtitle="Typ av lokal" data={adminStats.distributionData} />
        ) : (
          <NoDataPanel title="Fördelning" />
        )}
      </section>

      <section className="loa-overview-columns grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="gap-0 py-0 overflow-hidden"><div className="flex flex-wrap items-center justify-end gap-2 border-b border-border p-4 sm:px-5"><Button type="button" variant="secondary" className="h-auto shrink-0 px-4 py-2" onClick={() => navigateTo("/app/admin/adminprofil")}>
                <PencilIcon className="mr-1.5 h-4 w-4" />
                Hantera adminprofil
              </Button>
<Button type="button" variant="secondary" className="h-auto w-fit justify-start px-3 py-2 text-sm" onClick={() => navigateTo("/app/admin/maklare")}>
                <UsersGroupIcon className="mr-2 h-4 w-4" />
                Bjud in mäklare
              </Button>
<Button type="button" variant="secondary" className="h-auto w-fit justify-start px-3 py-2 text-sm" onClick={() => navigateTo("/app/publish")}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Publicera annons
              </Button></div>
          <div className="border-b border-veil/10 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink-900">Senaste annonser</h2>
                <p className="mt-1 text-sm text-ink-600">Övervaka era pågående annonseringar</p>
              </div>

            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader className="bg-canvas text-[11px] text-ink-500">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4 py-3 sm:px-5">Annons</TableHead>
                  <TableHead className="px-4 py-3">Status</TableHead>
                  <TableHead className="px-4 py-3 text-right">Visningar</TableHead>
                  <TableHead className="px-4 py-3 text-right">Förfr.</TableHead>
                  <TableHead className="px-4 py-3 text-right sm:px-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyListings.map((item) => (
                  <TableRow key={item.id} className="border-t border-veil/10">
                    <TableCell className="whitespace-normal px-4 py-3.5 align-top sm:px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-11 w-16 shrink-0 rounded-lg border border-veil/10 object-cover"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink-900">{item.title}</p>
                          <p className="mt-1 text-xs text-ink-600">
                            {item.district} · {item.size} m² · {formatSek(item.priceMonthly)}/mån
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 align-top">
                      <Badge variant="outline" className={`h-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(item.status)}`}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right font-semibold text-ink-800">{item.views.toLocaleString("sv-SE")}</TableCell>
                    <TableCell className="px-4 py-3.5 text-right font-semibold text-ink-800">{item.inquiries}</TableCell>
                    <TableCell className="px-4 py-3.5 text-right sm:px-5">
                      <Button type="button" variant="ghost" size="icon" aria-label={`Visa ${item.title}`} onClick={() => navigateTo(`/app/listings/${encodeURIComponent(item.id)}`)} className="h-8 w-8 rounded-md text-ink-600 hover:bg-control">
                        <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {companyListings.length === 0 ? (
                  <TableRow className="border-t border-veil/10">
                    <TableCell className="px-4 py-8 text-center text-sm font-semibold text-ink-500 sm:px-5" colSpan={5}>
                      Ingen data
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between border-t border-veil/10 px-4 py-3 text-xs text-ink-500 sm:px-5">
            <span>Visar {companyListings.length} annonser</span>
            <Button type="button" variant="link" className="h-auto p-0 text-xs font-semibold text-strong" onClick={() => navigateTo("/app/admin/annonser")}>
              Visa alla
            </Button>
          </div>
        </Card>

        <Card className="gap-0 py-0 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-ink-900">Aktivitet</h2>
          <p className="mt-1 text-sm text-ink-600">Senaste händelserna</p>
          <ul className="mt-4 space-y-3">
            {activityItems.map((item, index) => {
              const Icon = activityIcon(item.type);
              const hasNext = index < activityItems.length - 1;
              return (
                <li key={item.id} className="relative pl-9">
                  <span className="absolute left-0 top-0 inline-flex h-7 w-7 items-center justify-center rounded-full border border-veil/10 bg-control text-ink-700">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {hasNext ? <span className="absolute left-[13px] top-7 h-[calc(100%+0.65rem)] w-px bg-veil/10" /> : null}
                  <p className="text-sm font-semibold text-ink-800">{item.text}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{item.timestamp}</p>
                </li>
              );
            })}
            {activityItems.length === 0 ? (
              <li className="loa-activity-empty">
                Ingen data
              </li>
            ) : null}
          </ul>
          <Button type="button" variant="secondary" className="h-auto mt-4 w-full py-2 text-xs" onClick={() => navigateTo("/app/admin/aktivitet")}>
            Se all aktivitet
          </Button>
        </Card>
      </section>

    </div>
  );
}

function AdminPlaceholder({ sectionKey }) {
  const title = SECTION_TITLES[sectionKey] || "Sektion";
  return (
    <Card className="gap-0 py-0 p-6 sm:p-8">

      <Card className="gap-0 py-0 mt-5 rounded-xl border border-veil/10 bg-canvas p-4 text-sm text-ink-700">
        Kommer snart.
      </Card>
    </Card>
  );
}

function AdminProspectsPage({ app }) {
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const companyListings = ownedAdminListings(app);
  const listingById = new Map(companyListings.map((listing) => [String(listing.id), listing]));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const { prospects: list } = await prospectsApi.listForCompany();
        if (!cancelled) setProspects(list);
      } catch (error) {
        if (!cancelled) setLoadError(error.message || "Kunde inte ladda prospekten.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filteredProspects = prospects.filter((prospect) => (statusFilter === "all" || prospect.status === statusFilter) && `${prospect.title} ${listingById.get(String(prospect.listingId))?.title || ""}`.toLocaleLowerCase("sv").includes(query.trim().toLocaleLowerCase("sv")));

  return (
    <div className="space-y-4">


      {loadError ? <div role="alert" className="text-sm text-rose-700">{loadError}<Button variant="link" onClick={() => setRefreshKey((value) => value + 1)}>Försök igen</Button></div> : null}
      <Card className="gap-0 py-0 overflow-hidden">
        <div className="border-b border-veil/10 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-ink-500">Prospekt</p>
              <p className="mt-1 text-sm text-ink-600">Skapande och redigering sker i respektive mäklares egen panel.</p>
            </div>
            <Badge variant="outline" className="h-auto rounded-full bg-veil/10 px-2 py-0.5 text-[11px] font-semibold text-ink-700">{prospects.length} prospekt</Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-veil/10 p-4 sm:px-5">
          <Input aria-label="Sök prospekt" className="w-full sm:max-w-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sök prospekt eller objekt..." />
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger aria-label="Prospektstatus"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alla statusar</SelectItem><SelectItem value="draft">Utkast</SelectItem><SelectItem value="published">Publicerad</SelectItem><SelectItem value="archived">Arkiverad</SelectItem></SelectContent></Select>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader className="bg-canvas text-[11px] text-ink-500">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 sm:px-5">Prospekt</TableHead>
                <TableHead className="px-4 py-3">Objekt</TableHead>
                <TableHead className="px-4 py-3">Status</TableHead>
                <TableHead className="px-4 py-3">Version</TableHead>
                <TableHead className="px-4 py-3 sm:px-5">Uppdaterad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProspects.map((prospect) => {
                const listing = listingById.get(String(prospect.listingId));
                return (
                  <TableRow key={prospect.id} className="border-t border-veil/10">
                    <TableCell className="whitespace-normal px-4 py-3.5 align-top sm:px-5">
                      <div className="flex items-center gap-3">
                        <ProspectIcon />
                        <span className="min-w-0">
                          <Button variant="link" className="h-auto max-w-full justify-start p-0 font-semibold" onClick={() => setSelectedProspect(prospect)}>{prospect.title}</Button>
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
                    <TableCell className="px-4 py-3.5 align-top text-xs font-semibold text-ink-500 sm:px-5">{formatDate(prospect.updatedAt)}</TableCell>
                  </TableRow>
                );
              })}
              {!loading && !loadError && filteredProspects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="whitespace-normal border-t border-veil/10 px-4 py-10 text-center sm:px-5">
                    <p className="font-semibold text-ink-900">Inga prospekt att visa</p>
                    <p className="mt-1 text-sm text-ink-500">Dina mäklare kan skapa prospekt från sina egna objekt.</p>
                  </TableCell>
                </TableRow>
              ) : null}
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="whitespace-normal border-t border-veil/10 px-4 py-10 text-center text-sm text-ink-600 sm:px-5">
                    Laddar prospekt...
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </Card>
      <Sheet open={Boolean(selectedProspect)} onOpenChange={(open) => { if (!open) setSelectedProspect(null); }}>
        <SheetContent className="admin-workspace data-[side=right]:w-full data-[side=right]:sm:max-w-xl gap-0 p-0">
          <SheetHeader className="border-b border-veil/10 p-6 pr-12"><SheetTitle className="text-xl">{selectedProspect?.title}</SheetTitle><SheetDescription>Prospektöversikt · Läsbehörighet</SheetDescription></SheetHeader>
          {selectedProspect ? <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
            <StatusPill status={selectedProspect.status} variant="prospect" />
            <dl className="grid grid-cols-2 gap-5 text-sm">
              <div><dt className="text-ink-500">Objekt</dt><dd className="mt-1 font-medium">{listingById.get(String(selectedProspect.listingId))?.title || "Objekt"}</dd></div>
              <div><dt className="text-ink-500">Version</dt><dd className="mt-1 font-medium">{selectedProspect.currentVersion ? `v${selectedProspect.currentVersion}` : "Utkast"}</dd></div>
              <div><dt className="text-ink-500">Uppdaterad</dt><dd className="mt-1 font-medium">{formatDate(selectedProspect.updatedAt)}</dd></div>
            </dl>
            {(selectedProspect.publishedSections || []).map((section) => <Card key={section.id} className="gap-2 p-4"><h3 className="font-semibold">{section.title}</h3><p className="whitespace-pre-wrap text-sm text-ink-700">{section.body}</p></Card>)}
            <p className="rounded-lg bg-canvas p-4 text-sm text-ink-500">Ansvarig mäklare redigerar och delar prospektet från sin panel.</p>
          </div> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function AdminPanelPage({ app, pathname: routePathname }) {
  // Profil, Adminprofil, Inställningar and Hjälp are a window over a page (the account window), not a page: the page is the one it
  // was opened from, and it stays in the shell behind the window.
  const account = parseAccountPath(routePathname, typeof window !== "undefined" ? window.location.hash : "", normalizeAppRole(app?.user?.role));
  const pathname = account ? accountBackgroundPath("/app/admin") : routePathname;
  const sectionKey = sectionFromPath(pathname);
  const currentSectionLabel = SECTION_TITLES[sectionKey] || "Översikt";
  const companyListings = ownedAdminListings(app);
  const assistantListings = useMemo(
    () => ownedAdminListingRecords(app),
    [app?.listings, app?.user?.id, app?.adminCompany?.id, app?.user?.profile?.companyId, app?.companyBrokers]
  );
  const notificationCount = countAdminNotifications(app);
  useEffect(() => {
    const legacy = pathname.match(/^\/app\/admin\/(sparade-objekt|sparade-sokningar)\/?$/);
    if (legacy) navigateTo(`/app/admin/profil#${legacy[1]}`, { replace: true });
  }, [pathname]);
  const hasCompanyProfile = Boolean(app?.adminCompany?.id || app?.user?.profile?.companyId || app?.user?.profile?.companyName || app?.user?.profile?.legalEntity);
  const shouldShowEmptyCompanyPage = !hasCompanyProfile && !["adminprofil", "hjalp", "installningar", "notifikationer", "maklare", "annonser", "prospekt", "assistent"].includes(sectionKey);

  return (
    <BrokerAssistantProvider panel="admin" userName={app?.user?.name} listings={assistantListings} leads={app?.leads}>
      <AdminPanelShell
        pathname={pathname}
        navItems={ADMIN_NAV_ITEMS}
        bottomNavItems={ADMIN_BOTTOM_NAV_ITEMS}
        sectionTitle={currentSectionLabel}
        onLogout={app?.logout}
        badges={{ annonser: companyListings.length, notifikationer: notificationCount }}
        fullBleedContent={sectionKey === "meddelanden" || sectionKey === "assistent"}
        hideAssistantLauncher={sectionKey === "assistent"}
        contentKey={shouldShowEmptyCompanyPage ? "empty-company" : sectionKey}
      >
        {shouldShowEmptyCompanyPage ? <EmptyCompanyAdminPage app={app} sectionKey={sectionKey} /> : null}
        {sectionKey === "assistent" ? <BrokerAssistantPage /> : null}
        {!shouldShowEmptyCompanyPage && sectionKey === "oversikt" ? <AdminOverview app={app} /> : null}
        {!shouldShowEmptyCompanyPage && sectionKey === "annonser" ? <AdminListingsPage listings={companyListings} /> : null}
        {!shouldShowEmptyCompanyPage && sectionKey === "leads" ? <AdminLeadMatchesPage app={app} /> : null}
        {!shouldShowEmptyCompanyPage && sectionKey === "prospekt" ? <AdminProspectsPage app={app} /> : null}
        {!shouldShowEmptyCompanyPage && sectionKey === "inkorg" ? <AdminInquiriesPage pathname={pathname} /> : null}
        {!shouldShowEmptyCompanyPage && sectionKey === "notifikationer" ? <AdminNotificationsPage app={app} /> : null}
        {!shouldShowEmptyCompanyPage && sectionKey === "maklare" ? <AdminBrokersPage app={app} /> : null}
        {!shouldShowEmptyCompanyPage && sectionKey === "statistik" ? <AdminStatistics app={app} /> : null}
        {!shouldShowEmptyCompanyPage && sectionKey === "aktivitet" ? <AdminActivityPage /> : null}
        {sectionKey === "meddelanden" ? <MessagesPage app={app} /> : null}
        {!shouldShowEmptyCompanyPage && sectionKey !== "oversikt" && sectionKey !== "annonser" && sectionKey !== "leads" && sectionKey !== "prospekt" && sectionKey !== "inkorg" && sectionKey !== "notifikationer" && sectionKey !== "maklare" && sectionKey !== "meddelanden" && sectionKey !== "profil" && sectionKey !== "adminprofil" && sectionKey !== "statistik" && sectionKey !== "aktivitet" && sectionKey !== "assistent" ? <AdminPlaceholder sectionKey={sectionKey} /> : null}
      </AdminPanelShell>
      {account ? <AccountWindow app={app} base={account.base} pageKey={account.page.key} /> : null}
    </BrokerAssistantProvider>
  );
}

export default AdminPanelPage;
