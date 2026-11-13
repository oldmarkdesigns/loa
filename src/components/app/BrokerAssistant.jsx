import { useWorkspaceSurface } from "../layout/WorkspaceDesign";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CalendarCheck,
  ChevronRight,
  Eye,
  File as FileIcon,
  FilePen,
  FileText,
  Image as ImageIcon,
  ListChecks,
  Mail,
  Maximize2,
  PhoneCall,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Upload,
  UserPlus,
  X
} from "lucide-react";
import { cn } from "cn";
import { PanelToggleButton } from "../layout/PanelToggleButton";
import AssistantOrb from "./AssistantOrb";
import { AssistantChip, AssistantSuggestions, AssistantThread, assistantOrbState, assistantPhaseLabel, useAssistantThread, useKeepLatestInView } from "./AssistantKit";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { queueImportFiles } from "../../lib/listingImport";
import { navigateTo } from "../../lib/router";
import { answerQuestion, attachmentReply, buildSnapshot, overviewSummary, starterQuestions, suggestActions, suggestedQuestions } from "../../lib/brokerAssistant";
import { capabilities } from "../../lib/brokerHelper";
import { shellCardClass } from "../layout/shellCard";

// The broker's assistant. One conversation lives in the provider, so the button in the corner and the AI-assistent page
// show the same thread, and the card on Översikt shows what the assistant would do next. Answers come from rules over
// the leads and listings the panel already has (see lib/brokerAssistant.js and brokerHelper.js); nothing is sent anywhere.

const EMPTY = [];

// The lib returns icon names, so it stays free of React; these are the pictures they stand for.
const iconByName = {
  "book-open": BookOpen,
  calculator: Calculator,
  "calendar-check": CalendarCheck,
  eye: Eye,
  "file-pen": FilePen,
  "file-text": FileText,
  "list-checks": ListChecks,
  mail: Mail,
  "phone-call": PhoneCall,
  plus: Plus,
  upload: Upload,
  "user-plus": UserPlus
};
const iconFor = (name) => iconByName[name] || Sparkles;
const importIntent = /(annons|läs in|importera|skapa|publicera|lägg upp|ladda)/i;
const BrokerAssistantContext = createContext(null);

export const useBrokerAssistant = () => useContext(BrokerAssistantContext);

export function BrokerAssistantProvider({ panel = "broker", userName = "", listings = EMPTY, leads = EMPTY, loading = false, error = "", children }) {
  const conversation = useAssistantThread();
  const [open, setOpenState] = useState(false);
  const [seen, setSeen] = useState(false);
  // null = follow the screen size; true/false = the person opened or closed the column beside the assistant page.
  const [columnPreference, setColumnPreference] = useState(null);
  const snapshot = useMemo(() => buildSnapshot({ leads, listings, panel, userName }), [leads, listings, panel, userName]);
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const suggestions = useMemo(() => suggestActions(snapshot), [snapshot]);
  const questions = useMemo(() => suggestedQuestions(snapshot), [snapshot]);

  useEffect(() => () => conversation.clearTimers(), []);

  function setOpen(next) {
    setOpenState(next);
    if (next) setSeen(true);
  }

  function go(path) {
    setOpenState(false);
    navigateTo(path);
  }

  function runAction(action) {
    if (action.type === "navigate") {
      go(action.path);
    } else if (action.type === "import") {
      queueImportFiles(action.files);
      go(snapshotRef.current.paths.publish);
    }
  }

  async function copyText(text) {
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      copied = false;
    }
    conversation.reply([{ role: "assistant", text: copied ? "Texten är kopierad." : "Det gick inte att kopiera automatiskt – markera texten och kopiera den själv." }], 200);
  }

  function runChip(chip) {
    const { intent } = chip;
    if (intent.type === "navigate") go(intent.path);
    else if (intent.type === "ask") send({ text: intent.text });
    else if (intent.type === "copy") void copyText(intent.text);
    else if (intent.type === "mailto") window.location.href = intent.href;
  }

  /** Returns true when the message was taken, so the text box knows to clear itself. */
  function send({ text = "", files = EMPTY }) {
    const question = text.trim();
    if ((!question && files.length === 0) || conversation.busy) return false;
    conversation.say(question, files.length > 0 ? { files: files.map((file) => ({ id: `${file.name}-${file.size}-${file.lastModified}`, name: file.name })) } : {});
    const items = [];
    if (question && !(files.length > 0 && importIntent.test(question))) {
      items.push({ role: "assistant", ...answerQuestion(question, snapshotRef.current) });
    }
    if (files.length > 0) {
      const { accepted, ...reply } = attachmentReply(files);
      items.push({ role: "assistant", ...reply });
    }
    conversation.reply(items);
    return true;
  }

  function reset() {
    conversation.clearTimers();
    conversation.setThread([]);
    conversation.setPhase(null);
  }

  const value = {
    panel,
    snapshot,
    firstName: snapshot.firstName,
    suggestions,
    questions,
    columnPreference,
    setColumnPreference,
    loading,
    error,
    summary: error ? "Jag kunde inte hämta dina leads och annonser just nu, så jag kan inte föreslå något än." : overviewSummary(snapshot),
    attentionCount: snapshot.attentionCount,
    thread: conversation.thread,
    phase: conversation.phase,
    busy: conversation.busy,
    open,
    setOpen,
    seen,
    markSeen: () => setSeen(true),
    send,
    reset,
    runAction,
    runChip,
    openAssistantPage: () => go(snapshot.paths.assistant)
  };
  return <BrokerAssistantContext.Provider value={value}>{children}</BrokerAssistantContext.Provider>;
}

// ── Text box ─────────────────────────────────────────────────────────────────────────────────

/** Mirrors the message box in Meddelanden: text, attachments behind a "+", suggestions and a send button. */
function BrokerAssistantComposer({ className, autoFocus = false, placeholder = "Fråga om dina leads och objekt, eller bifoga ett dokument…" }) {
  const assistant = useBrokerAssistant();
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const fileInput = useRef(null);
  const textarea = useRef(null);
  const hasContent = Boolean(text.trim()) || attachments.length > 0;

  useEffect(() => {
    if (autoFocus) textarea.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  function pickAttachment(accept) {
    fileInput.current.accept = accept;
    fileInput.current.click();
  }

  function addAttachments(event) {
    const files = Array.from(event.target.files || []).map((file) => ({ id: crypto.randomUUID(), file }));
    if (files.length) setAttachments((previous) => [...previous, ...files]);
    event.target.value = "";
  }

  function submit(event) {
    event?.preventDefault();
    if (assistant.busy || !hasContent) return;
    if (assistant.send({ text, files: attachments.map((item) => item.file) })) {
      setText("");
      setAttachments([]);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={submit} className={className}>
      <Card className="loa-chat-composer gap-0 overflow-hidden rounded-xl p-0 shadow-none">
        <input ref={fileInput} type="file" multiple hidden tabIndex={-1} onChange={addAttachments} />
        {attachments.length > 0 ? (
          <ul aria-label="Bilagor" className="flex flex-wrap gap-2 px-3 pt-3">
            {attachments.map(({ id, file }) => (
              <li key={id} className="flex max-w-full items-center gap-2 rounded-md border border-border bg-canvas py-1 pl-2 pr-1">
                <FileIcon className="h-4 w-4 shrink-0 text-ink-500" />
                <span className="min-w-0 truncate text-xs" title={file.name}>{file.name}</span>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 min-h-0" aria-label={`Ta bort ${file.name}`} onClick={() => setAttachments((previous) => previous.filter((item) => item.id !== id))}>
                  <X className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        <Textarea
          ref={textarea}
          aria-label="Fråga assistenten"
          placeholder={placeholder}
          rows={2}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          className="max-h-40 min-h-[64px] resize-none border-0 px-4 py-3 shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between gap-2 px-3 pb-3">
          <div className="flex min-w-0 items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon" className="min-h-0" aria-label="Bifoga till meddelande" />}>
                <Plus className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start">
                <DropdownMenuItem onClick={() => pickAttachment("image/*")}><ImageIcon className="h-4 w-4" />Bifoga bild</DropdownMenuItem>
                <DropdownMenuItem onClick={() => pickAttachment("")}><FileIcon className="h-4 w-4" />Bifoga fil</DropdownMenuItem>
                <DropdownMenuItem onClick={() => pickAttachment(".xlsx,.xls,.csv,.pdf,.doc,.docx,.ppt,.pptx,.txt")}><FileText className="h-4 w-4" />Bifoga dokument</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Popover open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
              <PopoverTrigger render={<Button type="button" variant="ghost" size="sm" className="min-h-0" />}>
                <Sparkles className="mr-1.5 h-4 w-4" />
                Förslag
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-80 max-w-[calc(100vw-2rem)] gap-0 p-2 shadow-none">
                <p className="px-2 py-2 text-xs font-medium text-ink-500">Välj en fråga att ställa</p>
                {assistant.questions.map((question) => (
                  <Button
                    key={question}
                    type="button"
                    variant="ghost"
                    className="block h-auto min-h-0 w-full whitespace-normal px-3 py-2.5 text-left text-sm font-normal"
                    onClick={() => {
                      setText(question);
                      setSuggestionsOpen(false);
                      textarea.current?.focus();
                    }}
                  >
                    {question}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
          <Button type="submit" size="sm" className="min-h-0" disabled={assistant.busy || !hasContent}>
            <Send className="mr-2 h-4 w-4" />
            Skicka
          </Button>
        </div>
      </Card>
    </form>
  );
}

// ── What the assistant has to say before anything is asked ───────────────────────────────────

function SuggestionsSkeleton({ rows = 3 }) {
  return (
    <div role="status" aria-label="Läser in förslag" className="w-full space-y-2">
      {Array.from({ length: rows }, (_, row) => (
        <span key={row} className="block h-11 animate-pulse rounded-xl border border-veil/10 bg-veil/[0.03]" />
      ))}
    </div>
  );
}

function AssistantIntro() {
  const assistant = useBrokerAssistant();
  const { loading, error, busy } = assistant;
  return (
    <div className="w-full space-y-4">
      <p className="text-sm leading-relaxed text-ink-800" aria-live="polite">
        {loading ? "Går igenom dina leads och annonser…" : `${assistant.firstName ? `Hej ${assistant.firstName}! ` : ""}${assistant.summary}`}
      </p>
      {loading ? <SuggestionsSkeleton /> : null}
      {!loading && !error ? (
        <AssistantSuggestions items={assistant.suggestions} disabled={busy} onRun={(item) => assistant.runAction(item.action)} label="Föreslagna nästa steg" />
      ) : null}
      <div className="flex flex-wrap gap-2">
        {starterQuestions.map((question) => (
          <AssistantChip key={question} disabled={busy || loading} onClick={() => assistant.send({ text: question })}>{question}</AssistantChip>
        ))}
      </div>
    </div>
  );
}

// ── The card on Översikt: only what to do next ───────────────────────────────────────────────

function BrokerAssistantCardBody({ className }) {
  const assistant = useBrokerAssistant();
  const { loading, error } = assistant;
  const showCount = !loading && !error;

  return (
    <Card aria-label="Assistent" aria-busy={loading} className={cn("gap-0 overflow-hidden p-0 shadow-none", className)}>
      {/* Left-aligned in three blocks (who is speaking, the steps, the way on); the space left over goes between them. */}
      <div className="flex flex-1 flex-col justify-between gap-7 px-6 py-6 sm:px-7 sm:py-7">
        <div>
          <AssistantOrb state={loading ? "searching" : assistantOrbState(assistant.phase)} size={56} engaged={loading || assistant.busy} />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-strong">Nästa steg</h2>
            {showCount ? <Badge variant="secondary" className="h-auto px-3 py-1 text-xs font-semibold">{assistant.attentionCount} att hantera</Badge> : null}
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-ink-600">{loading ? "Går igenom dina leads och annonser…" : assistant.summary}</p>
        </div>

        {loading ? <SuggestionsSkeleton rows={2} /> : null}
        {!loading && !error ? (
          <AssistantSuggestions items={assistant.suggestions.slice(0, 3)} disabled={assistant.busy} onRun={(item) => assistant.runAction(item.action)} label={null} rowClassName="gap-4 px-4 py-3.5" />
        ) : null}

        <Button type="button" variant="ghost" size="sm" className="-ml-2.5 min-h-0 self-start text-ink-600" onClick={assistant.openAssistantPage}>
          Fråga AI-assistenten
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

/** Replaces the "Nästa steg" card. Falls back to its own conversation when no panel above provides one. */
export function BrokerAssistantCard({ listings, leads, loading, error, className }) {
  const context = useBrokerAssistant();
  if (context) return <BrokerAssistantCardBody className={className} />;
  return (
    <BrokerAssistantProvider listings={listings} leads={leads} loading={loading} error={error}>
      <BrokerAssistantCardBody className={className} />
    </BrokerAssistantProvider>
  );
}

// ── The AI-assistent page ────────────────────────────────────────────────────────────────────

const COLUMN_QUERY = "(min-width: 1024px)";

/** True from the width where the column can sit beside the conversation instead of over it. */
function useWideScreen() {
  const [wide, setWide] = useState(() => window.matchMedia?.(COLUMN_QUERY).matches ?? true);
  useEffect(() => {
    const query = window.matchMedia?.(COLUMN_QUERY);
    if (!query) return undefined;
    const update = () => setWide(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return wide;
}

/** One suggested next step: what to do in bold, why or where in a quieter line beneath. */
function NextStepCard({ icon, title, detail, onClick }) {
  const Icon = iconFor(icon);
  return (
    <li>
      <Button
        type="button"
        variant="ghost"
        onClick={onClick}
        className="h-auto min-h-0 w-full items-start justify-start gap-3.5 whitespace-normal rounded-xl border border-veil/10 bg-control px-4 py-3.5 text-left font-normal shadow-none hover:bg-subtle"
      >
        <span aria-hidden="true" className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-veil/[0.05] text-ink-700">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold leading-snug text-ink-900">{title}</span>
          {detail ? <span className="mt-1 block text-[13px] leading-snug text-ink-600">{detail}</span> : null}
        </span>
        <ChevronRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-ink-400" />
      </Button>
    </li>
  );
}

/** The column beside the conversation: what to do next, centred in the space it has. */
function AssistantColumn({ open, onClose }) {
  const assistant = useBrokerAssistant();
  const { loading, error } = assistant;
  return (
    <aside
      id="assistant-column"
      aria-labelledby="assistant-next-steps"
      inert={open ? undefined : ""}
      className={cn(
        "flex shrink-0 flex-col overflow-hidden bg-surface transition-[width,margin] duration-200",
        open
          ? `max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-20 max-lg:w-[min(380px,100%)] max-lg:border-l max-lg:border-veil/10 lg:ml-4 lg:w-[380px] ${shellCardClass}`
          : "max-lg:hidden lg:w-0"
      )}
    >
      <div className="flex h-full w-[380px] max-w-full flex-col overflow-y-auto px-5 pb-8 pt-4">
        <div className="flex justify-end lg:hidden">
          <Button type="button" variant="ghost" size="icon-sm" className="min-h-0" aria-label="Stäng föreslagna nästa steg" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* my-auto centres the block when there is room and lets it scroll from the top when there is not. */}
        <section className="my-auto">
          <h2 id="assistant-next-steps" className="mb-3 text-[11px] font-semibold text-ink-500">Föreslagna nästa steg</h2>
          {loading ? <SuggestionsSkeleton rows={3} /> : null}
          {!loading && error ? <p className="text-sm text-ink-600">Jag kunde inte hämta dina leads och annonser just nu.</p> : null}
          {!loading && !error ? (
            <ul className="space-y-2.5">
              {assistant.suggestions.map((item) => (
                <NextStepCard key={item.id} icon={item.icon} title={item.title || item.text} detail={item.detail} onClick={() => assistant.runAction(item.action)} />
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </aside>
  );
}

/**
 * The whole assistant on a page of its own. It opens on a greeting with the text box right under it and a few
 * things to try; the column beside it holds the suggested next steps. Once the first message is sent the text
 * box moves to the bottom, under the conversation.
 */
export function BrokerAssistantPage() {
  const assistant = useBrokerAssistant();
  const scrollRef = useRef(null);
  const listRef = useRef(null);
  const wide = useWideScreen();
  useKeepLatestInView(scrollRef, `${assistant?.thread.length}:${assistant?.phase}`, listRef);
  if (!assistant) return null;
  const { loading, busy, thread } = assistant;
  const empty = thread.length === 0;
  const columnOpen = assistant.columnPreference ?? wide;
  const orbState = loading ? "searching" : assistantOrbState(assistant.phase);

  return (
    <section aria-label="AI-assistent" className="relative flex h-full min-h-0 bg-canvas p-4">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 px-2">
          {empty ? null : (
            <>
              <AssistantOrb state={orbState} size={32} engaged={busy} />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight text-ink-900">AI-assistent</p>
                <p className="text-xs text-ink-500" aria-live="polite">{assistantPhaseLabel(assistant.phase) || "Redo att hjälpa dig"}</p>
              </div>
            </>
          )}
          <div className="ml-auto flex items-center gap-2">
            {empty ? null : (
              <Button type="button" variant="outline" size="sm" className="min-h-0 bg-control shadow-none" disabled={busy} onClick={assistant.reset}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Ny konversation
              </Button>
            )}
            {/* The same button as the side menu's fold button: the plain icon at rest, a hairline and a chevron in the direction of the
                click when it is pointed at. The name stays "Föreslagna nästa steg" (aria-expanded says which way it is); the tooltip says what a click does. */}
            <PanelToggleButton
              side="right"
              open={columnOpen}
              label={columnOpen ? "Dölj föreslagna nästa steg" : "Visa föreslagna nästa steg"}
              aria-label="Föreslagna nästa steg"
              aria-expanded={columnOpen}
              aria-controls="assistant-column"
              className="size-9"
              iconClassName="size-4"
              onClick={() => assistant.setColumnPreference(!columnOpen)}
            />
          </div>
        </header>

        <div ref={scrollRef} role={empty ? undefined : "log"} aria-label={empty ? undefined : "Samtal med assistenten"} className="relative min-h-0 flex-1 overflow-y-auto">
          {empty ? (
            <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center px-4 pb-24 text-center sm:px-6">
              <AssistantOrb state={orbState} size={64} engaged={loading || busy} />
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-strong">
                {assistant.firstName ? `Hej ${assistant.firstName}! ` : "Hej! "}Vad kan jag hjälpa dig med?
              </h1>
              <BrokerAssistantComposer autoFocus className="mt-7 w-full text-left" placeholder="Fråga vad som helst…" />
              <ul aria-label="Förslag på frågor" className="mt-4 flex flex-wrap justify-center gap-2">
                {capabilities.map((item) => {
                  const Icon = iconFor(item.icon);
                  return (
                    <li key={item.id}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 min-h-0 gap-2 rounded-full bg-control px-3.5 text-sm font-medium shadow-none"
                        title={item.text}
                        disabled={busy}
                        onClick={() => assistant.send({ text: item.ask })}
                      >
                        <Icon aria-hidden="true" className="h-4 w-4 text-ink-500" />
                        {item.title}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl px-4 pb-6 sm:px-8">
              <div ref={listRef} className="space-y-4">
                <AssistantThread thread={thread} busy={busy} onChip={assistant.runChip} onSuggestion={(item) => assistant.runAction(item.action)} />
              </div>
            </div>
          )}
        </div>

        {empty ? null : (
          <footer className="shrink-0 bg-canvas px-4 pt-2 duration-300 animate-in fade-in-0 slide-in-from-bottom-1 sm:px-8">
            <div className="mx-auto w-full max-w-3xl">
              <BrokerAssistantComposer autoFocus placeholder="Fortsätt konversationen…" />
              <p className="mt-2 text-[10px] text-ink-500">Assistenten svarar utifrån dina leads och annonser. Kontrollera utkast innan du skickar eller publicerar dem.</p>
            </div>
          </footer>
        )}
      </div>

      <AssistantColumn open={columnOpen} onClose={() => assistant.setColumnPreference(false)} />
    </section>
  );
}

// ── The button in the corner ─────────────────────────────────────────────────────────────────

function BrokerAssistantPanel({ onClose }) {
  const workspaceSurface = useWorkspaceSurface();
  const assistant = useBrokerAssistant();
  const scrollRef = useRef(null);
  useKeepLatestInView(scrollRef, `${assistant.thread.length}:${assistant.phase}`);

  function handleKeyDown(event) {
    // Menus opened from inside the panel render elsewhere in the page; their Escape is theirs to handle.
    if (event.key === "Escape" && !event.defaultPrevented && event.currentTarget.contains(event.target)) {
      event.stopPropagation();
      onClose();
    }
  }

  return (
    <section
      role="dialog"
      aria-modal="false"
      data-loa-surface={workspaceSurface}
      aria-label="Assistent"
      onKeyDown={handleKeyDown}
      className="fixed bottom-[5.5rem] right-4 z-40 flex h-[min(580px,calc(100dvh-10rem))] w-[min(400px,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-veil/10 bg-surface text-strong duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-3 sm:bottom-24 sm:right-6"
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-veil/10 px-4 py-3">
        <AssistantOrb state={assistant.loading ? "searching" : assistantOrbState(assistant.phase)} size={40} engaged={assistant.busy} />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-ink-900">Assistent</h2>
          <p className="truncate text-xs text-ink-500" aria-live="polite">{assistantPhaseLabel(assistant.phase) || "Redo att hjälpa dig"}</p>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" className="min-h-0 shrink-0" aria-label="Öppna som helsida" title="Öppna som helsida" onClick={assistant.openAssistantPage}>
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" className="min-h-0 shrink-0" aria-label="Stäng assistenten" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div ref={scrollRef} role="log" aria-label="Samtal med assistenten" className="relative min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <AssistantIntro />
        <AssistantThread thread={assistant.thread} busy={assistant.busy} onChip={assistant.runChip} onSuggestion={(item) => assistant.runAction(item.action)} />
      </div>

      <div className="shrink-0 border-t border-veil/10 p-3">
        <BrokerAssistantComposer autoFocus />
      </div>
    </section>
  );
}

/** Fixed button in the bottom-right corner of the panel: the orb in a glass avatar. Opens the assistant. `hidden` on the assistant's own page. */
export function BrokerAssistantLauncher({ hidden = false }) {
  const workspaceSurface = useWorkspaceSurface("launcher");
  const assistant = useBrokerAssistant();
  const trigger = useRef(null);
  const mustClose = hidden && Boolean(assistant?.open);

  // On the assistant's own page the button is gone: nothing left open, and nothing left to point out.
  useEffect(() => {
    if (!hidden) return;
    assistant?.markSeen();
    if (mustClose) assistant.setOpen(false);
  }, [hidden, mustClose]);

  if (!assistant || hidden || typeof document === "undefined") return null;
  const { open, setOpen, busy, phase, attentionCount, seen } = assistant;
  const showBadge = !open && !seen && attentionCount > 0;

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  return createPortal(
    <>
      {open ? <BrokerAssistantPanel onClose={close} /> : null}
      <Button
        ref={trigger}
        data-loa-surface={workspaceSurface}
        type="button"
        variant="ghost"
        aria-label={open ? "Stäng assistenten" : "Öppna assistenten"}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Assistent"
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) close();
        }}
        className="fixed bottom-4 right-4 z-40 h-auto min-h-0 w-auto !rounded-full p-0 transition-transform duration-200 hover:scale-105 hover:bg-transparent active:scale-95 aria-expanded:bg-transparent sm:bottom-6 sm:right-6"
      >
        <Avatar className="liquid-glass size-14">
          <AvatarFallback className="bg-transparent">
            <AssistantOrb state={assistantOrbState(phase)} size={36} engaged={busy} />
          </AvatarFallback>
        </Avatar>
        {showBadge ? (
          <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e5484d] px-1 text-[11px] font-semibold leading-none text-white ring-2 ring-surface">
            {attentionCount}
          </span>
        ) : null}
      </Button>
    </>,
    document.body
  );
}
