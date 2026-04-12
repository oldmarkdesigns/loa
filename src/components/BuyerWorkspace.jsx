import { useMemo, useState } from "react";
import AiSearchPanel from "./AiSearchPanel";
import { applyListingFilters } from "../data/matchEngine";

function formatSek(value) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0
  }).format(value);
}

const initialFilters = {
  query: "",
  district: "Alla",
  type: "Alla",
  maxBudget: 250000,
  teamSize: "",
  onlyVerified: false,
  readyNow: false
};

function CompactPropertyCard({ listing, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(listing)}
      className="rounded-2xl border border-ink-100 bg-white p-2 text-left transition hover:-translate-y-0.5 hover:shadow-surface"
    >
      <img src={listing.image} alt={listing.title} className="h-20 w-full rounded-xl object-cover" />
      <p className="mt-2 truncate text-xs font-semibold text-ink-900">{listing.title}</p>
      <p className="text-[11px] text-ink-500">{listing.district}</p>
      <div className="mt-1 flex items-center justify-between text-[11px] text-ink-600">
        <span>{listing.sizeSqm} kvm</span>
        <span>{listing.capacity} platser</span>
      </div>
    </button>
  );
}

function BuyerWorkspace({
  listings,
  districtOptions,
  listingTypes,
  quickNeeds,
  shortlist,
  onToggleShortlist,
  onOpenListing,
  onBookViewing
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [searchMode, setSearchMode] = useState("standard");

  const filteredListings = useMemo(() => applyListingFilters(listings, filters), [filters, listings]);
  const featuredListings = filteredListings.slice(0, 6);
  const spotlight = filteredListings[0] || listings[0];

  return (
    <main className="mx-auto mb-10 mt-6 grid w-[min(1320px,95vw)] gap-5 xl:grid-cols-[1.85fr_1fr]">
      <section className="space-y-5">
        <section className="relative overflow-hidden rounded-[34px] bg-ink-900 text-white shadow-surface">
          <img src="/mock/hero-main.svg" alt="Modern lokal" className="h-[520px] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-ink-900/35 via-brand-900/35 to-ink-900/70" />

          <div className="absolute inset-x-5 top-5 z-10 flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-white/90 p-2 text-brand-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 20V8l8-4 8 4v12H4Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </div>
              <p className="text-sm font-semibold">Lokalflöde</p>
            </div>

            <nav className="hidden items-center gap-2 rounded-full bg-white/15 px-2 py-1 text-xs md:flex">
              <button type="button" className="rounded-full bg-white/30 px-3 py-1 font-semibold">
                Hem
              </button>
              <button type="button" className="rounded-full px-3 py-1 text-white/85 hover:bg-white/15">
                Om
              </button>
              <button type="button" className="rounded-full px-3 py-1 text-white/85 hover:bg-white/15">
                Lokaler
              </button>
              <button
                type="button"
                className="rounded-full px-3 py-1 text-white/85 hover:bg-white/15"
                onClick={() => setSearchMode("ai")}
              >
                AI-sök
              </button>
            </nav>

            <button type="button" className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink-900" onClick={() => onBookViewing(spotlight)}>
              Kontakta hyresvärd
            </button>
          </div>

          <div className="absolute bottom-8 left-5 right-5 z-10 grid gap-6 md:grid-cols-[1fr_250px] md:items-end">
            <div className="max-w-xl">
              <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold">Byggt för snabb lokalmatchning</p>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.08] sm:text-5xl">
                Hitta rätt lokal med ett enklare flöde.
              </h1>
              <p className="mt-3 text-sm text-white/85 sm:text-base">
                Filtrera direkt eller låt AI-chatten ta fram bästa matchningar för ditt team och din budget.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900" onClick={() => onOpenListing(spotlight)}>
                  Kom igång
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white"
                  onClick={() => setSearchMode("ai")}
                >
                  Sök med AI
                </button>
              </div>
            </div>

            <div className="grid gap-3 text-right">
              <div className="ml-auto w-fit rounded-full bg-white/14 px-4 py-3 text-left backdrop-blur-md">
                <p className="text-2xl font-semibold">50+</p>
                <p className="text-xs text-white/80">Aktiva hyresvärder</p>
              </div>
              <div className="ml-auto w-fit rounded-full bg-white/14 px-4 py-3 text-left backdrop-blur-md">
                <p className="text-2xl font-semibold">2.1h</p>
                <p className="text-xs text-white/80">Median svarstid</p>
              </div>
              <div className="ml-auto w-fit rounded-full bg-white/14 px-4 py-3 text-left backdrop-blur-md">
                <p className="text-2xl font-semibold">{filteredListings.length}</p>
                <p className="text-xs text-white/80">Matchande lokaler</p>
              </div>
            </div>
          </div>
        </section>

        <section className="surface p-6 sm:p-7">
          <p className="inline-flex rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-semibold text-ink-600">Vilka vi är</p>
          <h2 className="mt-3 max-w-4xl font-display text-3xl font-semibold leading-tight text-ink-900">
            En tillitsdriven plattform för snabbare lokalaffärer. Tydlig data, enkel process och mindre manuellt arbete.
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="sm:col-span-2 rounded-3xl border border-ink-100 bg-white p-3">
              <img src="/mock/listing-2.svg" alt="Möte" className="h-52 w-full rounded-2xl object-cover" />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-3">
                  <p className="text-xs text-ink-500">Verifierad annonsdata</p>
                  <p className="mt-1 text-sm font-semibold text-ink-900">Automatisk uppföljning av tillgänglighet och pris</p>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <p className="text-xs text-ink-500">AI-matchning</p>
                  <p className="mt-1 text-sm font-semibold text-ink-900">Snabba förslag med motivering utifrån behov</p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-ink-100 bg-white p-4">
              <p className="text-3xl font-semibold text-ink-900">1 200+</p>
              <p className="text-sm text-ink-600">Kvalificerade intressen i testdata</p>
              <div className="mt-6 rounded-2xl bg-white p-3">
                <p className="text-2xl font-semibold text-ink-900">250+</p>
                <p className="text-sm text-ink-600">Team som hittat ny lokal via flödet</p>
              </div>
            </article>
          </div>
        </section>

        <section className="surface p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-xl font-semibold text-ink-900">Sökverktyg</h3>
            <div className="rounded-xl border border-ink-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setSearchMode("standard")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  searchMode === "standard" ? "bg-ink-900 text-white" : "text-ink-700"
                }`}
              >
                Filter
              </button>
              <button
                type="button"
                onClick={() => setSearchMode("ai")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  searchMode === "ai" ? "bg-ink-900 text-white" : "text-ink-700"
                }`}
              >
                AI-chat
              </button>
            </div>
          </div>

          {searchMode === "standard" ? (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <input
                  className="field"
                  value={filters.query}
                  onChange={(event) => setFilters((previous) => ({ ...previous, query: event.target.value }))}
                  placeholder="Sök område, adress eller lokal"
                />

                <select
                  className="field"
                  value={filters.district}
                  onChange={(event) => setFilters((previous) => ({ ...previous, district: event.target.value }))}
                >
                  <option value="Alla">Alla områden</option>
                  {districtOptions.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>

                <select
                  className="field"
                  value={filters.type}
                  onChange={(event) => setFilters((previous) => ({ ...previous, type: event.target.value }))}
                >
                  <option value="Alla">Alla typer</option>
                  {listingTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <input
                  className="field"
                  value={filters.teamSize}
                  type="number"
                  min="1"
                  onChange={(event) => setFilters((previous) => ({ ...previous, teamSize: event.target.value }))}
                  placeholder="Minsta platser"
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <label className="space-y-2">
                  <span className="text-xs font-semibold text-ink-600">Maxbudget: {formatSek(filters.maxBudget)}</span>
                  <input
                    className="w-full accent-brand-600"
                    type="range"
                    min="25000"
                    max="250000"
                    step="5000"
                    value={filters.maxBudget}
                    onChange={(event) => setFilters((previous) => ({ ...previous, maxBudget: event.target.value }))}
                  />
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={filters.onlyVerified}
                    onChange={(event) =>
                      setFilters((previous) => ({
                        ...previous,
                        onlyVerified: event.target.checked
                      }))
                    }
                  />
                  Verifierade
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={filters.readyNow}
                    onChange={(event) =>
                      setFilters((previous) => ({
                        ...previous,
                        readyNow: event.target.checked
                      }))
                    }
                  />
                  Ledig nu
                </label>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {featuredListings.slice(0, 2).map((listing) => (
                  <article key={listing.id} className="rounded-2xl border border-ink-100 bg-white p-3">
                    <div className="flex items-start gap-3">
                      <img src={listing.image} alt={listing.title} className="h-24 w-28 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900">{listing.title}</p>
                        <p className="text-xs text-ink-500">{listing.district} • {listing.sizeSqm} kvm</p>
                        <div className="mt-2 flex gap-2">
                          <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={() => onOpenListing(listing)}>
                            Visa
                          </button>
                          <button type="button" className="btn-primary px-3 py-1.5 text-xs" onClick={() => onBookViewing(listing)}>
                            Boka
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-4 h-[540px]">
              <AiSearchPanel
                listings={listings}
                quickNeeds={quickNeeds}
                filters={filters}
                onApplyFilters={setFilters}
                onOpenListing={onOpenListing}
              />
            </div>
          )}
        </section>
      </section>

      <aside className="space-y-4">
        <section className="surface p-4">
          <h3 className="font-display text-2xl font-semibold text-ink-900">Utforska lokaler</h3>
          <p className="mt-1 text-xs text-ink-600">Snabb översikt med de bästa matchningarna just nu.</p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {featuredListings.map((listing) => (
              <CompactPropertyCard key={listing.id} listing={listing} onOpen={onOpenListing} />
            ))}
          </div>

          <button type="button" className="btn-primary mt-4 w-full" onClick={() => setSearchMode("standard")}>
            Öppna alla matchningar
          </button>
        </section>

        <section className="surface p-4">
          <h4 className="font-display text-xl font-semibold text-ink-900">Hyr, jämför och ansök</h4>
          <div className="mt-3 space-y-2">
            <article className="rounded-2xl border border-ink-100 bg-white p-3">
              <p className="text-sm font-semibold text-ink-900">1. Hyr lokal</p>
              <p className="text-xs text-ink-600">Sök direkt bland verifierade lokaler.</p>
            </article>
            <article className="rounded-2xl border border-ink-100 bg-white p-3">
              <p className="text-sm font-semibold text-ink-900">2. Jämför alternativ</p>
              <p className="text-xs text-ink-600">Använd AI-sök eller sparade objekt för snabb jämförelse.</p>
            </article>
            <article className="rounded-2xl border border-ink-100 bg-white p-3">
              <p className="text-sm font-semibold text-ink-900">3. Skicka förfrågan</p>
              <p className="text-xs text-ink-600">Boka visning och fortsätt till offert med hyresvärden.</p>
            </article>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl">
          <img src="/mock/hero-main.svg" alt="Kampanj" className="h-40 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-900/75 via-ink-900/45 to-transparent" />
          <div className="absolute inset-0 p-4 text-white">
            <p className="text-sm font-semibold">Snabbläge med AI</p>
            <p className="mt-1 max-w-[180px] text-xs text-white/85">Få relevanta lokalförslag med ett par meddelanden.</p>
            <button type="button" className="mt-3 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-900" onClick={() => setSearchMode("ai")}>
              Starta AI-sök
            </button>
          </div>
        </section>

        <section className="surface p-4">
          <p className="font-display text-lg font-semibold text-ink-900">Sparade objekt</p>
          <p className="mt-1 text-xs text-ink-600">Sparade lokaler för snabb återkomst.</p>
          <div className="mt-3 space-y-2">
            {shortlist.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink-200 bg-white px-3 py-4 text-center text-sm text-ink-500">
                Inga sparade lokaler ännu.
              </div>
            ) : (
              shortlist.map((item) => (
                <div key={item.id} className="rounded-xl border border-ink-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink-800">{item.title}</p>
                      <p className="text-xs text-ink-500">{item.district}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleShortlist(item)}
                      className="text-xs font-semibold text-ink-500 hover:text-ink-900"
                    >
                      Ta bort
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onBookViewing(item)}
                    className="mt-2 w-full rounded-lg border border-brand-200 bg-brand-50 px-2 py-2 text-xs font-semibold text-brand-800"
                  >
                    Boka visning
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </aside>
    </main>
  );
}

export default BuyerWorkspace;
