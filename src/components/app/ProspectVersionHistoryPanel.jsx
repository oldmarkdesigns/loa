import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { formatDate } from "../../lib/formatters";
import { prospectsApi } from "../../api";
import { HistoryIcon } from "../icons/UiIcons";
import { Button } from "@/components/ui/button";

function ProspectVersionHistoryPanel({ prospectId, app, onRestored }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoringVersion, setRestoringVersion] = useState(null);

  async function loadVersions() {
    setLoading(true);
    try {
      const { versions: list } = await prospectsApi.listVersions(prospectId);
      setVersions(list);
    } catch (_error) {
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospectId]);

  async function restore(versionNumber) {
    setRestoringVersion(versionNumber);
    try {
      await prospectsApi.restoreVersion(prospectId, versionNumber);
      app.pushToast(`Version ${versionNumber} inläst i utkastet.`, "success");
      await onRestored?.();
    } finally {
      setRestoringVersion(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-ink-500">Laddar versionshistorik...</p>;
  }

  if (versions.length === 0) {
    return <p className="text-sm text-ink-500">Inga publicerade versioner än.</p>;
  }

  return (
    <div className="space-y-3">
      {versions.map((version) => (
        <Card key={version.id} className="gap-0 py-0 rounded-xl border border-veil/10 bg-canvas p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900">
              <HistoryIcon className="h-4 w-4" />
              Version {version.versionNumber}
            </span>
            <span className="text-xs text-ink-500">{formatDate(version.createdAt)}</span>
          </div>
          {version.changeSummary ? <p className="mt-1 text-sm text-ink-700">{version.changeSummary}</p> : null}
          <Button
            type="button"
            variant="secondary"
            className="h-auto mt-2 px-3 py-1.5 text-xs"
            onClick={() => restore(version.versionNumber)}
            disabled={restoringVersion === version.versionNumber}
          >
            {restoringVersion === version.versionNumber ? "Återställer..." : "Återställ till utkast"}
          </Button>
        </Card>
      ))}
    </div>
  );
}

export default ProspectVersionHistoryPanel;
