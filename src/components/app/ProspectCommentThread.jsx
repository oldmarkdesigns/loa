import { useState } from "react";
import { formatDate } from "../../lib/formatters";
import { SendHorizontalIcon } from "../icons/UiIcons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function ProspectCommentThread({
  sections = [],
  comments = [],
  onAddComment,
  pending = false,
  requireGuestName = false,
  guestName = "",
  onGuestNameChange
}) {
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id || "general");
  const [body, setBody] = useState("");

  const activeSection = sections.find((section) => section.id === activeSectionId);
  const commentsForSection = comments.filter((comment) => comment.sectionId === activeSectionId);
  const canSubmit = body.trim() && (!requireGuestName || guestName.trim());

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    await onAddComment(activeSectionId, body.trim());
    setBody("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap gap-1.5 border-b border-veil/10 pb-3">
        <Button
          type="button"
          variant="outline"
          className={`h-auto rounded-2xl border-ink-200 px-3 py-1 text-xs font-semibold text-ink-700 transition ${
            activeSectionId === "general" ? "border-strong bg-strong text-on-strong hover:bg-strong/90" : ""
          }`}
          onClick={() => setActiveSectionId("general")}
        >
          Allmänt
        </Button>
        {sections.map((section) => (
          <Button
            key={section.id}
            type="button"
            variant="outline"
            className={`h-auto rounded-2xl border-ink-200 px-3 py-1 text-xs font-semibold text-ink-700 transition ${
              activeSectionId === section.id ? "border-strong bg-strong text-on-strong hover:bg-strong/90" : ""
            }`}
            onClick={() => setActiveSectionId(section.id)}
          >
            {section.title || "Sektion"}
          </Button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-3">
        {commentsForSection.length === 0 ? (
          <p className="text-sm text-ink-500">Inga kommentarer än på den här sektionen.</p>
        ) : (
          commentsForSection.map((comment) => (
            <div key={comment.id} className="rounded-2xl border border-veil/10 bg-canvas p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink-900">
                  {comment.authorType === "guest" ? `${comment.guestName} (gäst)` : comment.authorName || "Användare"}
                </span>
                <span className="text-xs text-ink-500">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{comment.body}</p>
            </div>
          ))
        )}
      </div>

      <form className="shrink-0 space-y-2 border-t border-veil/10 pt-3" onSubmit={handleSubmit}>
        {requireGuestName ? (
          <Input
            placeholder="Ditt namn"
            value={guestName}
            onChange={(event) => onGuestNameChange?.(event.target.value)}
          />
        ) : null}
        <div className="flex gap-2">
          <Input
            placeholder={`Kommentera "${activeSection?.title || "Allmänt"}"...`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <Button type="submit" size="icon" className="shrink-0" disabled={!canSubmit || pending} aria-label="Skicka kommentar">
            <SendHorizontalIcon className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ProspectCommentThread;
