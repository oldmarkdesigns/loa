import { useMemo } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";

function TypeDistributionDonut({
  title = "Fördelning",
  subtitle = "Typ av lokal",
  data = []
}) {
  const chartConfig = useMemo(() => (
    data.reduce((acc, item) => {
      const key = String(item.key || item.name || "").toLowerCase();
      acc[key] = {
        label: item.name,
        color: item.color || "#cad9ec"
      };
      return acc;
    }, {})
  ), [data]);

  return (
    <article className="surface p-4 sm:p-5">
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 text-sm text-ink-600">{subtitle}</p>

      <div className="mt-4">
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={74}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={`var(--color-${String(entry.key || entry.name || "").toLowerCase()})`} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent labelKey="name" nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </div>

      <ul className="mt-2 space-y-2 text-sm">
        {data.map((entry) => (
          <li key={entry.name} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-ink-700">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-semibold text-ink-900">{Number(entry.value || 0)}%</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default TypeDistributionDonut;
