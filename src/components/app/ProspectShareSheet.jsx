import { useEffect, useState } from "react";
import { prospectSharingApi } from "../../api";
import { PlusIcon, TrashIcon, UserPlusIcon } from "../icons/UiIcons";

function ProspectShareSheet({ prospectId, listingId, prospect, app }) {
  const [collaborators, setCollaborators] = useState([]);
  const [guestLinks, setGuestLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualUserId, setManualUserId] = useState("");
  const [pending, setPending] = useState(false);

  const listingLeads = (app.leads || []).filter((lead) => String(lead.listingId) === String(listingId));
  const renterNameById = new Map(listingLeads.map((lead) => [lead.renterId, lead.renter?.name || lead.renter?.email]));
  const canShare = Boolean(prospect.currentVersion);

  async function load() {
    setLoading(true);
    try {
      const [{ collaborators: collabList }, { guestLinks: linkList }] = await Promise.all([
        prospectSharingApi.listCollaborators(prospectId),
        prospectSharingApi.listGuestLinks(prospectId)
      ]);
      setCollaborators(collabList);
      setGuestLinks(linkList);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospectId]);

  async function addCollaborator(userId) {
    if (!userId) return;
    setPending(true);
    try {
      await prospectSharingApi.addCollaborator(prospectId, userId);
      setManualUserId("");
      await load();
    } finally {
      setPending(false);
    }
  }

  async function removeCollaborator(userId) {
    setPending(true);
    try {
      await prospectSharingApi.removeCollaborator(prospectId, userId);
      await load();
    } finally {
      setPending(false);
    }
  }

  async function createGuestLink() {
    setPending(true);
    try {
      await prospectSharingApi.createGuestLink(prospectId);
      await load();
    } catch (error) {
      app.pushToast(error.message || "Kunde inte skapa gästlänken.", "error");
    } finally {
      setPending(false);
    }
  }

  async function revokeGuestLink(guestLinkId) {
    setPending(true);
    try {
      await prospectSharingApi.revokeGuestLink(prospectId, guestLinkId);
      await load();
    } finally {
      setPending(false);
    }
  }

  function copyGuestLink(token) {
    const url = `${window.location.origin}/prospekt/dela/${token}`;
    navigator.clipboard?.writeText(url);
    app.pushToast("Länk kopierad.", "success");
  }

  const collaboratorUserIds = new Set(collaborators.map((collab) => collab.userId));

  if (loading) {
    return <p className="text-sm text-ink-500">Laddar delningsinställningar...</p>;
  }

  return (
    <div className="space-y-5">
      {!canShare ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Publicera en version innan du kan dela prospektet.
        </p>
      ) : null}

      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Interna samarbetspartners</p>
        <div className="mt-2 space-y-2">
          {collaborators.length === 0 ? <p className="text-sm text-ink-500">Ingen tillagd än.</p> : null}
          {collaborators.map((collab) => (
            <div key={collab.id} className="flex items-center justify-between rounded-xl border border-black/10 px-3 py-2 text-sm">
              <span className="truncate text-ink-800">{renterNameById.get(collab.userId) || collab.userId}</span>
              <button type="button" onClick={() => removeCollaborator(collab.userId)} disabled={pending} className="text-ink-500 hover:text-rose-600">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {listingLeads.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {listingLeads
              .filter((lead) => !collaboratorUserIds.has(lead.renterId))
              .map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  className="btn-secondary px-3 py-1.5 text-xs"
                  onClick={() => addCollaborator(lead.renterId)}
                  disabled={pending || !canShare}
                >
                  <UserPlusIcon className="mr-1.5 h-3.5 w-3.5" />
                  {lead.renter?.name || lead.renter?.email || "Hyresgäst"}
                </button>
              ))}
          </div>
        ) : null}

        <div className="mt-3 flex gap-2">
          <input
            className="field text-sm"
            placeholder="Användar-id (t.ex. u-renter-demo)"
            value={manualUserId}
            onChange={(event) => setManualUserId(event.target.value)}
          />
          <button
            type="button"
            className="btn-secondary shrink-0 px-3 text-sm"
            onClick={() => addCollaborator(manualUserId.trim())}
            disabled={pending || !canShare}
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Extern gästlänk</p>
        <p className="mt-1 text-sm text-ink-600">Läs- och kommenteringsåtkomst, inget konto krävs. Bra för t.ex. arkitekten.</p>
        <div className="mt-2 space-y-2">
          {guestLinks.map((link) => (
            <div key={link.id} className="rounded-xl border border-black/10 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-ink-800">{link.label || "Gästlänk"}</span>
                {link.revokedAt ? (
                  <span className="text-xs font-semibold text-rose-600">Återkallad</span>
                ) : (
                  <div className="flex shrink-0 gap-3">
                    <button type="button" className="text-xs font-semibold text-ink-700 underline" onClick={() => copyGuestLink(link.token)}>
                      Kopiera
                    </button>
                    <button type="button" className="text-xs font-semibold text-rose-600" onClick={() => revokeGuestLink(link.id)} disabled={pending}>
                      Återkalla
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn-secondary mt-3 w-full justify-center px-4 py-2 text-sm"
          onClick={createGuestLink}
          disabled={pending || !canShare}
        >
          <PlusIcon className="mr-1.5 h-4 w-4" />
          Skapa gästlänk
        </button>
      </section>
    </div>
  );
}

export default ProspectShareSheet;
