import { useEffect, useMemo, useRef, useState } from "react";
import { navigateTo, routeMatches } from "../../lib/router";
import { formatSek } from "../../lib/formatters";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import BarInteractive from "../../components/charts/bar-interactive";
import TypeDistributionDonut from "../../components/charts/type-distribution-donut";
import {
  ArrowUpIcon,
  BarChart3Icon,
  BellIcon,
  BuildingIcon,
  CalendarIcon,
  CheckBadgeIcon,
  ClockIcon,
  DownloadIcon,
  FilterIcon,
  HistoryIcon,
  InfoCircleIcon,
  LayoutDashboardIcon,
  LogoutIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PanelLeftIcon,
  PencilIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  SendHorizontalIcon,
  SettingsGearIcon,
  SparklesIcon,
  StarIcon,
  SupportIcon,
  SwitchHorizontalIcon,
  UsersGroupIcon,
  UserIcon,
  XIcon
} from "../../components/icons/UiIcons";

const ADMIN_NAV_ITEMS = [
  { key: "oversikt", label: "Översikt", path: "/app/admin", Icon: LayoutDashboardIcon },
  { key: "annonser", label: "Annonser", path: "/app/admin/annonser", Icon: BuildingIcon, badge: "24" },
  { key: "leads", label: "Leads & Matchningar", path: "/app/admin/leads", Icon: SparklesIcon },
  { key: "notifikationer", label: "Notifikationer", path: "/app/admin/notifikationer", Icon: BellIcon, badge: "3" },
  { key: "maklare", label: "Mäklare", path: "/app/admin/maklare", Icon: UsersGroupIcon },
  { key: "aktivitet", label: "Aktivitet", path: "/app/admin/aktivitet", Icon: HistoryIcon },
  { key: "statistik", label: "Statistik", path: "/app/admin/statistik", Icon: BarChart3Icon }
];

const SECTION_TITLES = {
  oversikt: "Översikt",
  adminprofil: "Adminprofil",
  annonser: "Annonser",
  leads: "Leads & Matchningar",
  inkorg: "Inkorg",
  notifikationer: "Notifikationer",
  maklare: "Mäklare",
  aktivitet: "Aktivitet",
  statistik: "Statistik",
  hjalp: "Hjälp",
  installningar: "Inställningar"
};

const COMPANY_TYPE_OPTIONS = [
  "Privat fastighetsbolag",
  "Kommunalt bostadsbolag",
  "Kommersiell förvaltare",
  "Bostadsutvecklare",
  "Blandad portfölj"
];

const PORTFOLIO_SIZE_OPTIONS = [
  "1-10 fastigheter",
  "11-50 fastigheter",
  "51-200 fastigheter",
  "200+ fastigheter"
];

const APPROVAL_FLOW_OPTIONS = [
  {
    key: "admin_approves_broker",
    title: "Admin godkänner varje mäklare",
    description: "Ni behåller full kontroll över vem som publicerar"
  },
  {
    key: "broker_auto_approved",
    title: "Mäklare aktiveras automatiskt",
    description: "Godkänd roll aktiveras direkt utan manuell granskning"
  }
];

const LISTING_MODERATION_OPTIONS = [
  {
    key: "broker_publishes_direct",
    title: "Mäklare publicerar direkt",
    description: "Automatisk granskning flaggar avvikelser"
  },
  {
    key: "admin_reviews_before_publish",
    title: "Bolagsadmin granskar innan publicering",
    description: "Mer kontroll, kräver aktiv admin-närvaro"
  }
];

const kpiCards = [
  { key: "active", label: "Aktiva annonser", value: "24", delta: "+3", deltaTone: "up", meta: "vs förra perioden", unit: "annonser" },
  { key: "views", label: "Visningar (30d)", value: "18 420", delta: "+12.4%", deltaTone: "up", meta: "vs förra perioden", unit: "visningar" },
  { key: "inquiries", label: "Förfrågningar", value: "142", delta: "+8", deltaTone: "up", meta: "vs förra perioden", unit: "förfrågningar" },
  { key: "matches", label: "Matchade hyresgäster", value: "37", delta: "+6", deltaTone: "up", meta: "vs förra perioden", unit: "matchningar" }
];

const kpiSparklineSeries = {
  active: [18, 19, 20, 21, 21, 22, 24],
  views: [12800, 13600, 14500, 15200, 16400, 17100, 18420],
  inquiries: [92, 105, 111, 118, 127, 134, 142],
  matches: [18, 21, 24, 28, 30, 34, 37]
};

const kpiAxisLabels = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

const chartSeries = {
  "7d": [
    { label: "Mån", views: 420, inquiries: 24 },
    { label: "Tis", views: 560, inquiries: 28 },
    { label: "Ons", views: 490, inquiries: 23 },
    { label: "Tor", views: 720, inquiries: 31 },
    { label: "Fre", views: 680, inquiries: 29 },
    { label: "Lör", views: 330, inquiries: 18 },
    { label: "Sön", views: 290, inquiries: 16 }
  ],
  "30d": [
    { label: "v1", views: 1260, inquiries: 62 },
    { label: "v2", views: 1490, inquiries: 71 },
    { label: "v3", views: 1380, inquiries: 64 },
    { label: "v4", views: 1720, inquiries: 82 },
    { label: "v5", views: 1830, inquiries: 88 },
    { label: "v6", views: 1610, inquiries: 75 },
    { label: "v7", views: 1520, inquiries: 69 }
  ],
  "90d": [
    { label: "jan", views: 5120, inquiries: 244 },
    { label: "feb", views: 5480, inquiries: 261 },
    { label: "mar", views: 6010, inquiries: 289 },
    { label: "apr", views: 6420, inquiries: 304 },
    { label: "maj", views: 6240, inquiries: 296 },
    { label: "jun", views: 6670, inquiries: 318 },
    { label: "jul", views: 6510, inquiries: 309 }
  ]
};

const distributionData = [
  { key: "kontor", name: "Kontor", value: 42, color: "#0f1930" },
  { key: "butik", name: "Butik", value: 28, color: "#476a99" },
  { key: "lager", name: "Lager", value: 18, color: "#7ea1cc" },
  { key: "ovrigt", name: "Övrigt", value: 12, color: "#cad9ec" }
];

const districtPerformance = [
  { district: "Södermalm", views: 3240, inquiries: 44 },
  { district: "Östermalm", views: 2680, inquiries: 33 },
  { district: "Kista", views: 1420, inquiries: 19 },
  { district: "Vasastan", views: 2980, inquiries: 38 },
  { district: "Norrmalm", views: 3560, inquiries: 52 }
];

const funnelData = [
  { stage: "Visningar", count: 18420, conversion: 100 },
  { stage: "Matchade hyresgäster", count: 2140, conversion: 11.6 },
  { stage: "Kontaktförfrågningar", count: 742, conversion: 4.0 },
  { stage: "Bokade visningar", count: 206, conversion: 1.1 },
  { stage: "Signerat avtal", count: 41, conversion: 0.2 }
];

const brokerPerformanceRadar = [
  { metric: "Svarstid", anna: 88, erik: 71, maria: 92 },
  { metric: "Förfrågningar", anna: 82, erik: 69, maria: 77 },
  { metric: "Visningar", anna: 76, erik: 84, maria: 73 },
  { metric: "Matchgrad", anna: 81, erik: 74, maria: 87 },
  { metric: "Publiceringstakt", anna: 79, erik: 66, maria: 83 }
];

const segmentTrend = [
  { month: "Jan", kontor: 31, butik: 22, lager: 16 },
  { month: "Feb", kontor: 35, butik: 24, lager: 18 },
  { month: "Mar", kontor: 37, butik: 26, lager: 17 },
  { month: "Apr", kontor: 40, butik: 27, lager: 19 },
  { month: "Maj", kontor: 38, butik: 29, lager: 20 },
  { month: "Jun", kontor: 42, butik: 30, lager: 21 }
];

const weeklyHeatmap = [
  { day: "Mån", slots: [42, 56, 61, 48] },
  { day: "Tis", slots: [45, 62, 68, 51] },
  { day: "Ons", slots: [39, 58, 64, 49] },
  { day: "Tor", slots: [52, 70, 76, 57] },
  { day: "Fre", slots: [49, 66, 72, 54] },
  { day: "Lör", slots: [24, 32, 36, 28] },
  { day: "Sön", slots: [19, 25, 29, 22] }
];

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

const extendedStatCards = [
  {
    id: "occupancy",
    label: "Beläggningsgrad",
    value: "86%",
    delta: "+2.1%",
    meta: "mot förra månaden",
    visualType: "gauge",
    visual: { value: 86, target: 90, footer: "Mål 90%" }
  },
  {
    id: "vacancy_days",
    label: "Vakansdagar",
    value: "19",
    delta: "-3 dagar",
    meta: "snitt per annons",
    visualType: "sparkline",
    visual: { data: [29, 27, 25, 24, 23, 21, 19], labels: ["v1", "v7"], direction: "down" }
  },
  {
    id: "cost_per_inquiry",
    label: "Kostnad per förfrågan",
    value: "148 kr",
    delta: "-12 kr",
    meta: "marknadseffektivitet",
    visualType: "sparkline",
    visual: { data: [176, 171, 168, 162, 159, 154, 148], labels: ["jan", "nu"], direction: "down" }
  },
  {
    id: "lead_to_viewing",
    label: "Lead → Visning",
    value: "27.8%",
    delta: "+1.9%",
    meta: "konverteringsgrad",
    visualType: "funnel",
    visual: {
      steps: [
        { label: "Lead", value: 100 },
        { label: "Kval", value: 61 },
        { label: "Visning", value: 27.8 }
      ]
    }
  },
  {
    id: "viewing_to_deal",
    label: "Visning → Avtal",
    value: "19.9%",
    delta: "+0.8%",
    meta: "stängningsgrad",
    visualType: "funnel",
    visual: {
      steps: [
        { label: "Visning", value: 100 },
        { label: "LOI", value: 46 },
        { label: "Avtal", value: 19.9 }
      ]
    }
  },
  {
    id: "avg_rent_sqm",
    label: "Genomsnittlig hyra / m²",
    value: "3 420 kr",
    delta: "+4.5%",
    meta: "årstakt",
    visualType: "bars",
    visual: {
      items: [
        { label: "CBD", value: 92 },
        { label: "Innerstad", value: 78, active: true },
        { label: "Närförort", value: 58 },
        { label: "Ytterläge", value: 41 }
      ]
    }
  },
  {
    id: "revenue_potential",
    label: "Intäktspotential",
    value: "2.1 Mkr/mån",
    delta: "+0.2 Mkr",
    meta: "aktiva annonser",
    visualType: "sparkline",
    visual: { data: [1.5, 1.6, 1.65, 1.78, 1.84, 1.97, 2.1], labels: ["jan", "jul"], direction: "up" }
  },
  {
    id: "time_to_publish",
    label: "Tid till publicering",
    value: "1.8 dagar",
    delta: "-0.4 dagar",
    meta: "från utkast till live",
    visualType: "bars",
    visual: {
      items: [
        { label: "Utkast", value: 100 },
        { label: "Media", value: 74 },
        { label: "QC", value: 38 },
        { label: "Live", value: 18, active: true }
      ]
    }
  },
  {
    id: "verified_inquiries",
    label: "Verifierade förfrågningar",
    value: "73%",
    delta: "+5%",
    meta: "andel av totalen",
    visualType: "gauge",
    visual: { value: 73, target: 80, footer: "27% behöver manuell granskning" }
  },
  {
    id: "response_24h",
    label: "Svar inom 24h",
    value: "91%",
    delta: "+4%",
    meta: "SLA-uppfyllnad",
    visualType: "gauge",
    visual: { value: 91, target: 95, footer: "SLA 95%" }
  },
  {
    id: "viewing_reject_rate",
    label: "Avvisningsgrad visningar",
    value: "12%",
    delta: "-2%",
    meta: "kvalitetsutfall",
    visualType: "gauge",
    visual: { value: 12, target: 10, inverse: true, footer: "Lägre är bättre" }
  },
  {
    id: "top_district",
    label: "Toppområde denna månad",
    value: "Norrmalm",
    delta: "+18%",
    meta: "högst efterfrågan",
    visualType: "leaderboard",
    visual: {
      items: [
        { label: "Norrmalm", value: 100, active: true },
        { label: "Södermalm", value: 86 },
        { label: "Vasastan", value: 74 },
        { label: "Östermalm", value: 61 }
      ]
    }
  }
];

const activeListings = [
  {
    id: "adm-listing-1",
    title: "Kontorslokal Södermalm",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=240&h=160&q=80",
    district: "Södermalm",
    size: 248,
    priceMonthly: 48500,
    status: "Aktiv",
    views: 1240,
    inquiries: 18
  },
  {
    id: "adm-listing-2",
    title: "Butikslokal Östermalm",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=240&h=160&q=80",
    district: "Östermalm",
    size: 95,
    priceMonthly: 32000,
    status: "Aktiv",
    views: 890,
    inquiries: 11
  },
  {
    id: "adm-listing-3",
    title: "Lagerlokal Kista",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=240&h=160&q=80",
    district: "Kista",
    size: 520,
    priceMonthly: 62000,
    status: "Väntande",
    views: 340,
    inquiries: 4
  },
  {
    id: "adm-listing-4",
    title: "Showroom Vasastan",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=240&h=160&q=80",
    district: "Vasastan",
    size: 180,
    priceMonthly: 54000,
    status: "Aktiv",
    views: 1580,
    inquiries: 26
  },
  {
    id: "adm-listing-5",
    title: "Kontor Norrmalm",
    image: "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=240&h=160&q=80",
    district: "Norrmalm",
    size: 312,
    priceMonthly: 72000,
    status: "Utkast",
    views: 0,
    inquiries: 0
  }
];

const adminNotifications = [
  {
    id: "admin-notification-1",
    title: "Ny förfrågan på Kontorslokal Södermalm",
    body: "En ny hyresgäst har skickat in en förfrågan och väntar på återkoppling från teamet.",
    time: "12 min sedan",
    tone: "new"
  },
  {
    id: "admin-notification-2",
    title: "Showroom Vasastan publicerad",
    body: "Annonsen är nu live och har börjat samla visningar i sökflödet.",
    time: "58 min sedan",
    tone: "live"
  },
  {
    id: "admin-notification-3",
    title: "Anna Lind svarade på 6 förfrågningar",
    body: "Mäklarteamet har hög aktivitet idag. Sex förfrågningar markerades som hanterade.",
    time: "3h sedan",
    tone: "activity"
  }
];

const activityItems = [
  { id: "a1", type: "inquiry", text: "Ny förfrågan på Kontorslokal Södermalm", timestamp: "12 min sedan" },
  { id: "a2", type: "views", text: "48 nya visningar senaste timmen", timestamp: "1h sedan" },
  { id: "a3", type: "listing", text: "Showroom Vasastan publicerad", timestamp: "3h sedan" },
  { id: "a4", type: "team", text: "Anna Lind svarade på 6 förfrågningar", timestamp: "5h sedan" }
];

const brokerTeam = [
  { id: "b1", name: "Anna Lind", email: "anna@nordicestate.se", initials: "A", listings: 14, inquiries: 48, response: "2h" },
  { id: "b2", name: "Erik Ström", email: "erik@nordicestate.se", initials: "E", listings: 9, inquiries: 31, response: "4h" },
  { id: "b3", name: "Maria Holm", email: "maria@nordicestate.se", initials: "M", listings: 11, inquiries: 42, response: "1h" }
];

const matchedRenters = [
  {
    id: "r1",
    name: "Elin Andersson",
    company: "Nordic Product Studio AB",
    initials: "EA",
    district: "Södermalm",
    teamSize: "18 personer",
    budget: "52 000 kr/mån",
    preferredType: "Kontor",
    matchListingId: "adm-listing-1",
    score: 94,
    matchCriteria: [
      { label: "Lokaltyp", value: "Kontor", status: "match" },
      { label: "Område", value: "Södermalm", status: "match" },
      { label: "Yta", value: "230-280 m²", status: "match" },
      { label: "Budget", value: "upp till 52 000 kr/mån", status: "match" }
    ]
  },
  {
    id: "r2",
    name: "Johan Berg",
    company: "Urban Retail Group",
    initials: "JB",
    district: "Östermalm",
    teamSize: "7 personer",
    budget: "35 000 kr/mån",
    preferredType: "Butik",
    matchListingId: "adm-listing-2",
    score: 89,
    matchCriteria: [
      { label: "Lokaltyp", value: "Butik", status: "match" },
      { label: "Område", value: "Östermalm", status: "match" },
      { label: "Yta", value: "90-120 m²", status: "match" },
      { label: "Budget", value: "upp till 35 000 kr/mån", status: "partial" }
    ]
  },
  {
    id: "r3",
    name: "Sara Ekholm",
    company: "Logistikpartner Sverige",
    initials: "SE",
    district: "Kista",
    teamSize: "24 personer",
    budget: "70 000 kr/mån",
    preferredType: "Lager",
    matchListingId: "adm-listing-3",
    score: 86,
    matchCriteria: [
      { label: "Lokaltyp", value: "Lager", status: "match" },
      { label: "Område", value: "Kista", status: "match" },
      { label: "Yta", value: "450-600 m²", status: "partial" },
      { label: "Budget", value: "upp till 70 000 kr/mån", status: "match" }
    ]
  }
];

const adminInquiryThreads = [
  {
    id: "iq-1",
    renterId: "r1",
    listingId: "adm-listing-1",
    status: "Ny",
    priority: "Hög",
    receivedAt: "12 min sedan",
    assignedBroker: "Anna Lind",
    unreadCount: 2,
    stage: "Visning att boka",
    messages: [
      {
        id: "iq-1-m1",
        sender: "renter",
        text: "Hej! Lokalen på Södermalm ser väldigt rätt ut för vårt team. Vi vill gärna boka en visning nästa vecka, helst tisdag förmiddag om det går.",
        timestamp: "09:12"
      },
      {
        id: "iq-1-m2",
        sender: "renter",
        text: "Vi är 18 personer och behöver kunna flytta in redan i juni. Finns det möjlighet att ta en snabb digital avstämning innan vi bokar in platsbesök?",
        timestamp: "09:18"
      }
    ]
  },
  {
    id: "iq-2",
    renterId: "r2",
    listingId: "adm-listing-2",
    status: "Pågående",
    priority: "Medel",
    receivedAt: "1h sedan",
    assignedBroker: "Erik Ström",
    unreadCount: 0,
    stage: "Dokumentation",
    messages: [
      {
        id: "iq-2-m1",
        sender: "renter",
        text: "Hej, butiken på Östermalm är intressant. Kan ni skicka planritning och lite mer info om skyltläge och bindningstid?",
        timestamp: "13:06"
      },
      {
        id: "iq-2-m2",
        sender: "admin",
        text: "Absolut. Jag plockar fram planritning och villkor från förvaltaren nu. Jag återkommer inom kort med underlaget.",
        timestamp: "13:24"
      },
      {
        id: "iq-2-m3",
        sender: "renter",
        text: "Perfekt. Om ni även har ungefärlig driftkostnad per månad vore det hjälpsamt för vårt beslutsunderlag.",
        timestamp: "13:41"
      }
    ]
  },
  {
    id: "iq-3",
    renterId: "r3",
    listingId: "adm-listing-3",
    status: "Besvarad",
    priority: "Låg",
    receivedAt: "3h sedan",
    assignedBroker: "Maria Holm",
    unreadCount: 0,
    stage: "Timing att kvalificera",
    messages: [
      {
        id: "iq-3-m1",
        sender: "renter",
        text: "Lokalen i Kista matchar oss bra storleksmässigt. Intresse finns, men vi behöver inflyttning först i september. Är det möjligt att hålla dialogen varm tills dess?",
        timestamp: "10:02"
      },
      {
        id: "iq-3-m2",
        sender: "admin",
        text: "Det borde vara möjligt. Jag behöver bara stämma tillgänglighet och om nuvarande hyresgäst lämnar enligt plan innan jag kan lova något.",
        timestamp: "10:26"
      }
    ]
  },
  {
    id: "iq-4",
    renterId: "r1",
    listingId: "adm-listing-4",
    status: "Pågående",
    priority: "Hög",
    receivedAt: "5h sedan",
    assignedBroker: "Anna Lind",
    unreadCount: 1,
    stage: "Krav att klargöra",
    messages: [
      {
        id: "iq-4-m1",
        sender: "renter",
        text: "Showroomet i Vasastan känns relevant för oss. Hur ser det ut med lastintag, parkering för kunder och möjlighet att göra mindre anpassningar i entrén?",
        timestamp: "08:10"
      },
      {
        id: "iq-4-m2",
        sender: "admin",
        text: "Bra frågor. Jag har bekräftat att mindre anpassningar brukar gå att godkänna, men jag inväntar exakt besked om lastintag och kundparkering.",
        timestamp: "08:42"
      },
      {
        id: "iq-4-m3",
        sender: "renter",
        text: "Toppen. Skicka gärna exempel på tidigare anpassningar om ni har, så kan vi avgöra om lokalen är värd ett nästa möte.",
        timestamp: "08:57"
      }
    ]
  }
];

function sectionFromPath(pathname) {
  const match = pathname.match(/^\/(?:app\/)?admin\/([^/?#]+)/);
  const key = match?.[1] || "oversikt";
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

function deltaClass(tone) {
  if (tone === "up") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (tone === "down") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-black/10 bg-[#f7f7f7] text-ink-700";
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

function buildAdminLeadRows() {
  // Intended real source: interaction events for inquiries, favorites, and repeated listing visits.
  // Current demo data has explicit inquiry threads only, so leads are hydrated from those threads.
  return adminInquiryThreads
    .map((inquiry, index) => {
      const renter = matchedRenters.find((item) => item.id === inquiry.renterId);
      const listing = activeListings.find((item) => item.id === inquiry.listingId);
      if (!renter || !listing) return null;
      return {
        id: inquiry.id,
        inquiryId: inquiry.id,
        renter,
        listing,
        interest: "Förfrågan",
        score: renter.score,
        time: inquiry.receivedAt,
        isUnread: inquiry.unreadCount > 0 || inquiry.status === "Ny",
        sortOrder: index
      };
    })
    .filter(Boolean)
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

  sendToBroker(app, lead.renter, lead.listing);
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

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((value, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");
  const areaPoints = `0,100 ${points} 100,100`;
  const stroke = direction === "down" ? "#0f766e" : "#0f1930";
  const fill = direction === "down" ? "rgba(15,118,110,0.16)" : "rgba(15,25,48,0.14)";

  return (
    <div className="rounded-2xl border border-black/5 bg-[#f7fafb] px-3 py-2.5">
      <div className="h-16">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          <polyline points={areaPoints} fill={fill} stroke="none" />
          <polyline
            points={points}
            fill="none"
            stroke={stroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
        <span>{labels[0] || "start"}</span>
        <span>{labels[1] || "nu"}</span>
      </div>
    </div>
  );
}

function ExtendedMetricGauge({ value = 0, target, inverse = false, footer }) {
  const normalized = Math.max(0, Math.min(value, 100));
  const targetValue = typeof target === "number" ? Math.max(0, Math.min(target, 100)) : null;
  const fillWidth = inverse ? 100 - normalized : normalized;

  return (
    <div className="rounded-2xl border border-black/5 bg-[#f7fafb] px-3 py-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
            {inverse ? "Risknivå" : "Måluppfyllnad"}
          </p>
          <p className="mt-1 text-2xl font-semibold leading-none text-[#0f1930]">{normalized}%</p>
        </div>
        {targetValue !== null ? (
          <div className="rounded-full border border-black/10 bg-[#fffffe] px-2 py-1 text-[10px] font-semibold text-ink-600">
            mål {targetValue}%
          </div>
        ) : null}
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#dde7eb]">
        <div
          className={`h-full rounded-full ${inverse ? "bg-[#0f766e]" : "bg-[#0f1930]"}`}
          style={{ width: `${fillWidth}%` }}
        />
      </div>
      {footer ? <p className="mt-2 text-[11px] text-ink-500">{footer}</p> : null}
    </div>
  );
}

function ExtendedMetricFunnel({ steps = [] }) {
  if (!Array.isArray(steps) || steps.length === 0) return null;

  return (
    <div className="space-y-2 rounded-2xl border border-black/5 bg-[#f7fafb] px-3 py-3">
      {steps.map((step, index) => (
        <div key={step.label}>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-ink-700">{step.label}</span>
            <span className="text-ink-500">{step.value}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#dde7eb]">
            <div
              className="h-full rounded-full bg-[#0f1930]"
              style={{
                width: `${Math.max(step.value, 12)}%`,
                opacity: 1 - index * 0.18
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ExtendedMetricBars({ items = [], compact = false }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className={`rounded-2xl border border-black/5 bg-[#f7fafb] px-3 ${compact ? "py-2.5" : "py-3"}`}>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className={`font-semibold ${item.active ? "text-[#0f1930]" : "text-ink-600"}`}>{item.label}</span>
              <span className="text-ink-400">{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#dde7eb]">
              <div
                className={`h-full rounded-full ${item.active ? "bg-[#0f1930]" : "bg-[#7ea1cc]"}`}
                style={{ width: `${Math.max(item.value, 10)}%`, opacity: item.active ? 1 : 0.8 }}
              />
            </div>
          </div>
        ))}
      </div>
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
    <article className="rounded-[28px] border border-black/10 bg-[#fffffe] p-4 shadow-[0_12px_30px_rgba(15,25,48,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-ink-600">{item.label}</p>
          <p className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#0f1930]">{item.value}</p>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          {item.delta}
        </span>
      </div>
      <p className="mt-2 text-[11px] text-ink-500">{item.meta}</p>
      <div className="mt-4">{visual}</div>
    </article>
  );
}

function KpiCardsSection({ showMatchLink = false } = {}) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {kpiCards.map((card) => {
        if (card.key === "matches") {
          return (
            <article key="upgrade" className="surface p-4">
              <div className="flex h-full flex-col justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Uppgradera</p>
                  <h2 className="mt-2 text-lg font-semibold leading-tight text-[#0f1930]">
                    <span className="w-fit rounded-xl bg-[#f3d571] px-2 py-1 text-[#352922]">
                      Lokalflöde Business+
                    </span>
                  </h2>
                  <p className="mt-2 text-xs text-ink-600">Avancerad analys, API-tillgång och prioriterad support.</p>
                </div>
                <button type="button" className="btn-secondary w-fit px-4">
                  Se planer
                </button>
              </div>
            </article>
          );
        }

        const series = (kpiSparklineSeries[card.key] || []).map((value, index) => ({
          x: kpiAxisLabels[index] || `${index + 1}`,
          y: value
        }));
        return (
          <article key={card.key} className="surface p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-ink-600">{card.label}</p>
              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${deltaClass(card.deltaTone)}`}>
                {card.delta}
              </span>
            </div>
            <p className="mt-3 text-[30px] font-semibold leading-none text-[#0f1930]">{card.value}</p>
            {showMatchLink && card.key === "matches" ? (
              <button
                type="button"
                className="mt-2 min-h-0 p-0 text-xs font-semibold text-[#0f1930]"
                onClick={() => navigateTo("/app/admin/leads#matchningar")}
              >
                ↗ Visa alla matchningar
              </button>
            ) : null}
            <p className="mt-2 text-xs text-ink-500">{card.meta}</p>
            <div className="mt-3 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`kpi-gradient-${card.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f1930" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#0f1930" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="y"
                    stroke="#0f1930"
                    strokeWidth={1.7}
                    fill={`url(#kpi-gradient-${card.key})`}
                    fillOpacity={1}
                  />
                  <Tooltip
                    cursor={{ stroke: "#0f1930", strokeOpacity: 0.18, strokeWidth: 1 }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid rgba(15,25,48,0.12)",
                      background: "#fff",
                      boxShadow: "0 8px 24px rgba(15,25,48,0.10)"
                    }}
                    labelFormatter={(label) => `X: ${label}`}
                    formatter={(value) => [`Y: ${Number(value).toLocaleString("sv-SE")} ${card.unit}`, ""]}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function activityIcon(type) {
  if (type === "inquiry") return MessageSquareIcon;
  if (type === "views") return BarChart3Icon;
  if (type === "listing") return BuildingIcon;
  return UsersGroupIcon;
}

function WeeklyActivityHeatmap() {
  const labels = ["06-10", "10-14", "14-18", "18-22"];
  const values = weeklyHeatmap.flatMap((row) => row.slots);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  const heatmapPalette = [
    { bg: "#cad9ec", text: "#0f1930", border: "rgba(202, 217, 236, 0.9)" },
    { bg: "#7ea1cc", text: "#0f1930", border: "rgba(126, 161, 204, 0.9)" },
    { bg: "#476a99", text: "#ffffff", border: "rgba(71, 106, 153, 0.95)" },
    { bg: "#0f1930", text: "#ffffff", border: "rgba(15, 25, 48, 0.95)" }
  ];

  function heatmapCellStyle(value) {
    const intensity = (value - minValue) / range;
    const paletteIndex = Math.min(
      heatmapPalette.length - 1,
      Math.floor(intensity * heatmapPalette.length)
    );
    const swatch = heatmapPalette[paletteIndex];
    return {
      backgroundColor: swatch.bg,
      color: swatch.text,
      borderColor: swatch.border
    };
  }

  return (
    <article className="surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink-900">Veckoaktivitet</h3>
          <p className="mt-1 text-sm text-ink-600">Visningsintensitet per veckodag och tidsfönster</p>
        </div>
        <div className="rounded-full border border-black/10 bg-[#fbfcfe] px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">Låg</span>
            <div className="flex items-center gap-1">
              {heatmapPalette.map((swatch, step) => {
                return (
                  <span
                    key={step}
                    className="h-2.5 w-7 rounded-full border"
                    style={{ backgroundColor: swatch.bg, borderColor: swatch.border }}
                  />
                );
              })}
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">Hög</span>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="ml-14 grid grid-cols-4 gap-2 text-[11px] font-semibold text-ink-500">
          {labels.map((label) => <span key={label}>{label}</span>)}
        </div>
        {weeklyHeatmap.map((row) => (
          <div key={row.day} className="grid grid-cols-[44px_1fr] items-center gap-2">
            <span className="text-xs font-semibold text-ink-600">{row.day}</span>
            <div className="grid grid-cols-4 gap-2">
              {row.slots.map((value, index) => (
                <div
                  key={`${row.day}-${index}`}
                  className="h-8 rounded-lg border text-center text-[11px] font-semibold leading-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                  style={heatmapCellStyle(value)}
                  title={`${row.day} ${labels[index]}: ${value}`}
                >
                  {value}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function AdminSidebar({ pathname, onNavigate, onLogout }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
        <nav className="space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = item.key === "oversikt"
              ? pathname === "/app/admin" || pathname === "/app/admin/"
              : routeMatches(pathname, item.path);
            return (
              <button
                key={item.key}
                type="button"
                className={`menu-hover-row w-full px-3 py-2.5 text-left text-sm font-semibold transition ${
                  active ? "bg-[#0f1930] text-white" : "text-ink-700 hover:bg-black/5"
                }`}
                onClick={() => onNavigate(item.path)}
              >
                <span className="flex items-center gap-2">
                  <item.Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge ? (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? "bg-[#fffffe]/20 text-white" : "bg-black/10 text-ink-700"}`}>
                      {item.badge}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 pt-0 sm:px-6">
        <div className="mb-3 border-t border-black/10 pt-3">
          <div className="space-y-1">
            <button
              type="button"
              className={`menu-hover-row w-full px-3 py-2.5 text-left text-sm font-semibold transition ${
                routeMatches(pathname, "/app/admin/adminprofil")
                  ? "bg-[#0f1930] text-white"
                  : "text-ink-700 hover:bg-black/5"
              }`}
              onClick={() => onNavigate("/app/admin/adminprofil")}
            >
              <span className="flex items-center gap-2">
                <UserIcon className="h-[18px] w-[18px] shrink-0" />
                <span className="min-w-0 flex-1 truncate">Adminprofil</span>
              </span>
            </button>
            <button
              type="button"
              className={`menu-hover-row w-full px-3 py-2.5 text-left text-sm font-semibold transition ${
                routeMatches(pathname, "/app/admin/installningar")
                  ? "bg-[#0f1930] text-white"
                  : "text-ink-700 hover:bg-black/5"
              }`}
              onClick={() => onNavigate("/app/admin/installningar")}
            >
              <span className="flex items-center gap-2">
                <SettingsGearIcon className="h-[18px] w-[18px] shrink-0" />
                <span className="min-w-0 flex-1 truncate">Inställningar</span>
              </span>
            </button>
            <button
              type="button"
              className={`menu-hover-row w-full px-3 py-2.5 text-left text-sm font-semibold transition ${
                routeMatches(pathname, "/app/admin/hjalp")
                  ? "bg-[#0f1930] text-white"
                  : "text-ink-700 hover:bg-black/5"
              }`}
              onClick={() => onNavigate("/app/admin/hjalp")}
            >
              <span className="flex items-center gap-2">
                <SupportIcon className="h-[18px] w-[18px] shrink-0" />
                <span className="min-w-0 flex-1 truncate">Hjälp</span>
              </span>
            </button>
            <button
              type="button"
              className="menu-hover-row w-full px-3 py-2.5 text-left text-sm font-semibold text-ink-700 transition hover:bg-black/5"
              onClick={async () => {
                await onLogout?.();
                navigateTo("/", { replace: true });
              }}
            >
              <span className="flex items-center gap-2">
                <LogoutIcon className="h-[18px] w-[18px] shrink-0" />
                <span className="min-w-0 flex-1 truncate">Logga ut</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminListingsPage() {
  const [selectedStatus, setSelectedStatus] = useState("Alla");
  const statusFilters = ["Alla", "Aktiv", "Väntande", "Utkast"];
  const filteredListings = selectedStatus === "Alla"
    ? activeListings
    : activeListings.filter((item) => item.status === selectedStatus);

  return (
    <div className="space-y-4">
      <header className="surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Adminpanel</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink-900">Annonser</h1>
            <p className="mt-1 text-sm text-ink-600">Hantera aktiva annonser, utkast och publiceringar.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-secondary px-4">
              <FilterIcon className="mr-1.5 h-4 w-4" />
              Filter
            </button>
            <button type="button" className="btn-primary px-4">+ Ny annons</button>
          </div>
        </div>
      </header>

      <article className="surface overflow-hidden">
        <div className="border-b border-black/10 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">Alla annonser</h2>
              <p className="mt-1 text-sm text-ink-600">Överblick över status, visningar och förfrågningar.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {statusFilters.map((status) => {
                  const count = status === "Alla"
                    ? activeListings.length
                    : activeListings.filter((item) => item.status === status).length;
                  const isActive = selectedStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setSelectedStatus(status)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                        isActive
                          ? status === "Alla"
                            ? "border-[#0f1930] bg-[#0f1930] text-white"
                            : statusClass(status)
                          : "border-black/10 bg-[#fffffe] text-ink-700 hover:bg-black/5"
                      }`}
                    >
                      <span className="font-medium">{status === "Alla" ? "Alla" : status === "Aktiv" ? "Aktiva" : status}</span>
                      <span className="font-medium -ml-1">:</span>
                      <span className="font-semibold">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="inline-flex h-9 w-9 min-h-0 items-center justify-center rounded-full border border-black/10 bg-[#fffffe] text-ink-700">
                <FilterIcon className="h-4 w-4" />
              </button>
              <button type="button" className="inline-flex h-9 w-9 min-h-0 items-center justify-center rounded-full border border-black/10 bg-[#fffffe] text-ink-700">
                <SearchIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] table-fixed text-sm">
            <colgroup>
              <col className="w-[46%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[16%]" />
              <col className="w-[6%]" />
            </colgroup>
            <thead className="bg-[#fafafa] text-[11px] uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold sm:px-5">Annons</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Visningar</th>
                <th className="px-4 py-3 text-right font-semibold">Förfr.</th>
                <th className="px-4 py-3 text-left font-semibold">Ansvarig</th>
                <th className="px-4 py-3 text-right font-semibold sm:px-5" />
              </tr>
            </thead>
            <tbody>
              {filteredListings.map((item, index) => (
                <tr key={item.id} className="border-t border-black/10">
                  <td className="px-4 py-3.5 align-top sm:px-5">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.title} className="h-11 w-16 shrink-0 rounded-lg border border-black/10 object-cover" loading="lazy" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink-900">{item.title}</p>
                        <p className="mt-1 text-xs text-ink-600">{item.district} · {item.size} m² · {formatSek(item.priceMonthly)}/mån</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 align-top">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass(item.status)}`}>{item.status}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-ink-800">{item.views.toLocaleString("sv-SE")}</td>
                  <td className="px-4 py-3.5 text-right font-semibold text-ink-800">{item.inquiries}</td>
                  <td className="px-4 py-3.5 text-xs text-ink-700">
                    <span className="block truncate">{brokerTeam[index % brokerTeam.length]?.name}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right sm:px-5">
                    <button type="button" className="inline-flex h-8 w-8 min-h-0 items-center justify-center rounded-full border border-transparent text-ink-600 hover:border-black/10 hover:bg-[#fffffe]">
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredListings.length === 0 ? (
                <tr className="border-t border-black/10">
                  <td className="px-4 py-6 text-sm text-ink-500 sm:px-5" colSpan={6}>
                    Inga annonser med vald status.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

function notificationToneClass(tone) {
  if (tone === "new") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (tone === "live") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-black/10 bg-[#f7f7f7] text-ink-700";
}

function AdminNotificationsPage() {
  return (
    <div className="space-y-4">
      <header className="surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Adminpanel</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink-900">Notifikationer</h1>
            <p className="mt-1 text-sm text-ink-600">Samlad vy för nya händelser, publiceringar och teamaktivitet.</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-black/10 bg-[#f7f7f7] px-3 py-1 text-xs font-semibold text-ink-700">
            {adminNotifications.length} nya
          </span>
        </div>
      </header>

      <section className="surface p-4 sm:p-5">
        <div className="space-y-3">
          {adminNotifications.map((item) => (
            <article key={item.id} className="rounded-2xl border border-black/10 bg-[#fffffe] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${notificationToneClass(item.tone)}`}>
                      {item.tone === "new" ? "Ny" : item.tone === "live" ? "Live" : "Aktivitet"}
                    </span>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm text-ink-600">{item.body}</p>
                </div>
                <span className="text-xs font-medium text-ink-500">{item.time}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function AdminBrokersPage() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitedBrokers, setInvitedBrokers] = useState(() =>
    brokerTeam.map((broker) => ({
      id: broker.id,
      name: broker.name,
      email: broker.email,
      status: "Aktiv"
    }))
  );

  const inviteCode = useMemo(() => "BROKER-" + String(Math.floor(100000 + Math.random() * 900000)), []);

  return (
    <div className="space-y-4">
      <header className="surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Adminpanel</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink-900">Mäklare</h1>
            <p className="mt-1 text-sm text-ink-600">Teamöversikt med kapacitet, aktivitet och svarsfrekvens.</p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="surface p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-ink-900">Inbjudna mäklare</h2>
          <p className="mt-1 text-sm text-ink-600">Översikt över redan inbjudna och aktiva mäklare.</p>
          <div className="mt-4 space-y-3">
            {invitedBrokers.map((broker) => {
              const initials = String(broker.name || broker.email || "AA")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase();
              return (
                <div key={broker.id} className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-[#fffffe] px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e6eefc] text-xs font-semibold text-[#2d4f83]">
                      {initials}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink-900">{broker.name}</span>
                      <span className="block truncate text-xs text-ink-600">{broker.email}</span>
                    </span>
                  </div>
                  <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    {broker.status}
                  </span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="surface p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-ink-900">Bjud in mäklare</h2>
          <p className="mt-1 text-sm text-ink-600">Använd samma inbjudningsflöde som onboarding, anpassat för adminpanelen.</p>

          <div className="mt-4 rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Inbjudningskod</p>
            <p className="mt-2 text-[1.2rem] font-semibold text-[#0f1930]">{inviteCode}</p>
            <p className="mt-1 text-sm text-ink-500">Dela med mäklare via e-post eller internt system.</p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_150px]">
            <input
              className="field"
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="kollega@bolag.se"
            />
            <button
              type="button"
              className="btn-primary inline-flex w-full items-center justify-center px-4"
              onClick={() => {
                const email = String(inviteEmail || "").trim();
                if (!email) return;
                const name = email
                  .split("@")[0]
                  .split(/[._-]/)
                  .filter(Boolean)
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(" ");
                setInvitedBrokers((prev) => [
                  {
                    id: `invited-${Date.now()}`,
                    name: name || "Ny mäklare",
                    email,
                    status: "Väntar"
                  },
                  ...prev
                ]);
                setInviteEmail("");
              }}
            >
              + Bjud in
            </button>
          </div>
        </article>
      </section>

      <article className="surface p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-ink-900">Teamaktivitet</h2>
        <p className="mt-1 text-sm text-ink-600">Senaste händelser relaterade till mäklarteamet.</p>
        <ul className="mt-4 space-y-3">
          {activityItems.filter((item) => item.type === "team" || item.type === "inquiry").map((item, index, list) => {
            const Icon = activityIcon(item.type);
            const hasNext = index < list.length - 1;
            return (
              <li key={item.id} className="relative pl-10">
                <span className="absolute left-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-[#fffffe] text-ink-700">
                  <Icon className="h-4 w-4" />
                </span>
                {hasNext ? <span className="absolute left-[15px] top-8 h-[calc(100%+0.75rem)] w-px bg-black/10" /> : null}
                <p className="text-sm font-semibold text-ink-800">{item.text}</p>
                <p className="mt-0.5 text-xs text-ink-500">{item.timestamp}</p>
              </li>
            );
          })}
        </ul>
      </article>
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
      <header className="surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Adminpanel</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink-900">Förfrågningar</h1>
            <p className="mt-1 text-sm text-ink-600">Inkorg för inkommande dialoger. Välj konversation till vänster, svara i chatten och använd förslag som bygger på senaste hyresgästmeddelandet.</p>
          </div>
          <div className="rounded-2xl border border-[#d7e2ee] bg-[#f4f7fb] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#476a99]">Svar inom 24h</p>
            <p className="mt-1 text-xl font-semibold text-[#0f1930]">91%</p>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Nya</p>
          <p className="mt-2 text-2xl font-semibold text-[#0f1930]">{inquiries.filter((item) => item.status === "Ny").length}</p>
        </article>
        <article className="surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Pågående</p>
          <p className="mt-2 text-2xl font-semibold text-[#0f1930]">{inquiries.filter((item) => item.status === "Pågående").length}</p>
        </article>
        <article className="surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Hög prioritet</p>
          <p className="mt-2 text-2xl font-semibold text-[#0f1930]">{inquiries.filter((item) => item.priority === "Hög").length}</p>
        </article>
      </section>

      <section className="surface overflow-hidden">
        <div className="grid lg:h-[calc(100vh-11rem)] lg:grid-cols-[360px,minmax(0,1fr)] xl:grid-cols-[360px,minmax(0,1fr),336px]">
          <aside className="border-b border-black/10 bg-[#fbfcfd] lg:border-b-0 lg:border-r">
            <div className="border-b border-black/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">Inkorg</p>
              <h2 className="mt-1 text-lg font-semibold text-[#0f1930]">Konversationer</h2>
              <div className="mt-3">
                <label className="relative block">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    className="field !rounded-2xl !bg-[#fffffe] pl-9"
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
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setFilter(tab.key)}
                      className={`inline-flex min-h-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                        active
                          ? "bg-[#0f1930] text-white"
                          : "border border-black/10 bg-[#fffffe] text-ink-700 hover:border-[#bfd0e3]"
                      }`}
                    >
                      {tab.label}
                      <span className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] ${
                        active ? "bg-[#fffffe]/15 text-white" : "bg-[#eef3f8] text-[#476a99]"
                      }`}>
                        {tab.count}
                      </span>
                    </button>
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
                  <button
                    key={inquiry.id}
                    type="button"
                    onClick={() => selectInquiry(inquiry.id)}
                    className={`flex w-full items-start gap-3 border-b border-black/5 px-4 py-4 text-left transition ${
                      isActive ? "bg-[#fffffe] shadow-[inset_3px_0_0_#0f1930]" : "hover:bg-[#fffffe]/80"
                    }`}
                  >
                    <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      isActive ? "bg-[#0f1930] text-white" : "bg-[#dbe6f3] text-[#0f1930]"
                    }`}>
                      {renter.initials}
                    </span>
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
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${inquiryStatusClass(inquiry.status)}`}>{inquiry.status}</span>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${inquiryPriorityClass(inquiry.priority)}`}>{inquiry.priority}</span>
                        {inquiryNeedsResponse(inquiry) ? (
                          <span className="inline-flex rounded-full bg-[#eef3f8] px-2 py-0.5 text-[10px] font-semibold text-[#476a99]">
                            Svar krävs
                          </span>
                        ) : null}
                        {inquiry.unreadCount > 0 ? (
                          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#d96757] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {inquiry.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredInquiries.length === 0 ? (
                <div className="p-6 text-sm text-ink-600">
                  Ingen konversation matchar nuvarande filter.
                </div>
              ) : null}
            </div>
          </aside>

          <div className="min-w-0 border-b border-black/10 lg:border-b-0 xl:border-r">
            {activeInquiry && activeRenter && activeListing ? (
              <div className="flex h-full min-h-[760px] flex-col bg-[#fffffe]">
                <div className="border-b border-black/10 bg-[#fffffe] px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0f1930] text-sm font-semibold text-white">
                        {activeRenter.initials}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-semibold text-[#0f1930]">{activeRenter.name}</h3>
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${inquiryStatusClass(activeInquiry.status)}`}>{activeInquiry.status}</span>
                        </div>
                        <p className="truncate text-sm text-ink-600">{activeRenter.company} · {activeSummary}</p>
                        <p className="mt-1 text-xs text-ink-500">Ansvarig mäklare: {activeInquiry.assignedBroker} · Senast aktiv {activeInquiry.receivedAt}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-ink-500">
                      <span className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#fbfbfa] px-2.5 py-1">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {activeInquiry.stage}
                      </span>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 ${inquiryPriorityClass(activeInquiry.priority)}`}>
                        {activeInquiry.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-b border-black/10 bg-[#fbfcfd] px-4 py-3 sm:px-5 xl:hidden">
                  <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-[#d7e2ee] bg-[#fffffe] p-3">
                    <img src={activeListing.image} alt={activeListing.title} className="h-16 w-24 rounded-2xl border border-black/10 object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#476a99]">Matchad annons</p>
                      <p className="mt-1 truncate text-sm font-semibold text-[#0f1930]">{activeListing.title}</p>
                      <p className="mt-1 text-xs text-ink-600">{activeListing.district} · {activeListing.size} m² · {formatSek(activeListing.priceMonthly)}/mån</p>
                    </div>
                    <div className="rounded-2xl border border-[#d7e2ee] bg-[#f4f7fb] px-3 py-2 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Match</p>
                      <p className="mt-1 text-lg font-semibold text-[#0f1930]">{activeRenter.score}%</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#fffffe_0%,#fbfbfa_100%)] px-4 py-5 sm:px-5">
                  <div className="mx-auto max-w-3xl rounded-3xl border border-[#d9e4f1] bg-[#f4f7fb] p-4">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#476a99]">Dialogsammanfattning</p>
                        <p className="mt-1 text-sm font-semibold text-[#0f1930]">{activeSummary}</p>
                        <p className="mt-2 text-sm leading-relaxed text-ink-700">
                          {activeRenter.name.split(" ")[0]} söker {activeRenter.preferredType.toLowerCase()} i {activeRenter.district} för {activeRenter.teamSize.toLowerCase()} med budget {activeRenter.budget}.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[#c9d8e7] bg-[#fffffe] px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Nästa steg</p>
                        <p className="mt-1 text-sm font-semibold text-[#0f1930]">{activeInquiry.stage}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mx-auto max-w-3xl space-y-4">
                    {activeInquiry.messages.map((message) => {
                      const isAdmin = message.sender === "admin";
                      const isSystem = message.sender === "system";
                      return (
                        <div key={message.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                          <div className={`flex max-w-[85%] flex-col gap-1 ${isAdmin ? "items-end" : "items-start"}`}>
                            {!isSystem ? (
                              <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                                {isAdmin ? "Bolagsadmin" : activeRenter.name}
                              </span>
                            ) : null}
                            <div className={`rounded-[26px] px-4 py-3 text-sm leading-relaxed shadow-[0_12px_28px_rgba(15,25,48,0.06)] ${
                              isSystem
                                ? "border border-dashed border-black/10 bg-[#fafafa] text-ink-600"
                                : isAdmin
                                  ? "rounded-br-md bg-[#0f1930] text-white"
                                  : "rounded-bl-md border border-black/10 bg-[#fffffe] text-ink-800"
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

                <div className="border-t border-black/10 bg-[#fffffe] px-4 py-4 sm:px-5">
                  <div className="mx-auto max-w-3xl">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {quickPromptChips.map((prompt) => (
                        <button
                          key={prompt.id}
                          type="button"
                          onClick={() => applySuggestedPrompt(prompt.text)}
                          className="inline-flex min-h-0 items-center gap-2 rounded-full border border-[#cbd8e6] bg-[#f4f7fb] px-3 py-2 text-xs font-semibold text-[#0f1930] transition hover:bg-[#eaf1f8]"
                        >
                          <SparklesIcon className="h-3.5 w-3.5" />
                          {prompt.label}
                        </button>
                      ))}
                    </div>
                    <div className="rounded-[28px] border border-black/10 bg-[#fbfbfa] p-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <textarea
                          className="min-h-[104px] w-full resize-none rounded-[22px] border-0 bg-transparent px-3 py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-400"
                          placeholder="Skriv svar till hyresgästen..."
                          value={draftValue}
                          onChange={(event) => setDraftValue(activeInquiry.id, event.target.value)}
                        />
                        <button type="button" className="btn-primary min-h-0 rounded-[20px] px-4 py-3 text-sm" onClick={sendReply}>
                          Skicka svar
                        </button>
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

          <aside className="hidden bg-[#f8fafc] xl:block">
            {activeInquiry && activeRenter && activeListing ? (
              <div className="h-full space-y-4 overflow-y-auto p-4 sm:p-5">
                <article className="rounded-[28px] border border-[#d7e2ee] bg-[#fffffe] p-4">
                  <img src={activeListing.image} alt={activeListing.title} className="h-40 w-full rounded-[22px] border border-black/10 object-cover" loading="lazy" />
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#476a99]">Matchad annons</p>
                    <h3 className="mt-1 text-base font-semibold text-[#0f1930]">{activeListing.title}</h3>
                    <p className="mt-1 text-sm text-ink-600">{activeListing.district} · {activeListing.size} m² · {formatSek(activeListing.priceMonthly)}/mån</p>
                  </div>
                </article>

                <article className="rounded-[28px] border border-[#d7e2ee] bg-[#fffffe] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Hyresgäst</p>
                      <h3 className="mt-1 text-base font-semibold text-[#0f1930]">{activeRenter.name}</h3>
                    </div>
                    <div className="rounded-2xl border border-[#d7e2ee] bg-[#f4f7fb] px-3 py-2 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Match</p>
                      <p className="mt-1 text-lg font-semibold text-[#0f1930]">{activeRenter.score}%</p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2">
                    <div className="rounded-2xl border border-black/10 bg-[#fbfbfa] px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Bolag</p>
                      <p className="mt-1 text-sm font-semibold text-ink-900">{activeRenter.company}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl border border-black/10 bg-[#fbfbfa] px-3 py-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Team</p>
                        <p className="mt-1 text-sm font-semibold text-ink-900">{activeRenter.teamSize}</p>
                      </div>
                      <div className="rounded-2xl border border-black/10 bg-[#fbfbfa] px-3 py-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Budget</p>
                        <p className="mt-1 text-sm font-semibold text-ink-900">{activeRenter.budget}</p>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="rounded-[28px] border border-[#d7e2ee] bg-[#fffffe] p-4">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4 text-[#476a99]" />
                    <h3 className="text-sm font-semibold text-[#0f1930]">Föreslagna svar</h3>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-600">Direkt baserat på senaste hyresgästmeddelandet.</p>
                  <div className="mt-3 space-y-2.5">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt.id}
                        type="button"
                        onClick={() => applySuggestedPrompt(prompt.text)}
                        className="w-full rounded-3xl border border-black/10 bg-[#fbfbfa] p-3 text-left transition hover:border-[#bfd0e3] hover:bg-[#fffffe]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            prompt.kind === "question" ? "bg-[#e8f0fa] text-[#476a99]" : "bg-[#f3ebe6] text-[#9b5d3f]"
                          }`}>
                            {prompt.kind === "question" ? "Fråga" : "Svar"}
                          </span>
                          <span className="text-[11px] font-semibold text-ink-400">{prompt.label}</span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-ink-800">{prompt.text}</p>
                      </button>
                    ))}
                  </div>
                </article>

                <article className="rounded-[28px] border border-[#d7e2ee] bg-[#fffffe] p-4">
                  <h3 className="text-sm font-semibold text-[#0f1930]">Matchkriterier</h3>
                  <div className="mt-3 space-y-2">
                    {activeRenter.matchCriteria.map((item) => (
                      <div key={`${activeInquiry.id}-${item.label}`} className="flex items-start justify-between gap-3 rounded-2xl border border-black/10 bg-[#fbfbfa] px-3 py-2.5">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{item.label}</p>
                          <p className="mt-1 text-sm font-semibold text-ink-900">{item.value}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          item.status === "match" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {item.status === "match" ? "Match" : "Delvis"}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-[28px] border border-[#d7e2ee] bg-[#fffffe] p-4">
                  <h3 className="text-sm font-semibold text-[#0f1930]">Snabböversikt</h3>
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
      </section>
    </div>
  );
}

function AdminStatistics() {
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizeClosing, setCustomizeClosing] = useState(false);
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
    setCustomizeClosing(true);
    window.setTimeout(() => {
      setCustomizeOpen(false);
      setCustomizeClosing(false);
    }, 180);
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
        <nav className="sticky top-6 rounded-[28px] border border-black/10 bg-transparent p-3 shadow-[0_10px_24px_rgba(15,25,48,0.05)]">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Snabblänkar</p>
          <div className="space-y-0.5">
            {visibleSectionLinks.map((item) => {
              const active = item.id === activeSectionId;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`menu-hover-row block whitespace-nowrap rounded-2xl px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-[#0f1930] font-semibold text-white"
                      : "text-ink-600 hover:bg-black/5 hover:text-ink-900"
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
        <header className="surface px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Adminpanel</p>
              <h1 className="mt-1 text-2xl font-semibold text-ink-900">Statistik</h1>
              <p className="mt-1 text-sm text-ink-600">Översikt över trender, prestation och fördelning i portföljen.</p>
            </div>
            <button type="button" className="btn-secondary inline-flex items-center gap-1.5 px-4" onClick={() => setCustomizeOpen(true)}>
              <FilterIcon className="h-4 w-4" />
              Anpassa
            </button>
          </div>
        </header>

        {visibleModules.kpi ? (
          <section id="stats-kpi">
            <KpiCardsSection />
          </section>
        ) : null}

        {(visibleModules.trend || visibleModules.distribution) ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {visibleModules.trend ? (
            <div id="stats-trend">
              <BarInteractive title="Visningar & förfrågningar" subtitle="Senaste period" datasets={chartSeries} defaultRange="30d" />
            </div>
          ) : <div />}
          {visibleModules.distribution ? (
            <div id="stats-distribution">
              <TypeDistributionDonut title="Fördelning" subtitle="Typ av lokal" data={distributionData} />
            </div>
          ) : <div />}
          </section>
        ) : null}

        {(visibleModules.district || visibleModules.funnel) ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {visibleModules.district ? (
            <article id="stats-district" className="surface p-4 sm:p-5">
                <h3 className="text-lg font-semibold text-ink-900">Prestanda per område</h3>
                <p className="mt-1 text-sm text-ink-600">Visningar och förfrågningar för era starkaste delmarknader</p>
                <div className="mt-4 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={districtPerformance} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,25,48,0.12)" />
                      <XAxis dataKey="district" tick={{ fontSize: 11, fill: "#6f7a86" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#6f7a86" }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="views" name="Visningar" fill="#0f1930" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="inquiries" name="Förfrågningar" fill="#7ea1cc" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
          ) : <div />}

          {visibleModules.funnel ? (
            <article id="stats-funnel" className="surface p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-ink-900">Konverteringstratt</h3>
              <p className="mt-1 text-sm text-ink-600">Från visning till signerat avtal</p>
              <div className="mt-4 space-y-2.5">
                {funnelData.map((step) => (
                  <div key={step.stage}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink-700">{step.stage}</span>
                      <span className="text-ink-600">{step.count.toLocaleString("sv-SE")} · {step.conversion}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full border border-black/10 bg-[#eef2f8]">
                      <div className="h-full rounded-full bg-[#0f1930]" style={{ width: `${Math.max(step.conversion, 6)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ) : <div />}
          </section>
        ) : null}

        {(visibleModules.brokerRadar || visibleModules.heatmap) ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {visibleModules.brokerRadar ? (
            <article id="stats-broker-radar" className="surface p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-ink-900">Mäklarprestanda</h3>
              <p className="mt-1 text-sm text-ink-600">Jämförelse av teamets nyckelområden (index)</p>
              <div className="mt-4 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={brokerPerformanceRadar}>
                    <PolarGrid stroke="rgba(15,25,48,0.2)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#6f7a86" }} />
                    <PolarRadiusAxis tick={{ fontSize: 10, fill: "#6f7a86" }} />
                    <Tooltip />
                    <Legend />
                    <Radar name="Anna" dataKey="anna" stroke="#0f1930" fill="#0f1930" fillOpacity={0.2} />
                    <Radar name="Erik" dataKey="erik" stroke="#476a99" fill="#476a99" fillOpacity={0.16} />
                    <Radar name="Maria" dataKey="maria" stroke="#7ea1cc" fill="#7ea1cc" fillOpacity={0.16} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </article>
          ) : <div />}

          {visibleModules.heatmap ? (
            <div id="stats-heatmap">
              <WeeklyActivityHeatmap />
            </div>
          ) : <div />}
          </section>
        ) : null}

        {visibleModules.segment ? (
          <section id="stats-segment" className="surface p-4 sm:p-5">
          <h3 className="text-lg font-semibold text-ink-900">Trend per lokaltyp</h3>
          <p className="mt-1 text-sm text-ink-600">Utveckling av efterfrågan i respektive segment</p>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={segmentTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,25,48,0.12)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6f7a86" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6f7a86" }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="kontor" stroke="#0f1930" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="butik" stroke="#476a99" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="lager" stroke="#7ea1cc" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          </section>
        ) : null}

        {visibleModules.extended ? (
          <section id="stats-extended" className="surface p-4 sm:p-5">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-ink-900">Fördjupade nyckeltal</h3>
            <p className="mt-1 text-sm text-ink-600">Operativa och kommersiella KPI:er för portföljstyrning</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {displayedExtendedCards.map((item) => <ExtendedStatCard key={item.id} item={item} />)}
          </div>
          </section>
        ) : null}

        {customizeOpen ? (
          <div
            className={`fixed inset-0 z-[95] flex items-center justify-center bg-[#fffffe]/0 p-4 backdrop-blur-[2px] transition-all duration-200 ${
              customizeClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={closeCustomize}
          >
            <div
              className={`w-full max-w-2xl rounded-3xl border border-black/10 bg-[#fffffe] p-5 shadow-[0_24px_64px_rgba(15,25,48,0.22)] transition ${customizeClosing ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Anpassa statistik</p>
                  <h3 className="mt-1 text-xl font-semibold text-ink-900">Välj vilka nyckeltal som ska visas</h3>
                </div>
                <button type="button" className="close-circle-button inline-flex items-center justify-center rounded-full border border-black/15 bg-[#fffffe] text-xl leading-none text-ink-700" onClick={closeCustomize}>
                  ×
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-black/10 bg-[#fffffe] p-3">
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
                        <input
                          type="checkbox"
                          checked={Boolean(visibleModules[item.key])}
                          onChange={(event) => setVisibleModules((prev) => ({ ...prev, [item.key]: event.target.checked }))}
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-[#fffffe] p-3">
                  <p className="text-sm font-semibold text-ink-800">Fördjupade nyckeltal</p>
                  <div className="mt-3 max-h-[280px] space-y-2 overflow-y-auto pr-1 text-sm">
                    {extendedStatCards.map((item) => (
                      <label key={item.id} className="flex items-center gap-2 text-ink-700">
                        <input
                          type="checkbox"
                          checked={visibleExtendedCards[item.id] !== false}
                          onChange={(event) => setVisibleExtendedCards((prev) => ({ ...prev, [item.id]: event.target.checked }))}
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button type="button" className="btn-primary px-4" onClick={closeCustomize}>Spara</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AdminLeadMatchesPage({ app }) {
  const leadRows = useMemo(() => buildAdminLeadRows(), []);
  const [sortMode, setSortMode] = useState("best");
  const [listingFilter, setListingFilter] = useState("all");

  const activeListingOptions = useMemo(
    () => activeListings.filter((listing) => listing.status === "Aktiv"),
    []
  );

  const suggestedMatches = useMemo(() => {
    // Intended real source: saved search profiles joined against active company listings,
    // excluding tenants already present in inquiry/favorite/repeated-visit interaction tables.
    // Current demo data only has matched renter cards, so this keeps those cards and filters by listing.
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
      <header className="surface px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">LEADS & MATCHNINGAR</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink-900">Leads & Matchningar</h1>
            <p className="mt-1 text-sm text-ink-600">Hyresgäster som matchar era lokaler — inkommande och föreslagna</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-secondary px-4"
              onClick={() => app?.pushToast?.("Exporten är på väg (demo).", "info")}
            >
              <DownloadIcon className="mr-1.5 h-4 w-4" />
              Exportera
            </button>
            <button
              type="button"
              className="btn-primary px-4"
              onClick={() => app?.pushToast?.("Urval skickat till mäklarteamet (demo).", "success")}
            >
              + Skicka urval till mäklare
            </button>
          </div>
        </div>
      </header>

      <section className="surface overflow-hidden">
        <div className="border-b border-black/10 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">LEADS</p>
                <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-semibold text-ink-700">
                  {leadRows.length} nya
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-600">Hyresgäster som aktivt visat intresse för era lokaler</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-[#fafafa] text-[11px] uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold sm:px-5">Hyresgäst</th>
                <th className="px-4 py-3 text-left font-semibold">Lokal</th>
                <th className="px-4 py-3 text-left font-semibold">Intresse</th>
                <th className="px-4 py-3 text-right font-semibold">Match</th>
                <th className="px-4 py-3 text-left font-semibold">Tid</th>
                <th className="px-4 py-3 text-right font-semibold sm:px-5">Action</th>
              </tr>
            </thead>
            <tbody>
              {leadRows.map((lead) => (
                <tr
                  key={lead.id}
                  className={`cursor-pointer border-t border-black/10 transition hover:bg-[#fafafa] ${
                    lead.isUnread ? "shadow-[inset_3px_0_0_#0f1930]" : ""
                  }`}
                  onClick={() => openLeadConversation(app, lead)}
                >
                  <td className="px-4 py-3.5 align-top sm:px-5">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f1930] text-sm font-semibold text-white">
                        {lead.renter.initials}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink-900">{lead.renter.name}</span>
                        <span className="block truncate text-xs text-ink-600">{lead.renter.company}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 align-top font-semibold text-ink-800">{lead.listing.title}</td>
                  <td className="px-4 py-3.5 align-top">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${interestClass(lead.interest)}`}>
                      {lead.interest}
                    </span>
                  </td>
                  <td className={`px-4 py-3.5 text-right font-semibold ${matchScoreClass(lead.score)}`}>
                    {lead.score}%
                  </td>
                  <td className="px-4 py-3.5 align-top text-xs font-semibold text-ink-500">{lead.time}</td>
                  <td className="px-4 py-3.5 text-right sm:px-5">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="btn-secondary inline-flex min-h-0 w-auto items-center gap-1.5 px-3 py-2 text-xs"
                        onClick={(event) => {
                          event.stopPropagation();
                          sendToBroker(app, lead.renter, lead.listing);
                        }}
                      >
                        <SendHorizontalIcon className="h-3.5 w-3.5" />
                        Skicka till mäklare
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 min-h-0 items-center justify-center rounded-full border border-transparent text-ink-600 hover:border-black/10 hover:bg-[#fffffe]"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {leadRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border-t border-black/10 px-4 py-10 text-center sm:px-5">
                    <p className="font-semibold text-ink-900">Inga aktiva leads just nu</p>
                    <p className="mt-1 text-sm text-ink-500">Leads visas här när hyresgäster interagerar med era annonser</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-black/10" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Föreslagna av systemet</span>
        <span className="h-px flex-1 bg-black/10" />
      </div>

      <section id="matchningar" className="surface p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">MATCHNINGAR</p>
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-semibold text-ink-700">
                {suggestedMatches.length} föreslagna
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-600">Hyresgäster vars sökprofil matchar era lokaler — de har inte kontaktat er än</p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#fffffe] p-1">
            {sortTabs.map((tab) => {
              const active = sortMode === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`min-h-0 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                    active ? "bg-[#0f1930] text-white" : "text-ink-600 hover:text-ink-900"
                  }`}
                  onClick={() => setSortMode(tab.key)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={`inline-flex min-h-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              listingFilter === "all"
                ? "bg-[#0f1930] text-white"
                : "border border-black/10 bg-[#fffffe] text-ink-700 hover:border-[#bfd0e3]"
            }`}
            onClick={() => setListingFilter("all")}
          >
            Alla lokaler
          </button>
          {activeListingOptions.map((listing) => {
            const active = listingFilter === listing.id;
            return (
              <button
                key={listing.id}
                type="button"
                className={`inline-flex min-h-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-[#0f1930] text-white"
                    : "border border-black/10 bg-[#fffffe] text-ink-700 hover:border-[#bfd0e3]"
                }`}
                onClick={() => setListingFilter(listing.id)}
              >
                {listing.title}
              </button>
            );
          })}
        </div>

        {suggestedMatches.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {suggestedMatches.map((renter) => {
              const matchedListing = activeListings.find((listing) => listing.id === renter.matchListingId) || activeListings[0];
              return (
                <article key={renter.id} className="rounded-2xl border border-black/10 bg-[#fffffe] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f1930] text-sm font-semibold text-white">
                        {renter.initials}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink-900">{renter.name}</span>
                        <span className="block truncate text-xs text-ink-600">{renter.company}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 min-h-0 items-center justify-center rounded-full border border-transparent text-ink-600 hover:border-black/10 hover:bg-[#fffffe]"
                      onClick={() => app?.pushToast?.(`${renter.name} flaggad för senare.`, "success")}
                    >
                      <StarIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-black/10 pt-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Match</p>
                      <p className={`mt-1 text-3xl font-semibold leading-none ${matchScoreClass(renter.score)}`}>{renter.score}%</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${matchScoreBadgeClass(renter.score)}`}>
                      {renter.preferredType}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 border-t border-black/10 pt-3">
                    <div className="rounded-2xl border border-black/10 bg-[#fbfbfa] px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Område</p>
                      <p className="mt-1 truncate text-sm font-semibold text-ink-900">{renter.district}</p>
                    </div>
                    <div className="rounded-2xl border border-black/10 bg-[#fbfbfa] px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Storlek</p>
                      <p className="mt-1 truncate text-sm font-semibold text-ink-900">{matchCriteriaValue(renter, "Yta", renter.teamSize)}</p>
                    </div>
                    <div className="rounded-2xl border border-black/10 bg-[#fbfbfa] px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Budget</p>
                      <p className="mt-1 truncate text-sm font-semibold text-ink-900">{renter.budget}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-ink-500">Önskad inflytt: {moveInLabelForRenter(renter)}</p>
                  <button
                    type="button"
                    className="btn-secondary mt-4 inline-flex w-full min-h-0 items-center gap-1.5 py-2 text-xs"
                    onClick={() => sendToBroker(app, renter, matchedListing)}
                  >
                    <SendHorizontalIcon className="h-3.5 w-3.5" />
                    Skicka till mäklare
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-10 text-center">
            <p className="font-semibold text-ink-900">Inga matchningar hittades för era nuvarande lokaler</p>
            <p className="mt-1 text-sm text-ink-500">Publicera fler annonser för att bredda matchningsunderlaget.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function AdminActivityPage() {
  return (
    <article className="surface p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Adminpanel</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink-900">Aktivitet</h1>
        <p className="mt-1 text-sm text-ink-600">Samlad tidslinje över händelser i annonser, förfrågningar och team.</p>
      </div>
      <ul className="space-y-3">
        {activityItems.map((item, index) => {
          const Icon = activityIcon(item.type);
          const hasNext = index < activityItems.length - 1;
          return (
            <li key={item.id} className="relative pl-10">
              <span className="absolute left-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-[#fffffe] text-ink-700">
                <Icon className="h-4 w-4" />
              </span>
              {hasNext ? <span className="absolute left-[15px] top-8 h-[calc(100%+0.75rem)] w-px bg-black/10" /> : null}
              <p className="text-sm font-semibold text-ink-800">{item.text}</p>
              <p className="mt-0.5 text-xs text-ink-500">{item.timestamp}</p>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function AdminOverview({ app }) {
  const now = useMemo(() => new Date(), []);
  const greeting = useMemo(() => greetingForHour(now.getHours()), [now]);
  const dateLabel = useMemo(() => (
    new Intl.DateTimeFormat("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long"
    }).format(now)
  ), [now]);
  const [overviewInviteEmail, setOverviewInviteEmail] = useState("");
  const [overviewInvitedBrokers, setOverviewInvitedBrokers] = useState(() =>
    brokerTeam.map((broker) => ({
      id: broker.id,
      name: broker.name,
      email: broker.email,
      status: "Aktiv"
    }))
  );
  const overviewInviteCode = useMemo(() => "BROKER-" + String(Math.floor(100000 + Math.random() * 900000)), []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-stretch gap-4 xl:flex-row">
        <header className="surface shrink-0 px-4 py-4 sm:px-5 sm:py-5 xl:w-fit">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Kontopanel</p>
                <h1 className="mt-1 text-2xl font-semibold text-ink-900">{greeting}, {app?.user?.name?.split(" ")[0] || "Samuel"}.</h1>
                <p className="mt-1 text-sm text-ink-600">Här är vad som händer med er portfölj idag, {dateLabel}.</p>
              </div>
              <button type="button" className="btn-secondary shrink-0 px-4" onClick={() => navigateTo("/app/admin/adminprofil")}>
                <PencilIcon className="mr-1.5 h-4 w-4" />
                Hantera adminprofil
              </button>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Snabblänkar</p>
            <div className="flex flex-wrap items-center gap-2 -mt-2">
              <button type="button" className="btn-secondary inline-flex w-fit min-h-0 justify-start px-3 py-2 text-sm" onClick={() => navigateTo("/app/admin/maklare")}>
                <UsersGroupIcon className="mr-2 h-4 w-4" />
                Bjud in mäklare
              </button>
              <button type="button" className="btn-secondary inline-flex w-fit min-h-0 justify-start px-3 py-2 text-sm" onClick={() => navigateTo("/app/admin/annonser")}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Publicera annons
              </button>
            <button
              type="button"
              className="btn-secondary inline-flex w-fit min-h-0 justify-start px-3 py-2 text-sm"
              onClick={() => {
                navigateTo("/app/rent");
                void app?.switchRole?.("broker");
              }}
            >
              <SwitchHorizontalIcon className="mr-2 h-4 w-4" />
              Växla till sökläge
            </button>
            </div>
          </div>
        </header>

      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink-900">Statistik</h2>
        <button type="button" className="btn-secondary px-4" onClick={() => navigateTo("/app/admin/statistik")}>
          <BarChart3Icon className="mr-1.5 h-4 w-4" />
          Se all statistik
        </button>
      </div>

      <KpiCardsSection showMatchLink />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <BarInteractive title="Visningar & förfrågningar" subtitle="Senaste period" datasets={chartSeries} defaultRange="7d" />
        <TypeDistributionDonut title="Fördelning" subtitle="Typ av lokal" data={distributionData} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className="surface overflow-hidden">
          <div className="border-b border-black/10 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink-900">Aktiva annonser</h2>
                <p className="mt-1 text-sm text-ink-600">Övervaka era pågående annonseringar</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="inline-flex h-9 w-9 min-h-0 items-center justify-center rounded-full border border-black/10 bg-[#fffffe] text-ink-700">
                  <FilterIcon className="h-4 w-4" />
                </button>
                <button type="button" className="inline-flex h-9 w-9 min-h-0 items-center justify-center rounded-full border border-black/10 bg-[#fffffe] text-ink-700">
                  <SearchIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[#fafafa] text-[11px] uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold sm:px-5">Annons</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Visningar</th>
                  <th className="px-4 py-3 text-right font-semibold">Förfr.</th>
                  <th className="px-4 py-3 text-right font-semibold sm:px-5" />
                </tr>
              </thead>
              <tbody>
                {activeListings.map((item) => (
                  <tr key={item.id} className="border-t border-black/10">
                    <td className="px-4 py-3.5 align-top sm:px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-11 w-16 shrink-0 rounded-lg border border-black/10 object-cover"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink-900">{item.title}</p>
                          <p className="mt-1 text-xs text-ink-600">
                            {item.district} · {item.size} m² · {formatSek(item.priceMonthly)}/mån
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-ink-800">{item.views.toLocaleString("sv-SE")}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-ink-800">{item.inquiries}</td>
                    <td className="px-4 py-3.5 text-right sm:px-5">
                      <button type="button" className="inline-flex h-8 w-8 min-h-0 items-center justify-center rounded-full border border-transparent text-ink-600 hover:border-black/10 hover:bg-[#fffffe]">
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-black/10 px-4 py-3 text-xs text-ink-500 sm:px-5">
            <span>Visar 5 av 24 annonser</span>
            <button type="button" className="min-h-0 p-0 text-xs font-semibold text-[#0f1930]" onClick={() => navigateTo("/app/admin/annonser")}>
              Visa alla
            </button>
          </div>
        </article>

        <article className="surface p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-ink-900">Aktivitet</h2>
          <p className="mt-1 text-sm text-ink-600">Senaste händelserna</p>
          <ul className="mt-4 space-y-3">
            {activityItems.map((item, index) => {
              const Icon = activityIcon(item.type);
              const hasNext = index < activityItems.length - 1;
              return (
                <li key={item.id} className="relative pl-9">
                  <span className="absolute left-0 top-0 inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-[#fffffe] text-ink-700">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {hasNext ? <span className="absolute left-[13px] top-7 h-[calc(100%+0.65rem)] w-px bg-black/10" /> : null}
                  <p className="text-sm font-semibold text-ink-800">{item.text}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{item.timestamp}</p>
                </li>
              );
            })}
          </ul>
          <button type="button" className="btn-secondary mt-4 w-full min-h-0 py-2 text-xs" onClick={() => navigateTo("/app/admin/aktivitet")}>
            Se all aktivitet
          </button>
        </article>
      </section>

      <section className="surface p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Mäklarteam</h2>
            <p className="mt-1 text-sm text-ink-600">3 aktiva mäklare i er organisation</p>
          </div>
          <button type="button" className="btn-secondary px-4" onClick={() => navigateTo("/app/admin/maklare")}>
            <UsersGroupIcon className="mr-1.5 h-4 w-4" />
            Hantera mäklare
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-black/10 bg-[#fffffe] p-4 sm:p-5">
            <h3 className="text-lg font-semibold text-ink-900">Inbjudna mäklare</h3>
            <p className="mt-1 text-sm text-ink-600">Översikt över redan inbjudna och aktiva mäklare.</p>
            <div className="mt-4 space-y-3">
              {overviewInvitedBrokers.map((broker) => {
                const initials = String(broker.name || broker.email || "AA")
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase();
                return (
                  <div key={broker.id} className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-[#fffffe] px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e6eefc] text-xs font-semibold text-[#2d4f83]">
                        {initials}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink-900">{broker.name}</span>
                        <span className="block truncate text-xs text-ink-600">{broker.email}</span>
                      </span>
                    </div>
                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      {broker.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-2xl border border-black/10 bg-[#fffffe] p-4 sm:p-5">
            <h3 className="text-lg font-semibold text-ink-900">Bjud in mäklare</h3>
            <p className="mt-1 text-sm text-ink-600">Använd samma inbjudningsflöde som onboarding.</p>
            <div className="mt-4 rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Inbjudningskod</p>
              <p className="mt-2 text-[1.2rem] font-semibold text-[#0f1930]">{overviewInviteCode}</p>
              <p className="mt-1 text-sm text-ink-500">Dela med mäklare via e-post eller internt system.</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_150px]">
              <input
                className="field"
                type="email"
                value={overviewInviteEmail}
                onChange={(event) => setOverviewInviteEmail(event.target.value)}
                placeholder="kollega@bolag.se"
              />
              <button
                type="button"
                className="btn-primary inline-flex w-full items-center justify-center px-4"
                onClick={() => {
                  const email = String(overviewInviteEmail || "").trim();
                  if (!email) return;
                  const name = email
                    .split("@")[0]
                    .split(/[._-]/)
                    .filter(Boolean)
                    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(" ");
                  setOverviewInvitedBrokers((prev) => [
                    {
                      id: `overview-invited-${Date.now()}`,
                      name: name || "Ny mäklare",
                      email,
                      status: "Väntar"
                    },
                    ...prev
                  ]);
                  setOverviewInviteEmail("");
                }}
              >
                + Bjud in
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

function AdminProfile({ app }) {
  const user = app?.user;
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    legalEntity: "",
    organizationNumber: "",
    companyType: "",
    portfolioSize: "",
    logoUrl: "",
    companyDescription: "",
    websiteUrl: "",
    contactEmail: "",
    approvedEmailDomain: "",
    approvalFlow: "admin_approves_broker",
    listingModeration: "broker_publishes_direct",
    termsAdminAuthority: false,
    termsPlatformRules: false
  });

  useEffect(() => {
    setDraft({
      legalEntity: user?.profile?.legalEntity || "",
      organizationNumber: user?.profile?.organizationNumber || "",
      companyType: user?.profile?.companyType || "",
      portfolioSize: user?.profile?.portfolioSize || "",
      logoUrl: user?.profile?.logoUrl || "",
      companyDescription: user?.profile?.companyDescription || "",
      websiteUrl: user?.profile?.websiteUrl || "",
      contactEmail: user?.profile?.contactEmail || user?.email || "",
      approvedEmailDomain: user?.profile?.approvedEmailDomain || "",
      approvalFlow: user?.profile?.approvalFlow || "admin_approves_broker",
      listingModeration: user?.profile?.listingModeration || "broker_publishes_direct",
      termsAdminAuthority: Boolean(user?.profile?.termsAdminAuthority),
      termsPlatformRules: Boolean(user?.profile?.termsPlatformRules)
    });
  }, [user?.email, user?.profile]);

  async function saveAdminProfile() {
    if (!app?.updateProfile) {
      app?.pushToast?.("Kunde inte spara adminprofilen just nu.", "error");
      return;
    }
    setSaving(true);
    try {
      await app.updateProfile({
        profile: {
          ...(user?.profile || {}),
          legalEntity: String(draft.legalEntity || "").trim(),
          organizationNumber: String(draft.organizationNumber || "").trim(),
          companyType: String(draft.companyType || "").trim(),
          portfolioSize: String(draft.portfolioSize || "").trim(),
          logoUrl: String(draft.logoUrl || "").trim(),
          companyDescription: String(draft.companyDescription || "").trim(),
          websiteUrl: String(draft.websiteUrl || "").trim(),
          contactEmail: String(draft.contactEmail || "").trim(),
          approvedEmailDomain: String(draft.approvedEmailDomain || "").trim(),
          approvalFlow: draft.approvalFlow,
          listingModeration: draft.listingModeration,
          termsAdminAuthority: Boolean(draft.termsAdminAuthority),
          termsPlatformRules: Boolean(draft.termsPlatformRules)
        }
      });
      app?.pushToast?.("Adminprofil uppdaterad.", "success");
    } catch (error) {
      app?.pushToast?.(error.message || "Kunde inte spara adminprofilen.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="surface mx-auto w-full max-w-[920px] p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Adminpanel</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink-900">Adminprofil</h1>
          <p className="mt-1 text-sm text-ink-600">Hantera bolagets uppgifter och administratörens inställningar.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Organisationsnummer</span>
          <input className="field" value={draft.organizationNumber} onChange={(event) => setDraft((prev) => ({ ...prev, organizationNumber: event.target.value }))} />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Bolagsnamn</span>
          <input className="field" value={draft.legalEntity} onChange={(event) => setDraft((prev) => ({ ...prev, legalEntity: event.target.value }))} />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Bolagstyp</span>
          <select className="field" value={draft.companyType} onChange={(event) => setDraft((prev) => ({ ...prev, companyType: event.target.value }))}>
            <option value="">Välj bolagstyp</option>
            {COMPANY_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Portföljstorlek</span>
          <select className="field" value={draft.portfolioSize} onChange={(event) => setDraft((prev) => ({ ...prev, portfolioSize: event.target.value }))}>
            <option value="">Välj portföljstorlek</option>
            {PORTFOLIO_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <div className="grid gap-1.5 text-sm lg:col-span-2">
          <span className="text-sm font-semibold text-ink-700">Logotyp</span>
          <label className="flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-[#fafafa] px-5 py-6 text-center transition hover:bg-black/5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-[#fffffe] text-ink-700">
              <ArrowUpIcon className="h-4 w-4" />
            </span>
            <span className="mt-3 text-base font-semibold text-ink-700">Dra och släpp eller klicka för att ladda upp</span>
            <span className="mt-1 text-sm text-ink-500">PNG eller SVG · max 2 MB · rekommenderat 400 × 400 px</span>
            <input
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  setDraft((prev) => ({ ...prev, logoUrl: String(reader.result || "") }));
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
        </div>
        <label className="space-y-1.5 text-sm lg:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Bolagsbeskrivning</span>
          <textarea className="field min-h-[112px]" value={draft.companyDescription} onChange={(event) => setDraft((prev) => ({ ...prev, companyDescription: event.target.value }))} />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Webbplats</span>
          <input className="field" value={draft.websiteUrl} onChange={(event) => setDraft((prev) => ({ ...prev, websiteUrl: event.target.value }))} />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Kontaktmejl</span>
          <input className="field" value={draft.contactEmail} onChange={(event) => setDraft((prev) => ({ ...prev, contactEmail: event.target.value }))} />
        </label>
        <label className="space-y-1.5 text-sm lg:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Godkänd e-postdomän</span>
          <input className="field" value={draft.approvedEmailDomain} onChange={(event) => setDraft((prev) => ({ ...prev, approvedEmailDomain: event.target.value }))} />
        </label>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-ink-700">Godkännandeflöde</p>
          <div className="mt-3 space-y-3">
            {APPROVAL_FLOW_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`flex w-full items-center gap-3 !rounded-2xl border px-4 py-3 text-left transition ${
                  draft.approvalFlow === option.key
                    ? "border-[#0f1930] bg-[#f8fafc]"
                    : "border-black/10 bg-[#fffffe] hover:bg-black/5"
                }`}
                onClick={() => setDraft((prev) => ({ ...prev, approvalFlow: option.key }))}
              >
                <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${draft.approvalFlow === option.key ? "border-[#0f1930]" : "border-black/20"}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${draft.approvalFlow === option.key ? "bg-[#0f1930]" : "bg-transparent"}`} />
                </span>
                <span>
                  <span className="block text-[0.92rem] font-semibold leading-tight text-[#0f1930]">{option.title}</span>
                  <span className="mt-1 block text-[0.8rem] leading-snug text-ink-600">{option.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-700">Annonsmoderering</p>
          <div className="mt-3 space-y-3">
            {LISTING_MODERATION_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`flex w-full items-center gap-3 !rounded-2xl border px-4 py-3 text-left transition ${
                  draft.listingModeration === option.key
                    ? "border-[#0f1930] bg-[#f8fafc]"
                    : "border-black/10 bg-[#fffffe] hover:bg-black/5"
                }`}
                onClick={() => setDraft((prev) => ({ ...prev, listingModeration: option.key }))}
              >
                <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${draft.listingModeration === option.key ? "border-[#0f1930]" : "border-black/20"}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${draft.listingModeration === option.key ? "bg-[#0f1930]" : "bg-transparent"}`} />
                </span>
                <span>
                  <span className="block text-[0.92rem] font-semibold leading-tight text-[#0f1930]">{option.title}</span>
                  <span className="mt-1 block text-[0.8rem] leading-snug text-ink-600">{option.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button type="button" className="btn-primary px-4" disabled={saving} onClick={saveAdminProfile}>
          {saving ? "Sparar..." : "Spara ändringar"}
        </button>
      </div>
    </article>
  );
}

function AdminPlaceholder({ sectionKey }) {
  const title = SECTION_TITLES[sectionKey] || "Sektion";
  return (
    <article className="surface p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Adminpanel</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink-900">{title}</h1>
      <p className="mt-2 text-sm text-ink-600">
        Den här sektionen är under uppbyggnad och kommer snart med full funktionalitet.
      </p>
      <div className="mt-5 rounded-2xl border border-black/10 bg-[#fafafa] p-4 text-sm text-ink-700">
        Kommer snart.
      </div>
    </article>
  );
}

function AdminPanelPage({ app, pathname }) {
  const sectionKey = sectionFromPath(pathname);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const currentSectionLabel = SECTION_TITLES[sectionKey] || "Översikt";

  return (
    <section className="flex h-full min-h-0 bg-[#fffffe]">
      <aside className="hidden h-full w-[296px] shrink-0 border-r border-black/10 bg-[#fffffe] lg:block">
        <AdminSidebar pathname={pathname} onNavigate={(nextPath) => navigateTo(nextPath)} onLogout={app?.logout} />
      </aside>

      <div data-admin-scroll-container="true" className="min-h-0 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-black/10 bg-[#fffffe] px-4 py-2.5 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="inline-flex min-h-0 items-center gap-1.5 rounded-full border border-black/20 bg-[#fffffe] px-3 py-2 text-xs font-semibold text-ink-700"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <PanelLeftIcon className="h-4 w-4" />
              Meny
            </button>
            <p className="text-sm font-semibold text-ink-800">{currentSectionLabel}</p>
          </div>
        </div>

        <div className={`mx-auto w-full max-w-[1600px] ${sectionKey === "statistik" ? "pb-4 pr-4 pt-4 pl-2 sm:pb-6 sm:pr-6 sm:pt-6 sm:pl-3" : "p-4 sm:p-6"}`}>
          {sectionKey === "oversikt" ? <AdminOverview app={app} /> : null}
          {sectionKey === "annonser" ? <AdminListingsPage /> : null}
          {sectionKey === "leads" ? <AdminLeadMatchesPage app={app} /> : null}
          {sectionKey === "inkorg" ? <AdminInquiriesPage pathname={pathname} /> : null}
          {sectionKey === "notifikationer" ? <AdminNotificationsPage /> : null}
          {sectionKey === "maklare" ? <AdminBrokersPage /> : null}
          {sectionKey === "statistik" ? <AdminStatistics /> : null}
          {sectionKey === "aktivitet" ? <AdminActivityPage /> : null}
          {sectionKey === "adminprofil" ? <AdminProfile app={app} /> : null}
          {sectionKey !== "oversikt" && sectionKey !== "annonser" && sectionKey !== "leads" && sectionKey !== "inkorg" && sectionKey !== "notifikationer" && sectionKey !== "maklare" && sectionKey !== "adminprofil" && sectionKey !== "statistik" && sectionKey !== "aktivitet" ? <AdminPlaceholder sectionKey={sectionKey} /> : null}
        </div>
      </div>

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-[70] bg-transparent lg:hidden" onClick={() => setMobileSidebarOpen(false)}>
          <div className="h-full w-[min(88vw,320px)] border-r border-black/10 bg-[#fffffe]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-end border-b border-black/10 p-3">
              <button
                type="button"
                className="inline-flex h-9 w-9 min-h-0 items-center justify-center rounded-full border border-black/10 bg-[#fffffe] text-ink-700"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <AdminSidebar
              pathname={pathname}
              onNavigate={(nextPath) => {
                setMobileSidebarOpen(false);
                navigateTo(nextPath);
              }}
              onLogout={app?.logout}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default AdminPanelPage;
