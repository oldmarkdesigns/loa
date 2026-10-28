import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  Background,
  Bar,
  BarChart,
  BarXAxis,
  ChartTooltip,
  FunnelChart,
  Gauge,
  Grid,
  HeatmapCells,
  HeatmapChart,
  HeatmapInteractionBoundary,
  HeatmapInteractionProvider,
  HeatmapLegend,
  HeatmapTooltip,
  HeatmapXAxis,
  HeatmapYAxis,
  Line,
  LineChart,
  PatternLines,
  RadarArea,
  RadarAxis,
  RadarChart,
  RadarGrid,
  RadarLabels,
  XAxis
} from "@/components/charts";
import { BarList } from "./dashboard/WidgetCard";

/** The charts of the statistics page of the admin panel, in Bklit UI. Each takes its data as the page keeps it. */

// Colours are Bklit's own palette (the --chart-* variables of index.css): the first series is the primary, the second the secondary.
const PRIMARY = "var(--chart-line-primary)";
const SECONDARY = "var(--chart-line-secondary)";
const TERTIARY = "var(--chart-3)";

const number = (value) => Number(value || 0).toLocaleString("sv-SE");

/** Colours and the legend of a chart with several series: `[{ key, label, color }]`. */
export function SeriesLegend({ series }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ink-700">
      {series.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

const rowsOf = (series) => (point) => series.map((item) => ({ color: item.color, label: item.label, value: point[item.key] ?? 0 }));

const DISTRICT_SERIES = [
  { key: "views", label: "Visningar", color: PRIMARY },
  { key: "inquiries", label: "Förfrågningar", color: SECONDARY }
];

/** Views and inquiries per district: `[{ district, views, inquiries }]`. The inquiries are hatched. */
export function DistrictPerformanceChart({ data }) {
  const hatchId = useId().replace(/:/g, "");
  const fills = { views: PRIMARY, inquiries: `url(#${hatchId})` };
  return (
    <>
      <BarChart data={data} xDataKey="district" aspectRatio="auto" className="h-[280px]" margin={{ top: 16, right: 8, bottom: 32, left: 8 }} barGap={0.35}>
        <Grid horizontal />
        <PatternLines id={hatchId} width={6} height={6} orientation={["diagonal"]} stroke={SECONDARY} strokeWidth={1.5} />
        {DISTRICT_SERIES.map((item) => (
          <Bar key={item.key} dataKey={item.key} fill={fills[item.key]} stroke={item.color} lineCap="round" />
        ))}
        <BarXAxis />
        <ChartTooltip rows={rowsOf(DISTRICT_SERIES)} />
      </BarChart>
      <SeriesLegend series={DISTRICT_SERIES} />
    </>
  );
}

/** From view to signed lease: `[{ stage, count, conversion }]`, `conversion` being the share (in percent) of the first stage. */
export function ConversionFunnelChart({ data }) {
  const steps = data.map((step) => ({ label: step.stage, value: step.count }));
  return <FunnelChart data={steps} formatValue={number} style={{ aspectRatio: "1.5 / 1" }} />;
}

/** The team's key areas as an index of 0 to 100 for each broker: `[{ metric, [broker]: value }]`. */
export function BrokerRadarChart({ data }) {
  const { metrics, series } = useMemo(() => {
    const brokers = Object.keys(data[0] || {}).filter((key) => key !== "metric");
    return {
      metrics: data.map((row) => ({ key: row.metric, label: row.metric })),
      series: brokers.map((broker, index) => ({
        key: broker,
        label: broker,
        color: `var(--chart-${(index % 5) + 1})`,
        values: Object.fromEntries(data.map((row) => [row.metric, Number(row[broker] || 0)]))
      }))
    };
  }, [data]);

  return (
    <>
      <div className="mx-auto w-full max-w-[320px]">
        <RadarChart data={series} metrics={metrics} margin={44}>
          <RadarGrid />
          <RadarAxis />
          <RadarLabels fontSize={11} offset={14} />
          {series.map((item, index) => (
            <RadarArea key={item.key} index={index} showGlow={false} />
          ))}
        </RadarChart>
      </div>
      <SeriesLegend series={series} />
    </>
  );
}

const SEGMENT_SERIES = [
  { key: "kontor", label: "Kontor", color: PRIMARY },
  { key: "butik", label: "Butik", color: SECONDARY },
  { key: "lager", label: "Lager", color: TERTIARY }
];

/** The demand of each type of premises over time: `[{ date: Date, kontor, butik, lager }]`. */
export function SegmentTrendChart({ data }) {
  return (
    <>
      <LineChart data={data} aspectRatio="auto" className="h-[300px]" margin={{ top: 16, right: 12, bottom: 32, left: 8 }}>
        <Background pattern="dots" />
        {SEGMENT_SERIES.map((item) => (
          <Line key={item.key} dataKey={item.key} stroke={item.color} />
        ))}
        <XAxis />
        <ChartTooltip rows={rowsOf(SEGMENT_SERIES)} />
      </LineChart>
      <SeriesLegend series={SEGMENT_SERIES} />
    </>
  );
}

const WEEK_DAYS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

/**
 * Views per weekday and time of day: `rows` is `[{ day, slots: [number] }]` and `labels` names the slots. The heatmap takes the
 * slots as its columns and the days as its rows. It colours by level (0 to 4), so each value is placed among the others, from the
 * lowest to the highest, and the tooltip tells the value itself.
 */
export function WeeklyHeatmapChart({ rows, labels }) {
  const { columns, dayLabels } = useMemo(() => {
    const values = rows.flatMap((row) => row.slots);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const level = (value) => (max === min ? 2 : Math.round(((value - min) / (max - min)) * 4));
    return {
      dayLabels: rows.map((row) => row.day),
      columns: labels.map((label, slot) => ({
        bin: slot,
        bins: rows.map((row, dayIndex) => ({
          bin: dayIndex,
          count: level(row.slots[slot]),
          value: row.slots[slot],
          day: row.day,
          slot: label,
          date: new Date(2024, 0, 1 + dayIndex)
        }))
      }))
    };
  }, [rows, labels]);

  return (
    <HeatmapInteractionProvider>
      <HeatmapInteractionBoundary>
        <div className="flex w-full flex-col items-stretch gap-3">
          <HeatmapChart data={columns} layout="fluid" gap={4} margin={{ top: 28, right: 4, bottom: 4, left: 48 }} aspectRatio="1.5 / 1">
            <HeatmapCells />
            <HeatmapXAxis columnLabels={labels} />
            <HeatmapYAxis rowLabels={dayLabels} tickFilter="all" />
            <HeatmapTooltip
              formatTitle={(bin) => bin.day}
              formatSubtitle={(bin) => bin.slot}
              formatLabel={(_count, _date, bin) => `${number(bin.value)} visningar`}
            />
          </HeatmapChart>
          <HeatmapLegend lessLabel="Låg" moreLabel="Hög" />
        </div>
      </HeatmapInteractionBoundary>
    </HeatmapInteractionProvider>
  );
}

/** A small curve of `data` (numbers, oldest first). It is drawn in the second colour of the palette when the trend is down. */
export function MetricSparkline({ data = [], direction = "up" }) {
  const points = useMemo(() => {
    const start = new Date(2024, 0, 1);
    return data.map((value, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return { date, value };
    });
  }, [data]);
  const color = direction === "down" ? SECONDARY : PRIMARY;

  return (
    <AreaChart data={points} aspectRatio="auto" className="h-16" margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
      <Area dataKey="value" stroke={color} fill={color} showHighlight={false} />
    </AreaChart>
  );
}

/** A share of 0 to 100 as a gauge of notches; `inverse` reads it as a risk, where less is better. */
export function MetricGauge({ value = 0, inverse = false }) {
  const normalized = Math.max(0, Math.min(value, 100));
  return (
    <Gauge
      orientation="linear"
      value={inverse ? 100 - normalized : normalized}
      centerValue={normalized}
      defaultLabel={inverse ? "Risknivå" : "Måluppfyllnad"}
      suffix="%"
      totalNotches={36}
    />
  );
}

/** The steps of a funnel as shares of 0 to 100: `[{ label, value }]`. */
export function MetricFunnel({ steps = [] }) {
  const data = steps.map((step) => ({ label: step.label, value: Math.max(step.value, 1), displayValue: `${step.value}%` }));
  return <FunnelChart data={data} showPercentage={false} style={{ aspectRatio: "1.5 / 1" }} />;
}

/** Items of 0 to 100 side by side: `[{ label, value, active? }]`; the active item stands out. */
export function MetricBars({ items = [] }) {
  const rows = items.map((item) => ({
    key: item.label,
    label: item.label,
    value: item.value,
    color: item.active ? PRIMARY : TERTIARY,
    display: item.value
  }));
  return <BarList rows={rows} max={100} label="Jämförelse" />;
}
