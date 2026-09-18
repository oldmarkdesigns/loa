import { useState } from "react";
import {
  BuildingIcon,
  CalendarIcon,
  CarIcon,
  ClockIcon,
  CoinsIcon,
  LightbulbIcon,
  MapIcon,
  PencilIcon,
  PinIcon,
  PlusIcon,
  RulerIcon,
  TrashIcon,
  UserIcon,
  ChevronRightIcon
} from "../icons/UiIcons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

function listFromDelimitedValue(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isFilled(value, { disallowAll = false } = {}) {
  if (Array.isArray(value)) {
    const clean = value.map((item) => String(item || "").trim()).filter(Boolean);
    if (clean.length === 0) return false;
    return disallowAll ? !clean.every((item) => item.toLowerCase() === "alla") : true;
  }
  const text = String(value ?? "").trim();
  if (!text) return false;
  if (disallowAll && text.toLowerCase() === "alla") return false;
  return true;
}

function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "-";
  return `${amount.toLocaleString("sv-SE")} kr`;
}

function programSummary(program = {}) {
  const preferredTypes = listFromDelimitedValue(program.type);
  return [
    { key: "district", label: "Område", value: program.district || "Alla", Icon: PinIcon },
    { key: "type", label: "Typ av lokal", value: preferredTypes.length ? preferredTypes.join(", ") : "Alla typer", Icon: BuildingIcon },
    { key: "teamSize", label: "Platser", value: program.teamSize || "-", Icon: UserIcon },
    {
      key: "size",
      label: "Yta",
      value: program.minSize || program.maxSize ? `${program.minSize || 0}-${program.maxSize || "∞"} kvm` : "-",
      Icon: RulerIcon
    },
    {
      key: "budget",
      label: "Budget",
      value: program.maxBudget ? `Upp till ${formatMoney(program.maxBudget)}` : "-",
      Icon: CoinsIcon
    },
    { key: "moveInDate", label: "Inflyttning", value: program.moveInDate || "-", Icon: CalendarIcon },
    { key: "contractFlex", label: "Avtal", value: program.contractFlex || "Alla", Icon: ClockIcon },
    { key: "transit", label: "Kollektivtrafik", value: program.transitDistance || "Alla", Icon: MapIcon },
    { key: "parking", label: "Parkering", value: program.parkingType || "Alla", Icon: CarIcon },
    {
      key: "prefs",
      label: "Preferenser",
      value: [
        program.includeOperatingCosts ? "Driftkostnader" : null,
        program.accessibilityAdapted ? "Tillgänglighet" : null,
        program.ecoCertified ? "Miljöcertifierat" : null
      ].filter(Boolean).join(" · ") || "-",
      Icon: LightbulbIcon
    }
  ];
}

function programProgress(program = {}) {
  const preferredTypes = listFromDelimitedValue(program.type);
  const amenities = listFromDelimitedValue(program.amenities);
  const checks = [
    isFilled(program.district, { disallowAll: true }),
    isFilled(preferredTypes, { disallowAll: true }),
    isFilled(program.teamSize),
    isFilled(program.maxBudget) || isFilled(program.minBudget),
    isFilled(program.moveInDate),
    isFilled(program.transitDistance),
    amenities.length > 0
  ];
  const done = checks.filter(Boolean).length;
  const total = checks.length;
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export function programPreview(program = {}) {
  const parts = [];
  const types = listFromDelimitedValue(program.type);
  if (program.district && program.district !== "Alla") parts.push(program.district);
  if (types.length > 0) parts.push(types.join(", "));
  if (program.teamSize) parts.push(`${program.teamSize} platser`);
  if (program.maxBudget) parts.push(`max ${formatMoney(program.maxBudget)}`);
  return parts.join(" · ") || "Inga detaljer ännu";
}

function LocalProgramModule({
  programs = [],
  canEdit = true,
  onAddProgram,
  onEditProgram,
  onDeleteProgram
}) {
  const initialOpenId = programs[0]?.id || "";
  const [expandedProgramIds, setExpandedProgramIds] = useState(() => new Set(initialOpenId ? [initialOpenId] : []));

  function toggleExpanded(programId) {
    setExpandedProgramIds((prev) => {
      const next = new Set(prev);
      if (next.has(programId)) next.delete(programId);
      else next.add(programId);
      return next;
    });
  }

  return (
    <article className="rounded-3xl border border-black/10 bg-[#ffffff] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-[#0b0a0e]">Lokalprogram</h2>
          <p className="mt-1 text-sm text-ink-600">Flera behov kan sparas separat för olika team, lägen eller tidslinjer.</p>
        </div>
        {canEdit ? (
          <Button
            type="button"
            className="h-auto gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            onClick={onAddProgram}
          >
            <PlusIcon className="h-4 w-4" />
            Lägg till
          </Button>
        ) : null}
      </div>

      {programs.length === 0 ? (
        <Button
          type="button"
          variant="outline"
          className="h-auto mt-5 w-full justify-between gap-4 rounded-2xl border-dashed border-black/20 bg-[#f8fafc] p-4 text-left font-normal hover:border-[#0b0a0e]/40"
          onClick={onAddProgram}
        >
          <span>
            <span className="block text-sm font-semibold text-[#0b0a0e]">Inget lokalprogram ännu</span>
            <span className="mt-0.5 block text-sm text-ink-600">Lägg till första programmet för bättre matchning.</span>
          </span>
          <PlusIcon className="h-5 w-5 shrink-0 text-[#0b0a0e]" />
        </Button>
      ) : (
        <div className="mt-5 space-y-3">
          {programs.map((program, index) => {
            const expanded = expandedProgramIds.has(program.id);
            const progress = programProgress(program);
            const amenities = listFromDelimitedValue(program.amenities);
            return (
              <section key={program.id} className="rounded-2xl border border-black/10 bg-[#ffffff]">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                  onClick={() => toggleExpanded(program.id)}
                  aria-expanded={expanded}
                >
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-base font-semibold text-[#0b0a0e]">{program.title || `Lokalprogram ${index + 1}`}</span>
                      {index === 0 ? (
                        <Badge variant="outline" className="h-auto rounded-full bg-[#f8fafc] px-2.5 py-1 text-[11px] font-semibold text-ink-600">Aktivt i sök</Badge>
                      ) : null}
                    </span>
                    <span className="mt-1 block truncate text-sm text-ink-600">{programPreview(program)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="hidden text-xs font-semibold text-ink-500 sm:inline">{progress.percent}%</span>
                    <ChevronRightIcon className={`h-5 w-5 text-ink-600 transition-transform ${expanded ? "rotate-90" : ""}`} />
                  </span>
                </button>

                <div className={`overflow-hidden transition-all duration-300 ${expanded ? "max-h-[980px] opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="border-t border-black/10 p-4 pt-3">
                    <div className="rounded-2xl border border-black/10 bg-[#f8fafc] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-ink-700">{progress.percent}% klart</p>
                        <p className="text-xs font-semibold text-ink-500">{progress.done} av {progress.total}</p>
                      </div>
                      <Progress
                        value={progress.percent}
                        className="mt-2 [&_[data-slot=progress-track]]:h-3 [&_[data-slot=progress-track]]:border [&_[data-slot=progress-track]]:border-black/10 [&_[data-slot=progress-track]]:bg-[#eef2f8] [&_[data-slot=progress-indicator]]:bg-[#0b0a0e]"
                      />
                    </div>

                    <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                      {programSummary(program).map(({ key, label, value, Icon }) => (
                        <div key={key} className="flex min-w-0 items-start gap-2.5">
                          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-[#ffffff] text-[#0b0a0e]">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
                            <p className="mt-0.5 truncate text-[15px] font-semibold text-ink-900">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {amenities.length > 0 ? (
                      <div className="mt-4 border-t border-black/10 pt-4">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-700">Bekvämligheter</p>
                        <div className="flex flex-wrap gap-2">
                          {amenities.map((amenity) => (
                            <span
                              key={amenity}
                              className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-black/10 bg-[#ffffff] px-3 py-1.5 text-xs font-semibold text-ink-700"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {canEdit ? (
                      <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-ink-700 hover:border-[#0b0a0e] hover:text-[#0b0a0e]"
                          onClick={() => onEditProgram(program.id)}
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                          Redigera
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto gap-1.5 rounded-full border-rose-200 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => onDeleteProgram(program.id)}
                          disabled={programs.length <= 1}
                          title={programs.length <= 1 ? "Minst ett lokalprogram behövs" : "Radera lokalprogram"}
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                          Radera
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </article>
  );
}

export default LocalProgramModule;
