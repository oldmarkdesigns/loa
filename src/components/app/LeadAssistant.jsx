import { useEffect, useRef, useState } from "react";
import { AssistantPanel, AssistantThread, ASSISTANT_LISTEN_MS, ASSISTANT_THINK_MS, useAssistantThread } from "./AssistantKit";
import {
  addDays,
  buildBriefing,
  captureChips,
  describeDay,
  emailDraft,
  firstName,
  followUpChips,
  forwardStatus,
  interpretUpdate,
  mailtoFor,
  moreChips,
  outcomeQuestion,
  proposalChanges,
  statusChips,
  statusLabels,
  suggestNextSteps,
  toIsoDate
} from "../../lib/leadAssistant";

/**
 * Conversational stand-in for the notes and "next step" form of a lead. It greets with what matters for this
 * particular lead, asks what has happened, and turns short answers into a proposed update that is only saved
 * when confirmed. `onApply({ type, body, status, followUpDate })` does the saving (null = leave as is).
 */
export default function LeadAssistant({ lead, activities, loading, brokerName, onApply, onDirtyChange, className }) {
  const { thread, setThread, phase, setPhase, busy, reply, say, clearTimers, toggleIncluded, patchItem } = useAssistantThread();
  const [composer, setComposer] = useState("");
  const inputRef = useRef(null);
  const context = { lead, activities, brokerName, now: new Date() };
  const contextRef = useRef(context);
  contextRef.current = context;

  const name = firstName(lead.renter?.name) || "kunden";

  useEffect(() => {
    if (loading) return undefined;
    setThread([]);
    const briefing = buildBriefing(contextRef.current);
    reply([{ role: "assistant", text: briefing.text, chips: briefing.chips, suggestions: briefing.suggestions }], 500);
    return () => {
      clearTimers();
      setPhase(null);
    };
    // A new briefing only when a different lead is opened or its activity has finished loading.
  }, [loading, lead.id]);

  useEffect(() => {
    onDirtyChange?.(Boolean(composer.trim()));
  }, [composer, onDirtyChange]);

  function focusComposerSoon() {
    window.setTimeout(() => inputRef.current?.focus(), ASSISTANT_LISTEN_MS + ASSISTANT_THINK_MS);
  }

  function propose(update) {
    const changes = proposalChanges(update, contextRef.current);
    if (changes.length === 0) {
      reply([{ role: "assistant", text: "Det är redan så leadet ser ut, så jag behöver inte ändra något." }]);
      return;
    }
    reply([
      { role: "assistant", text: "Så här skulle jag uppdatera leadet. Bocka ur det du inte vill spara." },
      {
        role: "proposal",
        update,
        changes,
        included: Object.fromEntries(changes.map((change) => [change.key, true])),
        state: "open"
      }
    ]);
  }

  function askOutcome(kind) {
    const question = outcomeQuestion(kind, contextRef.current);
    const chips = question.chips.length > 0
      ? [...question.chips, { id: "custom", label: "Berätta själv", intent: { type: "compose" } }]
      : [];
    reply([{ role: "assistant", text: question.text, chips }]);
    if (chips.length === 0) focusComposerSoon();
  }

  function runIntent(intent, label) {
    if (busy) return;
    if (label) say(label);
    const ctx = contextRef.current;
    switch (intent.type) {
      case "capture":
        askOutcome(intent.kind);
        break;
      case "update":
        propose(intent.update);
        break;
      case "status":
        propose({
          type: null,
          body: null,
          status: forwardStatus(ctx.lead.status, intent.status, null) || (intent.status !== ctx.lead.status ? intent.status : null),
          followUpDate: (intent.status === "won" || intent.status === "lost") && ctx.lead.followUpDate ? "" : null
        });
        break;
      case "followup":
        propose({ type: null, body: null, status: null, followUpDate: intent.date });
        break;
      case "none":
        reply([{
          role: "assistant",
          text: `Okej. Ska jag sätta en påminnelse så att du inte glömmer bort ${name}?`,
          chips: [...followUpChips(ctx), { id: "dismiss", label: "Nej tack", intent: { type: "dismiss" } }]
        }]);
        break;
      case "more":
        reply([{ role: "assistant", text: "Vad vill du göra?", chips: moreChips() }]);
        break;
      case "status-menu":
        reply([{ role: "assistant", text: "Vilken status ska leadet ha?", chips: statusChips(ctx) }]);
        break;
      case "followup-menu":
        reply([{ role: "assistant", text: "När vill du följa upp?", chips: followUpChips(ctx) }]);
        break;
      case "compose":
        reply([{ role: "assistant", text: "Skriv vad som hände med egna ord så tolkar jag det." }]);
        focusComposerSoon();
        break;
      default:
        reply([{ role: "assistant", text: "Inga problem. Jag finns här när något händer." }]);
    }
  }

  function runSuggestion(suggestion) {
    if (busy) return;
    const ctx = contextRef.current;
    const { action } = suggestion;
    if (action.type === "capture") {
      say({ viewing: "Logga visningen", meeting: "Logga ett möte", note: "Anteckna något" }[action.kind] || suggestion.cta);
      askOutcome(action.kind);
    } else if (action.type === "followup") {
      say(`Sätt uppföljning om ${action.days} dagar`);
      propose({ type: null, body: null, status: null, followUpDate: toIsoDate(addDays(ctx.now, action.days)) });
    } else if (action.type === "call") {
      const phone = ctx.lead.renter?.phone || ctx.lead.renter?.profile?.phone;
      say(`Jag ringer ${name}`);
      if (phone) window.location.href = `tel:${phone}`;
      const question = outcomeQuestion("call", ctx);
      reply([{
        role: "assistant",
        text: `${phone ? `Ring ${name} på ${phone}. ` : ""}Säg till hur det gick så loggar jag samtalet åt dig.`,
        chips: [...question.chips, { id: "custom", label: "Berätta själv", intent: { type: "compose" } }]
      }]);
    } else if (action.type === "email") {
      const draft = emailDraft(action.draft, ctx);
      const href = mailtoFor(action.draft, ctx);
      say(`Jag skriver till ${name}`);
      if (href) window.location.href = href;
      reply([{
        role: "assistant",
        text: href
          ? `Jag har öppnat ett utkast till ${name} i din mejlklient. Skickade du det?`
          : `Jag har inte någon e-postadress till ${name}. Skicka mejlet på egen hand och berätta sedan för mig.`,
        chips: [
          {
            id: "email-sent",
            label: "Ja, logga mejlet",
            intent: {
              type: "update",
              update: {
                type: "email",
                body: `Skickade mejl till ${name}: ${draft.subject}.`,
                status: forwardStatus(ctx.lead.status, null, "email"),
                followUpDate: toIsoDate(addDays(ctx.now, 3))
              }
            }
          },
          { id: "dismiss", label: "Inte än", intent: { type: "dismiss" } }
        ]
      }]);
    }
  }

  function dismissProposal(id) {
    patchItem(id, { state: "dismissed" });
    reply([{
      role: "assistant",
      text: "Okej, inget sparades. Vill du berätta något annat?",
      chips: captureChips(contextRef.current).filter((chip) => chip.id !== "none")
    }], 400);
  }

  async function applyProposal(id) {
    const item = thread.find((entry) => entry.id === id);
    if (!item || busy) return;
    const { update, included } = item;
    const payload = {
      type: included.activity ? update.type : null,
      body: included.activity ? update.body : null,
      status: included.status ? update.status : null,
      followUpDate: included.followUp ? update.followUpDate : null
    };
    patchItem(id, { state: "saving" });
    clearTimers();
    setPhase("saving");
    try {
      await onApply(payload);
    } catch (error) {
      patchItem(id, { state: "open" });
      setPhase(null);
      reply([{ role: "assistant", text: `Det gick inte att spara${error?.message ? `: ${error.message}` : ""}. Vill du försöka igen?` }]);
      return;
    }
    patchItem(id, { state: "applied" });

    // Work out the next message from what was just saved, without waiting for the panel to reload.
    const ctx = contextRef.current;
    const nextLead = {
      ...ctx.lead,
      status: payload.status || ctx.lead.status,
      followUpDate: payload.followUpDate === null ? ctx.lead.followUpDate : payload.followUpDate
    };
    const nextActivities = payload.type
      ? [{ id: `local-${Date.now()}`, type: payload.type, body: payload.body, createdAt: new Date().toISOString() }, ...ctx.activities]
      : ctx.activities;
    const next = { ...ctx, lead: nextLead, activities: nextActivities };
    const parts = [
      payload.status ? `${name} står nu som ${statusLabels[payload.status].toLowerCase()}.` : "",
      payload.followUpDate ? `Uppföljning: ${describeDay(payload.followUpDate, ctx.now)}.` : "",
      payload.followUpDate === "" ? "Uppföljningen är borttagen." : ""
    ].filter(Boolean);
    const suggestions = suggestNextSteps(next);
    setPhase(null);
    reply([{
      role: "assistant",
      text: `Klart – sparat. ${parts.join(" ")} ${suggestions.length > 0 ? "Något mer att logga, eller ska vi ta nästa steg?" : "Något mer att logga?"}`.replace(/\s+/g, " "),
      chips: captureChips(next).filter((chip) => chip.id !== "none"),
      suggestions
    }], 450);
  }

  function submit(event) {
    event.preventDefault();
    const text = composer.trim();
    if (!text || busy) return;
    setComposer("");
    say(text);
    propose(interpretUpdate(text, contextRef.current));
  }

  return (
    <AssistantPanel
      className={className}
      phase={phase}
      busy={busy}
      idleLabel="Redo att hjälpa dig med leadet"
      scrollKey={`${thread.length}:${phase}`}
      composer={composer}
      onComposerChange={setComposer}
      onSubmit={submit}
      inputRef={inputRef}
      inputDisabled={loading}
      placeholder={`Berätta vad som hänt, t.ex. “Ringde ${name} – vill se lokalen på torsdag”`}
      loadingLabel={phase && thread.length === 0 ? "Läser in leadet…" : null}
    >
      <AssistantThread
        thread={thread}
        busy={busy}
        onChip={(chip) => runIntent(chip.intent, chip.label)}
        onSuggestion={runSuggestion}
        proposal={{ onToggle: toggleIncluded, onApply: applyProposal, onDismiss: dismissProposal }}
      />
    </AssistantPanel>
  );
}
