import { Card } from "@/components/ui/card";
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
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

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
    { key: "access", label: "Tillträde", value: program.accessHours || "Alla", Icon: ClockIcon },
    { key: "layout", label: "Planlösning", value: program.layoutType || "Alla", Icon: BuildingIcon },
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
  title = "Lokalprogram",
  programs = [],
  canEdit = true,
  onAddProgram,
  onEditProgram,
  onDeleteProgram
}) {
  const [expandedProgramIds, setExpandedProgramIds] = useState([]);
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2"><h2 className="text-base font-semibold">{title}</h2><Badge variant="secondary">{programs.length}</Badge></div>
        {canEdit && <Button variant="outline" size="sm" onClick={onAddProgram}><PlusIcon className="mr-1.5 h-4 w-4" />Lägg till</Button>}
      </div>
      {!programs.length ? <div className="p-5"><p className="text-sm text-ink-500">Inget lokalprogram ännu.</p>{canEdit && <Button variant="link" className="mt-1 h-auto p-0" onClick={onAddProgram}>Skapa ditt första lokalprogram</Button>}</div> : (
        <Accordion value={expandedProgramIds} onValueChange={setExpandedProgramIds} className="gap-2 p-3">
          {programs.map((program, index) => {
            const amenities = listFromDelimitedValue(program.amenities);
            const summary = programSummary(program);
            return <AccordionItem key={program.id} value={program.id} className="overflow-hidden rounded-lg border border-border">
              <AccordionTrigger className="h-12 items-center gap-3 bg-canvas px-3 py-2 hover:bg-tint-2 hover:no-underline [&>svg]:h-4 [&>svg]:w-4">
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <BuildingIcon className="h-4 w-4 shrink-0 text-ink-500" />
                  <span className="max-w-[160px] shrink-0 truncate text-sm font-medium">{program.title || `Lokalprogram ${index + 1}`}</span>
                  {index === 0 && <Badge variant="secondary" className="shrink-0 text-[10px]">Aktivt</Badge>}
                  <span className="ml-auto flex min-w-0 items-center divide-x divide-border overflow-x-auto whitespace-nowrap text-xs font-normal text-ink-600">
                    {summary.filter((item) => ["district", "type", "teamSize", "budget"].includes(item.key)).map((item) => (
                      <span key={item.key} className="shrink-0 px-3 first:pl-0 last:pr-0" title={`${item.label}: ${item.value === "-" ? "Inte angivet" : item.value}`}>
                        <span className="sr-only">{item.label}: </span>
                        {item.value === "-" ? "Inte angivet" : item.key === "teamSize" ? `${item.value} platser` : item.value}
                      </span>
                    ))}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="p-0 [&_p:not(:last-child)]:mb-0">
                <div className="border-t border-border p-4 sm:p-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    {[{ title: "Lokal och budget", keys: ["district","type","teamSize","size","budget","moveInDate"] }, { title: "Avtal och önskemål", keys: ["contractFlex","transit","access","layout","parking","prefs"] }].map((group) => <section key={group.title}>
                      <h3 className="mb-2 text-xs font-semibold text-ink-900">{group.title}</h3>
                      <dl className="divide-y divide-border">{summary.filter((item) => group.keys.includes(item.key)).map((item) => <div key={item.key} className="flex items-start justify-between gap-4 py-2"><dt className="shrink-0 text-xs text-ink-500">{item.label}</dt><dd className="min-w-0 break-words text-right text-xs font-medium text-ink-900">{item.value === "-" ? (canEdit ? <Button type="button" variant="ghost" size="icon" className="!h-6 !min-h-6 w-6 rounded-md p-0 text-ink-500 hover:text-ink-900" aria-label={`Redigera ${item.label.toLocaleLowerCase("sv-SE")}`} title={`Redigera ${item.label.toLocaleLowerCase("sv-SE")}`} onClick={() => onEditProgram(program.id)}><PencilIcon className="h-3.5 w-3.5" /></Button> : <span className="font-normal text-ink-500">Inte angivet</span>) : item.value}</dd></div>)}</dl>
                    </section>)}
                  </div>
                  {Object.values(program.contextNotes || {}).some(Boolean) && <div className="mt-4 space-y-2 border-t border-border pt-4"><h3 className="text-xs font-semibold">Egna önskemål</h3>{Object.entries(program.contextNotes || {}).filter(([, text]) => text.trim()).map(([category, text]) => <div key={category}><p className="text-xs font-medium text-ink-500">{category}</p><p className="whitespace-pre-wrap break-words text-sm">{text}</p></div>)}</div>}
                  {amenities.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-4">{amenities.map((amenity) => <Badge key={amenity} variant="secondary" className="h-auto px-2 py-1 text-xs font-normal">{amenity}</Badge>)}</div>}
                  {canEdit && <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3"><Button variant="ghost" size="sm" disabled={programs.length <= 1} title={programs.length <= 1 ? "Minst ett lokalprogram behövs" : "Radera lokalprogram"} onClick={() => onDeleteProgram(program.id)}><TrashIcon className="mr-1.5 h-4 w-4" />Radera</Button><Button variant="outline" size="sm" onClick={() => onEditProgram(program.id)}><PencilIcon className="mr-1.5 h-4 w-4" />Redigera</Button></div>}
                </div>
              </AccordionContent>
            </AccordionItem>;
          })}
        </Accordion>
      )}
    </Card>
  );
}

export default LocalProgramModule;
