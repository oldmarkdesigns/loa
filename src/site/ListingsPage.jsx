import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { districtOptions, listingTypes } from "../data/mockData";
import DotMap, { listingGeo } from "./DotMap";
import { AI_KEYS, amenityMatches, hasInterpretation, interpretPrompt } from "./aiSearch";
import Dropdown, { Option } from "./Dropdown";
import { propertyAmenityDefinitions } from "../lib/propertyAmenityIcons";
import { Arrow, Band, Field, ListingCard, SiteFrame, linkTo, useAuthDoors } from "./SiteChrome";
import { listingHref, listingImages, prefersReducedMotion, scrollToId, sek, siteListings } from "./siteUtils";

// /lokaler: every lediga lokal, and three ways into them before the list:
// describe the need in your own words (AI-sök), pick on the map, or filter.
// Whatever is chosen lives in the address, so a search can be shared and the
// homepage's search lands here already narrowed. Below, the results show as a
// grid or as the map with the list beside it.

const SORTS = {
  relevans: { label: "Mest relevanta", fn: (a, b) => (Number(b.score) || 0) - (Number(a.score) || 0) },
  hyra: { label: "Lägst hyra", fn: (a, b) => (Number(a.priceMonthly) || 0) - (Number(b.priceMonthly) || 0) },
  yta: { label: "Störst yta", fn: (a, b) => (Number(b.sizeSqm) || 0) - (Number(a.sizeSqm) || 0) }
};

const TRY = [
  "Kontor för 15 personer på Södermalm",
  "Ledig nu, under 60 000 kr i månaden",
  "Studio runt 120 kvm med högt i tak",
  "Verifierad klinik i Norrmalm"
];

const SEATS = [5, 10, 15, 20, 30];
const BUDGETS = [40000, 60000, 80000, 100000, 150000];
const MORE_KEYS = ["readyNow", "onlyVerified", "sizeAround", "amenities"];

const EMPTY = { district: "", type: "", teamSize: "", maxBudget: "", sizeAround: "", readyNow: false, onlyVerified: false, amenities: [], q: "" };

function readState() {
  const params = new URLSearchParams(window.location.search);
  const district = params.get("district");
  const type = params.get("type");
  const sort = params.get("sort");
  const digits = (key) => (params.get(key) || "").replace(/[^\d]/g, "");
  return {
    filters: {
      district: districtOptions.includes(district) ? district : "",
      type: listingTypes.includes(type) ? type : "",
      teamSize: digits("teamSize"),
      maxBudget: digits("maxBudget"),
      sizeAround: digits("size"),
      readyNow: params.get("ledig") === "1",
      onlyVerified: params.get("verifierad") === "1",
      amenities: (params.get("ingar") || "").split(",").map((item) => item.trim()).filter(Boolean),
      q: params.get("q") || ""
    },
    sort: sort in SORTS ? sort : "relevans",
    view: params.get("view") === "karta" ? "karta" : "lista"
  };
}

// The listings that pass every filter in `f`.
function applyFilters(all, f) {
  const team = Number(f.teamSize) || 0;
  const budget = Number(f.maxBudget) || 0;
  const size = Number(f.sizeAround) || 0;
  return all.filter((item) => {
    if (f.district && item.district !== f.district) return false;
    if (f.type && item.type !== f.type) return false;
    if (team && (Number(item.capacity) || 0) < team) return false;
    if (budget && (Number(item.priceMonthly) || 0) > budget) return false;
    if (size) {
      const sqm = Number(item.sizeSqm) || 0;
      if (sqm < size * 0.75 || sqm > size * 1.35) return false;
    }
    if (f.readyNow && !String(item.availability || "").toLowerCase().includes("ledig")) return false;
    if (f.onlyVerified && !item.verified) return false;
    if (f.amenities?.length && !f.amenities.every((label) => amenityMatches(item, label))) return false;
    return true;
  });
}

// One chip per thing the description was read as, each removable on its own.
function readChips(f) {
  const chips = [];
  if (f.district) chips.push({ key: "district", label: f.district });
  if (f.type) chips.push({ key: "type", label: f.type });
  if (f.teamSize) chips.push({ key: "teamSize", label: `Minst ${f.teamSize} platser` });
  if (f.maxBudget) chips.push({ key: "maxBudget", label: `Högst ${sek(f.maxBudget)}/mån` });
  if (f.sizeAround) chips.push({ key: "sizeAround", label: `Runt ${f.sizeAround} kvm` });
  if (f.readyNow) chips.push({ key: "readyNow", label: "Ledig nu" });
  if (f.onlyVerified) chips.push({ key: "onlyVerified", label: "Verifierad hyresvärd" });
  (f.amenities || []).forEach((label) => chips.push({ key: "amenities", value: label, label }));
  return chips;
}

function withoutChip(f, chip) {
  if (chip.key === "amenities") return { ...f, amenities: f.amenities.filter((item) => item !== chip.value) };
  return { ...f, [chip.key]: EMPTY[chip.key] };
}

// How far a lokal is from the search: 0 when it passes every filter, more the
// further it misses. Used when nothing matches, to show the nearest instead.
function distance(item, f) {
  let d = 0;
  if (f.district && item.district !== f.district) d += 1;
  if (f.type && item.type !== f.type) d += 1;
  const team = Number(f.teamSize) || 0;
  const seats = Number(item.capacity) || 0;
  if (team && seats < team) d += Math.min(1.5, ((team - seats) / team) * 1.5);
  const budget = Number(f.maxBudget) || 0;
  const price = Number(item.priceMonthly) || 0;
  if (budget && price > budget) d += Math.min(1.5, ((price - budget) / budget) * 2);
  const size = Number(f.sizeAround) || 0;
  const sqm = Number(item.sizeSqm) || 0;
  if (size && (sqm < size * 0.75 || sqm > size * 1.35)) d += Math.min(1, Math.abs(sqm - size) / size);
  if (f.readyNow && !String(item.availability || "").toLowerCase().includes("ledig")) d += 0.5;
  if (f.onlyVerified && !item.verified) d += 0.5;
  (f.amenities || []).forEach((label) => {
    if (!amenityMatches(item, label)) d += 0.3;
  });
  return d;
}

const CLOSEST = 6;

// One example search shown above the field, a new one every few seconds.
function useRotating(length, ms, paused) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (paused || length < 2) return undefined;
    const id = window.setInterval(() => setIndex((previous) => (previous + 1) % length), ms);
    return () => window.clearInterval(id);
  }, [length, ms, paused]);
  return index;
}

// `app` (from /app/rent) shows the same page inside the app: no site bar or
// band, lokaler open in the app, and the account adds a heart on each card, a
// booking bar under the map peek and tools on the results line.
export default function ListingsPage({ user, listings, app = null }) {
  const basePath = app?.basePath || "/lokaler";
  const hrefFor = app?.hrefFor || listingHref;
  const all = siteListings(listings);
  const doors = useAuthDoors();
  const initial = useMemo(readState, []);
  const [filters, setFilters] = useState(initial.filters);
  const [sort, setSort] = useState(initial.sort);
  const [view, setView] = useState(initial.view);
  const [draft, setDraft] = useState(initial.filters.q);
  const [pending, setPending] = useState(false);
  const [holdExample, setHoldExample] = useState(false);
  const exampleIndex = useRotating(TRY.length, 4200, holdExample || Boolean(draft) || pending);
  const example = TRY[exampleIndex];
  const [selectedId, setSelectedId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const inputRef = useRef(null);
  const timer = useRef(0);

  // Keep the address in step, without a new history entry per click.
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.district) params.set("district", filters.district);
    if (filters.type) params.set("type", filters.type);
    if (filters.teamSize) params.set("teamSize", filters.teamSize);
    if (filters.maxBudget) params.set("maxBudget", filters.maxBudget);
    if (filters.sizeAround) params.set("size", filters.sizeAround);
    if (filters.readyNow) params.set("ledig", "1");
    if (filters.onlyVerified) params.set("verifierad", "1");
    if (filters.amenities.length) params.set("ingar", filters.amenities.join(","));
    if (sort !== "relevans") params.set("sort", sort);
    if (view === "karta") params.set("view", "karta");
    const query = params.toString();
    window.history.replaceState(window.history.state, "", `${basePath}${query ? `?${query}` : ""}${window.location.hash}`);
  }, [filters, sort, view]);

  // /lokaler#sok (from the homepage and the bar) opens with the description field ready.
  useEffect(() => {
    if (window.location.hash !== "#sok") return undefined;
    const id = window.setTimeout(() => {
      scrollToId("#sok");
      inputRef.current?.focus({ preventScroll: true });
    }, 120);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const counts = useMemo(() => {
    const map = Object.fromEntries(districtOptions.map((name) => [name, 0]));
    all.forEach((item) => {
      if (item.district in map) map[item.district] += 1;
    });
    return map;
  }, [all]);

  const results = useMemo(() => applyFilters(all, filters).slice().sort(SORTS[sort].fn), [all, filters, sort]);

  // Nothing matches: show the nearest lokaler instead of an empty page.
  const closest = useMemo(() => {
    if (results.length) return [];
    return all
      .map((item) => ({ item, d: distance(item, filters) }))
      .sort((a, b) => a.d - b.d || SORTS[sort].fn(a.item, b.item))
      .slice(0, CLOSEST)
      .map((entry) => entry.item);
  }, [all, filters, results.length, sort]);
  const shown = results.length ? results : closest;

  // With nothing left, which single filter would bring lokaler back, and how many.
  const loosen = useMemo(() => {
    if (results.length) return [];
    return readChips(filters)
      .map((chip) => ({ chip, count: applyFilters(all, withoutChip(filters, chip)).length }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 2);
  }, [all, filters, results.length]);

  // What the description itself was read as, apart from filters changed since.
  const reading = useMemo(() => (filters.q ? readChips({ ...EMPTY, ...interpretPrompt(filters.q) }) : []), [filters.q]);

  const points = useMemo(
    () =>
      shown.map((item) => ({
        id: String(item.id),
        ...listingGeo(item),
        label: `${Math.round((Number(item.priceMonthly) || 0) / 1000)} tkr`,
        title: item.title
      })),
    [shown]
  );
  const selected = shown.find((item) => String(item.id) === selectedId) || null;

  const set = (patch) => setFilters((previous) => ({ ...previous, ...patch }));
  const toggle = (key, value) => setFilters((previous) => ({ ...previous, [key]: previous[key] === value ? "" : value }));
  const clearAll = () => {
    setFilters(EMPTY);
    setDraft("");
  };
  const chips = readChips(filters);
  const anyFilter = chips.length > 0;
  // How many lokaler a choice would show, with every other filter as it is.
  const countWith = (patch) => applyFilters(all, { ...filters, ...patch }).length;
  const moreCount = MORE_KEYS.reduce((n, key) => n + (key === "amenities" ? filters.amenities.length : filters[key] ? 1 : 0), 0);
  const clearMore = () => set({ readyNow: false, onlyVerified: false, sizeAround: "", amenities: [] });
  // The amenities worth offering: those at least one lokal has, most common first.
  const amenityChoices = useMemo(
    () =>
      propertyAmenityDefinitions
        .map((item) => ({ label: item.label, n: all.filter((listing) => amenityMatches(listing, item.label)).length }))
        .filter((item) => item.n > 0)
        .sort((a, b) => b.n - a.n)
        .slice(0, 8),
    [all]
  );
  const toggleAmenity = (label) =>
    setFilters((previous) => ({
      ...previous,
      amenities: previous.amenities.includes(label) ? previous.amenities.filter((item) => item !== label) : [...previous.amenities, label]
    }));

  function toResults() {
    const target = document.getElementById("resultat");
    if (!target) return;
    if (target.getBoundingClientRect().top > window.innerHeight * 0.6) scrollToId("#resultat");
  }

  function ask(prompt) {
    const text = String(prompt || "").trim();
    if (!text || pending) return;
    setDraft(text);
    setPending(true);
    window.clearTimeout(timer.current);
    // A short beat to read it, then the filters change all at once.
    timer.current = window.setTimeout(
      () => {
        const read = interpretPrompt(text);
        setFilters((previous) => ({
          ...previous,
          ...Object.fromEntries(AI_KEYS.map((key) => [key, EMPTY[key]])),
          ...read,
          q: text
        }));
        setSelectedId(null);
        setPending(false);
        window.setTimeout(toResults, 60);
      },
      prefersReducedMotion() ? 0 : 520
    );
  }

  function switchView(next) {
    if (next === view) return;
    const commit = () => flushSync(() => setView(next));
    if (typeof document.startViewTransition !== "function" || prefersReducedMotion()) {
      commit();
      return;
    }
    // One view dissolves into the other; the bar stays put (see .lo-vt in site.css).
    const root = document.documentElement;
    root.classList.add("lo-vt");
    document.startViewTransition(commit).finished.finally(() => root.classList.remove("lo-vt"));
  }

  function selectPoint(id) {
    setSelectedId(id);
    const row = document.getElementById(`lo-row-${id}`);
    if (row && window.matchMedia("(min-width: 901px)").matches) {
      const rect = row.getBoundingClientRect();
      if (rect.top < 96 || rect.bottom > window.innerHeight) scrollToId(`#lo-row-${CSS.escape(id)}`);
    }
  }

  const showsReading = Boolean(filters.q) && draft.trim() === filters.q && !pending;
  const plural = (n) => `${n} ${n === 1 ? "lokal" : "lokaler"}`;

  const body = (
    <>
      <header className="lo-wrap lo-page-head lo-page-head--search">
        <div className="lo-search-head">
          <h1 className="lo-search-title">
            Lediga lokaler
            <sup>{all.length}</sup>
          </h1>
          <form
            className={`lo-ask${pending ? " is-pending" : ""}`}
            id="sok"
            role="search"
            aria-label="AI-sök"
            onSubmit={(event) => {
              event.preventDefault();
              ask(draft);
            }}
          >
            <p className="lo-ask-note" id="lo-ask-note" aria-live="polite">
              <label className="lo-ask-label" htmlFor="lo-ask-input">
                <span className="lo-ask-mark" aria-hidden="true" />
                AI-sök
              </label>
              {pending ? (
                <>
                  <span className="lo-progress" aria-hidden="true" />
                  Läser beskrivningen…
                </>
              ) : showsReading ? (
                hasInterpretation(interpretPrompt(filters.q)) ? (
                  <span className="lo-ask-read">
                    Tolkat som <span>{reading.map((chip) => chip.label).join(" · ")}</span>
                  </span>
                ) : (
                  <span className="lo-ask-read">Hittade inget område, storlek, budget eller typ att gå på. Prova med egna ord igen.</span>
                )
              ) : (
                <>
                  Testa t.ex.{" "}
                  <button
                    key={exampleIndex}
                    type="button"
                    className="lo-ask-example"
                    onClick={() => ask(example)}
                    onMouseEnter={() => setHoldExample(true)}
                    onMouseLeave={() => setHoldExample(false)}
                    onFocus={() => setHoldExample(true)}
                    onBlur={() => setHoldExample(false)}
                  >
                    ”{example}”
                  </button>
                </>
              )}
            </p>
            <div className="lo-ask-row">
              <input
                id="lo-ask-input"
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Beskriv lokalen ni söker"
                aria-label="AI-sök: beskriv lokalen ni söker"
                aria-describedby="lo-ask-note"
                autoComplete="off"
                enterKeyHint="search"
              />
              {draft ? (
                <button
                  type="button"
                  className="lo-ask-clear"
                  aria-label="Töm sökningen"
                  onClick={() => {
                    if (filters.q) clearAll();
                    else setDraft("");
                    inputRef.current?.focus();
                  }}
                >
                  <span aria-hidden="true" className="lo-chip-x" />
                </button>
              ) : null}
              <button type="submit" className="lo-ask-go" aria-label="Sök med AI" disabled={!draft.trim() || pending}>
                <Arrow size={18} />
              </button>
            </div>
          </form>
        </div>
      </header>

      <div className="lo-wrap">
        <div className="lo-toolbar" id="resultat">
          <div className="lo-toolbar-filters" role="group" aria-label="Filter">
            <Dropdown label="Område" value={filters.district}>
              {(close) => (
                <div className="lo-dd-list">
                  <Option selected={!filters.district} count={countWith({ district: "" })} onClick={() => { set({ district: "" }); close(); }}>
                    Alla områden
                  </Option>
                  {districtOptions.map((name) => (
                    <Option key={name} selected={filters.district === name} count={countWith({ district: name })} onClick={() => { set({ district: name }); close(); }}>
                      {name}
                    </Option>
                  ))}
                </div>
              )}
            </Dropdown>

            <Dropdown label="Typ" value={filters.type}>
              {(close) => (
                <div className="lo-dd-list">
                  <Option selected={!filters.type} count={countWith({ type: "" })} onClick={() => { set({ type: "" }); close(); }}>
                    Alla typer
                  </Option>
                  {listingTypes.map((name) => (
                    <Option key={name} selected={filters.type === name} count={countWith({ type: name })} onClick={() => { set({ type: name }); close(); }}>
                      {name}
                    </Option>
                  ))}
                </div>
              )}
            </Dropdown>

            <Dropdown label="Platser" value={filters.teamSize ? `${filters.teamSize}+` : ""}>
              {(close) => (
                <>
                  <div className="lo-dd-list">
                    <Option selected={!filters.teamSize} count={countWith({ teamSize: "" })} onClick={() => { set({ teamSize: "" }); close(); }}>
                      Alla storlekar
                    </Option>
                    {SEATS.map((n) => (
                      <Option key={n} selected={filters.teamSize === String(n)} count={countWith({ teamSize: String(n) })} onClick={() => { set({ teamSize: String(n) }); close(); }}>
                        Minst {n} platser
                      </Option>
                    ))}
                  </div>
                  <div className="lo-dd-field">
                    <Field label="Eget antal">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        value={filters.teamSize}
                        placeholder="Till exempel 12"
                        onChange={(event) => set({ teamSize: event.target.value.replace(/[^\d]/g, "").slice(0, 4) })}
                      />
                    </Field>
                  </div>
                </>
              )}
            </Dropdown>

            <Dropdown label="Hyra" value={filters.maxBudget ? `högst ${Math.round(Number(filters.maxBudget) / 1000)} tkr` : ""}>
              {(close) => (
                <>
                  <div className="lo-dd-list">
                    <Option selected={!filters.maxBudget} count={countWith({ maxBudget: "" })} onClick={() => { set({ maxBudget: "" }); close(); }}>
                      Alla nivåer
                    </Option>
                    {BUDGETS.map((n) => (
                      <Option key={n} selected={filters.maxBudget === String(n)} count={countWith({ maxBudget: String(n) })} onClick={() => { set({ maxBudget: String(n) }); close(); }}>
                        Högst {sek(n)}/mån
                      </Option>
                    ))}
                  </div>
                  <div className="lo-dd-field">
                    <Field label="Egen maxhyra (kr/mån)">
                      <input
                        inputMode="numeric"
                        value={filters.maxBudget ? Number(filters.maxBudget).toLocaleString("sv-SE") : ""}
                        placeholder="Till exempel 70 000"
                        onChange={(event) => set({ maxBudget: event.target.value.replace(/[^\d]/g, "").slice(0, 8) })}
                      />
                    </Field>
                  </div>
                </>
              )}
            </Dropdown>

            <Dropdown label="Mer" value={moreCount ? String(moreCount) : ""} wide>
              {(close) => (
                <>
                  <div className="lo-dd-list">
                    <Option selected={filters.readyNow} count={countWith({ readyNow: !filters.readyNow })} onClick={() => set({ readyNow: !filters.readyNow })}>
                      Ledig nu
                    </Option>
                    <Option selected={filters.onlyVerified} count={countWith({ onlyVerified: !filters.onlyVerified })} onClick={() => set({ onlyVerified: !filters.onlyVerified })}>
                      Verifierad hyresvärd
                    </Option>
                  </div>
                  {amenityChoices.length ? (
                    <>
                      <p className="lo-dd-sub">Bekvämligheter</p>
                      <div className="lo-dd-list lo-dd-list--two">
                        {amenityChoices.map((item) => (
                          <Option key={item.label} selected={filters.amenities.includes(item.label)} onClick={() => toggleAmenity(item.label)}>
                            {item.label}
                          </Option>
                        ))}
                      </div>
                    </>
                  ) : null}
                  <div className="lo-dd-field">
                    <Field label="Yta runt (kvm)">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="10"
                        value={filters.sizeAround}
                        placeholder="Till exempel 150"
                        onChange={(event) => set({ sizeAround: event.target.value.replace(/[^\d]/g, "").slice(0, 5) })}
                      />
                    </Field>
                  </div>
                  <div className="lo-dd-foot">
                    <button type="button" className="lo-text-btn" onClick={clearMore} disabled={!moreCount}>
                      Rensa
                    </button>
                    <button type="button" className="lo-btn lo-dd-done" onClick={close}>
                      Visa {plural(results.length)}
                    </button>
                  </div>
                </>
              )}
            </Dropdown>
          </div>

          <div className="lo-toolbar-end">
            <Dropdown label="Sortera" value={SORTS[sort].label} active={false} align="end">
              {(close) => (
                <div className="lo-dd-list">
                  {Object.entries(SORTS).map(([key, entry]) => (
                    <Option key={key} selected={sort === key} onClick={() => { setSort(key); close(); }}>
                      {entry.label}
                    </Option>
                  ))}
                </div>
              )}
            </Dropdown>
            <div className="lo-view" role="group" aria-label="Visa som" data-view={view}>
              <span className="lo-view-thumb" aria-hidden="true" />
              <button type="button" aria-pressed={view === "lista"} onClick={() => switchView("lista")}>
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <rect x="2" y="2" width="5" height="5" rx="1" />
                  <rect x="9" y="2" width="5" height="5" rx="1" />
                  <rect x="2" y="9" width="5" height="5" rx="1" />
                  <rect x="9" y="9" width="5" height="5" rx="1" />
                </svg>
                Lista
              </button>
              <button type="button" aria-pressed={view === "karta"} onClick={() => switchView("karta")}>
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <path d="M1.5 3.5 5.5 2l5 1.5 4-1.5v10.5l-4 1.5-5-1.5-4 1.5z" />
                  <path d="M5.5 2v10.5M10.5 3.5V14" />
                </svg>
                Karta
              </button>
            </div>
          </div>
        </div>

        {results.length ? (
          <div className="lo-results-line" aria-live="polite">
            <p className="lo-results-count">{plural(results.length)}</p>
            {anyFilter ? (
              <button type="button" className="lo-text-btn" onClick={clearAll}>
                Rensa filter
              </button>
            ) : null}
            {app?.tools ? <span className="lo-panel-tools">{app.tools(filters)}</span> : null}
          </div>
        ) : (
          <div className="lo-nomatch" aria-live="polite">
            <p className="lo-nomatch-title">Ingen lokal matchar exakt. Här är de som kommer närmast.</p>
            <p className="lo-nomatch-hint">
              {loosen.length ? (
                <>
                  {loosen.map(({ chip, count }, index) => (
                    <span key={`${chip.key}-${chip.label}`}>
                      {index ? ", utan " : "Utan "}
                      <button type="button" className="lo-inline-btn" onClick={() => setFilters((previous) => withoutChip(previous, chip))}>
                        {chip.key === "district" ? chip.label : chip.label.charAt(0).toLowerCase() + chip.label.slice(1)}
                      </button>{" "}
                      {index ? count : `finns ${plural(count)}`}
                    </span>
                  ))}
                  .{" "}
                </>
              ) : (
                "Inget enskilt villkor räcker att ta bort. "
              )}
              <button type="button" className="lo-inline-btn" onClick={clearAll}>
                Visa alla {all.length}
              </button>
            </p>
          </div>
        )}

        {!shown.length ? null : view === "lista" ? (
          <ul className="lo-grid">
            {shown.map((listing) => (
              <li key={listing.id}>
                <ListingCard listing={listing} href={hrefFor(listing)} />
                {app?.cardAction ? app.cardAction(listing) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="lo-mapview">
            <div className="lo-mapview-map">
              <DotMap
                counts={counts}
                active={filters.district || undefined}
                onSelect={(district) => toggle("district", district)}
                districts="quiet"
                points={points}
                selectedId={selectedId}
                hoverId={hoverId}
                onPointSelect={selectPoint}
                onPointHover={setHoverId}
              />
              {selected ? (
                <div className="lo-peek-wrap">
                <a className="lo-peek" href={hrefFor(selected)} onClick={linkTo(hrefFor(selected))}>
                  <span className="lo-peek-img">
                    {listingImages(selected)[0] ? <img src={listingImages(selected)[0]} alt="" /> : null}
                  </span>
                  <span className="lo-peek-text">
                    <span className="lo-peek-name">{selected.title}</span>
                    <span className="lo-card-meta">
                      {[selected.district, selected.sizeSqm ? `${selected.sizeSqm} kvm` : null, `${sek(selected.priceMonthly)}/mån`].filter(Boolean).join(" · ")}
                    </span>
                    <span className="lo-peek-go">
                      Visa lokalen
                      <Arrow />
                    </span>
                  </span>
                </a>
                {app?.peekAction ? app.peekAction(selected) : null}
                </div>
              ) : (
                <p className="lo-mapview-hint">Klicka på en punkt för att se lokalen.</p>
              )}
            </div>
            <ol className="lo-mapview-list">
              {shown.map((listing) => {
                const id = String(listing.id);
                const href = hrefFor(listing);
                return (
                  <li
                    key={id}
                    id={`lo-row-${id}`}
                    className={`${selectedId === id ? "is-selected" : ""}${hoverId === id ? " is-hover" : ""}`}
                    onMouseEnter={() => setHoverId(id)}
                    onMouseLeave={() => setHoverId(null)}
                  >
                    <a href={href} onClick={linkTo(href)} onFocus={() => setHoverId(id)} onBlur={() => setHoverId(null)}>
                      <span className="lo-mini-img">{listingImages(listing)[0] ? <img src={listingImages(listing)[0]} alt="" loading="lazy" /> : null}</span>
                      <span className="lo-mini-text">
                        <span className="lo-mini-name">{listing.title}</span>
                        <span className="lo-card-line">{[listing.address, listing.district].filter(Boolean).join(", ")}</span>
                        <span className="lo-card-meta">
                          {[listing.type, listing.sizeSqm ? `${listing.sizeSqm} kvm` : null, listing.capacity ? `${listing.capacity} platser` : null].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <span className="lo-mini-price">
                        {sek(listing.priceMonthly)}
                        <span>/mån</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </>
  );

  if (app) {
    return (
      <section className="lo lo--app lo--app-list h-full overflow-y-auto" data-scroll-top-scope="results" data-no-reveal>
        {body}
      </section>
    );
  }

  return (
    <SiteFrame user={user} listings={listings} band={<Band
          label="Lokalprogram"
          title="Inte rätt lokal än?"
          body="Skapa ett lokalprogram med yta, budget och område. Det matchas mot varje ny lokal som kommer in."
        >
          <a className="lo-btn lo-btn--light" href={user ? "/app/profile" : "/signup"} onClick={linkTo(user ? "/app/profile" : "/signup")}>
            {user ? "Mitt lokalprogram" : "Skapa konto"}
            <Arrow />
          </a>
          {!user && <button type="button" className="lo-text-btn" style={{ color: "rgba(255,255,255,0.85)" }} onClick={() => doors.login("/callback")}>
            Jag har redan ett konto
          </button>}
        </Band>}>
      {body}
    </SiteFrame>
  );
}
