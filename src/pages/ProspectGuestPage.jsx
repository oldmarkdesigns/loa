import { useEffect, useState } from "react";
import { prospectCommentsApi, prospectSharingApi } from "../api";
import StatusPill from "../components/app/StatusPill";
import ProspectCommentThread from "../components/app/ProspectCommentThread";
import { Arrow, PageHead, SiteFrame } from "../site/SiteChrome";

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
      <SiteFrame slim navActions={false}>
        <PageHead label="Delat prospekt" title="Hämtar prospektet…">
          <div role="status" aria-live="polite">
            <div className="lo-progress" />
          </div>
        </PageHead>
      </SiteFrame>
    );
  }

  if (error || !prospect) {
    return (
      <SiteFrame slim navActions={false}>
        <PageHead back="Startsida" label="Delat prospekt" title="Länken fungerar inte." lede={error || "Prospektet hittades inte. Be avsändaren om en ny länk."} />
      </SiteFrame>
    );
  }

  return (
    <SiteFrame slim navActions={false}>
      <PageHead label="Delat prospekt" title={prospect.title} lede="Läs igenom, och lämna gärna en kommentar på det som berör dig.">
        <div className="lo-page-meta">
          <StatusPill status={prospect.status} variant="prospect" />
          <span>{prospect.publishedSections.length} avsnitt</span>
          <a className="lo-link" href="#kommentarer">
            Till kommentarerna
            <Arrow />
          </a>
        </div>
      </PageHead>

      {prospect.publishedSections.length === 0 ? (
        <section className="lo-section">
          <div className="lo-wrap">
            <p className="lo-muted">Inget publicerat innehåll än.</p>
          </div>
        </section>
      ) : (
        prospect.publishedSections.map((section, index) => (
          <section key={section.id} className="lo-section">
            <div className="lo-wrap lo-split">
              <div className="lo-section-side">
                <p className="lo-label">{String(index + 1).padStart(2, "0")}</p>
                <h2 className="lo-section-title">{section.title}</h2>
              </div>
              <div className="lo-section-body">
                <p className="lo-lede" style={{ whiteSpace: "pre-wrap" }}>{section.body}</p>
                {section.attachments?.length > 0 ? (
                  <ul className="lo-rules lo-rules--one">
                    {section.attachments.map((attachment, attachmentIndex) => (
                      <li key={`${attachment.storageId}-${attachmentIndex}`}>
                        <a className="lo-link" href={attachment.url} target="_blank" rel="noopener noreferrer">
                          {attachment.fileName}
                          <Arrow />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </section>
        ))
      )}

      <section className="lo-section" id="kommentarer">
        <div className="lo-wrap lo-split">
          <div className="lo-section-side">
            <p className="lo-label">Kommentarer</p>
            <h2 className="lo-section-title">Tyck till.</h2>
            <p className="lo-section-intro">Välj ett avsnitt, skriv ditt namn och din kommentar. Den syns för avsändaren i prospektet.</p>
          </div>
          <div className="lo-section-body">
            <div className="lo-app" style={{ width: "100%", height: 560 }}>
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
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}

export default ProspectGuestPage;
