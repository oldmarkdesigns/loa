import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  YAxis,
  XAxis
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";

const rangeOptions = ["7d", "30d", "90d"];
const chartConfig = {
  views: {
    label: "Visningar",
    color: "#0b0a0e"
  },
  inquiries: {
    label: "Förfrågningar",
    color: "#7ea1cc"
  }
};

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
    if (Array.isArray(datasets["30d"]) && datasets["30d"].length > 0) return datasets["30d"];
    return [];
  }, [datasets, range]);

  return (
    <article className="surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
          <p className="mt-1 text-sm text-ink-600">{subtitle}</p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#ffffff] p-1">
          {rangeOptions.map((option) => {
            const active = option === range;
            return (
              <button
                key={option}
                type="button"
                className={`min-h-0 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                  active
                    ? "bg-[#0b0a0e] text-white"
                    : "text-ink-600 hover:text-ink-900"
                }`}
                onClick={() => setRange(option)}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <AreaChart accessibilityLayer data={data} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
            <defs>
              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.22} />
                <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="inquiriesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-inquiries)" stopOpacity={0.18} />
                <stop offset="95%" stopColor="var(--color-inquiries)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#68817f" }}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#68817f" }} width={34} />
            <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: "#cad9ec", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="views"
              stroke="var(--color-views)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#viewsGradient)"
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="inquiries"
              stroke="var(--color-inquiries)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#inquiriesGradient)"
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ink-700">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#0b0a0e]" />
          Visningar
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#7ea1cc]" />
          Förfrågningar
        </span>
      </div>
    </article>
  );
}

export default BarInteractive;
