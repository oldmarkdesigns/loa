import { Card } from "@/components/ui/card";
import { useMemo, useState } from "react";
import { Area, AreaChart, Background, Bar, BarChart, BarXAxis, ChartTooltip, Grid, XAxis } from "@/components/charts";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const rangeOptions = ["7d", "30d", "90d"];
const SERIES = [
  { key: "views", label: "Visningar", color: "var(--chart-line-primary)" },
  { key: "inquiries", label: "Förfrågningar", color: "var(--chart-line-secondary)" }
];
const CHART_MARGIN = { top: 16, right: 8, bottom: 32, left: 8 };

const tooltipRows = (point) => SERIES.map((series) => ({ color: series.color, label: series.label, value: point[series.key] ?? 0 }));

/**
 * Views and inquiries. `datasets` has a list of points per range ("7d", "30d", "90d"). A list of one point is a total (columns
 * under a label); a longer list is a series over time, each point `{ date: Date, views, inquiries }`, drawn as areas.
 */
function BarInteractive({
  title = "Visningar & förfrågningar",
  subtitle = "Senaste 30 dagarna",
  datasets = {},
  defaultRange = "30d"
}) {
  const initialRange = rangeOptions.includes(defaultRange) ? defaultRange : "30d";
  const [range, setRange] = useState(initialRange);

  const data = useMemo(() => {
    if (Array.isArray(datasets[range]) && datasets[range].length > 0) return datasets[range];
    return [];
  }, [datasets, range]);

  const isSnapshot = Object.values(datasets).every((series) => !Array.isArray(series) || series.length <= 1);

  return (
    <Card className="gap-0 py-0 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
          <p className="mt-1 text-sm text-ink-600">{isSnapshot ? "Registrerade totalsiffror" : subtitle}</p>
        </div>
        {!isSnapshot ? <ToggleGroup
          variant="outline"
          spacing={0}
          value={[range]}
          onValueChange={(next) => next[0] && setRange(next[0])}
          className="rounded-lg border border-veil/10 bg-control p-1"
        >
          {rangeOptions.map((option) => (
            <ToggleGroupItem
              key={option}
              value={option}
              className="h-auto rounded-md border-0 px-2.5 py-1 text-xs font-semibold shadow-none data-[state=on]:bg-strong data-[state=on]:text-on-strong"
            >
              {option}
            </ToggleGroupItem>
          ))}
        </ToggleGroup> : null}
      </div>

      <div className="mt-4">
        {isSnapshot ? (
          <BarChart key={range} data={data} xDataKey="label" aspectRatio="auto" className="h-[260px]" margin={CHART_MARGIN} barGap={0.5} barWidth={40}>
            <Grid horizontal />
            {SERIES.map((series) => (
              <Bar key={series.key} dataKey={series.key} fill={series.color} lineCap="round" />
            ))}
            <BarXAxis />
            <ChartTooltip rows={tooltipRows} />
          </BarChart>
        ) : (
          <AreaChart key={range} data={data} aspectRatio="auto" className="h-[260px]" margin={CHART_MARGIN}>
            <Background pattern="dots" />
            {SERIES.map((series) => (
              <Area key={series.key} dataKey={series.key} stroke={series.color} fill={series.color} />
            ))}
            <XAxis />
            <ChartTooltip rows={tooltipRows} />
          </AreaChart>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ink-700">
        {SERIES.map((series) => (
          <span key={series.key} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
            {series.label}
          </span>
        ))}
      </div>
    </Card>
  );
}

export default BarInteractive;
