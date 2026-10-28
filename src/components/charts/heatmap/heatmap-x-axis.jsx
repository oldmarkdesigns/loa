"use client";;
import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useHeatmap } from "./heatmap-context";
import { getHeatmapColumnMonthAnchor } from "./heatmap-utils";

const monthFmt = new Intl.DateTimeFormat("sv-SE", { month: "short" });

export const HeatmapXAxis = memo(function HeatmapXAxis({
  className,
  // One label per column, for a heatmap whose columns are not weeks of a calendar; the month names of the calendar by default.
  columnLabels
}) {
  const { containerRef, data, margin, xScale } = useHeatmap();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const labels = useMemo(() => {
    if (columnLabels) {
      return columnLabels.map((label, columnIndex) => ({ label, x: margin.left + xScale(columnIndex), key: `column-${columnIndex}` }));
    }
    const ticks = [];
    let lastMonthKey = "";

    for (let columnIndex = 0; columnIndex < data.length; columnIndex++) {
      const column = data[columnIndex];
      if (!column) {
        continue;
      }

      const monthAnchor = getHeatmapColumnMonthAnchor(column);
      if (!monthAnchor) {
        continue;
      }

      const monthKey = `${monthAnchor.getFullYear()}-${monthAnchor.getMonth()}`;
      if (monthKey === lastMonthKey) {
        continue;
      }

      ticks.push({
        label: monthFmt.format(monthAnchor),
        x: margin.left + xScale(columnIndex),
        key: monthKey,
      });
      lastMonthKey = monthKey;
    }

    return ticks;
  }, [columnLabels, data, margin.left, xScale]);

  const container = containerRef.current;
  if (!(mounted && container)) {
    return null;
  }

  return createPortal(labels.map((tick) => (
    <div
      className="pointer-events-none absolute"
      key={tick.key}
      style={{
        top: 0,
        left: tick.x,
        width: 0,
        display: "flex",
        justifyContent: "flex-start",
      }}>
      <span className={cn("whitespace-nowrap text-chart-label text-xs", className)}>
        {tick.label}
      </span>
    </div>
  )), container);
});

HeatmapXAxis.displayName = "HeatmapXAxis";

export default HeatmapXAxis;
