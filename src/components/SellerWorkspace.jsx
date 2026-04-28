import { useMemo, useState } from "react";
import AiSearchPanel from "./AiSearchPanel";
import { applyListingFilters } from "../data/matchEngine";

const steps = ["Grund", "Villkor", "Media", "Granska"];

const emptyDraft = {
  title: "",
  district: "Norrmalm",
  address: "",
  type: "Kontor",
  rent: "",
  sizeSqm: "",
  capacity: "",
  term: "12 månader",
  availability: "Ledig nu",
  responseHours: "2",
  amenities: "Mötesrum, Fiber, Kök",
  coverImage: "/mock/listing-5.svg"
};

const initialBuyerFilters = {
  query: "",
  district: "Alla",
  type: "Alla",
  maxBudget: 250000,
  teamSize: "",
  onlyVerified: false,
  readyNow: false
};

function formatSek(value) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function ListingVisualCard({ listing, shortlisted, onOpenListing, onBookViewing, onToggleShortlist }) {
  return (
    <article className="property-card-hover overflow-hidden rounded-3xl border border-[#d9d9d9] bg-[#fffffe]">
      <button type="button" onClick={() => onOpenListing(listing)} className="relative block w-full text-left">
        <img src={listing.image} alt={listing.title} className="h-52 w-full object-cover" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-xl border border-white/40 bg-black/55 px-2 py-1 text-[11px] font-semibold text-white">{listing.type}</span>
          {listing.verified && (
            <span className="rounded-xl border border-white/40 bg-[#fffffe]/90 px-2 py-1 text-[11px] font-semibold text-black">Verifierad</span>
          )}
        </div>
      </button>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-lg font-semibold text-black">{listing.title}</h3>
          <p className="text-xs text-ink-500">{listing.district} • {listing.address}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-2xl border border-black/10 bg-[#fafafa] px-2 py-2">{listing.sizeSqm} kvm</div>
          <div className="rounded-2xl border border-black/10 bg-[#fafafa] px-2 py-2">{listing.capacity} platser</div>
          <div className="rounded-2xl border border-black/10 bg-[#fafafa] px-2 py-2">Svar: {listing.responseHours}h</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onBookViewing(listing)}
            className="rounded-2xl border border-[#0f1930] bg-[#0f1930] hover:bg-[#16233f] px-3 py-2 text-xs font-semibold text-white"
          >
            Boka visning
          </button>
          <button
            type="button"
            onClick={() => onToggleShortlist(listing)}
            className="rounded-2xl border border-black/10 bg-[#fffffe] px-3 py-2 text-xs font-semibold text-black"
          >
            {shortlisted ? "Sparad" : "Spara"}
          </button>
          <button
            type="button"
            onClick={() => onOpenListing(listing)}
            className="rounded-2xl border border-black/10 bg-[#fffffe] px-3 py-2 text-xs font-semibold text-black"
          >
            Visa
          </button>
        </div>
      </div>
    </article>
  );
}

function SellerWorkspace({
  mode,
  onModeChange,
  listings,
  districtOptions,
  listingTypes,
  quickNeeds,
  shortlist,
  onOpenListing,
  onToggleShortlist,
  onBookViewing,
  sellerMetrics,
  onPublishToast
}) {
  const [step, setStep] = useState(0);
  const [searchTool, setSearchTool] = useState("filter");
  const [draft, setDraft] = useState(emptyDraft);
  const [publishedCount, setPublishedCount] = useState(12);
  const [buyerFilters, setBuyerFilters] = useState(initialBuyerFilters);

  const completeness = useMemo(() => {
    const required = ["title", "address", "rent", "sizeSqm", "capacity"];
    const done = required.filter((field) => String(draft[field]).trim()).length;
    return Math.round((done / required.length) * 100);
  }, [draft]);

  const filteredListings = useMemo(() => applyListingFilters(listings, buyerFilters), [listings, buyerFilters]);

  function publishListing() {
    setPublishedCount((value) => value + 1);
    setDraft(emptyDraft);
    setStep(0);
    onPublishToast("Annonsen är publicerad i prototypläge och syns nu för hyresgäster.");
  }

  return (
    <main className="min-h-screen w-full bg-[#fffffe] text-black">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-[#fffffe] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">Lokalflöde Stockholm</span>
          <span className="text-xs text-ink-500">Prototyp</span>
        </div>

        <div className="inline-flex rounded-2xl border border-black/10 bg-[#fffffe] p-1 text-xs">
          <button
            type="button"
            onClick={() => onModeChange("buyer")}
            className={`rounded-xl px-4 py-2 font-semibold ${mode === "buyer" ? "bg-[#0f1930] text-white" : "text-ink-600"}`}
          >
            Hyr lokal
          </button>
          <button
            type="button"
            onClick={() => onModeChange("seller")}
            className={`rounded-xl px-4 py-2 font-semibold ${mode === "seller" ? "bg-[#0f1930] text-white" : "text-ink-600"}`}
          >
            Publicera lokal
          </button>
        </div>
      </header>

      {mode === "buyer" ? (
        <section className="grid h-[calc(100vh-64px)] overflow-hidden lg:grid-cols-[500px_1fr] xl:grid-cols-[540px_1fr]">
          <aside className="h-full overflow-hidden border-b border-black/10 bg-[#fffffe] p-4 lg:border-b-0 lg:border-r lg:p-5">
            <div className="flex h-full flex-col gap-4">
              <div>
                <h2 className="mt-1 text-3xl font-semibold">Sök & filtrera</h2>
              </div>

              <div className="inline-flex w-fit rounded-2xl border border-black/10 bg-[#fffffe] p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSearchTool("filter")}
                  className={`rounded-xl px-4 py-2 font-semibold ${searchTool === "filter" ? "bg-[#0f1930] text-white" : "text-ink-600"}`}
                >
                  Filter
                </button>
                <button
                  type="button"
                  onClick={() => setSearchTool("ai")}
                  className={`rounded-xl px-4 py-2 font-semibold ${searchTool === "ai" ? "bg-[#0f1930] text-white" : "text-ink-600"}`}
                >
                  AI-sök
                </button>
              </div>

              {searchTool === "filter" ? (
                <div className="rounded-3xl border border-[#c8d1de] bg-gradient-to-br from-[#edf2f7] via-[#eaf0f7] to-[#f3f6fb] p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Sökprofil</p>
                    <span className="rounded-full border border-white/70 bg-[#fffffe]/75 px-2 py-1 text-[11px] font-semibold text-ink-600">
                      Aktiv
                    </span>
                  </div>

                  <div className="space-y-3">
                    <input
                      className="field"
                      value={buyerFilters.query}
                      onChange={(event) => setBuyerFilters((prev) => ({ ...prev, query: event.target.value }))}
                      placeholder="Sök område, adress eller lokal"
                    />

                    <select
                      className="field"
                      value={buyerFilters.district}
                      onChange={(event) => setBuyerFilters((prev) => ({ ...prev, district: event.target.value }))}
                    >
                      <option value="Alla">Alla områden</option>
                      {districtOptions.map((district) => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>

                    <select
                      className="field"
                      value={buyerFilters.type}
                      onChange={(event) => setBuyerFilters((prev) => ({ ...prev, type: event.target.value }))}
                    >
                      <option value="Alla">Alla typer</option>
                      {listingTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>

                    <input
                      className="field"
                      type="number"
                      min="1"
                      value={buyerFilters.teamSize}
                      onChange={(event) => setBuyerFilters((prev) => ({ ...prev, teamSize: event.target.value }))}
                      placeholder="Minsta platser"
                    />

                    <label className="space-y-1">
                      <span className="text-[11px] text-ink-600">Maxbudget: {formatSek(buyerFilters.maxBudget)}</span>
                      <input
                        className="w-full accent-brand-600"
                        type="range"
                        min="25000"
                        max="250000"
                        step="5000"
                        value={buyerFilters.maxBudget}
                        onChange={(event) => setBuyerFilters((prev) => ({ ...prev, maxBudget: event.target.value }))}
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 rounded-2xl border border-black/10 bg-[#fffffe] px-3 py-2.5 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={buyerFilters.onlyVerified}
                          onChange={(event) => setBuyerFilters((prev) => ({ ...prev, onlyVerified: event.target.checked }))}
                        />
                        Verifierade
                      </label>
                      <label className="flex items-center gap-2 rounded-2xl border border-black/10 bg-[#fffffe] px-3 py-2.5 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={buyerFilters.readyNow}
                          onChange={(event) => setBuyerFilters((prev) => ({ ...prev, readyNow: event.target.checked }))}
                        />
                        Ledig nu
                      </label>
                    </div>

                    <button
                      type="button"
                      className="rounded-2xl border border-black/20 bg-[#fffffe] px-4 py-2 text-xs font-semibold"
                      onClick={() => setBuyerFilters(initialBuyerFilters)}
                    >
                      Nollställ filter
                    </button>
                  </div>
                </div>
              ) : (
                <div className="min-h-0 flex-1">
                  <AiSearchPanel
                    listings={listings}
                    quickNeeds={quickNeeds}
                    filters={buyerFilters}
                    onApplyFilters={setBuyerFilters}
                    onOpenListing={onOpenListing}
                  />
                </div>
              )}

              <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-3">
                <p className="mt-1 text-sm text-ink-700">Sparade objekt: {shortlist.length}</p>
                <div className="mt-2 space-y-1">
                  {shortlist.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <span className="truncate pr-2">{item.title}</span>
                      <button type="button" onClick={() => onToggleShortlist(item)} className="text-ink-500">Ta bort</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="flex h-full min-h-0 flex-col p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-semibold">Matchande objekt</h1>
              </div>
              <div className="rounded-2xl border border-black/10 bg-[#fffffe] px-3 py-2 text-xs font-semibold">
                {filteredListings.length} träffar
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {filteredListings.length === 0 ? (
                <div className="rounded-3xl border border-black/10 bg-[#fffffe] p-10 text-center text-sm text-ink-500">
                  Inga objekt matchar dina filter just nu.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredListings.map((listing) => (
                    <ListingVisualCard
                      key={listing.id}
                      listing={listing}
                      shortlisted={shortlist.some((entry) => entry.id === listing.id)}
                      onOpenListing={onOpenListing}
                      onBookViewing={onBookViewing}
                      onToggleShortlist={onToggleShortlist}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </section>
      ) : (
        <section className="flex min-h-[calc(100vh-64px)] items-start justify-center p-4 sm:p-8">
          <div className="w-full max-w-4xl rounded-3xl border border-black/10 bg-[#fffffe] p-5 sm:p-8">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Publiceringsflöde</p>
              <h1 className="mt-1 text-4xl font-semibold">Publicera objekt</h1>
              <p className="mt-2 text-sm text-ink-500">Ett centrerat steg-för-steg-flöde för snabb publicering.</p>
            </div>

            <div className="mt-6 inline-flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-black/10 bg-[#fffffe] p-1 text-xs">
              {steps.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStep(index)}
                  className={`rounded-xl px-4 py-2 font-semibold ${step === index ? "bg-[#0f1930] text-white" : "text-ink-600"}`}
                >
                  {index + 1}. {label}
                </button>
              ))}
            </div>

            <div className="mx-auto mt-4 h-2 w-full max-w-xl rounded-full bg-ink-100">
              <div className="h-2 rounded-full bg-black transition-all" style={{ width: `${completeness}%` }} />
            </div>
            <p className="mt-2 text-center text-xs font-semibold text-ink-600">Färdiggrad: {completeness}%</p>

            <div className="mx-auto mt-6 max-w-2xl space-y-3">
              {step === 0 && (
                <>
                  <input className="field" value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} placeholder="Rubrik för annons" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select className="field" value={draft.district} onChange={(e) => setDraft((p) => ({ ...p, district: e.target.value }))}>
                      <option>Norrmalm</option>
                      <option>Södermalm</option>
                      <option>Vasastan</option>
                      <option>Östermalm</option>
                      <option>Kungsholmen</option>
                      <option>Solna</option>
                    </select>
                    <select className="field" value={draft.type} onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value }))}>
                      <option>Kontor</option>
                      <option>Coworking</option>
                      <option>Studio</option>
                      <option>Butik</option>
                      <option>Klinik</option>
                    </select>
                  </div>
                  <input className="field" value={draft.address} onChange={(e) => setDraft((p) => ({ ...p, address: e.target.value }))} placeholder="Adress" />
                </>
              )}

              {step === 1 && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input className="field" type="number" value={draft.rent} onChange={(e) => setDraft((p) => ({ ...p, rent: e.target.value }))} placeholder="Månadshyra (SEK)" />
                    <input className="field" type="number" value={draft.sizeSqm} onChange={(e) => setDraft((p) => ({ ...p, sizeSqm: e.target.value }))} placeholder="Yta (kvm)" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input className="field" type="number" value={draft.capacity} onChange={(e) => setDraft((p) => ({ ...p, capacity: e.target.value }))} placeholder="Kapacitet" />
                    <input className="field" value={draft.term} onChange={(e) => setDraft((p) => ({ ...p, term: e.target.value }))} placeholder="Avtalstid" />
                    <input className="field" value={draft.availability} onChange={(e) => setDraft((p) => ({ ...p, availability: e.target.value }))} placeholder="Tillgänglighet" />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <input className="field" value={draft.coverImage} onChange={(e) => setDraft((p) => ({ ...p, coverImage: e.target.value }))} placeholder="Sökväg till omslagsbild" />
                  <textarea className="field min-h-24" value={draft.amenities} onChange={(e) => setDraft((p) => ({ ...p, amenities: e.target.value }))} placeholder="Faciliteter, separera med kommatecken" />
                </>
              )}

              {step === 3 && (
                <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-4 text-sm">
                  <p className="font-semibold">Förhandsvisning</p>
                  <p className="mt-1 text-ink-600">{draft.title || "Namnlös annons"}</p>
                  <p className="text-ink-500">{draft.district} • {draft.address || "Adress saknas"}</p>
                  <p className="mt-2 text-ink-600">Hyra: {draft.rent || "-"} SEK • Yta: {draft.sizeSqm || "-"} kvm • Kapacitet: {draft.capacity || "-"}</p>
                  <img src={draft.coverImage} alt="Förhandsvisning" className="mt-3 h-40 w-full rounded-2xl object-cover" />
                </div>
              )}
            </div>

            <div className="mx-auto mt-6 flex w-full max-w-2xl items-center justify-between">
              <button type="button" className="rounded-2xl border border-black/20 bg-[#fffffe] px-4 py-2 text-xs font-semibold" onClick={() => setStep((v) => Math.max(v - 1, 0))}>
                Föregående
              </button>
              {step < steps.length - 1 ? (
                <button type="button" className="rounded-2xl border border-[#0f1930] bg-[#0f1930] hover:bg-[#16233f] px-4 py-2 text-xs font-semibold text-white" onClick={() => setStep((v) => Math.min(v + 1, steps.length - 1))}>
                  Nästa
                </button>
              ) : (
                <button type="button" className="rounded-2xl border border-[#0f1930] bg-[#0f1930] hover:bg-[#16233f] px-4 py-2 text-xs font-semibold text-white" onClick={publishListing}>
                  Publicera annons
                </button>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-3 text-sm">
                <p className="text-xs text-ink-500">Aktiva annonser</p>
                <p className="mt-1 text-2xl font-semibold">{publishedCount}</p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-3 text-sm">
                <p className="text-xs text-ink-500">Kvalificerade intressen</p>
                <p className="mt-1 text-2xl font-semibold">{sellerMetrics[1].value}</p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-3 text-sm">
                <p className="text-xs text-ink-500">Median svarstid</p>
                <p className="mt-1 text-2xl font-semibold">{sellerMetrics[2].value}</p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-3 text-sm">
                <p className="text-xs text-ink-500">Bokade visningar</p>
                <p className="mt-1 text-2xl font-semibold">{sellerMetrics[3].value}</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default SellerWorkspace;
