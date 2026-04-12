import { useMemo, useState } from "react";

function SettingsPage({ app }) {
  const { user, savedFilters, filterPresets = [], savedAiSearches = [], switchRole } = app;
  const [pendingRole, setPendingRole] = useState(false);

  const currentRoleLabel = useMemo(() => (user?.role === "publisher" ? "Hyresvärd" : "Hyresgäst"), [user?.role]);

  return (
    <section className="p-4 sm:p-6">
      <div className="mx-auto grid w-full max-w-[1100px] gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-black/10 bg-white p-5">
          <h1 className="text-2xl font-semibold">Inställningar</h1>
          <p className="mt-1 text-sm text-ink-600">Hantera profil, roll och sparade preferenser.</p>

          <div className="mt-4 space-y-2 text-sm">
            <p><span className="font-semibold">Namn:</span> {user?.name || "-"}</p>
            <p><span className="font-semibold">E-post:</span> {user?.email || "-"}</p>
            <p><span className="font-semibold">Telefon:</span> {user?.phone || "-"}</p>
            <p><span className="font-semibold">Aktiv roll:</span> {currentRoleLabel}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl border border-black/20 bg-white px-3 py-2 text-xs font-semibold"
              disabled={pendingRole}
              onClick={async () => {
                setPendingRole(true);
                try {
                  await switchRole("renter");
                } finally {
                  setPendingRole(false);
                }
              }}
            >
              Byt till Hyresgäst
            </button>
            <button
              type="button"
              className="rounded-xl border border-black/20 bg-white px-3 py-2 text-xs font-semibold"
              disabled={pendingRole}
              onClick={async () => {
                setPendingRole(true);
                try {
                  await switchRole("publisher");
                } finally {
                  setPendingRole(false);
                }
              }}
            >
              Byt till Hyresvärd
            </button>
          </div>
        </article>

        <article className="rounded-3xl border border-black/10 bg-white p-5">
          <h2 className="text-xl font-semibold">Sökhistorik</h2>
          <p className="mt-1 text-sm text-ink-600">Överblick över dina sparade sökningar.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-[#fafafa] px-3 py-2 text-xs">
              <p className="font-semibold text-ink-700">Sparade filter</p>
              <p className="mt-1 text-ink-600">{filterPresets.length} st</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-[#fafafa] px-3 py-2 text-xs">
              <p className="font-semibold text-ink-700">Sparade AI-sök</p>
              <p className="mt-1 text-ink-600">{savedAiSearches.length} st</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <p><span className="font-semibold">Sökfras:</span> {savedFilters.query || "-"}</p>
            <p><span className="font-semibold">Område:</span> {savedFilters.district || "Alla"}</p>
            <p><span className="font-semibold">Typ:</span> {savedFilters.type || "Alla"}</p>
            <p><span className="font-semibold">Maxbudget:</span> {savedFilters.maxBudget || "-"}</p>
            <p><span className="font-semibold">Teamstorlek:</span> {savedFilters.teamSize || "-"}</p>
            <p><span className="font-semibold">Verifierade:</span> {savedFilters.verified ? "Ja" : "Nej"}</p>
            <p><span className="font-semibold">Ledig nu:</span> {savedFilters.readyNow ? "Ja" : "Nej"}</p>
          </div>
        </article>
      </div>
    </section>
  );
}

export default SettingsPage;
