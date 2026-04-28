import { useMemo, useState } from "react";
import { formatSek } from "../../lib/formatters";
import {
  ArchiveIcon,
  CalendarIcon,
  CircleDotIcon,
  MoreHorizontalIcon,
  PaperclipIcon,
  PinIcon,
  SearchIcon,
  SendHorizontalIcon,
  SparklesIcon,
  StarIcon,
  TagIcon,
  UserPlusIcon
} from "../../components/icons/UiIcons";

const MESSAGE_LISTING = {
  id: "msg-listing-1",
  title: "Kontorslokal Södermalm",
  district: "Södermalm",
  size: 248,
  priceMonthly: 48500,
  image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=720&h=480&q=80"
};

const BROKER_PROFILE = {
  name: "Anna Lind",
  initials: "AL",
  company: "Nordic Estate",
  role: "Mäklare",
  responseTime: "~2h",
  matchScore: 94
};

const RENTER_PROFILE = {
  name: "Elin Andersson",
  initials: "EA",
  company: "Nordic Product Studio AB",
  teamSize: "18 personer",
  budget: "52 000 kr/mån",
  matchScore: 94
};

const renterConversations = [
  {
    id: "rent-anna",
    counterpartName: "Anna Lind",
    counterpartInitials: "AL",
    company: "Nordic Estate",
    statusDot: "bg-[#2e5f43]",
    favorite: true,
    unreadCount: 6,
    bucket: "all",
    saved: false,
    timestamp: "14:32",
    summary: "Hej Samuel! Tack för din förfrågan. Jag skulle gärna...",
    messages: [
      { id: "r-sys-1", type: "system", text: "Du skickade en förfrågan om Kontorslokal Södermalm", timestamp: "20 april 10:24" },
      { id: "r-1", sender: "self", text: "Hej Anna! Jag är intresserad av er kontorslokal på Södermalm. Vi är ett designteam på 12 personer som letar efter ny lokal till augusti.", timestamp: "20 april 13:47" },
      { id: "r-2", sender: "other", text: "Hej Samuel! Tack för din förfrågan — vad roligt att ni är intresserade. Lokalen passar utmärkt för 10-15 personer och är nyligen renoverad.", timestamp: "22 april 09:12" },
      { id: "r-3", sender: "other", text: "Kan du berätta lite mer om er verksamhet och önskad tillträdesdag?", timestamp: "22 april 09:16" },
      { id: "r-4", sender: "self", text: "Absolut. Vi driver Oldmark Designs, en designstudio. Önskad inflytt 1 augusti med 3-årigt kontrakt om möjligt.", timestamp: "Idag 14:32" },
      { id: "r-5", sender: "other", text: "Perfekt — 3-årigt kontrakt fungerar bra. Jag kan erbjuda visning:\nTisdag 29/4 kl 10:00\nOnsdag 30/4 kl 14:30\nTorsdag 1/5 kl 09:00", timestamp: "Idag 14:48" }
    ],
    suggestions: [
      { id: "rent-s-1", tone: "answer", tag: "SVAR", label: "Föreslå tid", text: "Hej Anna! Tisdag 29/4 kl 10:00 passar bra. Ska vi ses på plats?" },
      { id: "rent-s-2", tone: "question", tag: "FRÅGA", label: "Be om mer info", text: "Tack för tiderna! Innan vi bokar — finns ritning och info om månadskostnader?" },
      { id: "rent-s-3", tone: "answer", tag: "SVAR", label: "Bekräfta intresse", text: "Tack för svar! Lokalen låter perfekt. Vi ser fram emot visningen." }
    ]
  },
  {
    id: "rent-erik",
    counterpartName: "Erik Ström",
    counterpartInitials: "ES",
    company: "Nordic Estate",
    statusDot: "bg-[#2e5f43]",
    favorite: false,
    unreadCount: 1,
    bucket: "unread",
    saved: false,
    timestamp: "09:15",
    summary: "Visningen är bokad till torsdag kl 14:00. Vi ses på plats.",
    messages: []
  },
  {
    id: "rent-maria",
    counterpartName: "Maria Holm",
    counterpartInitials: "MH",
    company: "Nordic Estate",
    statusDot: "bg-[#b08a3d]",
    favorite: true,
    unreadCount: 0,
    bucket: "saved",
    saved: true,
    timestamp: "Igår",
    summary: "Jag har skickat över hyreskontraktet för genomgång.",
    messages: []
  },
  {
    id: "rent-johan",
    counterpartName: "Johan Berg",
    counterpartInitials: "JB",
    company: "Fastighetsbyrån",
    statusDot: "bg-[#9aa7bd]",
    favorite: false,
    unreadCount: 0,
    bucket: "all",
    saved: false,
    timestamp: "20 apr",
    summary: "Tyvärr är lokalen uthyrd. Jag återkommer när vi har liknande.",
    messages: []
  },
  {
    id: "rent-sofia",
    counterpartName: "Sofia Ek",
    counterpartInitials: "SE",
    company: "CBRE Stockholm",
    statusDot: "bg-[#2e5f43]",
    favorite: false,
    unreadCount: 0,
    bucket: "all",
    saved: false,
    timestamp: "18 apr",
    summary: "Vi har några frågor kring er verksamhet innan vi går vidare.",
    messages: []
  },
  {
    id: "rent-henrik",
    counterpartName: "Henrik Lund",
    counterpartInitials: "HL",
    company: "Newsec",
    statusDot: "bg-[#2e5f43]",
    favorite: false,
    unreadCount: 0,
    bucket: "all",
    saved: false,
    timestamp: "15 apr",
    summary: "Visningsförslag: tisdag 29/4 kl 10:00 eller onsdag 30/4 kl 15:00.",
    messages: []
  }
];

const brokerConversations = [
  {
    id: "broker-elin",
    counterpartName: "Elin Andersson",
    counterpartInitials: "EA",
    company: "Nordic Product Studio AB",
    stage: "Ny",
    matchScore: 94,
    pipelineLabel: "Ny",
    pipelineTone: "neutral",
    needsReply: true,
    favorited: true,
    timestamp: "14:32",
    summary: "Vill boka visning av Kontorslokal Södermalm. Elin...",
    messages: [
      { id: "b-sys-1", type: "system", text: "Elin Andersson skickade en förfrågan om Kontorslokal Södermalm", timestamp: "20 april 10:24" },
      { id: "b-1", sender: "other", text: "Hej Anna! Vi är ett produktdesign-team på 18 personer som söker nytt kontor i Södermalm. Er lokal ser perfekt ut — skulle vi kunna boka en visning den här eller nästa vecka?", timestamp: "20 april 10:24" },
      { id: "b-2", sender: "other", text: "Vi har ett behov från 1 augusti och budget upp till ca 52 000 kr/mån. Kan vi få en digital visning först?", timestamp: "22 april 09:12" },
      { id: "b-3", sender: "other", text: "Hej igen! Följer upp — vill gärna boka en tid så snart som möjligt. Tisdag eller onsdag passar oss bäst.", timestamp: "Idag 14:30" }
    ],
    suggestions: [
      { id: "broker-s-1", tone: "answer", tag: "SVAR", label: "Föreslå tider", text: "Hej Elin! Jag kan erbjuda idag 10:00 eller onsdag 14:30 för en digital genomgång. Vilken tid passar bäst?" },
      { id: "broker-s-2", tone: "question", tag: "FRÅGA", label: "Klargör upplägg", text: "Tack! Vill ni börja med digital genomgång eller gå direkt på fysisk visning, och vilka från teamet deltar?" },
      { id: "broker-s-3", tone: "answer", tag: "SVAR", label: "Bekräfta", text: "Tack för tydlig återkoppling. Jag hjälper gärna vidare med nästa steg i processen." }
    ]
  },
  {
    id: "broker-samuel",
    counterpartName: "Samuel Oldmark",
    counterpartInitials: "SO",
    company: "Oldmark Designs AB",
    stage: "Kvalificerad",
    matchScore: 92,
    pipelineLabel: "Kvalificerad",
    pipelineTone: "green",
    needsReply: false,
    favorited: true,
    timestamp: "13:05",
    summary: "Absolut. Vi driver Oldmark Designs, en designstudio...",
    messages: []
  },
  {
    id: "broker-marcus",
    counterpartName: "Marcus Nilsson",
    counterpartInitials: "MN",
    company: "Nilsson & Co",
    stage: "Visning klar",
    matchScore: 88,
    pipelineLabel: "Visning klar",
    pipelineTone: "amber",
    needsReply: false,
    favorited: true,
    timestamp: "11:42",
    summary: "Tack för visningen idag! Vi diskuterar internt och återkommer.",
    messages: []
  },
  {
    id: "broker-linnea",
    counterpartName: "Linnea Åberg",
    counterpartInitials: "LÅ",
    company: "Åberg Consulting",
    stage: "Ej aktuell",
    matchScore: 45,
    pipelineLabel: "Ej aktuell",
    pipelineTone: "gray",
    needsReply: false,
    favorited: false,
    timestamp: "09:20",
    summary: "Tyvärr känns lokalen lite för stor för våra behov just nu.",
    messages: []
  },
  {
    id: "broker-david",
    counterpartName: "David Persson",
    counterpartInitials: "DP",
    company: "Persson Tech",
    stage: "Uppföljning",
    matchScore: 71,
    pipelineLabel: "Uppföljning",
    pipelineTone: "amber",
    needsReply: false,
    favorited: false,
    timestamp: "Igår",
    summary: "Hej! Jag leder en startup på 25 personer och söker vårt nästa...",
    messages: []
  },
  {
    id: "broker-elin-f",
    counterpartName: "Elin Forsberg",
    counterpartInitials: "EF",
    company: "Forsberg Arkitekter",
    stage: "Kontrakt",
    matchScore: 95,
    pipelineLabel: "Kontrakt",
    pipelineTone: "green",
    needsReply: true,
    favorited: true,
    timestamp: "Igår",
    summary: "Vi är redo att skriva kontrakt. Kan ni skicka över underlag?",
    messages: []
  }
];

function suggestionToneClass(tone) {
  if (tone === "question") return "border-[#cad9ec] bg-[#eef3f8] text-[#476a99]";
  return "border-black/10 bg-[#fbfbfa] text-[#0f1930]";
}

function pipelineToneClass(tone) {
  if (tone === "green") return "border-[#cad9ec] bg-[#eef3f8] text-[#0f1930]";
  if (tone === "amber") return "border-black/10 bg-[#fbfbfa] text-ink-700";
  if (tone === "gray") return "border-black/10 bg-[#fffffe] text-ink-600";
  return "border-black/10 bg-[#fffffe] text-ink-700";
}

function MessagesPage({ app }) {
  const activeRole = app?.user?.role === "publisher" ? "broker" : (app?.user?.role || "renter");
  const isBrokerView = activeRole === "broker";
  const [searchQuery, setSearchQuery] = useState("");
  const [activeConversationId, setActiveConversationId] = useState(isBrokerView ? brokerConversations[0].id : renterConversations[0].id);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("all");

  const conversations = isBrokerView ? brokerConversations : renterConversations;

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const haystack = `${conversation.counterpartName} ${conversation.company} ${conversation.summary}`.toLowerCase();
      const matchesQuery = query ? haystack.includes(query) : true;
      if (!matchesQuery) return false;
      if (isBrokerView) {
        if (filter === "unread") return conversation.needsReply;
        if (filter === "needs_reply") return conversation.needsReply;
        return true;
      }
      if (filter === "unread") return conversation.unreadCount > 0;
      if (filter === "saved") return conversation.saved;
      return true;
    });
  }, [conversations, filter, isBrokerView, searchQuery]);

  const activeConversation = filteredConversations.find((item) => item.id === activeConversationId)
    || conversations.find((item) => item.id === activeConversationId)
    || filteredConversations[0]
    || conversations[0];

  const filterTabs = isBrokerView
    ? [
      { key: "all", label: "Alla", count: brokerConversations.length },
      { key: "unread", label: "Olästa", count: brokerConversations.filter((item) => item.needsReply).length }
    ]
    : [
      { key: "all", label: "Alla", count: renterConversations.length },
      { key: "unread", label: "Olästa", count: renterConversations.filter((item) => item.unreadCount > 0).length },
      { key: "saved", label: "Sparade", count: renterConversations.filter((item) => item.saved).length }
    ];

  function useSuggestion(text) {
    setDraft(text);
  }

  function sendDraft() {
    if (!draft.trim()) return;
    setDraft("");
  }

  return (
    <section className="h-full overflow-y-auto bg-[#fffffe] lg:overflow-hidden">
      <div className="mx-auto min-h-full w-full max-w-[1600px] p-4 sm:p-6 lg:h-full">
        <div className="surface grid min-h-full overflow-hidden lg:h-full lg:min-h-0 lg:grid-cols-[312px,minmax(0,1fr)] xl:grid-cols-[312px,minmax(0,1fr),320px]">
          <aside className="flex min-h-0 flex-col border-b border-black/10 bg-[#fbfbfa] lg:border-b-0 lg:border-r">
            <div className="border-b border-black/10 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
                {isBrokerView ? "Inkorg" : "Hyresgäst"}
              </p>
              <h1 className="mt-1 text-2xl font-semibold leading-tight text-[#0f1930]">
                {isBrokerView ? "Konversationer" : "Meddelanden"}
              </h1>
              <label className="relative mt-4 block">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  className="field !rounded-2xl !bg-[#fffffe] pl-9"
                  placeholder={isBrokerView ? "Sök namn, bolag eller annons" : "Sök mäklare eller annons"}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </label>
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
                          : "border border-black/10 bg-[#fffffe] text-ink-700 hover:border-[#0f1930]"
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

            <div className="max-h-[360px] overflow-y-auto lg:min-h-0 lg:max-h-none lg:flex-1">
              {filteredConversations.map((conversation) => {
                const active = conversation.id === activeConversation?.id;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversationId(conversation.id)}
                    className={`message-list-row grid w-full grid-cols-[auto,1fr,auto] gap-3 border-b border-black/5 px-4 py-4 text-left transition ${
                      active ? "bg-[#fffffe] shadow-[inset_3px_0_0_#0f1930]" : "hover:bg-[#fffffe]/80"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2 pt-1">
                      {isBrokerView ? (
                        <StarIcon className={`h-3.5 w-3.5 ${conversation.favorited ? "fill-[#d6b65b] text-[#d6b65b]" : "text-ink-300"}`} />
                      ) : (
                        <StarIcon className={`h-3.5 w-3.5 ${conversation.favorite ? "fill-[#d6b65b] text-[#d6b65b]" : "text-ink-300"}`} />
                      )}
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                        active ? "bg-[#0f1930] text-white" : "bg-[#dbe6f3] text-[#0f1930]"
                      }`}>
                        {conversation.counterpartInitials}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-start gap-2">
                        <span className={`mt-1.5 inline-flex h-1.5 w-1.5 shrink-0 rounded-full ${conversation.statusDot || "bg-[#2e5f43]"}`} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink-900">{conversation.counterpartName}</p>
                          <p className="truncate text-xs text-ink-500">{conversation.company}</p>
                        </div>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-snug text-ink-700">{conversation.summary}</p>
                      {isBrokerView ? (
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${pipelineToneClass(conversation.pipelineTone)}`}>
                            {conversation.pipelineLabel}
                          </span>
                          <span className="text-xs font-semibold text-ink-800">{conversation.matchScore}% match</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] font-semibold text-ink-400">{conversation.timestamp}</p>
                      {!isBrokerView && conversation.unreadCount > 0 ? (
                        <span className="mt-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#0f1930] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {conversation.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="flex min-h-[620px] flex-col border-b border-black/10 bg-[#fffffe] lg:min-h-0 lg:border-b-0 xl:border-r">
            {activeConversation ? (
              <>
                <header className="border-b border-black/10 bg-[#fffffe] px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0f1930] text-sm font-semibold text-white">
                        {activeConversation.counterpartInitials}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-lg font-semibold text-[#0f1930]">{activeConversation.counterpartName}</h2>
                          {isBrokerView ? (
                            <span className="inline-flex rounded-full border border-black/10 bg-[#eef3f8] px-2 py-0.5 text-[11px] font-semibold text-[#476a99]">{activeConversation.stage}</span>
                          ) : (
                            <span className="inline-flex rounded-full border border-black/10 bg-[#eef3f8] px-2 py-0.5 text-[11px] font-semibold text-[#476a99]">{BROKER_PROFILE.role}</span>
                          )}
                        </div>
                        <p className="truncate text-sm text-ink-600">
                          {isBrokerView
                            ? `${activeConversation.company} · ${MESSAGE_LISTING.title}`
                            : `${BROKER_PROFILE.company} · ${MESSAGE_LISTING.title}`}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                          {isBrokerView ? <span>Ansvarig mäklare: {BROKER_PROFILE.name}</span> : null}
                          <span className="inline-flex items-center gap-1">
                            <CircleDotIcon className="h-3.5 w-3.5 fill-[#406947] text-[#406947]" />
                            Aktiv 12 min sedan
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isBrokerView ? (
                        <>
                          <button type="button" className="inline-flex min-h-0 items-center gap-1.5 rounded-full border border-black/10 bg-[#fffffe] px-3 py-2 text-xs font-semibold text-ink-800">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            Visning att boka
                          </button>
                        </>
                      ) : (
                        <button type="button" className="inline-flex min-h-0 items-center gap-1.5 rounded-full border border-black/10 bg-[#fffffe] px-3 py-2 text-xs font-semibold text-ink-800">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          Svara på tider
                        </button>
                      )}
                      <button type="button" className="inline-flex h-10 w-10 min-h-0 items-center justify-center rounded-full border border-black/10 bg-[#fffffe] text-ink-700">
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto bg-[#fffffe] px-4 py-5 sm:px-5">
                  <div className="mx-auto max-w-3xl space-y-4">
                    {activeConversation.messages.length > 0 ? activeConversation.messages.map((message) => {
                      if (message.type === "system") {
                        return (
                          <div key={message.id} className="space-y-2 text-center">
                            <div className="inline-flex rounded-full border border-black/10 bg-[#fffffe] px-5 py-2 text-sm text-ink-600">
                              {message.text}
                            </div>
                            <p className="text-[11px] text-ink-400">{message.timestamp}</p>
                          </div>
                        );
                      }

                      const self = message.sender === "self";
                      return (
                        <div key={message.id} className={`flex ${self ? "justify-end" : "justify-start"}`}>
                          <div className={`flex max-w-[85%] flex-col gap-1 ${self ? "items-end" : "items-start"}`}>
                            <span className="px-1 text-[11px] text-ink-400">{message.timestamp}</span>
                            <div className={`rounded-[26px] px-4 py-3 text-sm leading-relaxed shadow-[0_12px_28px_rgba(15,25,48,0.06)] ${
                              self
                                ? "rounded-br-md bg-[#0f1930] text-white"
                                : "rounded-bl-md border border-black/10 bg-[#fbfbfa] text-ink-800"
                            }`}>
                              {message.text.split("\n").map((line) => (
                                <p key={`${message.id}-${line}`} className="whitespace-pre-wrap">{line}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="pt-12 text-sm text-ink-600">Välj en aktiv konversation för att läsa dialogen.</div>
                    )}
                  </div>
                </div>

                <footer className="border-t border-black/10 bg-[#fffffe] px-4 py-4 sm:px-5">
                  <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-[28px] border border-black/10 bg-[#fbfbfa] p-2">
                    <button type="button" className="inline-flex h-9 w-9 min-h-0 items-center justify-center rounded-full text-ink-500">
                      <PaperclipIcon className="h-4 w-4" />
                    </button>
                    <input
                      className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
                      placeholder={isBrokerView ? "Skriv ett svar..." : "Skriv ett meddelande..."}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                    />
                    <button
                      type="button"
                      aria-label="Skicka"
                      onClick={sendDraft}
                      className="inline-flex h-10 w-10 min-h-0 items-center justify-center rounded-full bg-[#0f1930] text-white"
                    >
                      <SendHorizontalIcon className="h-4 w-4" />
                    </button>
                  </div>
                </footer>
              </>
            ) : null}
          </div>

          <aside className="hidden min-h-0 bg-[#fbfbfa] xl:block">
            <div className="h-full overflow-y-auto p-4">
              <article className="overflow-hidden rounded-3xl border border-black/10 bg-[#fffffe]">
                <img src={MESSAGE_LISTING.image} alt={MESSAGE_LISTING.title} className="h-36 w-full object-cover" loading="lazy" />
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">Matchad annons</p>
                  <h3 className="mt-2 text-base font-semibold text-[#0f1930]">{MESSAGE_LISTING.title}</h3>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-ink-600">
                    <PinIcon className="h-3.5 w-3.5" />
                    {MESSAGE_LISTING.district} · {MESSAGE_LISTING.size} m²
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#0f1930]">{formatSek(MESSAGE_LISTING.priceMonthly)}/mån</p>
                </div>
              </article>

              <article className="mt-3 rounded-3xl border border-black/10 bg-[#fffffe] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
                      {isBrokerView ? "Hyresgäst" : "Mäklare"}
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-[#0f1930]">
                      {isBrokerView ? RENTER_PROFILE.name : BROKER_PROFILE.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">Match</p>
                    <p className="mt-2 text-2xl font-semibold text-[#0f1930]">
                      {isBrokerView ? RENTER_PROFILE.matchScore : BROKER_PROFILE.matchScore}%
                    </p>
                  </div>
                </div>

                {isBrokerView ? (
                  <div className="mt-4 space-y-2">
                    <div className="rounded-2xl border border-black/10 px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Bolag</p>
                      <p className="mt-2 text-sm text-ink-900">{RENTER_PROFILE.company}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl border border-black/10 px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Team</p>
                        <p className="mt-2 text-sm text-ink-900">{RENTER_PROFILE.teamSize}</p>
                      </div>
                      <div className="rounded-2xl border border-black/10 px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Budget</p>
                        <p className="mt-2 text-sm text-ink-900">{RENTER_PROFILE.budget}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm text-ink-900">
                      <span className="font-semibold">{BROKER_PROFILE.name}</span>
                      <span className="font-semibold text-[#0f1930]">{BROKER_PROFILE.matchScore}%</span>
                    </div>
                    <div className="rounded-2xl border border-black/10 px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Byrå</p>
                      <p className="mt-2 text-sm text-ink-900">{BROKER_PROFILE.company}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl border border-black/10 px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Roll</p>
                        <p className="mt-2 text-xs text-ink-900">Ansvarig mäklare</p>
                      </div>
                      <div className="rounded-2xl border border-black/10 px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Svarstid</p>
                        <p className="mt-2 text-sm text-ink-900">{BROKER_PROFILE.responseTime}</p>
                      </div>
                    </div>
                  </div>
                )}
              </article>

              <article className="mt-3 rounded-3xl border border-black/10 bg-[#fffffe] p-4">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-4 w-4 text-[#0f1930]" />
                  <h3 className="text-base font-semibold text-[#0f1930]">Föreslagna svar</h3>
                </div>
                <p className="mt-2 text-sm text-ink-600">Baserat på senaste meddelandet</p>
                <div className="mt-3 space-y-2">
                  {activeConversation?.suggestions?.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => useSuggestion(suggestion.text)}
                      className="message-suggestion-card w-full border border-black/10 bg-[#fbfbfa] p-3 text-left transition hover:bg-[#fffffe]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${suggestionToneClass(suggestion.tone)}`}>
                          {suggestion.tag}
                        </span>
                        <span className="text-[11px] text-ink-500">{suggestion.label}</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-ink-800">{suggestion.text}</p>
                    </button>
                  ))}
                </div>
              </article>

              {isBrokerView ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="inline-flex min-h-0 items-center gap-1.5 rounded-full border border-black/10 bg-[#fffffe] px-3 py-2 text-sm text-ink-700">
                    <TagIcon className="h-3.5 w-3.5" />
                    Märk
                  </button>
                  <button type="button" className="inline-flex min-h-0 items-center gap-1.5 rounded-full border border-black/10 bg-[#fffffe] px-3 py-2 text-sm text-ink-700">
                    <UserPlusIcon className="h-3.5 w-3.5" />
                    Tilldela
                  </button>
                  <button type="button" className="inline-flex min-h-0 items-center gap-1.5 rounded-full border border-black/10 bg-[#fffffe] px-3 py-2 text-sm text-ink-700">
                    <ArchiveIcon className="h-3.5 w-3.5" />
                    Arkivera
                  </button>
                </div>
              ) : (
                <p className="mt-3 inline-flex items-center gap-2 text-xs text-ink-600">
                  <CircleDotIcon className="h-3.5 w-3.5 text-[#406947]" />
                  All kommunikation sker via Lokalflöde.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default MessagesPage;
