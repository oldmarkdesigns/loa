import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Paperclip } from "lucide-react";
import { cn } from "cn";
import AssistantOrb from "./AssistantOrb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

// Shared building blocks for the assistants (leads, listing editor): one conversation model, one look.

const LISTEN_MS = 320;
const THINK_MS = 650;
export const ASSISTANT_LISTEN_MS = LISTEN_MS;
export const ASSISTANT_THINK_MS = THINK_MS;
const orbStateByPhase = { listening: "listening", thinking: "composing", saving: "connecting" };
const phaseLabels = { listening: "Lyssnar…", thinking: "Tänker…", saving: "Sparar…" };
export const assistantOrbState = (phase) => orbStateByPhase[phase] || "breathing";
export const assistantPhaseLabel = (phase) => phaseLabels[phase] || null;

/**
 * The conversation itself: messages, the phase the assistant is in (listening → thinking → answering), and the helpers
 * that add to it. `reply()` makes the assistant pause for a moment first, so answers arrive rather than pop.
 */
export function useAssistantThread() {
  const [thread, setThread] = useState([]);
  const [phase, setPhase] = useState(null);
  const timers = useRef([]);
  const idCounter = useRef(0);

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }

  function nextId() {
    idCounter.current += 1;
    return `assistant-${idCounter.current}`;
  }

  function reply(items, delay = THINK_MS) {
    clearTimers();
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setPhase(reduced ? "thinking" : "listening");
    timers.current.push(window.setTimeout(() => setPhase("thinking"), reduced ? 0 : LISTEN_MS));
    timers.current.push(window.setTimeout(() => {
      setThread((prev) => [...prev, ...items.map((item) => ({ id: nextId(), ...item }))]);
      setPhase(null);
    }, reduced ? 0 : LISTEN_MS + delay));
  }

  function say(text, extra = {}) {
    setThread((prev) => [...prev, { id: nextId(), role: "user", text, ...extra }]);
  }

  function toggleIncluded(id, key, checked) {
    setThread((prev) => prev.map((item) => (item.id === id ? { ...item, included: { ...item.included, [key]: checked } } : item)));
  }

  function patchItem(id, patch) {
    setThread((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  return { thread, setThread, phase, setPhase, busy: phase !== null, reply, say, clearTimers, toggleIncluded, patchItem };
}

/**
 * Keeps the newest message in view, starting at its first line when it is taller than the space available.
 * The messages are the children of `listRef` (default: the scrolling element itself).
 */
export function useKeepLatestInView(ref, key, listRef) {
  useEffect(() => {
    const container = ref.current;
    const latest = (listRef?.current || container)?.lastElementChild;
    if (!container || !latest) return;
    const top = latest.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
    const maxScroll = container.scrollHeight - container.clientHeight;
    container.scrollTo({ top: Math.max(0, Math.min(top - 12, maxScroll)), behavior: "smooth" });
  }, [key]);
}

export function AssistantChip({ children, ...props }) {
  return (
    <Button type="button" variant="outline" size="sm" className="h-auto min-h-0 rounded-full px-3 py-1.5 text-xs font-semibold" {...props}>
      {children}
    </Button>
  );
}

export function AssistantSuggestions({ items, disabled, onRun, label = "Föreslagna nästa steg", rowClassName }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      {label ? <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</p> : null}
      <ul className="divide-y divide-veil/10 rounded-xl border border-veil/10 bg-surface">
        {items.map((item) => (
          <li key={item.id} className={cn("flex items-center gap-3 px-3 py-2", rowClassName)}>
            <span className="min-w-0 flex-1 text-sm text-ink-800">{item.text}</span>
            <Button type="button" variant="secondary" size="sm" className="h-auto min-h-0 shrink-0 px-3 py-1.5 text-xs" disabled={disabled} onClick={() => onRun(item)}>
              {item.cta}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const defaultProposalLabels = { primary: "Bekräfta", secondary: null, dismiss: "Avbryt", applied: "Sparat:", dismissed: "Ändringen sparades inte." };

/**
 * A proposed set of changes, one checkbox per change, applied only when confirmed. A change may carry `detail`
 * (e.g. a full text) that is shown beneath its line. `onApply(id, "primary" | "secondary")` picks the button used.
 */
export function AssistantProposal({ item, disabled, onToggle, onApply, onDismiss, labels }) {
  const text = { ...defaultProposalLabels, ...labels };
  const active = item.changes.filter((change) => item.included[change.key]);
  if (item.state === "applied") {
    return (
      <p className="flex items-start gap-2 text-sm font-medium text-emerald-700">
        <Check className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{item.appliedLabel || text.applied} {active.map((change) => change.label).join(" · ")}</span>
      </p>
    );
  }
  if (item.state === "dismissed") return <p className="text-xs text-ink-500">{text.dismissed}</p>;
  const saving = item.state === "saving";
  return (
    <div className="space-y-3 rounded-xl border border-veil/10 bg-canvas p-3.5">
      <ul className="space-y-2.5">
        {item.changes.map((change) => (
          <li key={change.key}>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-800">
              <Checkbox
                className="mt-0.5"
                checked={Boolean(item.included[change.key])}
                disabled={disabled}
                onCheckedChange={(checked) => onToggle(item.id, change.key, Boolean(checked))}
              />
              <span className="min-w-0">
                {change.label}
                {change.detail ? <span className="mt-1 block whitespace-pre-line rounded-lg bg-surface px-2.5 py-2 text-xs leading-relaxed text-ink-600 ring-1 ring-veil/10">{change.detail}</span> : null}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" className="h-auto min-h-0 px-3.5 py-1.5 text-xs" disabled={disabled || active.length === 0} onClick={() => onApply(item.id, "primary")}>
          {saving ? "Sparar…" : text.primary}
        </Button>
        {text.secondary ? (
          <Button type="button" variant="outline" size="sm" className="h-auto min-h-0 px-3.5 py-1.5 text-xs" disabled={disabled || active.length === 0} onClick={() => onApply(item.id, "secondary")}>
            {text.secondary}
          </Button>
        ) : null}
        <Button type="button" variant="ghost" size="sm" className="h-auto min-h-0 px-3 py-1.5 text-xs" disabled={disabled} onClick={() => onDismiss(item.id)}>
          {text.dismiss}
        </Button>
      </div>
    </div>
  );
}

/** Renders the thread: the person's messages, the assistant's (chips and suggestions only on the latest), and proposals. */
export function AssistantThread({ thread, busy, onChip, onSuggestion, suggestionsLabel, proposal }) {
  const lastIndex = thread.length - 1;
  return thread.map((item, index) => {
    if (item.role === "user") {
      return (
        <div key={item.id} className="flex justify-end">
          <div className="flex max-w-[85%] flex-col items-end gap-1.5">
            {item.text ? <p className="rounded-2xl rounded-br-md bg-strong px-3.5 py-2 text-sm leading-relaxed text-on-strong">{item.text}</p> : null}
            {item.files?.length ? (
              <ul className="flex flex-wrap justify-end gap-1.5" aria-label="Bilagor">
                {item.files.map((file) => (
                  <li key={file.id || file.name} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-veil/10 bg-control px-2 py-1 text-xs text-ink-700">
                    <Paperclip className="h-3 w-3 shrink-0 text-ink-500" />
                    <span className="min-w-0 truncate">{file.name}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      );
    }
    if (item.role === "proposal") {
      return <AssistantProposal key={item.id} item={item} disabled={busy} {...proposal} />;
    }
    const showActions = index === lastIndex && !busy;
    return (
      <div key={item.id} className="animate-in fade-in-0 slide-in-from-bottom-1 space-y-3 duration-300">
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink-800">{item.text}</p>
        {item.draft ? <p className="whitespace-pre-line rounded-xl border border-veil/10 bg-canvas px-3.5 py-3 text-sm leading-relaxed text-ink-800">{item.draft}</p> : null}
        {showActions && item.chips?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {item.chips.map((chip) => (
              <AssistantChip key={chip.id} onClick={() => onChip(chip)}>{chip.label}</AssistantChip>
            ))}
          </div>
        ) : null}
        {showActions && item.suggestions?.length > 0 ? (
          <AssistantSuggestions items={item.suggestions} disabled={busy} onRun={onSuggestion} label={suggestionsLabel} />
        ) : null}
      </div>
    );
  });
}

/** The frame around a conversation: the orb and name on top, the thread in the middle, the text box at the bottom. */
export function AssistantPanel({
  className,
  phase,
  busy,
  title = "Assistent",
  idleLabel,
  scrollKey,
  children,
  composer,
  onComposerChange,
  onSubmit,
  inputRef,
  inputLabel = "Berätta för assistenten",
  placeholder,
  inputDisabled = false,
  loadingLabel
}) {
  const scrollRef = useRef(null);
  useKeepLatestInView(scrollRef, scrollKey);
  return (
    <Card className={cn("min-h-0 gap-0 overflow-hidden p-0 shadow-none", className)}>
      <div className="flex shrink-0 items-center gap-3 px-5 pb-1 pt-4">
        <AssistantOrb state={assistantOrbState(phase)} size={44} engaged={busy} />
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-ink-900">{title}</h3>
          <p className="text-xs text-ink-500" aria-live="polite">{assistantPhaseLabel(phase) || idleLabel}</p>
        </div>
      </div>

      <div ref={scrollRef} role="log" aria-label="Samtal med assistenten" className="relative max-h-[24rem] min-h-[9rem] flex-1 space-y-3.5 overflow-y-auto px-5 py-3 md:max-h-none">
        {children}
        {loadingLabel ? <p className="text-sm text-ink-500">{loadingLabel}</p> : null}
      </div>

      <form onSubmit={onSubmit} className="flex shrink-0 items-center gap-2 border-t border-veil/10 p-3">
        <Input
          ref={inputRef}
          aria-label={inputLabel}
          className="text-sm"
          value={composer}
          disabled={inputDisabled}
          onChange={(event) => onComposerChange(event.target.value)}
          placeholder={placeholder}
        />
        <Button type="submit" size="icon" aria-label="Skicka" disabled={!composer.trim() || busy}>
          <ArrowUp className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
