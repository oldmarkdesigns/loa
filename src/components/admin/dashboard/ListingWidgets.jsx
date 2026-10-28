import { useId, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  BarDepthBack,
  BarDepthFront,
  BarSquares,
  BarXAxis,
  ChartTooltip,
  Grid,
  PatternLines,
  PieCenter,
  PieChart,
  PieSlice,
  RadarArea,
  RadarAxis,
  RadarChart,
  RadarGrid,
  RadarLabels,
  SankeyChart,
  SankeyLink,
  SankeyNode,
  SankeyTooltip
} from "@/components/charts";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { listingAge, listingStatusBreakdown, rentByDistrict, topListings } from "../../../lib/brokerDashboard";
import { BarList, WidgetBody, WidgetCard, number, rangeToggleClass, rangeToggleItemClass } from "./WidgetCard";

/** The widgets about the broker's listings. All take `{ listings, leads, loading, error }`. */

export function ListingStatusWidget({ listings, loading, error }) {
  const { segments, total } = listingStatusBreakdown(listings);
  const slices = segments.filter((segment) => segment.value > 0);
  const hatchId = useId().replace(/:/g, "");
  // Each status keeps its place in the palette, so its colour is the same whatever the other statuses hold. The ones that are not on
  // the market (a draft, an inactive listing) are hatched in their colour.
  const colorOf = (segment) => `var(--chart-${segments.indexOf(segment) + 1})`;
  const hatched = (segment) => segment.key === "draft" || segment.key === "inactive";
  const hatchIdOf = (segment) => `${hatchId}-${segment.key}`;

  return (
    <WidgetCard title="Objekt per status" subtitle="Alla dina objekt">
      <WidgetBody loading={loading} error={error} empty={!total} emptyText="Inga objekt ännu. Skapa din första annons." minHeight={200}>
        <div className="dashboard-split">
          <div className="mx-auto flex w-full max-w-[200px] justify-center">
            <PieChart
              data={slices.map((segment) => ({ label: segment.label, value: segment.value, color: colorOf(segment), fill: hatched(segment) ? `url(#${hatchIdOf(segment)})` : undefined }))}
              size={180}
              innerRadius={58}
              padAngle={slices.length > 1 ? 0.03 : 0}
              hoverOffset={6}
            >
              {slices.map((segment, index) => (
                <PieSlice key={segment.key} index={index} showGlow={false} />
              ))}
              {slices.filter(hatched).map((segment) => (
                <PatternLines key={segment.key} id={hatchIdOf(segment)} width={6} height={6} orientation={["diagonal"]} stroke={colorOf(segment)} strokeWidth={1.5} />
              ))}
              <PieCenter defaultLabel="objekt" />
            </PieChart>
          </div>
          <ul aria-label="Objekt per status" className="space-y-2 text-sm">
            {segments.map((segment) => (
              <li key={segment.key} className={`flex items-center justify-between gap-3 ${segment.value ? "" : "text-ink-400"}`}>
                <span className="inline-flex min-w-0 items-center gap-2 text-ink-700">
                  <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorOf(segment) }} />
                  <span className="truncate">{segment.label}</span>
                </span>
                <span className="font-semibold tabular-nums text-ink-900">{number(segment.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </WidgetBody>
    </WidgetCard>
  );
}

const TOP_METRICS = [
  { value: "leads", label: "Leads", subtitle: "Objekten med flest leads", empty: "Inga leads är kopplade till dina objekt ännu." },
  { value: "views", label: "Visningar", subtitle: "Objekten med flest annonsvisningar", empty: "Inga annonsvisningar är registrerade ännu." }
];

/** The ranked listings as the nodes and links a sankey draws: each district flows into the listings of it, wide as their value. */
function listingFlow(rows) {
  const nodes = [];
  const districtIndex = new Map();
  const links = [];
  for (const row of rows) {
    const district = row.district || "Övrigt område";
    if (!districtIndex.has(district)) {
      districtIndex.set(district, nodes.length);
      nodes.push({ name: district, category: "source" });
    }
  }
  for (const row of rows) {
    const target = nodes.length;
    nodes.push({ name: row.title });
    links.push({ source: districtIndex.get(row.district || "Övrigt område"), target, value: row.value });
  }
  return { nodes, links };
}

export function TopListingsWidget({ listings, leads, loading, error }) {
  const [metric, setMetric] = useState("leads");
  const active = TOP_METRICS.find((item) => item.value === metric);
  const rows = topListings(listings, leads, metric);
  const flow = useMemo(() => listingFlow(rows), [rows.map((row) => `${row.id}:${row.value}`).join("|")]);

  return (
    <WidgetCard
      title="Objekt i topp"
      subtitle={active.subtitle}
      action={
        <ToggleGroup
          aria-label="Rangordna objekt efter"
          value={[metric]}
          onValueChange={(value) => value[0] && setMetric(value[0])}
          className={rangeToggleClass}
        >
          {TOP_METRICS.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value} className={rangeToggleItemClass} aria-label={`Flest ${item.label.toLowerCase()}`}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      }
    >
      <WidgetBody loading={loading} error={error} empty={!rows.length} emptyText={active.empty} minHeight={200}>
        {metric === "leads" ? (
          // A podium: a column for each listing, the one with the most leads on the left and the rest in order, so the ranking is
          // the height of the columns. The rank is in front of each name.
          <BarChart
            key={metric}
            data={rows.map((row, index) => ({ label: `${index + 1}. ${row.title}\n${number(row.value)} leads`, value: row.value }))}
            xDataKey="label"
            aspectRatio="auto"
            barGap={0.3}
            margin={{ top: 24, right: 24, bottom: 72, left: 24 }}
            className="h-[340px] w-full"
          >
            <Grid horizontal />
            <BarDepthBack dataKey="value" color="var(--chart-line-primary)" />
            <Bar dataKey="value" perspective />
            <BarDepthFront dataKey="value" />
            <BarXAxis labelMaxWidth={124} />
            <ChartTooltip showDatePill={false} rows={(point) => [{ color: "var(--chart-line-primary)", label: "Leads", value: point.value }]} />
          </BarChart>
        ) : (
          // Each district on the left flows into its listings on the right; the width of a flow is how many views it has.
          <SankeyChart key={metric} data={flow} aspectRatio="2.6 / 1" margin={{ top: 16, right: 200, bottom: 16, left: 110 }}>
            <SankeyLink />
            <SankeyNode valueSuffix={` ${active.label.toLowerCase()}`} />
            <SankeyTooltip formatValue={number} />
          </SankeyChart>
        )}
      </WidgetBody>
    </WidgetCard>
  );
}

export function RentByDistrictWidget({ listings, loading, error }) {
  const { rows: byDistrict, count } = rentByDistrict(listings);
  const rows = byDistrict.map((row) => ({
    key: row.district,
    label: row.district,
    value: row.value,
    display: `${number(row.value)} kr`,
    text: `${number(row.value)} kronor per kvadratmeter och år`
  }));
  // A radar needs three corners to be a shape; with fewer areas the rents are listed with bars instead.
  const radar = rows.length >= 3;
  const top = Math.max(1, ...rows.map((row) => row.value));
  const metrics = rows.map((row) => ({ key: row.key, label: row.label }));
  // The radar scale is 0 to 100: the dearest area is the full radius, the others are shown in relation to it.
  const series = [{ label: "Hyra", values: Object.fromEntries(rows.map((row) => [row.key, Math.round((row.value / top) * 100)])) }];

  return (
    <WidgetCard
      title="Hyra per område"
      subtitle="Snitt i kr per kvm och år"
      footer={count ? `Baserat på ${number(count)} objekt med hyra och yta angivna.${radar ? " Området med högst hyra är hela radien." : ""}` : undefined}
    >
      <WidgetBody loading={loading} error={error} empty={!rows.length} emptyText="Ingen hyra att jämföra ännu. Ange hyra och yta på dina objekt." minHeight={200}>
        {radar ? (
          <div className="dashboard-split">
            <div className="mx-auto w-full max-w-[280px]">
              <RadarChart data={series} metrics={metrics} margin={52}>
                <RadarGrid />
                <RadarAxis />
                <RadarLabels fontSize={11} offset={14} />
                <RadarArea index={0} showGlow={false} />
              </RadarChart>
            </div>
            <ul aria-label="Snitthyra per område" className="space-y-2 text-sm">
              {rows.map((row) => (
                <li key={row.key} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-ink-700">{row.label}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-ink-900">{row.display}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <BarList rows={rows} label="Snitthyra per område" />
        )}
      </WidgetBody>
    </WidgetCard>
  );
}

export function ListingAgeWidget({ listings, loading, error }) {
  const age = listingAge(listings);
  const stale = age.buckets.find((bucket) => bucket.key === "older")?.value || 0;

  return (
    <WidgetCard
      title="Tid på marknaden"
      subtitle="Hur länge annonserna legat ute"
      headline={loading || error ? "—" : age.average === null ? "—" : `${number(age.average)} dagar`}
      headlineNote="i snitt"
      footer={stale ? `${number(stale)} ${stale === 1 ? "annons har" : "annonser har"} legat ute i över tre månader.` : undefined}
    >
      <WidgetBody loading={loading} error={error} empty={!age.count} emptyText="Inga aktiva annonser ute på marknaden just nu." minHeight={200}>
        {/* One square for each listing, stacked in the column of how long it has been out. */}
        <BarChart data={age.buckets} xDataKey="label" aspectRatio="auto" margin={{ top: 12, right: 4, bottom: 30, left: 4 }} className="min-h-[200px] w-full flex-1">
          <Grid horizontal />
          <BarSquares dataKey="value" />
          <BarXAxis />
          <ChartTooltip
            showDatePill={false}
            rows={(point) => [{ color: "var(--chart-line-primary)", label: "Annonser", value: point.value }]}
          />
        </BarChart>
      </WidgetBody>
    </WidgetCard>
  );
}
