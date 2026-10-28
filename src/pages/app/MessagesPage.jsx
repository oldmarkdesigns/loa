import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Search, Send, Sparkles, Star, MessageSquare, Archive, Building2, Plus, Image, File, FileText, X } from "lucide-react";
import { normalizeAppRole } from "../../lib/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const MESSAGE_LISTING = {
  id: "msg-listing-1",
  title: "Kontorslokal Södermalm",
  address: "Maria Prästgårdsgata",
  district: "Södermalm",
  size: 248,
  priceMonthly: 48500,
  image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=720&h=480&q=80",
};

const BROKER_PROFILE = {
  name: "Anna Lind",
  initials: "AL",
  company: "Nordic Estate",
  role: "Mäklare",
  responseTime: "~2h",
};

const renterConversations = [
  {
    id: "rent-anna",
    counterpartName: "Anna Lind",
    counterpartInitials: "AL",
    company: "Nordic Estate",
    statusDot: "bg-[#2e5f43]",
    unreadCount: 6,
    bucket: "all",
    saved: false,
    timestamp: "14:32",
    summary: "Hej Samuel! Tack för din förfrågan. Jag skulle gärna...",
    messages: [
      { id: "r-sys-1", type: "system", text: "Du skickade en förfrågan om Kontorslokal Södermalm", timestamp: "20 april 10:24" },
      {
        id: "r-1",
        sender: "self",
        text: "Hej Anna! Jag är intresserad av er kontorslokal på Södermalm. Vi är ett designteam på 12 personer som letar efter ny lokal till augusti.",
        timestamp: "20 april 13:47",
      },
      {
        id: "r-2",
        sender: "other",
        text: "Hej Samuel! Tack för din förfrågan — vad roligt att ni är intresserade. Lokalen passar utmärkt för 10-15 personer och är nyligen renoverad.",
        timestamp: "22 april 09:12",
      },
      {
        id: "r-3",
        sender: "other",
        text: "Kan du berätta lite mer om er verksamhet och önskad tillträdesdag?",
        timestamp: "22 april 09:16",
      },
      {
        id: "r-4",
        sender: "self",
        text: "Absolut. Vi driver Oldmark Designs, en designstudio. Önskad inflytt 1 augusti med 3-årigt kontrakt om möjligt.",
        timestamp: "Idag 14:32",
      },
      {
        id: "r-5",
        sender: "other",
        text: "Perfekt — 3-årigt kontrakt fungerar bra. Jag kan erbjuda visning:\nTisdag 29/4 kl 10:00\nOnsdag 30/4 kl 14:30\nTorsdag 1/5 kl 09:00",
        timestamp: "Idag 14:48",
      },
    ],
    suggestions: [
      {
        id: "rent-s-1",
        tone: "answer",
        tag: "SVAR",
        label: "Föreslå tid",
        text: "Hej Anna! Tisdag 29/4 kl 10:00 passar bra. Ska vi ses på plats?",
      },
      {
        id: "rent-s-2",
        tone: "question",
        tag: "FRÅGA",
        label: "Be om mer info",
        text: "Tack för tiderna! Innan vi bokar — finns ritning och info om månadskostnader?",
      },
      {
        id: "rent-s-3",
        tone: "answer",
        tag: "SVAR",
        label: "Bekräfta intresse",
        text: "Tack för svar! Lokalen låter perfekt. Vi ser fram emot visningen.",
      },
    ],
  },
  {
    id: "rent-erik",
    counterpartName: "Erik Ström",
    counterpartInitials: "ES",
    company: "Nordic Estate",
    statusDot: "bg-[#2e5f43]",
    unreadCount: 1,
    bucket: "unread",
    saved: false,
    timestamp: "09:15",
    summary: "Visningen är bokad till torsdag kl 14:00. Vi ses på plats.",
    messages: [],
  },
  {
    id: "rent-maria",
    counterpartName: "Maria Holm",
    counterpartInitials: "MH",
    company: "Nordic Estate",
    statusDot: "bg-[#b08a3d]",
    unreadCount: 0,
    bucket: "saved",
    saved: true,
    timestamp: "Igår",
    summary: "Jag har skickat över hyreskontraktet för genomgång.",
    messages: [],
  },
  {
    id: "rent-johan",
    counterpartName: "Johan Berg",
    counterpartInitials: "JB",
    company: "Fastighetsbyrån",
    statusDot: "bg-[#9aa7bd]",
    unreadCount: 0,
    bucket: "all",
    saved: false,
    timestamp: "20 apr",
    summary: "Tyvärr är lokalen uthyrd. Jag återkommer när vi har liknande.",
    messages: [],
  },
  {
    id: "rent-sofia",
    counterpartName: "Sofia Ek",
    counterpartInitials: "SE",
    company: "CBRE Stockholm",
    statusDot: "bg-[#2e5f43]",
    unreadCount: 0,
    bucket: "all",
    saved: false,
    timestamp: "18 apr",
    summary: "Vi har några frågor kring er verksamhet innan vi går vidare.",
    messages: [],
  },
  {
    id: "rent-henrik",
    counterpartName: "Henrik Lund",
    counterpartInitials: "HL",
    company: "Newsec",
    statusDot: "bg-[#2e5f43]",
    unreadCount: 0,
    bucket: "all",
    saved: false,
    timestamp: "15 apr",
    summary: "Visningsförslag: tisdag 29/4 kl 10:00 eller onsdag 30/4 kl 15:00.",
    messages: [],
  },
];

const brokerConversations = [
  {
    id: "broker-elin",
    counterpartName: "Elin Andersson",
    counterpartInitials: "EA",
    company: "Nordic Product Studio AB",
    stage: "Ny",
    pipelineLabel: "Ny",
    pipelineTone: "neutral",
    needsReply: true,
    timestamp: "14:32",
    summary: "Vill boka visning av Kontorslokal Södermalm. Elin...",
    messages: [
      {
        id: "b-sys-1",
        type: "system",
        text: "Elin Andersson skickade en förfrågan om Kontorslokal Södermalm",
        timestamp: "20 april 10:24",
      },
      {
        id: "b-1",
        sender: "other",
        text: "Hej Anna! Vi är ett produktdesign-team på 18 personer som söker nytt kontor i Södermalm. Er lokal ser perfekt ut — skulle vi kunna boka en visning den här eller nästa vecka?",
        timestamp: "20 april 10:24",
      },
      {
        id: "b-2",
        sender: "other",
        text: "Vi har ett behov från 1 augusti och budget upp till ca 52 000 kr/mån. Kan vi få en digital visning först?",
        timestamp: "22 april 09:12",
      },
      {
        id: "b-3",
        sender: "other",
        text: "Hej igen! Följer upp — vill gärna boka en tid så snart som möjligt. Tisdag eller onsdag passar oss bäst.",
        timestamp: "Idag 14:30",
      },
    ],
    suggestions: [
      {
        id: "broker-s-1",
        tone: "answer",
        tag: "SVAR",
        label: "Föreslå tider",
        text: "Hej Elin! Jag kan erbjuda idag 10:00 eller onsdag 14:30 för en digital genomgång. Vilken tid passar bäst?",
      },
      {
        id: "broker-s-2",
        tone: "question",
        tag: "FRÅGA",
        label: "Klargör upplägg",
        text: "Tack! Vill ni börja med digital genomgång eller gå direkt på fysisk visning, och vilka från teamet deltar?",
      },
      {
        id: "broker-s-3",
        tone: "answer",
        tag: "SVAR",
        label: "Bekräfta",
        text: "Tack för tydlig återkoppling. Jag hjälper gärna vidare med nästa steg i processen.",
      },
    ],
  },
  {
    id: "broker-samuel",
    counterpartName: "Samuel Oldmark",
    counterpartInitials: "SO",
    company: "Oldmark Designs AB",
    stage: "Kvalificerad",
    pipelineLabel: "Kvalificerad",
    pipelineTone: "green",
    needsReply: false,
    timestamp: "13:05",
    summary: "Absolut. Vi driver Oldmark Designs, en designstudio...",
    messages: [],
  },
  {
    id: "broker-marcus",
    counterpartName: "Marcus Nilsson",
    counterpartInitials: "MN",
    company: "Nilsson & Co",
    stage: "Visning klar",
    pipelineLabel: "Visning klar",
    pipelineTone: "amber",
    needsReply: false,
    timestamp: "11:42",
    summary: "Tack för visningen idag! Vi diskuterar internt och återkommer.",
    messages: [],
  },
  {
    id: "broker-linnea",
    counterpartName: "Linnea Åberg",
    counterpartInitials: "LÅ",
    company: "Åberg Consulting",
    stage: "Ej aktuell",
    pipelineLabel: "Ej aktuell",
    pipelineTone: "gray",
    needsReply: false,
    timestamp: "09:20",
    summary: "Tyvärr känns lokalen lite för stor för våra behov just nu.",
    messages: [],
  },
  {
    id: "broker-david",
    counterpartName: "David Persson",
    counterpartInitials: "DP",
    company: "Persson Tech",
    stage: "Uppföljning",
    pipelineLabel: "Uppföljning",
    pipelineTone: "amber",
    needsReply: false,
    timestamp: "Igår",
    summary: "Hej! Jag leder en startup på 25 personer och söker vårt nästa...",
    messages: [],
  },
  {
    id: "broker-elin-f",
    counterpartName: "Elin Forsberg",
    counterpartInitials: "EF",
    company: "Forsberg Arkitekter",
    stage: "Kontrakt",
    pipelineLabel: "Kontrakt",
    pipelineTone: "green",
    needsReply: true,
    timestamp: "Igår",
    summary: "Vi är redo att skriva kontrakt. Kan ni skicka över underlag?",
    messages: [],
  },
];

export default function MessagesPage({ app }) {
  const role = normalizeAppRole(app?.user?.role);
  const isBroker = role === "broker" || role === "company_admin";
  const conversations = isBroker ? brokerConversations : renterConversations;
  const [selectedId, setSelectedId] = useState(null);
  const [mobileChat, setMobileChat] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [favorites, setFavorites] = useState({});
  const [archived, setArchived] = useState({});
  const [statuses, setStatuses] = useState({});
  const [drafts, setDrafts] = useState({});
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const composer = useRef(null);
  const attachmentInput = useRef(null);
  const attachmentTarget = useRef(null);
  const [attachments, setAttachments] = useState({});
  function pickAttachment(accept) {
    attachmentTarget.current = active.id;
    attachmentInput.current.accept = accept;
    attachmentInput.current.click();
  }
  function addAttachments(event) {
    const files = Array.from(event.target.files || []).map((file) => ({ id: crypto.randomUUID(), file }));
    const id = attachmentTarget.current;
    if (files.length && id) setAttachments((previous) => ({ ...previous, [id]: [...(previous[id] || []), ...files] }));
    event.target.value = "";
  }
  const active = conversations.find((item) => item.id === selectedId) || conversations[0];
  const draft = drafts[active.id] || "";
  const activeAttachments = attachments[active.id] || [];
  const unread = (item) => (isBroker ? item.needsReply : item.unreadCount > 0);
  const visible = useMemo(
    () =>
      conversations.filter((item) => {
        if (filter === "archived" ? !archived[item.id] : archived[item.id]) return false;
        if (filter === "unread" && !unread(item)) return false;
        if (filter === "saved" && !favorites[item.id]) return false;
        return `${item.counterpartName} ${item.company} ${item.summary}`
          .toLocaleLowerCase("sv")
          .includes(query.trim().toLocaleLowerCase("sv"));
      }),
    [conversations, query, filter, favorites, archived],
  );
  useEffect(() => {
    setSuggestionsOpen(false);
  }, [active.id]);
  function updateDraft(value) {
    setDrafts((prev) => ({ ...prev, [active.id]: value }));
  }
  function sendDraft(event) {
    event.preventDefault();
    if (!draft.trim() && !activeAttachments.length) return;
    // This page currently uses demonstration conversations, not a messaging API.
    // Keep the draft instead of silently discarding an unsent message.
    app.pushToast?.("Meddelandet är inte skickat. Meddelandefunktionen är ännu inte ansluten.", "info");
  }
  return (
    <section aria-label="Meddelanden" className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col bg-canvas p-4">
      <div className="grid min-h-0 flex-1 gap-5 md:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className={`${mobileChat ? "hidden md:flex" : "flex"} min-h-0 flex-col gap-0 overflow-hidden bg-surface p-0`}>
          <header className="space-y-4 border-b border-border p-5">
            <h2 className="text-base font-semibold text-ink-900">Konversationer</h2>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-400" />
              <Input
                aria-label="Sök konversationer"
                placeholder="Sök namn eller företag…"
                className="bg-control pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <ToggleGroup
              aria-label="Filtrera konversationer"
              value={[filter]}
              onValueChange={(value) => value[0] && setFilter(value[0])}
              className="flex w-full gap-1"
            >
              {[
                ["all", "Alla"],
                ["unread", "Olästa"],
                ["saved", "Favoriter"],
                ["archived", "Arkiv"],
              ].map(([value, label]) => (
                <ToggleGroupItem key={value} value={value} className="min-w-0 flex-1 px-2 text-xs">
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </header>
          <nav aria-label="Konversationer" className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {visible.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                aria-current={active.id === item.id ? "true" : undefined}
                onClick={() => {
                  setSelectedId(item.id);
                  setMobileChat(true);
                }}
                className={`h-auto w-full justify-start gap-3 whitespace-normal rounded-lg p-3 text-left font-normal ${active.id === item.id ? "bg-tint-2 hover:bg-tint-2" : "hover:bg-control"}`}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-tint-3 text-xs font-medium text-ink-900">{item.counterpartInitials}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{item.counterpartName}</span>
                    <span className="shrink-0 text-[10px] text-ink-500">{item.timestamp}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ink-500">{item.company}</span>
                  <span className="mt-2 flex items-center gap-2">
                    <span className="truncate text-xs text-ink-600">{item.summary}</span>
                    {unread(item) ? <span aria-label="Oläst" className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" /> : null}
                  </span>
                </span>
              </Button>
            ))}
            {!visible.length && (
              <div className="px-5 py-12 text-center">
                <Search className="mx-auto mb-3 h-5 w-5 text-ink-400" />
                <p className="text-sm font-medium">Inga konversationer</p>
                <p className="mt-1 text-xs text-ink-500">Prova ett annat sökord eller filter.</p>
              </div>
            )}
          </nav>
          <p className="border-t border-border px-5 py-3 text-xs text-ink-500">Demokonversationer · inga meddelanden skickas</p>
        </Card>
        <Card className={`${mobileChat ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-col gap-0 overflow-hidden bg-surface p-0`}>
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Till konversationer"
                className="md:hidden"
                onClick={() => setMobileChat(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-strong text-xs text-on-strong">{active.counterpartInitials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">{active.counterpartName}</h2>
                <p className="mt-0.5 truncate text-xs text-ink-500">{active.company}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {isBroker && (
                <Select
                  value={statuses[active.id] || active.stage}
                  onValueChange={(value) => setStatuses((prev) => ({ ...prev, [active.id]: value }))}
                >
                  <SelectTrigger aria-label="Konversationsstatus" className="mr-2 h-8 w-[145px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Ny", "Kvalificerad", "Visning klar", "Uppföljning", "Kontrakt", "Ej aktuell"].map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={favorites[active.id] ? "Ta bort favorit" : "Favoritmarkera"}
                aria-pressed={!!favorites[active.id]}
                onClick={() => setFavorites((prev) => ({ ...prev, [active.id]: !prev[active.id] }))}
              >
                <Star className={`h-4 w-4 ${favorites[active.id] ? "fill-current" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={archived[active.id] ? "Återställ konversation" : "Arkivera konversation"}
                onClick={() => {
                  setArchived((prev) => ({ ...prev, [active.id]: !prev[active.id] }));
                  setMobileChat(false);
                }}
              >
                <Archive className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <div className="flex items-center gap-3 border-b border-border bg-canvas px-4 py-3 lg:px-6">
            <Building2 className="h-4 w-4 shrink-0 text-ink-500" />
            <p className="min-w-0 truncate text-xs">
              <span className="font-medium">{MESSAGE_LISTING.title}</span>
              <span className="ml-2 text-ink-500">
                {MESSAGE_LISTING.size} m² · {MESSAGE_LISTING.district}
              </span>
            </p>
          </div>
          <div role="log" aria-label="Meddelandehistorik" className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-5">
              {active.messages.map((message) =>
                message.type === "system" ? (
                  <p key={message.id} className="mx-auto max-w-sm py-3 text-center text-xs leading-relaxed text-ink-500">
                    {message.text}
                    <span className="mt-1 block text-[10px]">{message.timestamp}</span>
                  </p>
                ) : (
                  <div key={message.id} className={`flex ${message.sender === "self" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[88%] space-y-1.5 sm:max-w-[78%]">
                      <Card
                        className={`gap-0 whitespace-pre-wrap break-words rounded-xl px-4 py-3 text-sm leading-relaxed shadow-none ${message.sender === "self" ? "rounded-br-sm border-transparent bg-strong text-on-strong" : "rounded-bl-sm bg-canvas text-ink-800"}`}
                      >
                        {message.text}
                      </Card>
                      <p className={`px-1 text-[10px] text-ink-500 ${message.sender === "self" ? "text-right" : ""}`}>
                        {message.sender === "self" ? "Du" : active.counterpartName.split(" ")[0]} · {message.timestamp}
                      </p>
                    </div>
                  </div>
                ),
              )}
              {!active.messages.length && (
                <div className="py-16 text-center">
                  <MessageSquare className="mx-auto mb-3 h-7 w-7 text-ink-400" />
                  <p className="text-sm font-medium">Ingen meddelandehistorik</p>
                  <p className="mt-1 text-xs text-ink-500">Det finns inga meddelanden i den här demokonversationen.</p>
                </div>
              )}
            </div>
          </div>
          <footer className="shrink-0 border-t border-border px-4 py-4 lg:px-6">
            <form onSubmit={sendDraft} className="mx-auto max-w-3xl">
              <Card className="gap-0 overflow-hidden rounded-xl p-0 shadow-none focus-within:ring-2 focus-within:ring-brand-200">
                <input ref={attachmentInput} type="file" multiple hidden tabIndex={-1} onChange={addAttachments} />
                {activeAttachments.length > 0 && <ul aria-label="Bilagor" className="flex flex-wrap gap-2 px-3 pt-3">
                  {activeAttachments.map(({ id, file }) => <li key={id} className="flex max-w-full items-center gap-2 rounded-md border border-border bg-canvas py-1 pl-2 pr-1">
                    <File className="h-4 w-4 shrink-0 text-ink-500" />
                    <span className="min-w-0 truncate text-xs" title={file.name}>{file.name}</span>
                    <Button type="button" variant="ghost" size="icon" aria-label={`Ta bort ${file.name}`} onClick={() => setAttachments((prev) => ({ ...prev, [active.id]: prev[active.id].filter((item) => item.id !== id) }))}><X className="h-3 w-3" /></Button>
                  </li>)}
                </ul>}
                <Textarea
                  ref={composer}
                  aria-label="Meddelande"
                  placeholder={`Skriv till ${active.counterpartName.split(" ")[0]}…`}
                  rows={2}
                  value={draft}
                  onChange={(event) => updateDraft(event.target.value)}
                  className="max-h-40 min-h-[64px] resize-y border-0 px-4 py-3 shadow-none focus-visible:ring-0"
                />
                <div className="flex items-center justify-between gap-2 px-3 pb-3">
                  <div className="flex min-w-0 items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon" aria-label="Bifoga till meddelande" />}><Plus className="h-4 w-4" /></DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start">
                      <DropdownMenuItem onClick={() => pickAttachment("image/*")}><Image className="h-4 w-4" />Bifoga bild</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => pickAttachment("")}><File className="h-4 w-4" />Bifoga fil</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => pickAttachment(".pdf,.doc,.docx,.odt,.rtf,.txt")}><FileText className="h-4 w-4" />Bifoga dokument</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Popover open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
                    <PopoverTrigger render={<Button type="button" variant="ghost" size="sm" disabled={!active.suggestions?.length} />}>
                      <Sparkles className="mr-1.5 h-4 w-4" />
                      Svarsförslag
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="w-80 max-w-[calc(100vw-2rem)] p-2">
                      <p className="px-2 py-2 text-xs font-medium text-ink-500">Välj ett utkast att anpassa</p>
                      {active.suggestions?.map((item) => (
                        <Button
                          key={item.id}
                          type="button"
                          variant="ghost"
                          className="block h-auto w-full whitespace-normal p-3 text-left"
                          onClick={() => {
                            updateDraft(item.text);
                            setSuggestionsOpen(false);
                            composer.current?.focus();
                          }}
                        >
                          <span className="block text-xs font-semibold">{item.label}</span>
                          <span className="mt-1 block text-xs font-normal leading-relaxed text-ink-500">{item.text}</span>
                        </Button>
                      ))}
                    </PopoverContent>
                  </Popover>
                  </div>
                  <Button type="submit" size="sm" disabled={!draft.trim() && !activeAttachments.length}>
                    <Send className="mr-2 h-4 w-4" />
                    Skicka
                  </Button>
                </div>
              </Card>
              <p className="mt-2 text-[10px] text-ink-500">Demoläge. Svar, status och favoriter sparas inte permanent.</p>
            </form>
          </footer>
        </Card>
      </div>
    </section>
  );
}
