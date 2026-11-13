import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import EditorWorkspace from "../../components/layout/EditorWorkspace";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import LeadAssistant from "../../components/app/LeadAssistant";
import { LeadActivityLog, LeadInterestCard, leadCardClass } from "../../components/app/LeadPanelCards";
import { firstName as firstNameOf } from "../../lib/leadAssistant";
import BrokerOverview from "../../components/admin/BrokerOverview";
import { leadActivitiesApi, listingApi, prospectCommentsApi, prospectsApi } from "../../api";
import { formatDate } from "../../lib/formatters";
import { navigateTo, normalizeAppRole } from "../../lib/router";
import AdminPanelShell from "../../components/layout/AdminPanelShell";
import { BrokerAssistantPage, BrokerAssistantProvider } from "../../components/app/BrokerAssistant";
import SidePanelFrame from "../../components/layout/SidePanelFrame";
import StatusPill, {
  LEAD_STATUS_ORDER,
  listingStatusLabel,
  listingStatusOptions,
  leadStatusOptions
} from "../../components/app/StatusPill";
import {
  ArchiveIcon,
  BuildingIcon,
  CalendarIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  PdfIcon,
  PlusIcon,
  SettingsGearIcon,
  SparklesIcon,
  SupportIcon,
  UserIcon,
  UsersGroupIcon,
  XIcon
} from "../../components/icons/UiIcons";
import AccountWindow from "../../components/account/AccountWindow";
import { accountBackgroundPath, parseAccountPath } from "../../lib/accountPages";
import MessagesPage from "./MessagesPage";
import ListingEditorOverlay from "../../components/app/ListingEditorOverlay";
import { useProspectEditorState, ProspectEditorSections, ProspectEditorFooterActions } from "../../components/app/ProspectEditorSections";
import ProspectCommentThread from "../../components/app/ProspectCommentThread";
import ProspectVersionHistoryPanel from "../../components/app/ProspectVersionHistoryPanel";
import ProspectShareSheet from "../../components/app/ProspectShareSheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Archive, ArrowUpRight, Bot, ChevronLeft, ChevronRight, CircleDot, Coins, Eye, EyeOff, FileText, LayoutDashboard, MapPin, MessageSquare, Paperclip, Pencil, Settings, Sparkles, Trash2, UserRound, Users } from "lucide-react";
import { cn } from "cn";
import ProspectAssistant from "../../components/app/ProspectAssistant";
import ProspectIcon from "../../components/app/ProspectIcon";
import RowActionsMenu from "../../components/app/RowActionsMenu";
import { reviewProspect } from "../../lib/prospectAssistant";
import { useMediaQuery } from "../../lib/useMediaQuery";

export const BROKER_NAV_ITEMS = [
  { key: "oversikt", label: "Översikt", path: "/app/broker", Icon: LayoutDashboardIcon, group: "Arbetsyta" },
  { key: "assistent", label: "AI-assistent", path: "/app/broker/assistent", Icon: Bot, group: "Arbetsyta" },
  { key: "objekt", label: "Dina objekt", path: "/app/broker/objekt", Icon: BuildingIcon, group: "Objekt" },
  { key: "prospekt", label: "Prospekt", path: "/app/broker/prospekt", Icon: PdfIcon, group: "Objekt" },
  { key: "leads", label: "Leads", path: "/app/broker/leads", Icon: SparklesIcon, group: "Hyresgäster" },
  { key: "meddelanden", label: "Meddelanden", path: "/app/broker/meddelanden", Icon: MessageSquareIcon, group: "Hyresgäster" }
];

export const BROKER_BOTTOM_NAV_ITEMS = [
  { key: "profil", label: "Profil", path: "/app/broker/profil", Icon: UserIcon },
  { key: "installningar", label: "Inställningar", path: "/app/broker/installningar", Icon: SettingsGearIcon },
  { key: "hjalp", label: "Hjälp", path: "/app/broker/hjalp", Icon: SupportIcon }
];

const BROKER_SECTION_TITLES = {
  oversikt: "Översikt",
  assistent: "AI-assistent",
  objekt: "Dina objekt",
  leads: "Leads",
  prospekt: "Prospekt",
  meddelanden: "Meddelanden",
  profil: "Profil",
  installningar: "Inställningar",
  hjalp: "Hjälp"
};

// Saved listings and searches used to be pages of their own; they are cards on the profile now.
const LEGACY_SECTIONS = { "sparade-objekt": "profil", "sparade-sokningar": "profil" };

function sectionFromPath(pathname) {
  const match = pathname.match(/^\/(?:app\/)?broker\/([^/?#]+)/);
  const key = LEGACY_SECTIONS[match?.[1]] || match?.[1] || "oversikt";
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
  { value: "meeting", label: "Möte" },
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

function useBrokerListingsData(app) {
  const { user, leads = [], updateListing } = app;

  const [listingLoadError, setListingLoadError] = useState("");
  const [publisherListings, setPublisherListings] = useState([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);

  async function refreshPublisherListings() {
    if (!user?.id) {
      setPublisherListings([]);
      setIsLoadingListings(false);
      return;
    }

    setIsLoadingListings(true);
    setListingLoadError("");
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
    } catch (error) {
      setListingLoadError(error.message || "Kunde inte ladda objekten.");
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

  return { listingLoadError, user, updateListing, isLoadingListings, listingPerformance, ownLeads, ownListings, refreshPublisherListings };
}

function BrokerOverviewSection({ app }) {
  const { isLoadingListings, listingLoadError, listingPerformance, ownLeads, refreshPublisherListings } = useBrokerListingsData(app);
  return <BrokerOverview app={app} listings={listingPerformance} leads={ownLeads} loading={isLoadingListings} error={listingLoadError} onRetry={refreshPublisherListings} />;
}

function BrokerListingsSection({ app }) {
  const { listingLoadError, isLoadingListings, listingPerformance, refreshPublisherListings } = useBrokerListingsData(app);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("alla");
  const [selectedListingId, setSelectedListingId] = useState(null);
  const [busyListingId, setBusyListingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleting = Boolean(deleteTarget) && busyListingId === deleteTarget.id;

  // The same lifecycle actions as in the editor: hide an active listing, publish any other, or delete it.
  async function changeVisibility(listing) {
    setBusyListingId(listing.id);
    try {
      if (listing.status === "active") {
        await app.updateListing(listing.id, { status: "draft" });
        app.pushToast("Objekt dolt.", "info");
      } else {
        await app.publishListing(listing.id);
      }
      await refreshPublisherListings();
    } catch (error) {
      app.pushToast(error.message || "Åtgärden misslyckades. Försök igen.", "error");
    } finally {
      setBusyListingId(null);
    }
  }

  async function confirmDeleteListing() {
    if (!deleteTarget) return;
    setBusyListingId(deleteTarget.id);
    try {
      await app.deleteListing(deleteTarget.id);
      setDeleteOpen(false);
      await refreshPublisherListings();
    } catch (error) {
      app.pushToast(error.message || "Kunde inte radera objektet.", "error");
    } finally {
      setBusyListingId(null);
    }
  }

  const listingActions = (listing) => {
    const active = listing.status === "active";
    const busy = busyListingId === listing.id;
    return [
      { key: "edit", label: "Redigera", icon: Pencil, onSelect: () => setSelectedListingId(listing.id) },
      { key: "visibility", label: active ? "Dölj objekt" : "Publicera objekt", icon: active ? EyeOff : Eye, disabled: busy, onSelect: () => void changeVisibility(listing) },
      "separator",
      { key: "delete", label: "Radera", icon: Trash2, destructive: true, disabled: busy, onSelect: () => { setDeleteTarget(listing); setDeleteOpen(true); } }
    ];
  };

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
    ? listingPerformance.find((listing) => String(listing.id) === String(selectedListingId)) || null
    : null;

  return (
    <div className="space-y-5">


      {listingLoadError ? <div role="alert" className="text-sm text-rose-700">{listingLoadError}<Button variant="link" onClick={refreshPublisherListings}>Försök igen</Button></div> : null}
      <Card className="gap-0 py-0 overflow-hidden">
        <div className="border-b border-veil/10 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-ink-500">Hantera objekt</p>
              <p className="mt-1 text-sm text-ink-600">Välj ett objekt för att redigera uppgifterna.</p>
            </div>
            <Badge variant="outline" className="h-auto rounded-full bg-veil/10 px-2 py-0.5 text-[11px] font-semibold text-ink-700">{filteredListings.length} objekt</Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="grid min-w-0 flex-1 gap-2 sm:max-w-[460px] sm:grid-cols-[minmax(200px,1fr)_170px]">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Sök objekt"
              placeholder="Sök titel, adress eller område"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger aria-label="Objektstatus">
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
          <div className="ml-auto flex flex-wrap items-center gap-2"><Button type="button" variant="secondary" className="h-auto px-4 py-2" onClick={() => navigateTo("/app/broker/leads")}>
            <CalendarIcon className="mr-1.5 h-4 w-4" />
            Intressen
          </Button>
<Button type="button" className="h-auto px-4 py-2" onClick={() => navigateTo("/app/publish")}>
            <span className="mr-1.5 text-base leading-none">+</span>
            Publicera ny annons
          </Button></div>
          </div>
        </div>

        <Table className="min-w-[640px]">
          <TableHeader className="bg-canvas"><TableRow><TableHead className="pl-5">Objekt</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Visningar</TableHead><TableHead className="text-right">Leads</TableHead><TableHead className="text-right">Yta</TableHead><TableHead className="pr-5 text-right">Åtgärder</TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredListings.map((listing) => <TableRow key={listing.id}>
              <TableCell className="py-2 pl-5"><div className="flex items-center gap-3"><img src={listing.image || "/object-images/object-1.jpeg"} alt="" className="h-10 w-14 shrink-0 rounded-md object-cover" /><div><Button variant="link" className="h-auto min-h-0 justify-start p-0 font-semibold" onClick={() => setSelectedListingId(listing.id)}>{listing.title || listing.address}</Button><p className="mt-0.5 text-xs leading-4 text-ink-500">{listing.district} · {listing.address}</p></div></div></TableCell>
              <TableCell><StatusPill status={listing.status} variant="listing" /></TableCell>
              <TableCell className="text-right tabular-nums">{listing.views.toLocaleString("sv-SE")}</TableCell>
              <TableCell className="text-right tabular-nums">{listing.listingLeads}</TableCell>
              <TableCell className="text-right tabular-nums">{listing.sizeSqm} m²</TableCell>
              <TableCell className="pr-5 text-right"><RowActionsMenu label={`Åtgärder för ${listing.title || listing.address}`} actions={listingActions(listing)} /></TableCell>
            </TableRow>)}
            {isLoadingListings || filteredListings.length === 0 ? <TableRow><TableCell colSpan={6} className="whitespace-normal py-12 text-center"><p className="font-medium">{isLoadingListings ? "Laddar dina objekt..." : "Inga objekt matchar dina filter"}</p>{!isLoadingListings ? <Button variant="link" onClick={() => { setQuery(""); setStatusFilter("alla"); }}>Rensa filter</Button> : null}</TableCell></TableRow> : null}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={(open) => { if (!deleting) setDeleteOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Radera objektet?</AlertDialogTitle>
            <AlertDialogDescription>Objektet ”{deleteTarget?.title || deleteTarget?.address}” tas bort. Åtgärden kan inte ångras.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Avbryt</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleting} onClick={confirmDeleteListing}>{deleting ? "Raderar..." : "Radera objekt"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

function ListingEditorSidePanel(props) {
  return <ListingEditorOverlay {...props} />;
}

function ProspectWorkspaceCard({ title, children }) {
  return (
    <Card className="gap-0 py-0 p-4 sm:p-5">
      <p className="text-[11px] font-semibold text-ink-500">{title}</p>
      <div className="mt-3">{children}</div>
    </Card>
  );
}


// The sidebar of "Redigera prospekt": the six sections, then the rest of the workspace.
const PROSPECT_SECTION_ICONS = { overview: LayoutDashboard, description: FileText, terms: Coins, location: MapPin, contact: UserRound, materials: Paperclip };
const PROSPECT_WORKSPACE_ENTRIES = [
  { key: "kommentarer", label: "Kommentarer", Icon: MessageSquare },
  { key: "samarbete", label: "Samarbete", Icon: Users },
  { key: "installningar", label: "Inställningar", Icon: Settings }
];

const PROSPECT_SECTION_STEPS = [
  { kind: "overview", label: "Översikt", prompt: "Börja med det viktigaste om objektet." },
  { kind: "description", label: "Beskrivning", prompt: "Gör lokalen tydlig och lätt att förstå." },
  { kind: "terms", label: "Villkor", prompt: "Lägg in hyrestid, deposition och uppsägningstid." },
  { kind: "location", label: "Läge", prompt: "Beskriv kommunikationer och närområde." },
  { kind: "contact", label: "Kontakt", prompt: "Välj ansvarig kontaktperson." },
  { kind: "materials", label: "Material", prompt: "Lägg till bilagor och egna sektioner." }
];

function ProspectWorkspaceSidePanel({ prospectId, listingId, app, onClose, onMutated }) {
  const [prospect, setProspect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState("prospekt");
  const [prospectStep, setProspectStep] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentsPending, setCommentsPending] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  // From the lg breakpoint the assistant sits beside the form; below it, it takes the form's place while open.
  const [assistantOpen, setAssistantOpen] = useState(false);
  const sidebar = useMediaQuery("(min-width: 1024px)");

  async function loadProspect() {
    setLoading(true);
    setLoadError("");
    try {
      const { prospect: loaded } = await prospectsApi.getProspect(prospectId);
      setProspect(loaded);
    } catch (error) {
      setLoadError(error.message || "Kunde inte ladda prospektet.");
    } finally {
      setLoading(false);
    }
  }

  async function loadComments() {
    try {
      const { comments: list } = await prospectCommentsApi.listComments(prospectId);
      setComments(list);
    } catch (error) { app.pushToast(error.message || "Kunde inte ladda kommentarer.", "error"); }
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
    } catch (error) {
      app.pushToast(error.message || "Kunde inte spara kommentaren.", "error");
    } finally {
      setCommentsPending(false);
    }
  }

  async function archiveProspect() {
    setArchiving(true);
    try {
      await prospectsApi.archiveProspect(prospectId);
      app.pushToast("Prospekt arkiverat.", "info");
      await onMutated?.();
      onClose();
    } catch (error) {
      app.pushToast(error.message || "Kunde inte arkivera prospektet.", "error");
    } finally {
      setArchiving(false);
    }
  }

  const prospectGaps = new Set(reviewProspect({ title: editor.title, sections: editor.sections }).map((finding) => finding.section).filter(Boolean));

  // The assistant points at a section (or another tab of the workspace) by opening it.
  function focusProspectTarget(target) {
    const index = PROSPECT_SECTION_STEPS.findIndex((step) => step.kind === target);
    if (index >= 0) {
      setActiveTab("prospekt");
      setProspectStep(index);
    } else {
      setActiveTab(target);
    }
    setAssistantOpen(false);
  }

  return (
    <EditorWorkspace size="wide" title="Redigera prospekt" dirty={editor.dirty} busy={editor.saving || editor.publishing || Boolean(editor.uploadingSectionId) || archiving} onClose={onClose} onSaveDraft={editor.saveDraft}>
      {(handleClose) => (
        <Tabs value={activeTab} onValueChange={setActiveTab} orientation={sidebar ? "vertical" : "horizontal"} className="flex min-h-0 flex-1 flex-col gap-0">
          <header className="shrink-0 border-b border-veil/10 bg-surface px-5 py-4 sm:px-8">
            <p className="text-xs text-ink-500">Redigera prospekt</p>
            <div className="mt-1.5 flex items-center gap-3">
              {prospect ? (
                <Input
                  className="flex-1"
                  value={editor.title}
                  onChange={(event) => editor.setTitle(event.target.value)}
                  placeholder="Namnge prospektet..."
                  aria-label="Titel"
                  disabled={editor.saving || editor.publishing}
                />
              ) : (
                <p className="flex-1 py-2 text-[15px] text-ink-500">Laddar...</p>
              )}
              <Button type="button" variant="outline" className="shrink-0 lg:hidden" aria-pressed={assistantOpen} onClick={() => setAssistantOpen((open) => !open)}>
                <Sparkles className="mr-1.5 h-4 w-4" />
                Assistent
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Stäng"
                className="h-10 w-10 shrink-0 rounded-md"
                onClick={handleClose}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
            <nav aria-label="Prospektets innehåll" className="shrink-0 border-b border-veil/10 bg-surface lg:w-[248px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
              <ul className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
                {[...PROSPECT_SECTION_STEPS.map((step, index) => ({ id: step.kind, label: step.label, Icon: PROSPECT_SECTION_ICONS[step.kind], current: activeTab === "prospekt" && prospectStep === index, gap: prospectGaps.has(step.kind), open: () => { setActiveTab("prospekt"); setProspectStep(index); } })),
                  ...PROSPECT_WORKSPACE_ENTRIES.map(({ key, label, Icon }) => ({ id: key, label, Icon, current: activeTab === key, gap: false, open: () => setActiveTab(key) }))].map(({ id, label, Icon, current, gap, open }) => (
                  <li key={id} className={cn("shrink-0 lg:shrink", id === "kommentarer" && "lg:mt-3 lg:border-t lg:border-veil/10 lg:pt-3")}>
                    <Button
                      type="button"
                      variant="ghost"
                      aria-current={current ? "page" : undefined}
                      className={cn("h-10 min-h-0 w-full justify-start gap-2.5 px-3 text-sm font-semibold", current ? "bg-strong text-on-strong hover:bg-strong hover:text-on-strong" : "text-ink-600")}
                      onClick={open}
                    >
                      <Icon aria-hidden="true" className="h-4 w-4" />
                      <span className="truncate">{label}</span>
                      {gap ? <span role="img" aria-label="Uppgifter saknas" className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" /> : null}
                    </Button>
                  </li>
                ))}
              </ul>
            </nav>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-canvas p-5 sm:p-8">
            {loadError ? <div role="alert" className="space-y-3"><p>{loadError}</p><Button variant="outline" onClick={loadProspect}>Försök igen</Button></div> : loading || !prospect ? (
              <p className="text-sm text-ink-500">Laddar prospekt...</p>
            ) : (
              <div className="mx-auto max-w-3xl space-y-4">
                <TabsContent value="prospekt">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-strong">{PROSPECT_SECTION_STEPS[prospectStep].label}</h2>
                    <p className="mt-1 text-sm text-ink-500">{PROSPECT_SECTION_STEPS[prospectStep].prompt}</p>
                  </div>
                  <fieldset disabled={editor.saving || editor.publishing} className="min-w-0">
                    <ProspectEditorSections editor={editor} listingSummary={prospect.listingSummary} activeKind={PROSPECT_SECTION_STEPS[prospectStep].kind} />
                  </fieldset>
                </TabsContent>
                <TabsContent value="kommentarer">
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
                </TabsContent>

                <TabsContent value="samarbete">
                  <ProspectShareSheet prospectId={prospect.id} listingId={listingId} prospect={prospect} app={app} />
                </TabsContent>

                <TabsContent value="installningar">
                  <div className="space-y-4">
                    {prospect.status !== "archived" ? (
                      <Card className="gap-0 py-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                        <div>
                          <p className="text-sm font-semibold text-rose-900">Arkivera prospekt</p>
                          <p className="mt-1 text-xs text-rose-700">Döljer prospektet från din lista.</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto shrink-0 gap-1.5 rounded-md border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 hover:text-rose-700"
                          onClick={() => setConfirmArchive(true)}
                          disabled={archiving || editor.dirty || editor.saving || editor.publishing}
                        >
                          <ArchiveIcon className="h-4 w-4" />
                          {archiving ? "Arkiverar..." : "Arkivera"}
                        </Button>
                      </Card>
                    ) : null}
                    <ProspectWorkspaceCard title="Versionshistorik">
                      {editor.dirty ? <p className="text-sm text-ink-500">Spara utkastet innan du återställer en version eller arkiverar prospektet.</p> : <ProspectVersionHistoryPanel prospectId={prospect.id} app={app} onRestored={loadProspect} />}
                    </ProspectWorkspaceCard>
                  </div>
                </TabsContent>
              </div>
            )}
          </div>


            {prospect ? (
              <aside
                aria-label="Assistent"
                className={cn(
                  "min-h-0 w-full shrink-0 border-l border-veil/10 bg-canvas p-3 lg:w-[360px]",
                  assistantOpen ? "flex max-lg:absolute max-lg:inset-0 max-lg:z-10" : "hidden lg:flex"
                )}
              >
                <ProspectAssistant editor={editor} listing={prospect.listingSummary} user={app.user} onFocus={focusProspectTarget} className="w-full" />
              </aside>
            ) : null}
          </div>

          {prospect ? (
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-veil/10 bg-surface px-5 py-4">
              <Button type="button" variant="outline" disabled={editor.saving || editor.publishing} onClick={handleClose}>Avbryt</Button>
              {activeTab === "prospekt" ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {editor.error ? <p role="alert" className="w-full text-sm text-rose-700">{editor.error}</p> : null}
                  {editor.hasUnpublishedChanges ? <span className="mr-1 text-xs font-semibold text-amber-700">Opublicerade ändringar</span> : null}
                  {prospectStep > 0 ? <Button type="button" variant="outline" disabled={editor.saving || editor.publishing} onClick={() => setProspectStep((index) => Math.max(0, index - 1))}><ChevronLeft className="h-4 w-4" />Föregående</Button> : null}
                  {prospectStep < PROSPECT_SECTION_STEPS.length - 1 ? <Button type="button" disabled={editor.saving || editor.publishing} onClick={() => setProspectStep((index) => Math.min(index + 1, PROSPECT_SECTION_STEPS.length - 1))}>Nästa steg<ChevronRight className="h-4 w-4" /></Button> : <ProspectEditorFooterActions editor={editor} />}
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <ProspectEditorFooterActions editor={editor} />
                </div>
              )}
            </div>
          ) : null}
          <AlertDialog open={confirmArchive} onOpenChange={(open) => { if (!archiving) setConfirmArchive(open); }}>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Arkivera prospektet?</AlertDialogTitle><AlertDialogDescription>Prospektet döljs från den aktiva listan. Sparat innehåll behålls.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={archiving}>Avbryt</AlertDialogCancel><AlertDialogAction disabled={archiving} onClick={archiveProspect}>{archiving ? "Arkiverar..." : "Arkivera prospekt"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
        </Tabs>
      )}
    </EditorWorkspace>
  );
}


function BrokerProspectsSection({ app }) {
  const { ownListings } = useBrokerListingsData(app);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadError, setLoadError] = useState("");
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProspectId, setSelectedProspectId] = useState(null);
  const [creatingListingId, setCreatingListingId] = useState("");
  const [creating, setCreating] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function loadProspects() {
    setLoading(true);
    setLoadError("");
    try {
      const { prospects: list } = await prospectsApi.listMine();
      setProspects(list);
    } catch (error) {
      setLoadError(error.message || "Kunde inte ladda prospekten.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProspects();
  }, []);

  const listingById = new Map(ownListings.map((listing) => [String(listing.id), listing]));
  const selectedProspect = prospects.find((prospect) => prospect.id === selectedProspectId) || null;

  const filteredProspects = prospects.filter((prospect) => (statusFilter === "all" || prospect.status === statusFilter) && `${prospect.title} ${listingById.get(String(prospect.listingId))?.title || ""}`.toLocaleLowerCase("sv").includes(query.trim().toLocaleLowerCase("sv")));

  async function archiveFromList() {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await prospectsApi.archiveProspect(archiveTarget.id);
      app.pushToast("Prospekt arkiverat.", "info");
      setArchiveOpen(false);
      await loadProspects();
    } catch (error) {
      app.pushToast(error.message || "Kunde inte arkivera prospektet.", "error");
    } finally {
      setArchiving(false);
    }
  }

  const prospectActions = (prospect) => [
    { key: "edit", label: "Redigera", icon: Pencil, onSelect: () => setSelectedProspectId(prospect.id) },
    prospect.status !== "archived" && { key: "archive", label: "Arkivera", icon: Archive, onSelect: () => { setArchiveTarget(prospect); setArchiveOpen(true); } }
  ];

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


      <Card className="gap-0 py-0 overflow-hidden">
        <div className="border-b border-veil/10 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink-500">Prospekt</p>
              {ownListings.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Select
                    value={creatingListingId || ownListings[0]?.id || ""}
                    onValueChange={setCreatingListingId}
                  >
                    <SelectTrigger aria-label="Välj objekt för nytt prospekt" className="w-auto min-w-[200px]">
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
            <Badge variant="outline" className="h-auto shrink-0 rounded-full bg-veil/10 px-2 py-0.5 text-[11px] font-semibold text-ink-700">{prospects.length} prospekt</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-b border-veil/10 p-4 sm:px-5">
          <Input aria-label="Sök prospekt" className="w-full sm:max-w-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sök prospekt eller objekt..." />
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger aria-label="Prospektstatus"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alla statusar</SelectItem><SelectItem value="draft">Utkast</SelectItem><SelectItem value="published">Publicerad</SelectItem><SelectItem value="archived">Arkiverad</SelectItem></SelectContent></Select>
        </div>
        {loadError ? <div role="alert" className="p-5 text-sm text-rose-700">{loadError}<Button variant="link" onClick={loadProspects}>Försök igen</Button></div> : null}
        <div className="overflow-x-auto">
          <Table className="min-w-[860px]">
            <TableHeader className="bg-canvas text-[11px] text-ink-500">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 sm:px-5">Prospekt</TableHead>
                <TableHead className="px-4 py-3">Objekt</TableHead>
                <TableHead className="px-4 py-3">Status</TableHead>
                <TableHead className="px-4 py-3">Version</TableHead>
                <TableHead className="px-4 py-3">Uppdaterad</TableHead>
                <TableHead className="px-4 py-3 text-right sm:px-5">Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProspects.map((prospect) => {
                const listing = listingById.get(String(prospect.listingId));
                return (
                  <TableRow
                    key={prospect.id}
                    className="cursor-pointer border-t border-veil/10 transition hover:bg-canvas"
                    onClick={() => setSelectedProspectId(prospect.id)}
                  >
                    <TableCell className="whitespace-normal px-4 py-2 align-top sm:px-5">
                      <div className="flex items-center gap-3">
                        <ProspectIcon />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink-900">{prospect.title}</span>
                          <span className="block truncate text-xs text-ink-600">{listing?.title || listing?.address || prospect.listingId}</span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 align-top font-semibold text-ink-800">{listing?.title || "Objekt"}</TableCell>
                    <TableCell className="px-4 py-2 align-top">
                      <StatusPill status={prospect.status} variant="prospect" />
                    </TableCell>
                    <TableCell className="px-4 py-2 align-top text-sm font-semibold text-ink-700">
                      {prospect.currentVersion ? `v${prospect.currentVersion}` : "Utkast"}
                    </TableCell>
                    <TableCell className="px-4 py-2 align-top text-xs font-semibold text-ink-500">{relativeTime(prospect.updatedAt)}</TableCell>
                    <TableCell className="px-4 py-2 text-right sm:px-5">
                      <RowActionsMenu label={`Åtgärder för ${prospect.title}`} actions={prospectActions(prospect)} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && !loadError && filteredProspects.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="whitespace-normal border-t border-veil/10 px-4 py-10 text-center sm:px-5">
                    <p className="font-semibold text-ink-900">Inga prospekt att visa</p>
                    <p className="mt-1 text-sm text-ink-500">Skapa ett prospekt för ett av dina objekt.</p>
                  </TableCell>
                </TableRow>
              ) : null}
              {loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="whitespace-normal border-t border-veil/10 px-4 py-10 text-center text-sm text-ink-600 sm:px-5">
                    Laddar prospekt...
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={archiveOpen} onOpenChange={(open) => { if (!archiving) setArchiveOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arkivera prospektet?</AlertDialogTitle>
            <AlertDialogDescription>Prospektet döljs från den aktiva listan. Sparat innehåll behålls.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Avbryt</AlertDialogCancel>
            <AlertDialogAction disabled={archiving} onClick={archiveFromList}>{archiving ? "Arkiverar..." : "Arkivera prospekt"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

export function LeadDetailPanel({ lead, app, onClose }) {
  const [activities, setActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [assistantDirty, setAssistantDirty] = useState(false);
  const [freshActivityId, setFreshActivityId] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadActivities() {
      if (!lead?.id) return;
      setIsLoadingActivities(true);
      try {
        const response = await leadActivitiesApi.getActivities(lead.id);
        if (!cancelled) setActivities(response.activities || []);
      } catch (_error) {
        if (!cancelled) setError("Kunde inte ladda aktivitetsloggen. Öppna leadet igen för att försöka på nytt.");
      } finally {
        if (!cancelled) setIsLoadingActivities(false);
      }
    }
    void loadActivities();
    return () => {
      cancelled = true;
    };
  }, [lead?.id]);

  useEffect(() => {
    if (!freshActivityId) return undefined;
    const timer = window.setTimeout(() => setFreshActivityId(null), 4000);
    return () => window.clearTimeout(timer);
  }, [freshActivityId]);

  if (!lead) return null;

  // "meeting" needs the newer backend; against an older deployment it is kept as a note instead of being lost.
  async function logActivity(type, body) {
    try {
      return await leadActivitiesApi.addActivity(lead.id, type, body);
    } catch (caught) {
      if (type !== "meeting") throw caught;
      return leadActivitiesApi.addActivity(lead.id, "note", `Möte: ${body}`);
    }
  }

  // Called by the assistant once the person confirms a proposal. null means "leave as it is".
  async function applyAssistantUpdate({ type, body, status, followUpDate }) {
    setError("");
    setPending(true);
    try {
      let created = null;
      if (type && body) created = (await logActivity(type, body))?.activity || null;
      const patch = {};
      if (status) patch.status = status;
      if (followUpDate !== null && followUpDate !== undefined) patch.followUpDate = followUpDate;
      if (Object.keys(patch).length > 0) await app.updateLead(lead.id, patch);
      const response = await leadActivitiesApi.getActivities(lead.id);
      setActivities(response.activities || []);
      if (created?.id) setFreshActivityId(created.id);
    } finally {
      setPending(false);
    }
  }

  return (
    <EditorWorkspace size="medium" title="Hantera lead" dirty={assistantDirty} busy={pending} onClose={onClose}>
      {(handleClose) => (
        <>
        <div className="shrink-0 border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-ink-500">Lead</p>
              <h2 className="mt-0.5 truncate text-xl font-semibold text-ink-900">{lead.renter?.name || lead.renter?.email || "Hyresgäst"}</h2>
              <p className="mt-0.5 text-sm text-ink-500">Berätta vad som hänt så hjälper assistenten dig vidare.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Stäng"
              className="h-10 w-10 shrink-0 rounded-md"
              onClick={handleClose}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Two columns that share the height between them: only the log and the conversation scroll, never the overlay. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas p-4 md:overflow-hidden md:p-5">
          {error && <p role="alert" className="mb-4 shrink-0 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-[minmax(250px,300px)_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)]">
            <div className="flex min-h-0 flex-col gap-4">
              <LeadInterestCard
                lead={lead}
                followUp={lead.followUpDate ? { label: formatDate(lead.followUpDate), overdue: isOverdueFollowUp(lead.followUpDate) } : null}
              />
              <LeadActivityLog
                activities={activities.map((activity) => ({
                  ...activity,
                  label: ACTIVITY_TYPES.find((type) => type.value === activity.type)?.label || activity.type,
                  when: relativeTime(activity.createdAt)
                }))}
                loading={isLoadingActivities}
                freshId={freshActivityId}
              />
            </div>
            <LeadAssistant
              className={`md:min-h-0 ${leadCardClass}`}
              lead={lead}
              activities={activities}
              loading={isLoadingActivities}
              brokerName={firstNameOf(app.user?.name)}
              onApply={applyAssistantUpdate}
              onDirtyChange={setAssistantDirty}
            />
          </div>
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-surface px-5 py-3">
          <p className="text-xs text-ink-500">{pending ? "Sparar…" : "Ändringar du bekräftar sparas direkt"}</p>
          <Button variant="outline" disabled={pending} onClick={handleClose}>Stäng</Button>
        </footer>
        </>
      )}
    </EditorWorkspace>
  );
}

function BrokerLeadsSection({ app }) {
  const { leads, updateLead } = app;
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [savingLeadIds, setSavingLeadIds] = useState({});
  const [statusOverrides, setStatusOverrides] = useState({});
  async function saveInlineStatus(lead, status) {
    if (!status || savingLeadIds[lead.id]) return;
    const previous = statusOverrides[lead.id] || lead.status || "new";
    setStatusOverrides((prev) => ({ ...prev, [lead.id]: status }));
    setSavingLeadIds((prev) => ({ ...prev, [lead.id]: true }));
    try {
      await updateLead(lead.id, { status });
      setStatusOverrides((prev) => { const next = { ...prev }; delete next[lead.id]; return next; });
    } catch (error) {
      setStatusOverrides((prev) => ({ ...prev, [lead.id]: previous }));
      app.pushToast(error.message || "Kunde inte spara statusen. Försök igen.", "error");
    } finally {
      setSavingLeadIds((prev) => ({ ...prev, [lead.id]: false }));
    }
  }

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


      <section className="grid gap-3 md:grid-cols-3">
        <Card className="gap-0 bg-tint p-4">
          <p className="text-sm text-ink-600">Totala leads</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-strong">{rows.length}</p>
          <p className="mt-2 text-xs text-ink-500">Alla aktiva intresseanmälningar</p>
        </Card>
        <Card className="gap-0 bg-tint p-4">
          <p className="text-sm text-ink-600">Förfallna uppföljningar</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-strong">{overdueCount}</p>
          <p className="mt-2 text-xs text-ink-500">Beräknat i klienten från dagens datum</p>
        </Card>
        <Card className="gap-0 bg-tint p-4">
          <p className="text-sm text-ink-600">Bokade visningar</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-strong">{viewingCount}</p>
          <p className="mt-2 text-xs text-ink-500">Snittmatch {avgScore}%</p>
        </Card>
      </section>

      <Card className="gap-0 py-0 overflow-hidden">
        <div className="border-b border-veil/10 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-ink-500">Intresseanmälningar</p>
              <p className="mt-1 text-sm text-ink-600">Klicka på en rad för att följa upp med hjälp av assistenten och se loggen.</p>
            </div>
            <Badge variant="outline" className="h-auto rounded-full bg-veil/10 px-2 py-0.5 text-[11px] font-semibold text-ink-700">{rows.length} rader</Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-canvas text-[11px] text-ink-500">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 sm:px-5">Hyresgäst</TableHead>
                <TableHead className="px-4 py-3">Objekt</TableHead>
                <TableHead className="px-4 py-3">Status</TableHead>
                <TableHead className="px-4 py-3 text-right">Match</TableHead>
                <TableHead className="px-4 py-3">Tid</TableHead>
                <TableHead className="px-4 py-3 text-right sm:px-5">Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((lead) => {
                const renterName = lead.renter?.name || lead.renter?.email || "Hyresgäst";
                const overdue = isOverdueFollowUp(lead.followUpDate);
                return (
                  <TableRow
                    key={lead.id}
                    className={`cursor-pointer border-t border-veil/10 transition hover:bg-canvas ${
                      overdue ? "shadow-[inset_3px_0_0_rgb(var(--strong))]" : ""
                    }`}
                    onClick={(event) => { if (!event.target.closest("button, [role=combobox], [role=option], [data-slot=select-content]")) setSelectedLeadId(lead.id); }}
                  >
                    <TableCell className="whitespace-normal px-4 py-2 align-top sm:px-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-strong text-xs font-semibold text-on-strong">{initialsForName(renterName)}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink-900">{renterName}</span>
                          <span className="block truncate text-xs text-ink-600">
                            {lead.renter?.profile?.companyName || lead.renter?.profile?.legalEntity || lead.renter?.email || "Hyresgäst"}
                          </span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 align-top font-semibold text-ink-800">{lead.listing?.title || "Objekt"}</TableCell>
                    <TableCell className="whitespace-normal px-4 py-2 align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill status={statusOverrides[lead.id] || lead.status} />
                        {overdue ? (
                          <Badge variant="outline" className="h-auto rounded-full border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                            Förfallen
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className={`px-4 py-2 text-right font-semibold ${scoreClass(Number(lead.fitScore || 0))}`}>
                      {Number(lead.fitScore || 0)}%
                    </TableCell>
                    <TableCell className="px-4 py-2 align-top text-xs font-semibold text-ink-500">{relativeTime(lead.createdAt)}</TableCell>
                    <TableCell className="whitespace-normal px-4 py-2 text-right sm:px-5">
                      <RowActionsMenu
                        label={`Åtgärder för ${renterName}`}
                        actions={[
                          { key: "open", label: "Öppna intresseanmälan", icon: ArrowUpRight, onSelect: () => setSelectedLeadId(lead.id) },
                          {
                            key: "status",
                            label: "Ändra status",
                            icon: CircleDot,
                            disabled: Boolean(savingLeadIds[lead.id]),
                            value: statusOverrides[lead.id] || lead.status || "new",
                            options: leadStatusOptions(),
                            onValueChange: (value) => void saveInlineStatus(lead, value)
                          }
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="whitespace-normal border-t border-veil/10 px-4 py-10 text-center sm:px-5">
                    <p className="font-semibold text-ink-900">Inga intresseanmälningar ännu</p>
                    <p className="mt-1 text-sm text-ink-500">Nya förfrågningar visas här när hyresgäster bokar visning.</p>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </Card>

      {selectedLead ? <LeadDetailPanel lead={selectedLead} app={app} onClose={() => setSelectedLeadId(null)} /> : null}
    </div>
  );
}

function BrokerPanelPage({ app, pathname: routePathname }) {
  // Profil, Inställningar and Hjälp are a window over a page (the account window), not a page: the page is the one it was opened
  // from, and it stays in the shell behind the window.
  const account = parseAccountPath(routePathname, typeof window !== "undefined" ? window.location.hash : "", normalizeAppRole(app?.user?.role));
  const pathname = account ? accountBackgroundPath("/app/broker") : routePathname;
  const sectionKey = sectionFromPath(pathname);
  const currentSectionLabel = BROKER_SECTION_TITLES[sectionKey] || "Översikt";
  const leadCount = Array.isArray(app?.leads) ? app.leads.length : 0;
  const assistantData = useBrokerListingsData(app);

  useEffect(() => {
    const legacy = pathname.match(/^\/app\/broker\/(sparade-objekt|sparade-sokningar)\/?$/);
    if (legacy) navigateTo(`/app/broker/profil#${legacy[1]}`, { replace: true });
  }, [pathname]);

  return (
    <BrokerAssistantProvider
      panel="broker"
      userName={app?.user?.name}
      listings={assistantData.listingPerformance}
      leads={assistantData.ownLeads}
      loading={assistantData.isLoadingListings}
      error={assistantData.listingLoadError}
    >
      <AdminPanelShell
        pathname={pathname}
        navItems={BROKER_NAV_ITEMS}
        bottomNavItems={BROKER_BOTTOM_NAV_ITEMS}
        sectionTitle={currentSectionLabel}
        onLogout={app?.logout}
        badges={{ leads: leadCount }}
        fullBleedContent={sectionKey === "meddelanden" || sectionKey === "assistent"}
        hideAssistantLauncher={sectionKey === "assistent"}
        contentKey={sectionKey}
      >
        {sectionKey === "oversikt" ? <BrokerOverviewSection app={app} /> : null}
        {sectionKey === "assistent" ? <BrokerAssistantPage /> : null}
        {sectionKey === "objekt" ? <BrokerListingsSection app={app} /> : null}
        {sectionKey === "leads" ? <BrokerLeadsSection app={app} /> : null}
        {sectionKey === "prospekt" ? <BrokerProspectsSection app={app} /> : null}
        {sectionKey === "meddelanden" ? <MessagesPage app={app} /> : null}
      </AdminPanelShell>
      {account ? <AccountWindow app={app} base={account.base} pageKey={account.page.key} /> : null}
    </BrokerAssistantProvider>
  );
}

export default BrokerPanelPage;
