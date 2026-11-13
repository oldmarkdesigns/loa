import { Card } from "@/components/ui/card";
import { useMemo, useRef, useState } from "react";
import { prospectsApi } from "../../api";
import { BuildingIcon, CheckIcon, CoinsIcon, PaperclipIcon, PencilIcon, PinIcon, PlusIcon, TrashIcon, UploadIcon, UserIcon, XIcon } from "../icons/UiIcons";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const PREDEFINED_ORDER = ["overview", "description", "terms", "location", "contact", "materials"];

const PREDEFINED_SECTION_META = {
  overview: { label: "Objektsöversikt", Icon: BuildingIcon },
  description: { label: "Lokalbeskrivning", Icon: PencilIcon, placeholder: "Beskriv karaktär och planlösning utöver bekvämligheterna ovan..." },
  terms: { label: "Hyresvillkor", Icon: CoinsIcon },
  location: { label: "Läge & kommunikationer", Icon: PinIcon },
  contact: { label: "Kontaktperson", Icon: UserIcon },
  materials: { label: "Bilagor & presentationsmaterial", Icon: UploadIcon, placeholder: "Valfri kommentar till bilagorna nedan..." }
};

// Mirrors STRUCTURED_FIELD_LABELS in convex/prospects.js — keep label wording in sync
// so the composed body text matches what the seed function produces.
const STRUCTURED_FIELD_SCHEMAS = {
  contact: [
    { key: "firstName", label: "Förnamn", placeholder: "Förnamn" },
    { key: "lastName", label: "Efternamn", placeholder: "Efternamn" },
    { key: "phone", label: "Telefon", placeholder: "07X-XXX XX XX" },
    { key: "email", label: "E-post", placeholder: "namn@bolag.se" }
  ],
  terms: [
    {
      key: "term",
      label: "Hyrestid",
      placeholder: "Ange egen hyrestid",
      presets: ["3 månader", "6 månader", "12 månader", "24 månader", "36 månader", "5 år", "Tillsvidare"]
    },
    {
      key: "noticePeriod",
      label: "Uppsägningstid",
      placeholder: "Ange egen uppsägningstid",
      presets: ["1 månad", "3 månader", "6 månader", "9 månader", "12 månader"]
    },
    {
      key: "deposit",
      label: "Deposition",
      placeholder: "Ange egen deposition",
      presets: ["1 månadshyra", "2 månadshyror", "3 månadshyror", "6 månadshyror", "Bankgaranti"]
    }
  ],
  location: [
    { key: "transit", label: "Kollektivtrafik", placeholder: "t.ex. 5 min till T-bana" },
    { key: "parking", label: "Parkering", placeholder: "t.ex. garage i huset" },
    { key: "neighborhood", label: "Närområde", placeholder: "t.ex. restauranger och service" }
  ]
};

const STRUCTURED_FIELD_LAYOUT = {
  terms: "row",
  contact: "grid2"
};

const CUSTOM_OPTION_VALUE = "__custom__";

function composeBodyFromFields(kind, fields) {
  const schema = STRUCTURED_FIELD_SCHEMAS[kind];
  if (!schema) return null;
  return schema
    .map(({ key, label }) => (fields?.[key]?.trim() ? `${label}: ${fields[key].trim()}` : ""))
    .filter(Boolean)
    .join("\n");
}

function sectionsFingerprint(sections) {
  return JSON.stringify(
    (sections || []).map((section) => ({
      id: section.id,
      title: section.title,
      body: section.body,
      fields: section.fields || {},
      order: section.order,
      attachments: (section.attachments || []).map((attachment) => attachment.storageId)
    }))
  );
}

function buildInitialSections(existingSections) {
  const byKind = new Map();
  (existingSections || []).forEach((section) => {
    if (PREDEFINED_ORDER.includes(section.kind) && !byKind.has(section.kind)) {
      byKind.set(section.kind, section);
    }
  });

  const predefined = PREDEFINED_ORDER.map((kind, index) => {
    const existing = byKind.get(kind);
    return existing
      ? { ...existing, fields: existing.fields || {} }
      : {
        id: `predefined-${kind}`,
        kind,
        title: PREDEFINED_SECTION_META[kind].label,
        body: "",
        fields: {},
        order: index,
        attachments: []
      };
  });

  const custom = (existingSections || [])
    .filter((section) => !PREDEFINED_ORDER.includes(section.kind))
    .sort((a, b) => a.order - b.order);

  return [...predefined, ...custom];
}

async function uploadFileToStorage(uploadUrl, file) {
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file
  });

  if (!response.ok) {
    throw new Error("Uppladdningen misslyckades.");
  }

  const { storageId } = await response.json();
  return storageId;
}

export function useProspectEditorState(prospect, app, { onMutated } = {}) {
  const [title, setTitle] = useState(prospect.title || "");
  const [sections, setSections] = useState(() => buildInitialSections(prospect.draftSections));
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingSectionId, setUploadingSectionId] = useState(null);
  const [error, setError] = useState("");
  const fingerprint = (name, items) => JSON.stringify([name, sectionsFingerprint(items)]);
  const [savedFingerprint, setSavedFingerprint] = useState(() => fingerprint(prospect.title || "", buildInitialSections(prospect.draftSections)));
  // The editor starts over from the stored prospect whenever it has been loaded or replaced (after a save, say). This is
  // done while rendering rather than in an effect, so whatever mounts alongside the loaded prospect, the assistant
  // included, never sees the content that was there before.
  const loadedKey = `${prospect.id}:${prospect.updatedAt}`;
  const [syncedKey, setSyncedKey] = useState(loadedKey);
  if (syncedKey !== loadedKey) {
    const next = buildInitialSections(prospect.draftSections);
    setSyncedKey(loadedKey);
    setTitle(prospect.title || "");
    setSections(next);
    setSavedFingerprint(fingerprint(prospect.title || "", next));
  }
  const dirty = fingerprint(title, sections) !== savedFingerprint;

  const hasUnpublishedChanges = useMemo(() => {
    if (!prospect.currentVersion) return sections.some((section) => section.body.trim()) || Boolean(title.trim());
    return (
      title !== prospect.title
      || sectionsFingerprint(sections) !== sectionsFingerprint(buildInitialSections(prospect.publishedSections))
    );
  }, [title, sections, prospect.currentVersion, prospect.title, prospect.publishedSections]);

  function updateSectionField(sectionId, field, value) {
    setSections((prev) => prev.map((section) => (section.id === sectionId ? { ...section, [field]: value } : section)));
  }

  function updateSectionFieldValue(sectionId, fieldKey, value) {
    setSections((prev) => prev.map((section) => (
      section.id === sectionId
        ? { ...section, fields: { ...(section.fields || {}), [fieldKey]: value } }
        : section
    )));
  }

  function addSection() {
    setSections((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, kind: "custom", title: "Ny sektion", body: "", order: prev.length, attachments: [] }
    ]);
  }

  function removeSection(sectionId) {
    setSections((prev) => prev.filter((section) => section.id !== sectionId));
  }

  function removeAttachment(sectionId, attachmentIndex) {
    setSections((prev) => prev.map((section) => {
      if (section.id !== sectionId) return section;
      return { ...section, attachments: section.attachments.filter((_, index) => index !== attachmentIndex) };
    }));
  }

  async function uploadAttachment(sectionId, file) {
    setUploadingSectionId(sectionId);
    try {
      const { uploadUrl } = await prospectsApi.generateUploadUrl();
      const storageId = await uploadFileToStorage(uploadUrl, file);
      setSections((prev) => prev.map((section) => {
        if (section.id !== sectionId) return section;
        const attachments = section.attachments || [];
        return {
          ...section,
          attachments: [
            ...attachments,
            { storageId, fileName: file.name, contentType: file.type, order: attachments.length }
          ]
        };
      }));
    } catch (error) {
      app.pushToast(error.message || "Kunde inte ladda upp filen.", "error");
    } finally {
      setUploadingSectionId(null);
    }
  }

  /** Replaces the title and sections at once, for an assistant that edits several parts in one go (and undoes it). */
  function replaceContent(next) {
    setTitle(next.title);
    setSections(next.sections);
  }

  /** Saves the draft, or `override` ({ title, sections }) when it has only just been set and the state has not caught up. */
  async function saveDraft(override) {
    const target = override && Array.isArray(override.sections) ? override : { title, sections };
    setSaving(true);
    setError("");
    try {
      const orderedSections = target.sections.map((section, index) => {
        const composedBody = composeBodyFromFields(section.kind, section.fields);
        return {
          ...section,
          ...(composedBody !== null ? { body: composedBody } : {}),
          order: index
        };
      });
      const { prospect: updated } = await prospectsApi.saveDraft(prospect.id, target.title, orderedSections);
      setSavedFingerprint(fingerprint(target.title, target.sections));
      app.pushToast("Utkast sparat.", "success");
      await onMutated?.(updated);
      return true;
    } catch (error) {
      setError(error.message || "Kunde inte spara utkastet.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function publishVersion() {
    setPublishing(true);
    try {
      if (!await saveDraft()) return;
      const { prospect: updated } = await prospectsApi.publishVersion(prospect.id);
      app.pushToast(`Version ${updated.currentVersion} publicerad.`, "success");
      await onMutated?.(updated);
    } catch (error) {
      setError(error.message || "Kunde inte publicera versionen.");
    } finally {
      setPublishing(false);
    }
  }

  return {
    title,
    dirty,
    error,
    setTitle,
    sections,
    saving,
    publishing,
    uploadingSectionId,
    hasUnpublishedChanges,
    updateSectionField,
    updateSectionFieldValue,
    addSection,
    removeSection,
    removeAttachment,
    uploadAttachment,
    replaceContent,
    saveDraft,
    publishVersion
  };
}

function FactRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="font-semibold text-ink-900">{value}</span>
    </div>
  );
}

function FactList({ children }) {
  return <div className="divide-y divide-veil/5 rounded-xl bg-canvas px-3">{children}</div>;
}

function AmenityChips({ amenities }) {
  if (!amenities?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {amenities.map((amenity) => (
        <Badge key={amenity} variant="outline" className="h-auto rounded-2xl border-ink-200 bg-control px-3 py-1 text-xs font-semibold text-ink-700">{amenity}</Badge>
      ))}
    </div>
  );
}

function PresetSelectField({ label, placeholder, value, presets, onChange }) {
  const [customDraft, setCustomDraft] = useState(null);
  const isKnownPreset = presets.includes(value);
  const isCustomValue = Boolean(value) && !isKnownPreset;

  function confirmCustom() {
    const trimmed = (customDraft || "").trim();
    if (!trimmed) return;
    onChange(trimmed);
    setCustomDraft(null);
  }

  if (customDraft !== null) {
    return (
      <label className="block text-[11px] font-medium text-ink-600">
        {label}
        <div className="mt-1 flex gap-1">
          <Input
            className="h-auto min-w-0 flex-1 px-2 py-1.5 text-xs"
            value={customDraft}
            onChange={(event) => setCustomDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                confirmCustom();
              }
            }}
            placeholder={placeholder}
            autoFocus
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Bekräfta värde"
            className="h-[30px] w-[30px] shrink-0 rounded-md border-veil/10 text-ink-700 hover:border-strong hover:bg-transparent hover:text-strong"
            onClick={confirmCustom}
          >
            <CheckIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </label>
    );
  }

  return (
    <label className="block text-[11px] font-medium text-ink-600">
      {label}
      <Select
        value={isKnownPreset ? value : isCustomValue ? CUSTOM_OPTION_VALUE : undefined}
        onValueChange={(next) => {
          if (next === CUSTOM_OPTION_VALUE) {
            setCustomDraft(isCustomValue ? value : "");
            return;
          }
          onChange(next);
        }}
      >
        <SelectTrigger className="mt-1 h-auto w-full px-2 py-1.5 text-xs">
          <SelectValue placeholder="Välj..." />
        </SelectTrigger>
        <SelectContent>
          {isCustomValue ? <SelectItem value={CUSTOM_OPTION_VALUE}>{value}</SelectItem> : null}
          {presets.map((preset) => (
            <SelectItem key={preset} value={preset}>{preset}</SelectItem>
          ))}
          {!isCustomValue ? <SelectItem value={CUSTOM_OPTION_VALUE}>Annat...</SelectItem> : null}
        </SelectContent>
      </Select>
    </label>
  );
}

function StructuredFields({ section, kind, updateSectionFieldValue }) {
  const schema = STRUCTURED_FIELD_SCHEMAS[kind];
  const layout = STRUCTURED_FIELD_LAYOUT[kind];
  return (
    <div
      className={
        layout === "row"
          ? "grid grid-cols-3 gap-1.5"
          : layout === "grid2"
            ? "grid grid-cols-2 gap-2"
            : "space-y-2"
      }
    >
      {schema.map(({ key, label, placeholder, presets }) => (
        presets ? (
          <PresetSelectField
            key={key}
            label={label}
            placeholder={placeholder}
            value={section.fields?.[key] || ""}
            presets={presets}
            onChange={(value) => updateSectionFieldValue(section.id, key, value)}
          />
        ) : (
          <label key={key} className="block text-xs font-medium text-ink-600">
            {label}
            <Input
              className="mt-1 py-2 text-sm"
              value={section.fields?.[key] || ""}
              onChange={(event) => updateSectionFieldValue(section.id, key, event.target.value)}
              placeholder={placeholder}
            />
          </label>
        )
      ))}
    </div>
  );
}

function PredefinedSectionBody({ section, listingSummary, updateSectionField, updateSectionFieldValue }) {
  if (section.kind === "overview") {
    return (
      <FactList>
        <FactRow label="Adress" value={listingSummary?.address} />
        <FactRow label="Storlek" value={listingSummary?.sizeSqm ? `${listingSummary.sizeSqm} kvm` : ""} />
        <FactRow label="Kapacitet" value={listingSummary?.capacity ? `${listingSummary.capacity} platser` : ""} />
        <FactRow label="Typ" value={listingSummary?.type} />
        <FactRow label="Pris" value={listingSummary?.priceMonthly ? `${listingSummary.priceMonthly} kr/månad` : ""} />
        <FactRow label="Tillträde" value={listingSummary?.availability} />
      </FactList>
    );
  }

  if (section.kind === "location") {
    return (
      <div className="space-y-2.5">
        <FactList>
          <FactRow label="Adress" value={listingSummary?.address} />
          <FactRow label="Område" value={[listingSummary?.district, listingSummary?.county].filter(Boolean).join(", ")} />
        </FactList>
        <StructuredFields section={section} kind="location" updateSectionFieldValue={updateSectionFieldValue} />
      </div>
    );
  }

  if (section.kind === "description") {
    return (
      <div className="space-y-2">
        <AmenityChips amenities={listingSummary?.amenities} />
        <Textarea
          className="min-h-16"
          aria-label={section.title}
          value={section.body}
          onChange={(event) => updateSectionField(section.id, "body", event.target.value)}
          placeholder={PREDEFINED_SECTION_META.description.placeholder}
        />
      </div>
    );
  }

  if (section.kind === "terms") {
    return (
      <div className="space-y-2.5">
        {listingSummary?.priceMonthly ? (
          <FactList>
            <FactRow label="Hyra" value={`${listingSummary.priceMonthly} kr/månad`} />
          </FactList>
        ) : null}
        <StructuredFields section={section} kind="terms" updateSectionFieldValue={updateSectionFieldValue} />
      </div>
    );
  }

  if (section.kind === "contact") {
    return <StructuredFields section={section} kind="contact" updateSectionFieldValue={updateSectionFieldValue} />;
  }

  return (
    <Textarea
      className="min-h-16"
      aria-label={section.title}
      value={section.body}
      onChange={(event) => updateSectionField(section.id, "body", event.target.value)}
      placeholder={PREDEFINED_SECTION_META[section.kind]?.placeholder}
    />
  );
}

function SectionAttachments({ section, uploadingSectionId, uploadAttachment, removeAttachment }) {
  const fileInputRef = useRef(null);
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {(section.attachments || []).map((attachment, index) => (
        <Badge key={`${attachment.storageId}-${index}`} variant="outline" className="h-auto gap-1.5 rounded-2xl border-ink-200 bg-control px-3 py-1 text-xs font-semibold text-ink-700">
          <PaperclipIcon className="h-3.5 w-3.5" />
          <span className="max-w-[160px] truncate">{attachment.fileName}</span>
          <Button type="button" variant="ghost" size="icon" className="h-4 w-4 hover:bg-transparent" aria-label="Ta bort bilaga" onClick={() => removeAttachment(section.id, index)}>
            <XIcon className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          disabled={Boolean(uploadingSectionId)}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void uploadAttachment(section.id, file);
          }}
        />
      <Button type="button" variant="secondary" disabled={Boolean(uploadingSectionId)} className="h-auto px-3 py-1.5 text-xs" onClick={() => fileInputRef.current?.click()}>
        <PaperclipIcon className="mr-1.5 h-3.5 w-3.5" />
        {uploadingSectionId === section.id ? "Laddar upp..." : "Bifoga fil"}
      </Button>
    </div>
  );
}

export function ProspectEditorSections({ editor, listingSummary, activeKind = null }) {
  const { sections, uploadingSectionId, updateSectionField, updateSectionFieldValue, removeSection, removeAttachment, uploadAttachment, addSection } = editor;
  const predefinedSections = sections.filter((section) => PREDEFINED_ORDER.includes(section.kind) && (!activeKind || section.kind === activeKind));
  const customSections = sections.filter((section) => !PREDEFINED_ORDER.includes(section.kind));
  const showCustomSections = !activeKind || activeKind === "materials";

  return (
    <div className="space-y-3">
      {predefinedSections.map((section) => {
        const meta = PREDEFINED_SECTION_META[section.kind];
        const Icon = meta.Icon;
        return (
          <Card key={section.id} className="gap-0 py-0 p-3.5 sm:p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tint text-ink-700">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-sm font-semibold text-ink-900">{meta.label}</h3>
            </div>
            <div className="mt-2.5">
              <PredefinedSectionBody
                section={section}
                listingSummary={listingSummary}
                updateSectionField={updateSectionField}
                updateSectionFieldValue={updateSectionFieldValue}
              />
            </div>
            <SectionAttachments
              section={section}
              uploadingSectionId={uploadingSectionId}
              uploadAttachment={uploadAttachment}
              removeAttachment={removeAttachment}
            />
          </Card>
        );
      })}

      {showCustomSections && customSections.length > 0 ? (
        <p className="pt-2 text-[11px] font-semibold text-ink-500">Egna sektioner</p>
      ) : null}

      {showCustomSections ? customSections.map((section) => (
        <Card key={section.id} className="gap-0 py-0 p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <Input
              className="font-semibold"
              aria-label="Sektionens rubrik"
              value={section.title}
              onChange={(event) => updateSectionField(section.id, "title", event.target.value)}
              placeholder="Sektionsrubrik"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Ta bort sektion"
              className="h-9 w-9 shrink-0 rounded-md border-veil/10 text-ink-500 hover:border-rose-200 hover:bg-transparent hover:text-rose-600"
              onClick={() => removeSection(section.id)}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            aria-label={section.title || "Sektionens innehåll"}
            className="mt-2.5 min-h-20"
            value={section.body}
            onChange={(event) => updateSectionField(section.id, "body", event.target.value)}
            placeholder="Text för den här sektionen"
          />
          <SectionAttachments
            section={section}
            uploadingSectionId={uploadingSectionId}
            uploadAttachment={uploadAttachment}
            removeAttachment={removeAttachment}
          />
        </Card>
      )) : null}

      {showCustomSections ? <Button type="button" variant="secondary" className="h-auto w-full justify-center px-4 py-3" onClick={addSection}>
        <PlusIcon className="mr-1.5 h-4 w-4" />
        Lägg till anpassad sektion
      </Button> : null}
    </div>
  );
}

export function ProspectEditorFooterActions({ editor }) {
  return (
    <>
      {editor.error ? <p role="alert" className="w-full text-sm text-rose-700">{editor.error}</p> : null}
      {editor.hasUnpublishedChanges ? (
        <span className="mr-auto text-xs font-semibold text-amber-700">Opublicerade ändringar</span>
      ) : null}
      <Button type="button" variant="secondary" className="h-auto px-4 py-2 text-sm" onClick={editor.saveDraft} disabled={editor.saving || editor.publishing || Boolean(editor.uploadingSectionId)}>
        {editor.saving ? "Sparar..." : "Spara utkast"}
      </Button>
      <Button type="button" className="h-auto px-4 py-2 text-sm" onClick={editor.publishVersion} disabled={editor.publishing || editor.saving || Boolean(editor.uploadingSectionId)}>
        {editor.publishing ? "Publicerar..." : "Publicera ny version"}
      </Button>
    </>
  );
}
