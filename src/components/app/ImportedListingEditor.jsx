import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import EditorWorkspace from "../layout/EditorWorkspace";
import { ListingEditorFrame, publishDraftFromEditorDraft, useListingEditorState } from "./ListingEditorOverlay";
import { buildPayload, listMissingFields } from "../../lib/listingDraft";

/**
 * "Redigera objekt" for a listing that was read from documents and has not been published yet. It is the same window,
 * with the same fields, categories and assistant, but nothing is stored here: approving hands the edited draft back to
 * the review, which decides what to publish.
 */
export default function ImportedListingEditor({ item, position, total, others, app, onApprove, onClose }) {
  // The draft of the import in the shape of a stored listing, which is what the editor starts from.
  const listing = useMemo(() => ({ id: item.id, status: "draft", ...buildPayload(item.draft, "draft") }), [item.id]);
  const editor = useListingEditorState(listing, app, { save: async (draft) => onApprove(publishDraftFromEditorDraft(draft, item.draft)) });
  const missing = listMissingFields(publishDraftFromEditorDraft(editor.draft, item.draft));
  const uncertain = item.uncertain || [];

  async function approve() {
    if (await editor.saveChanges()) onClose();
  }

  return (
    <EditorWorkspace
      size="wide"
      title="Granska importerat objekt"
      description="Kontrollera och komplettera uppgifterna som lästes in innan annonsen publiceras."
      dirty={editor.dirty}
      busy={editor.saving}
      onClose={onClose}
      onSaveDraft={async () => {
        if (await editor.saveChanges()) onClose();
      }}
      saveDraftLabel="Godkänn objekt"
    >
      {(close) => (
        <ListingEditorFrame
          editor={editor}
          listing={listing}
          others={others}
          onClose={close}
          subtitle={[`Objekt ${position} av ${total}`, item.sourceName, item.sourceRef].filter(Boolean).join(" · ")}
          note={uncertain.length > 0 ? <p className="text-xs font-semibold text-amber-700">Kontrollera: {uncertain.join(", ")}</p> : null}
          assistant={{ saveLabel: "Använd och godkänn", savedWord: "godkänt" }}
          footer={(
            <>
              <Button type="button" variant="outline" className="mr-auto" onClick={close} disabled={editor.saving}>Avbryt</Button>
              {missing.length > 0 ? <p role="status" className="text-xs font-medium text-amber-700">Saknas: {missing.join(", ")}</p> : <p role="status" className="text-xs text-ink-500">Alla obligatoriska uppgifter är ifyllda</p>}
              <Button type="button" onClick={() => void approve()} disabled={editor.saving}>
                {editor.saving ? "Sparar..." : "Godkänn objekt"}
              </Button>
            </>
          )}
        />
      )}
    </EditorWorkspace>
  );
}
