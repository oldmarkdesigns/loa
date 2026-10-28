import { useId } from "react";
import { cn } from "cn";
import { Bar, BarChart, BarXAxis, ChartTooltip, Grid, PatternLines } from "@/components/charts";
import { TooltipContent } from "@/components/charts/tooltip";
import { CHART_PRIMARY, number } from "./WidgetCard";

const CHART_MARGIN = { top: 12, right: 4, bottom: 30, left: 4 };
const SECONDARY = "var(--chart-line-secondary)";

/**
 * Columns over a row of labels, for the widgets that count things in steps or days. Each item of `data` is
 * `{ label, value, tone?, title? }`: `label` sits under the column, `title` (when given) heads its tooltip instead. `tone` sets
 * one column apart: "late" hatches it (what is overdue, what is old), "today" gives it the second colour of the palette.
 * `seriesLabel` names what is counted, in the tooltip.
 */
export default function ColumnChart({ data, seriesLabel, className, valueFormatter = number }) {
  const hatchId = useId().replace(/:/g, "");
  const fillOf = (item) => (item.tone === "late" ? `url(#${hatchId})` : item.tone === "today" ? SECONDARY : CHART_PRIMARY);
  const swatchOf = (item) => (item.tone === "today" ? SECONDARY : CHART_PRIMARY);

  return (
    <BarChart
      data={data}
      xDataKey="label"
      aspectRatio="auto"
      barGap={0.3}
      margin={CHART_MARGIN}
      className={cn("min-h-[200px] w-full flex-1", className)}
    >
      <Grid horizontal />
      <PatternLines id={hatchId} width={6} height={6} orientation={["diagonal"]} stroke={CHART_PRIMARY} strokeWidth={1.5} />
      <Bar dataKey="value" stroke={CHART_PRIMARY} fill={fillOf} lineCap="round" />
      <BarXAxis />
      <ChartTooltip
        showDatePill={false}
        content={({ point }) => (
          <TooltipContent
            title={point.title ?? point.label}
            rows={[{ color: swatchOf(point), label: seriesLabel, value: valueFormatter(point.value) }]}
          />
        )}
      />
    </BarChart>
  );
}
