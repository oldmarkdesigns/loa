import { useEffect, useRef, useState } from "react";
import { AssistantPanel, AssistantThread, useAssistantThread } from "./AssistantKit";
import { answerProspectQuestion, applyProspectChanges, buildProspectBriefing, improveAll, prospectTargets, proposalFor } from "../../lib/prospectAssistant";

const proposalLabels = { primary: "Använd och spara", secondary: "Använd", dismiss: "Avbryt", applied: "Uppdaterat:", dismissed: "Inget ändrades." };
const kindLabels = { title: "Föreslå en titel", description: "Skriv en lokalbeskrivning", terms: "Föreslå hyresvillkor", location: "Föreslå läge", contact: "Fyll i kontaktperson" };

/**
 * Assistant beside the prospect editor. It reviews the prospect, understands short requests such as “sätt
 * uppsägningstiden till 6 månader”, and offers the edits as one list to tick through. Nothing reaches the prospect
 * until a proposal is used, and the draft is only saved when “Använd och spara” is chosen.
 * `onFocus(target)` takes the person to a section or tab of the editor.
 */
export default function ProspectAssistant({ editor, listing, user, onFocus, className }) {
  const { thread, setThread, phase, setPhase, busy, reply, say, clearTimers, toggleIncluded, patchItem } = useAssistantThread();
  const [composer, setComposer] = useState("");
  const inputRef = useRef(null);
  const context = { title: editor.title, sections: editor.sections, listing, user };
  const contextRef = useRef(context);
  contextRef.current = context;

  useEffect(() => {
    setThread([]);
    reply([{ role: "assistant", ...buildProspectBriefing(contextRef.current) }], 500);
    return () => {
      clearTimers();
      setPhase(null);
    };
    // One review when the assistant opens (the parent mounts it once the prospect has loaded); edits made since are handled as they happen.
  }, []);

  function offer(text, changes) {
    reply([
      { role: "assistant", text },
      { role: "proposal", changes, included: Object.fromEntries(changes.map((change) => [change.key, true])), state: "open" }
    ]);
  }

  function respond(result) {
    if (result.changes?.length > 0) offer(result.text, result.changes);
    else reply([{ role: "assistant", text: result.text, chips: result.chips, suggestions: result.suggestions }]);
  }

  function showTarget(target) {
    onFocus(target);
    reply([{ role: "assistant", text: `Jag har öppnat ${prospectTargets[target].label} åt dig.` }], 300);
  }

  function runIntent(intent, label) {
    if (busy) return;
    if (label) say(label);
    switch (intent.type) {
      case "improve": {
        const changes = improveAll(contextRef.current);
        if (changes.length === 0) reply([{ role: "assistant", text: "Det finns inget mer jag kan fylla i själv – resten är uppgifter bara du känner till." }]);
        else offer("Så här skulle jag fylla i prospektet. Bocka ur det du inte vill ha.", changes);
        break;
      }
      case "ask":
        respond(answerProspectQuestion(intent.text, contextRef.current));
        break;
      case "focus":
        showTarget(intent.target);
        break;
      case "undo":
        editor.replaceContent(intent.before);
        reply([{ role: "assistant", text: "Ångrat i prospektet. Har du redan sparat måste du spara igen för att ändra tillbaka." }], 300);
        break;
      default:
        reply([{ role: "assistant", text: "Okej." }], 300);
    }
  }

  function runSuggestion(suggestion) {
    if (busy) return;
    const { action } = suggestion;
    if (action.type === "focus") {
      say(`Visa ${prospectTargets[action.target].label}`);
      showTarget(action.target);
      return;
    }
    say(kindLabels[action.kind] || suggestion.cta);
    const changes = proposalFor(action.kind, contextRef.current);
    if (changes.length === 0) reply([{ role: "assistant", text: "Jag har inget underlag att fylla i det från – uppgifterna behöver skrivas in av dig." }]);
    else offer("Så här skulle jag göra:", changes);
  }

  function dismissProposal(id) {
    patchItem(id, { state: "dismissed" });
    reply([{ role: "assistant", text: "Okej, inget ändrades. Vad vill du ändra i stället?" }], 350);
  }

  async function applyProposal(id, mode) {
    const item = thread.find((entry) => entry.id === id);
    if (!item || busy || editor.saving || editor.publishing) return;
    const chosen = item.changes.filter((change) => item.included[change.key]);
    if (chosen.length === 0) return;
    const before = { title: contextRef.current.title, sections: contextRef.current.sections };
    const next = applyProspectChanges(before, chosen);
    const save = mode === "primary";

    editor.replaceContent(next);
    if (save) {
      patchItem(id, { state: "saving" });
      clearTimers();
      setPhase("saving");
      const saved = await editor.saveDraft(next);
      setPhase(null);
      if (!saved) {
        patchItem(id, { state: "open" });
        reply([{ role: "assistant", text: "Det gick inte att spara – ändringarna ligger kvar i prospektet. Försök igen om en stund." }]);
        return;
      }
    }
    patchItem(id, { state: "applied", appliedLabel: save ? "Uppdaterat och sparat:" : "Använt i prospektet:" });

    const briefing = buildProspectBriefing({ ...contextRef.current, ...next });
    reply([{
      role: "assistant",
      text: `Klart – ${save ? "utkastet är sparat" : "ändringarna ligger i prospektet. Spara utkastet när du är nöjd"}. ${briefing.suggestions ? "Det här återstår:" : "Prospektet ser komplett ut nu."}`,
      suggestions: briefing.suggestions,
      chips: [{ id: "undo", label: "Ångra", intent: { type: "undo", before } }]
    }], 450);
  }

  function submit(event) {
    event.preventDefault();
    const text = composer.trim();
    if (!text || busy) return;
    setComposer("");
    say(text);
    respond(answerProspectQuestion(text, contextRef.current));
  }

  return (
    <AssistantPanel
      className={className}
      phase={phase}
      busy={busy}
      idleLabel="Redo att hjälpa dig med prospektet"
      scrollKey={`${thread.length}:${phase}`}
      composer={composer}
      onComposerChange={setComposer}
      onSubmit={submit}
      inputRef={inputRef}
      inputLabel="Berätta vad du vill ändra"
      placeholder="Berätta vad du vill ändra, t.ex. “deposition 3 månadshyror”"
      loadingLabel={phase && thread.length === 0 ? "Läser in prospektet…" : null}
    >
      <AssistantThread
        thread={thread}
        busy={busy}
        onChip={(chip) => runIntent(chip.intent, chip.label)}
        onSuggestion={runSuggestion}
        proposal={{ onToggle: toggleIncluded, onApply: applyProposal, onDismiss: dismissProposal, labels: proposalLabels }}
      />
    </AssistantPanel>
  );
}
