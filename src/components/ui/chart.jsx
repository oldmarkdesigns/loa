import { createContext, useContext, useId, useMemo } from "react";
import { Legend, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "../../lib/utils";

const ChartContext = createContext(null);

function useChart() {
  const context = useContext(ChartContext);
  if (!context) return { config: {} };
  return context;
}

function labelFor(config, key, fallback) {
  if (!key) return fallback;
  return config?.[key]?.label || fallback || key;
}

function colorFor(config, key, fallback) {
  if (!key) return fallback;
  return config?.[key]?.color || fallback || "currentColor";
}

export function ChartContainer({ id, className, children, config = {} }) {
  const generatedId = useId().replace(/:/g, "");
  const chartId = id || generatedId;

  const style = useMemo(() => {
    return Object.entries(config).reduce((acc, [key, item]) => {
      if (item?.color) acc[`--color-${key}`] = item.color;
      return acc;
    }, {});
  }, [config]);

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "w-full",
          "[&_.recharts-cartesian-axis-tick_text]:fill-ink-500",
          "[&_.recharts-cartesian-grid_line]:stroke-ink-100",
          "[&_.recharts-pie-sector:focus-visible]:outline-none",
          className
        )}
        style={style}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = Tooltip;
export const ChartLegend = Legend;

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelKey,
  nameKey,
  hideLabel = false,
  hideIndicator = false
}) {
  const { config } = useChart();
  if (!active || !payload || payload.length === 0) return null;

  const displayLabel = hideLabel
    ? null
    : labelFor(config, labelKey || payload[0]?.dataKey, label);

  return (
    <div className="min-w-[160px] rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2 text-xs shadow-[0_10px_24px_rgba(15,25,48,0.1)]">
      {displayLabel ? <p className="font-semibold text-ink-900">{displayLabel}</p> : null}
      <div className={displayLabel ? "mt-1.5 space-y-1" : "space-y-1"}>
        {payload.map((item) => {
          const dataKey = String(nameKey || item.dataKey || "");
          const rowLabel = labelFor(config, dataKey, item.name || item.dataKey);
          const rowColor = colorFor(config, dataKey, item.color);
          const value = Number(item.value || 0).toLocaleString("sv-SE");
          return (
            <div key={`${dataKey}-${item.value}`} className="flex items-center justify-between gap-3 text-ink-700">
              <span className="inline-flex items-center gap-1.5">
                {!hideIndicator ? <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: rowColor }} /> : null}
                {rowLabel}
              </span>
              <span className="font-semibold text-ink-900">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChartLegendContent({ payload }) {
  const { config } = useChart();
  if (!payload || payload.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
      {payload.map((item) => {
        const dataKey = String(item.dataKey || item.value || "");
        return (
          <span key={dataKey} className="inline-flex items-center gap-1.5 text-ink-700">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorFor(config, dataKey, item.color) }} />
            {labelFor(config, dataKey, item.value)}
          </span>
        );
      })}
    </div>
  );
}
