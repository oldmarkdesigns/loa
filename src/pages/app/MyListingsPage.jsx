import { useMemo, useState } from "react";
import { formatDate, parseAmenities } from "../../lib/formatters";
import { navigateTo } from "../../lib/router";
import { districtOptions, listingTypes } from "../../data/mockData";
import PresetTextField from "../../components/app/PresetTextField";
import { BuildingIcon, CalendarIcon } from "../../components/icons/UiIcons";

const termPresets = ["3 månader", "6 månader", "12 månader", "24 månader", "36 månader", "Flexibelt avtal"];
const availabilityPresets = ["Ledig nu", "Inom 2 veckor", "Inom 1 månad", "Inom 2 månader", "Efter överenskommelse"];
const createSteps = ["Grund", "Villkor", "Media", "Granska"];

const initialCreateDraft = {
  title: "",
  district: "Norrmalm",
  address: "",
  type: "Kontor",
  priceMonthly: "",
  sizeSqm: "",
  capacity: "",
  term: "12 månader",
  availability: "Ledig nu",
  responseHours: "2",
  amenities: "Mötesrum, Fiber, Kök",
  image: "/object-images/object-4.jpeg"
};

function statusLabel(status) {
  if (status === "active") {
    return "Aktiv";
  }
  if (status === "draft") {
    return "Utkast";
  }
  return status || "-";
}

function toNumber(value) {
  return Number(value || 0);
}

const createStepRules = {
  0: [
    {
      key: "title",
      label: "Rubrik",
      isMissing: (draft) => !String(draft.title || "").trim()
    },
    {
      key: "address",
      label: "Adress",
      isMissing: (draft) => !String(draft.address || "").trim()
    }
  ],
  1: [
    {
      key: "priceMonthly",
      label: "Månadshyra",
      isMissing: (draft) => toNumber(draft.priceMonthly) <= 0
    },
    {
      key: "sizeSqm",
      label: "Yta",
      isMissing: (draft) => toNumber(draft.sizeSqm) <= 0
    },
    {
      key: "capacity",
      label: "Kapacitet",
      isMissing: (draft) => toNumber(draft.capacity) <= 0
    }
  ],
  2: [
    {
      key: "image",
      label: "Omslagsbild",
      isMissing: (draft) => !String(draft.image || "").trim()
    }
  ]
};

function getCreateStepErrors(stepIndex, draft) {
  if (!createStepRules[stepIndex]) {
    return [];
  }

  return createStepRules[stepIndex]
    .filter((rule) => rule.isMissing(draft))
    .map((rule) => ({
      key: rule.key,
      label: rule.label
    }));
}

function getFirstIncompleteCreateStep(draft) {
  for (let index = 0; index <= 2; index += 1) {
    if (getCreateStepErrors(index, draft).length > 0) {
      return index;
    }
  }
  return null;
}

function StepProgress({ currentStep }) {
  return (
    <div className="mt-5 rounded-3xl border border-black/10 bg-gradient-to-br from-white to-white p-3">
      <div className="grid grid-cols-4 gap-2">
        {createSteps.map((label, index) => {
          const active = index === currentStep;
          const complete = index < currentStep;

          return (
            <div
              key={label}
              className={`rounded-2xl border px-3 py-2 ${
                active
                  ? "border-[#0d162b]/30 bg-white"
                  : complete
                    ? "border-[#0d162b]/20 bg-white"
                    : "border-black/10 bg-white/70"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
                    active
                      ? "bg-[#0d162b] text-white"
                      : complete
                        ? "bg-[#1a2845] text-white"
                        : "border border-black/10 bg-white text-ink-500"
                  }`}
                >
                  {index + 1}
                </span>
                <span className={`text-xs font-semibold ${active || complete ? "text-black" : "text-ink-500"}`}>{label}</span>
              </div>
              <div className={`mt-2 h-1 rounded-full ${active ? "bg-[#0d162b]" : complete ? "bg-[#1a2845]/70" : "bg-black/10"}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListingPreview({ draft }) {
  const amenities = parseAmenities(draft.amenities);

  return (
    <article className="overflow-hidden rounded-3xl border border-black/10 bg-white">
      <img src={draft.image || "/object-images/object-1.jpeg"} alt={draft.title || "Objekt"} className="h-28 w-full object-cover" />
      <div className="space-y-3 p-4">
        <div>
          <p className="text-xl font-semibold">{draft.title || "Namnlöst objekt"}</p>
          <p className="text-sm text-ink-600">{draft.district || "Område saknas"} • {draft.address || "Adress saknas"}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-black/10 bg-[#fafafa] px-3 py-2">{draft.sizeSqm || "-"} kvm</div>
          <div className="rounded-xl border border-black/10 bg-[#fafafa] px-3 py-2">{draft.capacity || "-"} platser</div>
          <div className="rounded-xl border border-black/10 bg-[#fafafa] px-3 py-2">{draft.type || "-"}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          {amenities.length === 0 ? <span className="text-xs text-ink-500">Lägg till faciliteter för att förbättra annonsen.</span> : null}
          {amenities.slice(0, 6).map((amenity) => (
            <span key={amenity} className="rounded-full border border-black/10 bg-white px-2 py-1 text-[11px] font-semibold text-ink-700">{amenity}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

function PublishReview({ draft, onEdit, onApproveAndPublish, pending }) {
  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-black/10 bg-white p-4">
      <div className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink-700">
        Kontrollera annonsen innan publicering.
      </div>
      <ListingPreview draft={draft} />
      <div className="flex w-full justify-end gap-2">
        <button type="button" className="rounded-2xl border border-black/20 bg-white px-4 py-2 text-xs font-semibold" onClick={onEdit}>
          Ändra annons
        </button>
        <button type="button" className="rounded-2xl border border-[#0d162b] bg-[#0d162b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#16233f]" onClick={onApproveAndPublish} disabled={pending}>
          {pending ? "Publicerar..." : "Godkänn och publicera"}
        </button>
      </div>
    </div>
  );
}

function PublishSuccess({ draft, onCreateAnother, onViewListing }) {
  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
      <ListingPreview draft={draft} />
      <div className="flex justify-end gap-2">
        <button type="button" className="rounded-2xl border border-black/20 bg-white px-4 py-2 text-xs font-semibold text-black" onClick={onCreateAnother}>
          Publicera nytt objekt
        </button>
        <button type="button" className="rounded-2xl border border-[#0d162b] bg-[#0d162b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#16233f]" onClick={onViewListing}>
          Visa objekt
        </button>
      </div>
    </div>
  );
}

function buildEditDraft(listing) {
  return {
    title: listing.title || "",
    district: listing.district || "Norrmalm",
    address: listing.address || "",
    type: listing.type || "Kontor",
    priceMonthly: String(listing.priceMonthly || ""),
    sizeSqm: String(listing.sizeSqm || ""),
    capacity: String(listing.capacity || ""),
    term: listing.term || "12 månader",
    availability: listing.availability || "Ledig nu",
    responseHours: String(listing.responseHours || 2),
    amenities: Array.isArray(listing.amenities) ? listing.amenities.join(", ") : "",
    image: listing.image || listing.images?.[0] || "/object-images/object-1.jpeg"
  };
}

function MyListingsPage({ app }) {
  const { user, listings, requestListingVerification, createListing, updateListing, publishListing, deleteListing } = app;
  const [editingListingId, setEditingListingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [createDraft, setCreateDraft] = useState(initialCreateDraft);
  const [createPending, setCreatePending] = useState(false);
  const [createFeedback, setCreateFeedback] = useState("");
  const [createStep, setCreateStep] = useState(0);
  const [createAttemptedSteps, setCreateAttemptedSteps] = useState({ 0: false, 1: false, 2: false });
  const [publishedPreview, setPublishedPreview] = useState(null);
  const [listQuery, setListQuery] = useState("");
  const [listStatus, setListStatus] = useState("alla");
  const [sortBy, setSortBy] = useState("date_desc");

  const ownListings = useMemo(
    () => listings.filter((listing) => listing.ownerId === user?.id),
    [listings, user?.id]
  );

  const filteredOwnListings = useMemo(() => {
    return ownListings.filter((listing) => {
      const query = listQuery.trim().toLowerCase();
      const queryMatch = !query || [listing.title, listing.district, listing.address, listing.type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
      const statusMatch = listStatus === "alla" || String(listing.status || "") === listStatus;
      return queryMatch && statusMatch;
    });
  }, [listQuery, listStatus, ownListings]);

  const sortedOwnListings = useMemo(() => {
    const items = [...filteredOwnListings];

    function numberValue(value) {
      return Number(value || 0);
    }

    function dateValue(listing, mode = "created") {
      const source = mode === "updated" ? listing.updatedAt : (listing.createdAt || listing.updatedAt);
      const parsed = new Date(source || 0).getTime();
      return Number.isFinite(parsed) ? parsed : 0;
    }

    items.sort((a, b) => {
      if (sortBy === "date_desc") return dateValue(b, "created") - dateValue(a, "created");
      if (sortBy === "date_asc") return dateValue(a, "created") - dateValue(b, "created");
      if (sortBy === "size_desc") return numberValue(b.sizeSqm) - numberValue(a.sizeSqm);
      if (sortBy === "size_asc") return numberValue(a.sizeSqm) - numberValue(b.sizeSqm);
      if (sortBy === "price_desc") return numberValue(b.priceMonthly) - numberValue(a.priceMonthly);
      if (sortBy === "price_asc") return numberValue(a.priceMonthly) - numberValue(b.priceMonthly);
      if (sortBy === "updated_desc") return dateValue(b, "updated") - dateValue(a, "updated");
      return String(a.title || "").localeCompare(String(b.title || ""), "sv");
    });

    return items;
  }, [filteredOwnListings, sortBy]);

  const editingListing = useMemo(
    () => ownListings.find((item) => item.id === editingListingId) || null,
    [editingListingId, ownListings]
  );

  if (user?.role !== "publisher") {
    return (
      <section className="p-4 sm:p-6">
        <div className="mx-auto max-w-[1000px] rounded-3xl border border-black/10 bg-white p-6 text-sm text-ink-600">
          Dina objekt är tillgängligt i hyresvärdsläge.
        </div>
      </section>
    );
  }

  function resetEditView() {
    setEditingListingId(null);
    setDraft(null);
    setFeedback("");
    setPending(false);
  }

  function startEdit(listing) {
    setEditingListingId(listing.id);
    setDraft(buildEditDraft(listing));
    setFeedback("");
  }

  function validateDraft(currentDraft) {
    const missing = [];
    if (!String(currentDraft.title || "").trim()) missing.push("Rubrik");
    if (!String(currentDraft.address || "").trim()) missing.push("Adress");
    if (Number(currentDraft.priceMonthly || 0) <= 0) missing.push("Månadshyra");
    if (Number(currentDraft.sizeSqm || 0) <= 0) missing.push("Yta");
    if (Number(currentDraft.capacity || 0) <= 0) missing.push("Kapacitet");
    if (!String(currentDraft.image || "").trim()) missing.push("Omslagsbild");
    return missing;
  }

  const createStepErrorsByIndex = useMemo(
    () => ({
      0: getCreateStepErrors(0, createDraft),
      1: getCreateStepErrors(1, createDraft),
      2: getCreateStepErrors(2, createDraft)
    }),
    [createDraft]
  );

  const currentCreateStepErrors = useMemo(() => {
    if (publishedPreview || createStep > 2 || !createAttemptedSteps[createStep]) {
      return [];
    }
    return createStepErrorsByIndex[createStep].map((entry) => entry.label);
  }, [createAttemptedSteps, createStep, createStepErrorsByIndex, publishedPreview]);

  function markCreateStepAttempt(stepIndex) {
    if (stepIndex > 2) {
      return;
    }
    setCreateAttemptedSteps((previous) => ({
      ...previous,
      [stepIndex]: true
    }));
  }

  function createFieldInvalid(stepIndex, fieldKey) {
    return Boolean(
      createAttemptedSteps[stepIndex] &&
      createStepErrorsByIndex[stepIndex]?.some((entry) => entry.key === fieldKey)
    );
  }

  function createFieldClass(stepIndex, fieldKey) {
    return `field ${createFieldInvalid(stepIndex, fieldKey) ? "border-rose-300 bg-rose-50 focus:border-rose-500" : ""}`;
  }

  async function handleSaveAndPublish() {
    if (!editingListingId || !draft) {
      return;
    }

    const missing = validateDraft(draft);
    if (missing.length > 0) {
      setFeedback(`Fyll i obligatoriska fält innan publicering: ${missing.join(", ")}.`);
      return;
    }

    setPending(true);
    try {
      await updateListing(editingListingId, {
        ...draft,
        priceMonthly: Number(draft.priceMonthly || 0),
        sizeSqm: Number(draft.sizeSqm || 0),
        capacity: Number(draft.capacity || 0),
        responseHours: Number(draft.responseHours || 2),
        amenities: parseAmenities(draft.amenities)
      });
      await publishListing(editingListingId);
      resetEditView();
    } catch (error) {
      setFeedback(error.message || "Kunde inte spara objektet just nu.");
      setPending(false);
    }
  }

  async function handleDelete(listing) {
    const confirmed = window.confirm(`Radera objektet "${listing.title}"? Detta går inte att ångra.`);
    if (!confirmed) {
      return;
    }

    await deleteListing(listing.id);
    if (editingListingId === listing.id) {
      resetEditView();
    }
  }

  async function handleCreateAndPublish() {
    const firstIncomplete = getFirstIncompleteCreateStep(createDraft);
    if (firstIncomplete !== null) {
      markCreateStepAttempt(firstIncomplete);
      setCreateStep(firstIncomplete);
      const missing = createStepErrorsByIndex[firstIncomplete].map((entry) => entry.label).join(", ");
      setCreateFeedback(`Du kan inte publicera ännu. Slutför steget "${createSteps[firstIncomplete]}". Saknas: ${missing}.`);
      return;
    }

    setCreatePending(true);
    try {
      const created = await createListing({
        ...createDraft,
        priceMonthly: Number(createDraft.priceMonthly || 0),
        sizeSqm: Number(createDraft.sizeSqm || 0),
        capacity: Number(createDraft.capacity || 0),
        responseHours: Number(createDraft.responseHours || 2),
        amenities: parseAmenities(createDraft.amenities),
        status: "draft"
      });

      await publishListing(created.listing.id);
      setPublishedPreview({
        ...createDraft,
        priceMonthly: Number(createDraft.priceMonthly || 0),
        sizeSqm: Number(createDraft.sizeSqm || 0),
        capacity: Number(createDraft.capacity || 0),
        amenities: parseAmenities(createDraft.amenities)
      });
      setCreateFeedback("");
    } catch (error) {
      setCreateFeedback(error.message || "Kunde inte publicera objektet just nu.");
    } finally {
      setCreatePending(false);
    }
  }

  function handleCreateNext() {
    if (publishedPreview || createStep >= 3) {
      return;
    }

    const errors = createStepErrorsByIndex[createStep] || [];
    if (errors.length > 0) {
      markCreateStepAttempt(createStep);
      setCreateFeedback(`Fyll i obligatoriska fält i steget "${createSteps[createStep]}": ${errors.map((entry) => entry.label).join(", ")}.`);
      return;
    }

    setCreateStep((value) => Math.min(value + 1, 3));
    setCreateFeedback("");
  }

  function resetCreateFlow() {
    setCreateDraft(initialCreateDraft);
    setCreatePending(false);
    setCreateFeedback("");
    setCreateStep(0);
    setCreateAttemptedSteps({ 0: false, 1: false, 2: false });
    setPublishedPreview(null);
  }

  if (editingListing && draft) {
    return (
      <section className="h-full overflow-y-auto p-4 pb-8 sm:p-6">
        <div className="mx-auto w-full max-w-7xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold">Ändra objekt</h1>
              <p className="text-sm text-ink-600">Uppdatera all information och publicera ändringarna direkt.</p>
            </div>
            <button type="button" className="rounded-2xl border border-black/20 bg-white px-4 py-2.5 text-sm font-semibold" onClick={resetEditView}>
              Tillbaka till dina objekt
            </button>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-3 rounded-3xl border border-black/10 bg-white p-4">
              <div className="rounded-2xl border border-black/10 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">1. Grund</p>
                <div className="mt-2 space-y-3">
                  <input className="field" value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} placeholder="Rubrik" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select className="field" value={draft.district} onChange={(event) => setDraft((prev) => ({ ...prev, district: event.target.value }))}>
                      {districtOptions.map((district) => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                    <select className="field" value={draft.type} onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value }))}>
                      {listingTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <input className="field" value={draft.address} onChange={(event) => setDraft((prev) => ({ ...prev, address: event.target.value }))} placeholder="Adress" />
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">2. Villkor</p>
                <div className="mt-2 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input className="field" type="number" min="0" value={draft.priceMonthly} onChange={(event) => setDraft((prev) => ({ ...prev, priceMonthly: event.target.value }))} placeholder="Månadshyra (SEK)" />
                    <input className="field" type="number" min="0" value={draft.sizeSqm} onChange={(event) => setDraft((prev) => ({ ...prev, sizeSqm: event.target.value }))} placeholder="Yta (kvm)" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input className="field" type="number" min="0" value={draft.capacity} onChange={(event) => setDraft((prev) => ({ ...prev, capacity: event.target.value }))} placeholder="Kapacitet" />
                    <PresetTextField
                      value={draft.term}
                      onChange={(value) => setDraft((prev) => ({ ...prev, term: value }))}
                      presets={termPresets}
                      selectPlaceholder="Avtalstid"
                    />
                    <PresetTextField
                      value={draft.availability}
                      onChange={(value) => setDraft((prev) => ({ ...prev, availability: value }))}
                      presets={availabilityPresets}
                      selectPlaceholder="Tillgänglighet"
                    />
                  </div>
                  <input className="field" type="number" min="1" value={draft.responseHours} onChange={(event) => setDraft((prev) => ({ ...prev, responseHours: event.target.value }))} placeholder="Svarstid (timmar)" />
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">3. Media</p>
                <div className="mt-2 space-y-3">
                  <input className="field" value={draft.image} onChange={(event) => setDraft((prev) => ({ ...prev, image: event.target.value }))} placeholder="Sökväg till omslagsbild" />
                  <textarea className="field min-h-28" value={draft.amenities} onChange={(event) => setDraft((prev) => ({ ...prev, amenities: event.target.value }))} placeholder="Faciliteter, separera med kommatecken" />
                </div>
              </div>

              {feedback ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{feedback}</p> : null}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="rounded-2xl border border-black/20 bg-white px-4 py-2 text-sm font-semibold" onClick={resetEditView}>
                    Avbryt
                  </button>
                  <button type="button" className="rounded-2xl border border-[#0f1930] bg-[#0f1930] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16233f]" onClick={handleSaveAndPublish} disabled={pending}>
                    {pending ? "Sparar..." : "Spara och publicera"}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-3xl border border-black/10 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Förhandsvisning för hyresgäst</p>
              <ListingPreview draft={draft} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="h-full overflow-y-auto p-4 pb-8 sm:p-6">
      <div className="flex w-full min-h-full flex-col">
        <div className="mb-4 shrink-0">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-5">
              <button
                type="button"
                className="tab-underline-button inline-flex items-center gap-1.5 border-b-2 border-[#0f1930] pb-1 text-sm font-semibold text-[#0f1930]"
                onClick={() => navigateTo("/app/my-listings")}
              >
                <BuildingIcon className="h-3.5 w-3.5" />
                Dina objekt
              </button>
              <button
                type="button"
                className="tab-underline-button inline-flex items-center gap-1.5 border-b-2 border-transparent pb-1 text-sm font-semibold text-ink-600 hover:text-black"
                onClick={() => navigateTo("/app/leads")}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                Intresse och visningar
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold">Dina objekt</h1>
              <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                Gratisplan aktiv: obegränsad publicering utan betalvägg.
              </p>
            </div>
            <p className="text-sm text-ink-600">Hantera dina publicerade objekt, verifiering och redigering.</p>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] xl:gap-6">
          <aside className="xl:order-3 self-start rounded-3xl border border-[#c8d1de] bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wide ${publishedPreview ? "text-emerald-600" : "text-ink-500"}`}>
                  {publishedPreview ? "Publicerat" : "Publiceringsflöde"}
                </p>
                <h2 className="text-[34px] font-semibold leading-tight">{publishedPreview ? "Objekt publicerat" : "Publicera objekt"}</h2>
                <p className="mt-1 text-sm text-ink-600">
                  {publishedPreview ? "Ditt objekt har publicerats. Du finner det under dina objekt." : "Fyll i stegvis och publicera utan manuellt handpåläggning."}
                </p>
              </div>
            </div>
            {publishedPreview ? null : <StepProgress currentStep={createStep} />}

            {publishedPreview ? (
              <PublishSuccess
                draft={publishedPreview}
                onCreateAnother={resetCreateFlow}
                onViewListing={() => navigateTo("/app/my-listings")}
              />
            ) : (
              <div className="mt-6 space-y-4 rounded-3xl border border-black/10 bg-white p-4">
                {createStep === 0 ? (
                  <div className="space-y-3">
                    <input className={createFieldClass(0, "title")} value={createDraft.title} onChange={(event) => setCreateDraft((prev) => ({ ...prev, title: event.target.value }))} placeholder="Rubrik" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <select className="field" value={createDraft.district} onChange={(event) => setCreateDraft((prev) => ({ ...prev, district: event.target.value }))}>
                        {districtOptions.map((district) => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                      <select className="field" value={createDraft.type} onChange={(event) => setCreateDraft((prev) => ({ ...prev, type: event.target.value }))}>
                        {listingTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <input className={createFieldClass(0, "address")} value={createDraft.address} onChange={(event) => setCreateDraft((prev) => ({ ...prev, address: event.target.value }))} placeholder="Adress" />
                  </div>
                ) : null}

                {createStep === 1 ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input className={createFieldClass(1, "priceMonthly")} type="number" min="0" value={createDraft.priceMonthly} onChange={(event) => setCreateDraft((prev) => ({ ...prev, priceMonthly: event.target.value }))} placeholder="Månadshyra (SEK)" />
                      <input className={createFieldClass(1, "sizeSqm")} type="number" min="0" value={createDraft.sizeSqm} onChange={(event) => setCreateDraft((prev) => ({ ...prev, sizeSqm: event.target.value }))} placeholder="Yta (kvm)" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input className={createFieldClass(1, "capacity")} type="number" min="0" value={createDraft.capacity} onChange={(event) => setCreateDraft((prev) => ({ ...prev, capacity: event.target.value }))} placeholder="Kapacitet" />
                      <PresetTextField
                        value={createDraft.term}
                        onChange={(value) => setCreateDraft((prev) => ({ ...prev, term: value }))}
                        presets={termPresets}
                        selectPlaceholder="Avtalstid"
                      />
                      <PresetTextField
                        value={createDraft.availability}
                        onChange={(value) => setCreateDraft((prev) => ({ ...prev, availability: value }))}
                        presets={availabilityPresets}
                        selectPlaceholder="Tillgänglighet"
                      />
                    </div>
                    <input className="field" type="number" min="1" value={createDraft.responseHours} onChange={(event) => setCreateDraft((prev) => ({ ...prev, responseHours: event.target.value }))} placeholder="Svarstid (timmar)" />
                  </div>
                ) : null}

                {createStep === 2 ? (
                  <div className="space-y-3">
                    <input className={createFieldClass(2, "image")} value={createDraft.image} onChange={(event) => setCreateDraft((prev) => ({ ...prev, image: event.target.value }))} placeholder="Sökväg till omslagsbild" />
                    <textarea className="field min-h-24" value={createDraft.amenities} onChange={(event) => setCreateDraft((prev) => ({ ...prev, amenities: event.target.value }))} placeholder="Faciliteter, separera med kommatecken" />
                  </div>
                ) : null}

                {createStep === 3 ? (
                  <PublishReview
                    draft={{
                      ...createDraft,
                      priceMonthly: Number(createDraft.priceMonthly || 0),
                      sizeSqm: Number(createDraft.sizeSqm || 0),
                      capacity: Number(createDraft.capacity || 0),
                      amenities: parseAmenities(createDraft.amenities)
                    }}
                    onEdit={() => setCreateStep(0)}
                    onApproveAndPublish={handleCreateAndPublish}
                    pending={createPending}
                  />
                ) : null}

                {createFeedback ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{createFeedback}</p> : null}
                {currentCreateStepErrors.length > 0 ? (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    Saknade obligatoriska fält: {currentCreateStepErrors.join(", ")}.
                  </p>
                ) : null}

                {createStep < 3 ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/10 pt-4">
                    <button
                      type="button"
                      className="rounded-2xl border border-black/20 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
                      onClick={() => setCreateStep((value) => Math.max(0, value - 1))}
                      disabled={createStep === 0}
                    >
                      Föregående
                    </button>
                    <div className="flex gap-2">
                      <button type="button" className="rounded-2xl border border-black/20 bg-white px-4 py-2 text-sm font-semibold" onClick={resetCreateFlow}>
                        Nollställ
                      </button>
                      <button type="button" className="rounded-2xl border border-[#0d162b] bg-[#0d162b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16233f]" onClick={handleCreateNext}>
                        Nästa steg
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </aside>

          <div className="h-px w-full bg-black/10 xl:order-2 xl:h-auto xl:w-px" />

          <section className="min-w-0 xl:order-1 xl:pr-1 flex min-h-0 flex-col">
            <div className="mb-3 shrink-0 space-y-3">
              <div className="rounded-2xl border border-black/10 bg-white p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_170px_250px]">
                  <input
                    className="field"
                    value={listQuery}
                    onChange={(event) => setListQuery(event.target.value)}
                    placeholder="Sök titel, adress eller område"
                  />
                  <select className="field" value={listStatus} onChange={(event) => setListStatus(event.target.value)}>
                    <option value="alla">Alla statusar</option>
                    <option value="active">Aktiva</option>
                    <option value="draft">Utkast</option>
                  </select>
                  <select className="field w-full" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                    <option value="date_desc">Datum för publicering (senast)</option>
                    <option value="date_asc">Datum för publicering (äldst)</option>
                    <option value="size_desc">Storlek (störst först)</option>
                    <option value="size_asc">Storlek (minst först)</option>
                    <option value="price_desc">Hyra (högst först)</option>
                    <option value="price_asc">Hyra (lägst först)</option>
                    <option value="updated_desc">Senast uppdaterad</option>
                    <option value="title_asc">Titel (A-Ö)</option>
                  </select>
                </div>
                <p className="mt-2 text-xs text-ink-600">Visar {sortedOwnListings.length} av {ownListings.length} objekt</p>
              </div>
            </div>

            <div className="min-h-0 flex-1 pr-1">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {sortedOwnListings.length === 0 ? (
                <div className="rounded-3xl border border-black/10 bg-white p-5 text-sm text-ink-500">
                  Du har inte publicerat några objekt ännu.
                </div>
              ) : null}

              {sortedOwnListings.map((listing) => (
                <article key={listing.id} className="rounded-3xl border border-black/10 bg-white p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-28 shrink-0 rounded-2xl border border-black/10 bg-white p-1.5">
                      <img src={listing.image || "/object-images/object-1.jpeg"} alt={listing.title} className="h-24 w-full rounded-xl object-cover" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold leading-tight">{listing.title}</p>
                          <p className="truncate text-xs text-ink-600">{listing.district} • {listing.address}</p>
                        </div>
                        <span className="shrink-0 rounded-xl border border-black/10 bg-white px-2 py-1 text-[10px] font-semibold uppercase text-ink-700">
                          {statusLabel(listing.status)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="rounded-full border border-black/10 bg-[#fafafa] px-2 py-1">{listing.type}</span>
                        <span className={`rounded-full border px-2 py-1 ${listing.verified ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                          {listing.verified ? "Verifierad" : "Ej verifierad"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <div className="rounded-2xl border border-black/10 bg-[#fafafa] px-2 py-1.5">{listing.sizeSqm} kvm</div>
                        <div className="rounded-2xl border border-black/10 bg-[#fafafa] px-2 py-1.5">{listing.capacity} platser</div>
                        <div className="rounded-2xl border border-black/10 bg-[#fafafa] px-2 py-1.5">Uppdaterad {formatDate(listing.updatedAt)}</div>
                      </div>

                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button type="button" className="whitespace-nowrap rounded-2xl border border-black/20 bg-white px-3 py-1.5 text-[11px] font-semibold" onClick={() => requestListingVerification(listing.id)}>
                          Begär verifiering
                        </button>
                        <button type="button" className="whitespace-nowrap rounded-2xl border border-black/20 bg-white px-3 py-1.5 text-[11px] font-semibold" onClick={() => startEdit(listing)}>
                          Ändra
                        </button>
                        <button type="button" className="whitespace-nowrap rounded-2xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700" onClick={() => handleDelete(listing)}>
                          Radera
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export default MyListingsPage;
