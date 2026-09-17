import { useEffect, useState } from "react";
import { prospectCommentsApi, prospectSharingApi } from "../api";
import StatusPill from "../components/app/StatusPill";
import ProspectCommentThread from "../components/app/ProspectCommentThread";
import TopLeftLogoPlaceholder from "../components/layout/TopLeftLogoPlaceholder";
import { PaperclipIcon } from "../components/icons/UiIcons";

function ProspectGuestPage({ token }) {
  const [prospect, setProspect] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guestName, setGuestName] = useState(() => {
    try {
      return window.localStorage.getItem("prospekt_guest_name") || "";
    } catch (_error) {
      return "";
    }
  });
  const [pending, setPending] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { prospect: loadedProspect, comments: loadedComments } = await prospectSharingApi.getByGuestToken(token);
      setProspect(loadedProspect);
      setComments(loadedComments);
    } catch (err) {
      setError(err.message || "Länken kunde inte öppnas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function updateGuestName(value) {
    setGuestName(value);
    try {
      window.localStorage.setItem("prospekt_guest_name", value);
    } catch (_error) {
      // Ignore — a per-viewer convenience only, never required for the comment to work.
    }
  }

  async function addComment(sectionId, body) {
    setPending(true);
    try {
      await prospectCommentsApi.addGuestComment(token, sectionId, guestName.trim(), body);
      const { comments: refreshed } = await prospectSharingApi.getByGuestToken(token);
      setComments(refreshed);
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4">
        <p className="text-sm text-ink-600">Laddar prospekt...</p>
      </div>
    );
  }

  if (error || !prospect) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4">
        <TopLeftLogoPlaceholder />
        <div className="surface max-w-md p-6 text-center">
          <h1 className="text-xl font-semibold text-ink-900">Länken fungerar inte</h1>
          <p className="mt-2 text-sm text-ink-600">{error || "Prospektet hittades inte."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-16">
      <TopLeftLogoPlaceholder />
      <div className="mx-auto max-w-5xl px-4 pt-24 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Delat prospekt</p>
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
                  <h2 className="text-lg font-semibold text-[#0b0a0e]">{section.title}</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink-700">{section.body}</p>
                  {section.attachments?.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {section.attachments.map((attachment, index) => (
                        <a
                          key={`${attachment.storageId}-${index}`}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="chip inline-flex items-center gap-1.5"
                        >
                          <PaperclipIcon className="h-3.5 w-3.5" />
                          {attachment.fileName}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </section>
              ))
            )}
          </div>

          <aside className="surface flex h-[560px] flex-col p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">Kommentarer</h2>
            <div className="mt-3 min-h-0 flex-1">
              <ProspectCommentThread
                sections={prospect.publishedSections}
                comments={comments}
                onAddComment={addComment}
                pending={pending}
                requireGuestName
                guestName={guestName}
                onGuestNameChange={updateGuestName}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ProspectGuestPage;
