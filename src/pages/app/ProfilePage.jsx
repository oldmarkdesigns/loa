import { useEffect, useMemo, useState } from "react";
import ListingVisualCard from "../../components/app/ListingVisualCard";
import { navigateTo } from "../../lib/router";

const DEFAULT_MAX_BUDGET = 250000;

function formatTimestamp(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Nyss";
  return parsed.toLocaleString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function buildHistoryChips(filters = {}, aiPrompt = "") {
  const chips = [];
  const query = String(filters.query || "").trim();
  const keyword = String(filters.keyword || "").trim();
  const district = String(filters.district || "").trim();
  const typeArray = Array.isArray(filters.type) ? filters.type.filter(Boolean) : [];
  const minSize = String(filters.minSize || "").trim();
  const maxSize = String(filters.maxSize || "").trim();
  const teamSize = String(filters.teamSize || "").trim();
  const minBudget = String(filters.minBudget || "").trim();
  const maxBudget = String(filters.maxBudget || "").trim();

  if (aiPrompt) chips.push(`AI: ${aiPrompt}`);
  if (query) chips.push(`Sök: ${query}`);
  if (!query && keyword) chips.push(`Sökord: ${keyword}`);
  if (district && district !== "Alla") chips.push(`Område: ${district}`);
  if (typeArray.length > 0) chips.push(`Typ: ${typeArray.join(", ")}`);
  if (teamSize) chips.push(`Platser: ${teamSize}+`);
  if (minSize || maxSize) chips.push(`Yta: ${minSize || 0}-${maxSize || "∞"} kvm`);
  if (minBudget || (maxBudget && Number(maxBudget) !== DEFAULT_MAX_BUDGET)) chips.push(`Budget: ${minBudget || 0}-${maxBudget || "∞"} kr`);
  if (filters.transitDistance) chips.push(`Kommunaltrafik: ${filters.transitDistance}`);
  if (filters.contractFlex) chips.push(`Avtal: ${filters.contractFlex}`);
  if (filters.accessHours) chips.push(`Access: ${filters.accessHours}`);
  if (filters.parkingType) chips.push(`Parkering: ${filters.parkingType}`);
  if (filters.layoutType) chips.push(`Planlösning: ${filters.layoutType}`);
  if (filters.advertiser && filters.advertiser !== "Alla") chips.push(`Annonsör: ${filters.advertiser}`);
  if (filters.includeOperatingCosts) chips.push("Driftkostnader ingår");
  if (filters.accessibilityAdapted) chips.push("Tillgänglighetsanpassad");
  if (filters.ecoCertified) chips.push("Miljöcertifierad");
  if (filters.verified) chips.push("Verifierade objekt");
  if (filters.readyNow) chips.push("Ledig nu");

  return chips.slice(0, 12);
}

function buildHistoryDetails(filters = {}, aiPrompt = "") {
  const details = [];
  const query = String(filters.query || "").trim();
  const keyword = String(filters.keyword || "").trim();
  const district = String(filters.district || "").trim();
  const typeArray = Array.isArray(filters.type) ? filters.type.filter(Boolean) : [];
  const minSize = String(filters.minSize || "").trim();
  const maxSize = String(filters.maxSize || "").trim();
  const teamSize = String(filters.teamSize || "").trim();
  const minBudget = String(filters.minBudget || "").trim();
  const maxBudget = String(filters.maxBudget || "").trim();

  if (aiPrompt) details.push({ label: "AI-sök", value: aiPrompt });
  if (query || keyword) details.push({ label: "Söktext", value: query || keyword });
  if (district && district !== "Alla") details.push({ label: "Område", value: district });
  if (typeArray.length > 0) details.push({ label: "Typ", value: typeArray.join(", ") });
  if (teamSize) details.push({ label: "Team", value: `${teamSize} platser` });
  if (minSize || maxSize) details.push({ label: "Yta", value: `${minSize || "0"}-${maxSize || "∞"} kvm` });
  if (minBudget || (maxBudget && Number(maxBudget) !== DEFAULT_MAX_BUDGET)) details.push({ label: "Budget", value: `${minBudget || "0"}-${maxBudget || "∞"} kr` });
  if (filters.moveInDate) details.push({ label: "Inflyttning", value: filters.moveInDate });
  if (filters.transitDistance) details.push({ label: "Kommunaltrafik", value: filters.transitDistance });

  return details.slice(0, 8);
}

function buildRentSearchUrl(filters = {}, { aiPrompt = "" } = {}) {
  const params = new URLSearchParams();
  const query = String(filters.query || "").trim();
  const keyword = String(filters.keyword || "").trim();
  const district = String(filters.district || "").trim();
  const typeArray = Array.isArray(filters.type) ? filters.type.filter(Boolean) : [];
  const minSize = String(filters.minSize || "").trim();
  const maxSize = String(filters.maxSize || "").trim();
  const teamSize = String(filters.teamSize || "").trim();
  const minBudget = String(filters.minBudget || "").trim();
  const maxBudget = String(filters.maxBudget || "").trim();

  params.set("run", "1");
  if (query) params.set("query", query);
  else if (keyword) params.set("query", keyword);
  if (district && district !== "Alla") params.set("district", district);
  if (typeArray[0]) params.set("type", typeArray[0]);
  if (minSize) params.set("minSize", minSize);
  if (maxSize) params.set("maxSize", maxSize);
  if (teamSize) params.set("teamSize", teamSize);
  if (minBudget) params.set("minBudget", minBudget);
  if (maxBudget && Number(maxBudget) !== DEFAULT_MAX_BUDGET) params.set("maxBudget", maxBudget);
  if (filters.transitDistance) params.set("transitDistance", filters.transitDistance);
  if (filters.moveInDate) params.set("moveInDate", filters.moveInDate);
  if (filters.contractFlex) params.set("contractFlex", filters.contractFlex);
  if (filters.accessHours) params.set("accessHours", filters.accessHours);
  if (filters.parkingType) params.set("parkingType", filters.parkingType);
  if (filters.layoutType) params.set("layoutType", filters.layoutType);
  if (filters.advertiser && filters.advertiser !== "Alla") params.set("advertiser", filters.advertiser);
  if (filters.includeOperatingCosts) params.set("includeOperatingCosts", "1");
  if (filters.accessibilityAdapted) params.set("accessibilityAdapted", "1");
  if (filters.ecoCertified) params.set("ecoCertified", "1");
  if (filters.verified) params.set("verified", "1");
  if (filters.readyNow) params.set("readyNow", "1");
  if (aiPrompt) {
    params.set("ai", "1");
    params.set("aiPrompt", aiPrompt);
  }
  return `/app/rent?${params.toString()}`;
}

function ProfilePage({ app }) {
  const {
    user,
    listings = [],
    favorites = [],
    filterPresets = [],
    switchRole,
    toggleFavorite,
    deleteSavedFilter
  } = app;
  const [pendingRole, setPendingRole] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [teamInvite, setTeamInvite] = useState({
    email: "",
    firstName: "",
    lastName: ""
  });
  const [teamMembers, setTeamMembers] = useState(() => {
    const seeded = Array.isArray(user?.teamMembers) ? user.teamMembers : [];
    if (seeded.length > 0) return seeded;
    return [
      {
        id: "team-owner",
        email: user?.email || "konto@foretag.se",
        firstName: (user?.name || "").split(" ")[0] || "Kontoinnehavare",
        lastName: (user?.name || "").split(" ").slice(1).join(" ") || "",
        status: "Aktiv"
      }
    ];
  });

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "profile" || tab === "favorites" || tab === "history") {
      setActiveTab(tab);
    }
  }, []);

  const roleSet = useMemo(() => new Set(Array.isArray(user?.roles) ? user.roles : [user?.role || "renter"]), [user?.role, user?.roles]);
  const hasRenter = roleSet.has("renter");
  const hasPublisher = roleSet.has("publisher");
  const canSwitchRoles = hasRenter && hasPublisher;

  const currentRoleLabel = useMemo(() => (user?.role === "publisher" ? "Annonsör" : "Hyresgäst"), [user?.role]);
  const favoriteIds = useMemo(() => new Set(favorites.map((entry) => String(entry.listingId))), [favorites]);
  const favoriteListings = useMemo(() => {
    return listings.filter((listing) => favoriteIds.has(String(listing.id)));
  }, [favoriteIds, listings]);

  function activateTab(tabKey) {
    setActiveTab(tabKey);
    const params = new URLSearchParams(window.location.search);
    if (tabKey === "profile") {
      params.delete("tab");
    } else {
      params.set("tab", tabKey);
    }
    const nextSearch = params.toString();
    const basePath = window.location.pathname;
    window.history.replaceState(window.history.state, "", nextSearch ? `${basePath}?${nextSearch}` : basePath);
  }

  function inviteTeamMember(event) {
    event.preventDefault();
    const email = teamInvite.email.trim().toLowerCase();
    const firstName = teamInvite.firstName.trim();
    const lastName = teamInvite.lastName.trim();
    if (!email || !firstName) {
      app.pushToast?.("Fyll i e-post och förnamn för att bjuda in en användare.", "error");
      return;
    }
    const alreadyExists = teamMembers.some((member) => member.email.toLowerCase() === email);
    if (alreadyExists) {
      app.pushToast?.("Den här användaren finns redan i teamet.", "error");
      return;
    }
    setTeamMembers((prev) => [
      ...prev,
      {
        id: `team-${Date.now()}`,
        email,
        firstName,
        lastName,
        status: "Inbjuden"
      }
    ]);
    setTeamInvite({ email: "", firstName: "", lastName: "" });
    app.pushToast?.(`Inbjudan skickad till ${email}.`, "success");
  }

  function removeTeamMember(memberId) {
    setTeamMembers((prev) => prev.filter((member) => member.id !== memberId));
    app.pushToast?.("Användaren har tagits bort från teamet.", "success");
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-black/10 bg-white px-4 py-2 sm:px-6">
        <nav className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-start gap-5">
          {[
            { key: "profile", label: "Profil" },
            { key: "favorites", label: "Sparade objekt" },
            { key: "history", label: "Sparade sökningar" }
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`border-b-2 pb-0.5 text-sm font-semibold transition ${
                  active
                    ? "border-[#0f1930] text-[#0f1930]"
                    : "border-transparent text-ink-600 hover:text-black"
                }`}
                onClick={() => activateTab(tab.key)}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-[1240px]">

        {activeTab === "profile" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-black/10 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/20 bg-white text-sm font-semibold text-ink-700">
                  {(user?.name || "AA")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() || "")
                    .join("")}
                </div>
                <div>
                  <p className="text-lg font-semibold text-black">{user?.name || "Användare"}</p>
                  <p className="text-sm text-ink-600">{user?.email || "-"}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <p><span className="font-semibold">Telefon:</span> {user?.phone || "-"}</p>
                <p><span className="font-semibold">Aktiv roll:</span> {currentRoleLabel}</p>
                <p><span className="font-semibold">Tillgängliga roller:</span> {[...roleSet].map((role) => (role === "publisher" ? "Annonsör" : "Hyresgäst")).join(", ")}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {!hasRenter ? (
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
                    Lägg till Hyresgäst
                  </button>
                ) : null}
                {!hasPublisher ? (
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
                    Lägg till Annonsör
                  </button>
                ) : null}
                {canSwitchRoles ? (
                  <>
                    <button
                      type="button"
                      className="rounded-xl border border-black/20 bg-white px-3 py-2 text-xs font-semibold"
                      disabled={pendingRole || user?.role === "renter"}
                      onClick={async () => {
                        setPendingRole(true);
                        try {
                          await switchRole("renter");
                        } finally {
                          setPendingRole(false);
                        }
                      }}
                    >
                      Växla till Hyresgäst
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-black/20 bg-white px-3 py-2 text-xs font-semibold"
                      disabled={pendingRole || user?.role === "publisher"}
                      onClick={async () => {
                        setPendingRole(true);
                        try {
                          await switchRole("publisher");
                        } finally {
                          setPendingRole(false);
                        }
                      }}
                    >
                      Växla till Annonsör
                    </button>
                  </>
                ) : null}
              </div>
            </article>

            <article className="rounded-3xl border border-black/10 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Hantera användare</h2>
                  <p className="mt-1 text-sm text-ink-600">
                    Bjud in kollegor så att ni kan söka lokaler tillsammans, spara objekt och boka visningar i samma team.
                  </p>
                </div>
                <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-ink-700">
                  {teamMembers.length} användare
                </span>
              </div>

              <form className="mt-4 grid gap-2 sm:grid-cols-[1.3fr_1fr_1fr_auto]" onSubmit={inviteTeamMember}>
                <input
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500 focus:border-[#0f1930] focus:outline-none"
                  value={teamInvite.email}
                  onChange={(event) => setTeamInvite((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="E-post"
                  type="email"
                />
                <input
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500 focus:border-[#0f1930] focus:outline-none"
                  value={teamInvite.firstName}
                  onChange={(event) => setTeamInvite((prev) => ({ ...prev, firstName: event.target.value }))}
                  placeholder="Förnamn"
                />
                <input
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500 focus:border-[#0f1930] focus:outline-none"
                  value={teamInvite.lastName}
                  onChange={(event) => setTeamInvite((prev) => ({ ...prev, lastName: event.target.value }))}
                  placeholder="Efternamn"
                />
                <button
                  type="submit"
                  className="rounded-xl border border-[#0f1930] bg-[#0f1930] px-3 py-2 text-xs font-semibold text-white hover:bg-[#16233f]"
                >
                  Bjud in
                </button>
              </form>

              <div className="mt-4 overflow-hidden rounded-2xl border border-black/10">
                <div className="grid grid-cols-[1.6fr_1fr_1fr_auto] gap-2 border-b border-black/10 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  <span>E-post</span>
                  <span>Förnamn</span>
                  <span>Efternamn</span>
                  <span className="text-right">Status</span>
                </div>
                <div className="divide-y divide-black/10">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="grid grid-cols-[1.6fr_1fr_1fr_auto] items-center gap-2 px-3 py-2 text-sm text-ink-700">
                      <span className="truncate">{member.email}</span>
                      <span className="truncate">{member.firstName || "-"}</span>
                      <span className="truncate">{member.lastName || "-"}</span>
                      <div className="inline-flex items-center justify-end gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          member.status === "Aktiv"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border border-amber-200 bg-amber-50 text-amber-800"
                        }`}>
                          {member.status}
                        </span>
                        {member.id !== "team-owner" ? (
                          <button
                            type="button"
                            className="rounded-lg border border-black/10 bg-white px-2 py-1 text-[11px] font-semibold text-ink-700 hover:bg-white"
                            onClick={() => removeTeamMember(member.id)}
                          >
                            Ta bort
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        ) : null}

        {activeTab === "favorites" ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold">Sparade objekt</h2>
                <p className="mt-1 text-sm text-ink-600">Objekt du har sparat för uppföljning.</p>
              </div>
              <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-ink-700">
                {favoriteListings.length} sparade
              </span>
            </div>
            {favoriteListings.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-black/10 bg-[#fafafa] px-3 py-3 text-sm text-ink-600">
                Inga sparade objekt ännu.
              </p>
            ) : (
              <div className="mt-3 grid gap-4 lg:grid-cols-3">
                {favoriteListings.map((listing) => (
                  <ListingVisualCard
                    key={listing.id}
                    listing={listing}
                    shortlisted={favoriteIds.has(String(listing.id))}
                    onOpenListing={(selected) => navigateTo(`/app/listings/${encodeURIComponent(selected.id)}`)}
                    onToggleShortlist={(listingId) => toggleFavorite?.(listingId)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "history" ? (
          <div>
            <article className="rounded-3xl border border-black/10 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-semibold">Sparade filter</h2>
                  <p className="mt-1 text-sm text-ink-600">Välj ett filter för att öppna sökresultat med samma inställningar.</p>
                </div>
                <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-ink-700">
                  {filterPresets.length} sparade
                </span>
              </div>
              {filterPresets.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-black/10 bg-[#fafafa] px-3 py-3 text-sm text-ink-600">
                  Inga sparade filter ännu.
                </p>
              ) : (
                <div className="mt-3 grid gap-3">
                  {filterPresets.map((preset) => {
                    const chips = buildHistoryChips(preset.filters);
                    const details = buildHistoryDetails(preset.filters);
                    const targetUrl = buildRentSearchUrl(preset.filters);
                    return (
                      <article
                        key={preset.id}
                        className="cursor-pointer rounded-2xl border border-black/10 bg-white p-3 transition hover:border-[#0f1930]/35"
                        onClick={() => navigateTo(targetUrl)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            navigateTo(targetUrl);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-black">{preset.title || "Sparat filter"}</p>
                            <p className="text-xs text-ink-500">Uppdaterad {formatTimestamp(preset.updatedAt || preset.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="rounded-xl border border-black/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-white"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigateTo(targetUrl);
                              }}
                            >
                              Sök igen
                            </button>
                            <button
                              type="button"
                              className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteSavedFilter?.(preset.id);
                              }}
                            >
                              Radera
                            </button>
                          </div>
                        </div>
                        {details.length > 0 ? (
                          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                            {details.map((item) => (
                              <div key={`${preset.id}-${item.label}-${item.value}`} className="rounded-xl border border-black/10 bg-white px-2.5 py-2">
                                <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">{item.label}</dt>
                                <dd className="mt-0.5 text-xs font-medium text-ink-800">{item.value}</dd>
                              </div>
                            ))}
                          </dl>
                        ) : null}
                        {chips.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {chips.map((chip) => (
                              <span key={`${preset.id}-${chip}`} className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-700">
                                {chip}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </article>
          </div>
        ) : null}
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;
