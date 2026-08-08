import { useEffect, useState } from "react";

const initialAssistantMessage = {
  role: "assistant",
  text: "Beskriv behovet så föreslår jag filter och matchande lokaler."
};

function createInitialMessages() {
  return [{ id: crypto.randomUUID(), ...initialAssistantMessage }];
}

function AiSearchPanelV2({
  filters,
  onApplyFilters,
  onRunSearch,
  listingsById,
  defaultFilters,
  onSaveSearch,
  queuedPrompt,
  onQueuedPromptHandled,
  onSuggestedFilters
}) {
  const [messages, setMessages] = useState(createInitialMessages);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState("");

  async function submitPrompt(prompt) {
    const cleaned = String(prompt || "").trim();
    if (!cleaned || pending) {
      return;
    }

    setPending(true);
    setLastSubmittedPrompt(cleaned);
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: cleaned }]);

    try {
      const result = await onRunSearch(cleaned, filters);
      onApplyFilters(result.suggestedFilters);
      onSuggestedFilters?.({
        prompt: cleaned,
        suggestedFilters: result.suggestedFilters
      });
      const topItems = result.topListingIds.map((id) => listingsById.get(id)).filter(Boolean);
      const topText = topItems.length ? `Toppförslag: ${topItems.map((entry) => entry.title).join(" • ")}` : "Inga träffar just nu.";
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `${result.explanation}\n${topText}`
        }
      ]);
      setInput("");
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: error.message || "Kunde inte köra AI-sök just nu."
        }
      ]);
    } finally {
      setPending(false);
    }
  }

  function handleReset() {
    if (pending) {
      return;
    }
    onApplyFilters({ ...defaultFilters });
    setInput("");
    setMessages(createInitialMessages());
  }

  function handleSaveSearch() {
    const prompt = String(lastSubmittedPrompt || input || "").trim();
    if (!prompt || !onSaveSearch) {
      return;
    }
    onSaveSearch({
      prompt,
      filters
    });
  }

  useEffect(() => {
    if (!queuedPrompt || pending) {
      return;
    }
    submitPrompt(queuedPrompt);
    onQueuedPromptHandled?.();
  }, [queuedPrompt, pending]);

  return (
    <section className="flex min-h-[560px] flex-col lg:min-h-[620px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink-900">AI-sök</p>
          <p className="text-xs text-ink-600">Konversationsbaserad matchning för lokaler i realtid.</p>
        </div>
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">Beta</div>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-3xl border border-[#c9d2df] bg-[#ffffff]/70 p-3">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          {messages.map((message) => (
            <div key={message.id} className={`max-w-[95%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${message.role === "assistant" ? "border border-[#0d162b] bg-[#0d162b] text-white" : "ml-auto border border-ink-200 bg-[#ffffff] text-ink-900"}`}>
              {message.text}
            </div>
          ))}
        </div>

        <form
          className="mt-3 rounded-2xl border border-[#0b0a0e]/20 bg-[#ffffff] p-2"
          onSubmit={(event) => {
            event.preventDefault();
            submitPrompt(input);
          }}
        >
          <div className="space-y-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="field w-full border-[#0b0a0e]/25 bg-[#fdfefe]"
              placeholder="Exempel: kontor i Solna för 16 personer, max 60000 kr"
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="rounded-2xl border border-black/20 bg-[#ffffff] px-4 py-2 text-sm font-semibold" onClick={handleReset} disabled={pending}>
                Nollställ
              </button>
              <button type="button" className="rounded-2xl border border-black/20 bg-[#ffffff] px-4 py-2 text-sm font-semibold" onClick={handleSaveSearch} disabled={pending || (!lastSubmittedPrompt && !input.trim())}>
                Spara AI-sök
              </button>
              <button type="submit" className="btn-primary shrink-0 px-5" disabled={pending}>{pending ? "Söker..." : "Skicka"}</button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

export default AiSearchPanelV2;
