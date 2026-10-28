import { useEffect, useRef, useState } from "react";
import { AssistantPanel, AssistantThread, useAssistantThread } from "./AssistantKit";
import { answerListingQuestion, applyChanges, buildListingBriefing, fieldTargets, improveAll, proposalFor } from "../../lib/listingAssistant";

const kindLabels = { title: "Föreslå en rubrik", description: "Skriv en beskrivning", amenities: "Föreslå bekvämligheter", rent: "Sätt hyran efter marknaden" };

/**
 * Assistant beside the form in "Redigera objekt". It reviews the listing, understands short requests such as
 * “sätt hyran till 45 000 och lägg till fiber”, and offers the edits as one list to tick through. Nothing reaches the
 * form until a proposal is used, and nothing is saved unless “Använd och spara” is chosen.
 */
export default function ListingAssistant({ editor, listing, others, className, saveLabel = "Använd och spara", savedWord = "sparat" }) {
  const proposalLabels = { primary: saveLabel, secondary: "Använd", dismiss: "Avbryt", applied: "Uppdaterat:", dismissed: "Inget ändrades." };
  const { thread, setThread, phase, setPhase, busy, reply, say, clearTimers, toggleIncluded, patchItem } = useAssistantThread();
  const [composer, setComposer] = useState("");
  const inputRef = useRef(null);
  const context = { draft: editor.draft, listing, others };
  const contextRef = useRef(context);
  contextRef.current = context;

  useEffect(() => {
    setThread([]);
    reply([{ role: "assistant", ...buildListingBriefing(contextRef.current) }], 500);
    return () => {
      clearTimers();
      setPhase(null);
    };
    // A new review only when a different listing is opened; edits made since are handled as they happen.
  }, [listing.id]);

  function offer(text, changes) {
    reply([
      { role: "assistant", text },
      { role: "proposal", changes, included: Object.fromEntries(changes.map((change) => [change.key, true])), state: "open" }
    ]);
  }

  function respond(result) {
    if (result.changes?.length > 0) {
      offer(result.text, result.changes);
    } else {
      reply([{ role: "assistant", text: result.text, chips: result.chips, suggestions: result.suggestions }]);
    }
  }

  function showField(field) {
    editor.focusField(field);
    reply([{ role: "assistant", text: `Jag har öppnat ${fieldTargets[field].label} åt dig.` }], 300);
  }

  function runIntent(intent, label) {
    if (busy) return;
    if (label) say(label);
    switch (intent.type) {
      case "improve": {
        const changes = improveAll(contextRef.current);
        if (changes.length === 0) reply([{ role: "assistant", text: "Annonsen har redan det viktigaste. Jag kan jämföra hyran med liknande objekt om du vill." }]);
        else offer("Så här skulle jag förbättra annonsen. Bocka ur det du inte vill ha.", changes);
        break;
      }
      case "ask":
        respond(answerListingQuestion(intent.text, contextRef.current));
        break;
      case "focus":
        showField(intent.field);
        break;
      case "undo":
        editor.setDraft(intent.before);
        reply([{ role: "assistant", text: "Ångrat i formuläret. Har du redan sparat måste du spara igen för att ändra tillbaka." }], 300);
        break;
      default:
        reply([{ role: "assistant", text: "Okej." }], 300);
    }
  }

  function runSuggestion(suggestion) {
    if (busy) return;
    const { action } = suggestion;
    if (action.type === "focus") {
      say(`Visa ${fieldTargets[action.field].label}`);
      showField(action.field);
      return;
    }
    say(kindLabels[action.kind] || suggestion.cta);
    const changes = proposalFor(action.kind, contextRef.current);
    if (changes.length === 0) reply([{ role: "assistant", text: "Det finns inget att föreslå där just nu." }]);
    else offer("Så här skulle jag göra:", changes);
  }

  function dismissProposal(id) {
    patchItem(id, { state: "dismissed" });
    reply([{ role: "assistant", text: "Okej, inget ändrades. Vad vill du ändra i stället?" }], 350);
  }

  async function applyProposal(id, mode) {
    const item = thread.find((entry) => entry.id === id);
    if (!item || busy || editor.saving) return;
    const chosen = item.changes.filter((change) => item.included[change.key]);
    if (chosen.length === 0) return;
    const before = contextRef.current.draft;
    const next = applyChanges(before, chosen);
    const save = mode === "primary";

    editor.setDraft(next);
    if (save) {
      patchItem(id, { state: "saving" });
      clearTimers();
      setPhase("saving");
      const saved = await editor.saveChanges(next);
      setPhase(null);
      if (!saved) {
        patchItem(id, { state: "open" });
        reply([{ role: "assistant", text: "Det gick inte att spara – ändringarna ligger kvar i formuläret. Kontrollera uppgifterna och försök igen." }]);
        return;
      }
    }
    patchItem(id, { state: "applied", appliedLabel: save ? `Uppdaterat och ${savedWord}:` : "Använt i formuläret:" });

    const briefing = buildListingBriefing({ ...contextRef.current, draft: next });
    reply([{
      role: "assistant",
      text: `Klart – ${save ? savedWord : "ändringarna ligger i formuläret. Spara när du är nöjd"}. ${briefing.suggestions ? "Det här återstår:" : "Annonsen ser komplett ut nu."}`,
      suggestions: briefing.suggestions,
      chips: [{ id: "undo", label: "Ångra", intent: { type: "undo", before } }, ...(briefing.chips || []).filter((chip) => chip.id !== "improve")]
    }], 450);
  }

  function submit(event) {
    event.preventDefault();
    const text = composer.trim();
    if (!text || busy) return;
    setComposer("");
    say(text);
    respond(answerListingQuestion(text, contextRef.current));
  }

  return (
    <AssistantPanel
      className={className}
      phase={phase}
      busy={busy}
      idleLabel="Redo att hjälpa dig med annonsen"
      scrollKey={`${thread.length}:${phase}`}
      composer={composer}
      onComposerChange={setComposer}
      onSubmit={submit}
      inputRef={inputRef}
      inputLabel="Berätta vad du vill ändra"
      placeholder="Berätta vad du vill ändra, t.ex. “sätt hyran till 45 000”"
      loadingLabel={phase && thread.length === 0 ? "Läser in annonsen…" : null}
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
