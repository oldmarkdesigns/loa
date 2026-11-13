import { useMemo, useState } from "react";
import { applyListingFilters, parseNeedsFromPrompt } from "../data/matchEngine";

function AiSearchPanel({ listings, quickNeeds, filters, onApplyFilters, onOpenListing }) {
  const [messages, setMessages] = useState([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      text: "Beskriv dina behov. Jag kan filtrera på område, budget, yta, inflyttning och lokaltyp."
    }
  ]);
  const [input, setInput] = useState("");

  const previewMatches = useMemo(() => applyListingFilters(listings, filters).slice(0, 3), [filters, listings]);

  function postUserPrompt(prompt) {
    if (!prompt.trim()) {
      return;
    }

    const userText = prompt.trim();
    const parsed = parseNeedsFromPrompt(userText);
    const merged = {
      ...filters,
      ...parsed
    };
    const matches = applyListingFilters(listings, merged).slice(0, 3);

    const summaryParts = [];
    if (parsed.district) summaryParts.push(`område ${parsed.district}`);
    if (parsed.type) summaryParts.push(`typ ${parsed.type}`);
    if (parsed.maxBudget) summaryParts.push(`max ${parsed.maxBudget.toLocaleString("sv-SE")} kr`);
    if (parsed.teamSize) summaryParts.push(`minst ${parsed.teamSize} platser`);
    if (parsed.readyNow) summaryParts.push("endast ledig nu");

    const summary =
      summaryParts.length > 0
        ? `Tillämpade filter: ${summaryParts.join(", ")}.`
        : "Jag hittade inga tydliga nyckelord och behöll dina nuvarande filter med ranking på matchningspoäng.";

    const assistantLines = [summary];
    if (matches.length === 0) {
      assistantLines.push("Ingen direkt träff. Testa högre budget eller fler områden.");
    } else {
      assistantLines.push(`Bästa förslag: ${matches.map((item) => item.title).join(" • ")}`);
    }

    setMessages((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        role: "user",
        text: userText
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: assistantLines.join("\n")
      }
    ]);

    onApplyFilters(merged);
    setInput("");
  }

  return (
    <section className="surface flex h-full flex-col border-[#c8d1de] bg-gradient-to-br from-[#edf2f7] via-[#eef2f8] to-[#f5f8fc] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink-900">AI-sök</p>
          <p className="text-xs text-ink-600">Konversationsbaserad sökning med snabba matchningsförslag.</p>
        </div>
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">Beta</div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {quickNeeds.map((need) => (
          <button
            type="button"
            key={need}
            onClick={() => postUserPrompt(need)}
            className="rounded-full border border-ink-200 bg-[#ffffff] px-3 py-1 text-xs font-semibold text-ink-700 hover:border-brand-300"
          >
            {need}
          </button>
        ))}
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-3xl border border-[#c9d2df] bg-[#ffffff]/70 p-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[95%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
              message.role === "assistant"
                ? "border border-[#0d162b] bg-[#0d162b] text-white"
                : "ml-auto border border-ink-200 bg-[#ffffff] text-ink-900"
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          postUserPrompt(input);
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="field"
          placeholder="Exempel: kontor i Norrmalm för 12 personer, max 70000 kr"
        />
        <button type="submit" className="btn-primary shrink-0 px-5">
          Skicka
        </button>
      </form>

      <div className="mt-4 rounded-3xl border border-[#c9d2df] bg-[#ffffff]/80 p-3">
        <p className="text-xs font-semibold text-ink-500">Toppval just nu</p>
        <div className="mt-2 grid gap-2">
          {previewMatches.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenListing(item)}
              className="flex items-center justify-between rounded-xl border border-ink-200 bg-[#ffffff] px-3 py-2 text-left text-sm text-ink-800 hover:border-brand-300"
            >
              <span>{item.title}</span>
              <span className="text-xs font-semibold text-brand-700">{item.score}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AiSearchPanel;
