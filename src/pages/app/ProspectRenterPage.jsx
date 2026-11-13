import { useEffect, useState } from "react";
import { prospectCommentsApi, prospectsApi } from "../../api";
import StatusPill from "../../components/app/StatusPill";
import ProspectCommentThread from "../../components/app/ProspectCommentThread";
import { PaperclipIcon } from "../../components/icons/UiIcons";
import { Badge } from "@/components/ui/badge";

function ProspectRenterPage({ prospectId }) {
  const [prospect, setProspect] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentsPending, setCommentsPending] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [{ prospect: loadedProspect }, { comments: loadedComments }] = await Promise.all([
        prospectsApi.getProspect(prospectId),
        prospectCommentsApi.listComments(prospectId)
      ]);
      setProspect(loadedProspect);
      setComments(loadedComments);
    } catch (err) {
      setError(err.message || "Prospektet kunde inte öppnas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospectId]);

  async function addComment(sectionId, body) {
    setCommentsPending(true);
    try {
      await prospectCommentsApi.addComment(prospectId, sectionId, body);
      const { comments: refreshed } = await prospectCommentsApi.listComments(prospectId);
      setComments(refreshed);
    } finally {
      setCommentsPending(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-ink-600">Laddar prospekt...</div>;
  }

  if (error || !prospect) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="surface p-6 text-center">
          <h1 className="text-xl font-semibold text-ink-900">Kunde inte öppna prospektet</h1>
          <p className="mt-2 text-sm text-ink-600">{error || "Prospektet hittades inte."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-ink-500">Delat prospekt</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink-900">{prospect.title}</h1>
        </div>
        <StatusPill status={prospect.status} variant="prospect" />
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {prospect.publishedSections.length === 0 ? (
            <p className="surface p-6 text-sm text-ink-600">Inget publicerat innehåll än.</p>
          ) : (
            prospect.publishedSections.map((section) => (
              <section key={section.id} className="surface p-4 sm:p-5">
                <h2 className="text-lg font-semibold text-strong">{section.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-700">{section.body}</p>
                {section.attachments?.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {section.attachments.map((attachment, index) => (
                      <Badge
                        key={`${attachment.storageId}-${index}`}
                        variant="outline"
                        className="h-auto gap-1.5 rounded-2xl border-ink-200 bg-surface px-3 py-1 text-xs font-semibold text-ink-700 hover:bg-surface"
                        render={<a href={attachment.url} target="_blank" rel="noopener noreferrer" />}
                      >
                        <PaperclipIcon className="h-3.5 w-3.5" />
                        {attachment.fileName}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </section>
            ))
          )}
        </div>

        <aside className="surface flex h-[560px] flex-col p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-ink-500">Kommentarer</h2>
          <div className="mt-3 min-h-0 flex-1">
            <ProspectCommentThread
              sections={prospect.publishedSections}
              comments={comments}
              onAddComment={addComment}
              pending={commentsPending}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ProspectRenterPage;
