import { Card } from "@/components/ui/card";
import { useId, useMemo } from "react";
import { PatternLines, PieCenter, PieChart, PieSlice } from "@/components/charts";

function TypeDistributionDonut({
  title = "Fördelning",
  subtitle = "Typ av lokal",
  data = []
}) {
  const hatchId = useId().replace(/:/g, "");
  // The donut reads `{ label, value, color }`; the callers hand over `{ name, value }`. Colours are the chart palette in order,
  // the fourth slice on hatched in their colour, as Bklit's own examples do.
  const slices = useMemo(
    () =>
      data.map((item, index) => {
        const color = `var(--chart-${(index % 5) + 1})`;
        return { label: item.name, value: Number(item.value || 0), color, fill: index % 5 >= 3 ? `url(#${hatchId}-${index % 5})` : undefined };
      }),
    [data, hatchId]
  );

  return (
    <Card className="gap-0 py-0 p-4 sm:p-5">
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 text-sm text-ink-600">{subtitle}</p>

      <div className="mt-4 flex justify-center">
        <PieChart data={slices} size={180} innerRadius={74} padAngle={slices.length > 1 ? 0.03 : 0} hoverOffset={6}>
          {slices.map((slice, index) => (
            <PieSlice key={slice.label} index={index} showGlow={false} />
          ))}
          {[3, 4].map((n) => (
            <PatternLines key={n} id={`${hatchId}-${n}`} width={6} height={6} orientation={["diagonal"]} stroke={`var(--chart-${n + 1})`} strokeWidth={1.5} />
          ))}
          <PieCenter defaultLabel="objekt" />
        </PieChart>
      </div>

      <ul className="mt-2 space-y-2 text-sm">
        {data.map((entry, index) => (
          <li key={entry.name} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-ink-700">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slices[index]?.color }} />
              {entry.name}
            </span>
            <span className="font-semibold text-ink-900">{Number(entry.value || 0)} objekt</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default TypeDistributionDonut;
