"use client";;
import { memo } from "react";
import { TooltipBox } from "../tooltip/tooltip-box";
import { useHeatmap, useHeatmapInteraction } from "./heatmap-context";
import {
  formatHeatmapContributionLabel,
  formatHeatmapTooltipDate,
  formatHeatmapTooltipWeekday,
} from "./heatmap-utils";
import { useDelayedTooltipData } from "./use-delayed-tooltip-data";

export const HeatmapTooltip = memo(function HeatmapTooltip({
  formatLabel = formatHeatmapContributionLabel,
  // The two lines over the figure, from the hovered bin: its date and the weekday of it by default. A heatmap whose bins are not
  // days of a calendar (rows and columns of its own) names them with these.
  formatTitle = (bin) => formatHeatmapTooltipDate(bin.date),
  formatSubtitle = (bin) => formatHeatmapTooltipWeekday(bin.date),
  className = "",
  panelStyle,
  backgroundColor,
  showDelay = 0,
  hideDelay = 120,
  instant = false
}) {
  const { containerRef, width, height } = useHeatmap();
  const { tooltipData } = useHeatmapInteraction();
  const displayData = useDelayedTooltipData(tooltipData, showDelay, hideDelay);

  if (!displayData) {
    return null;
  }

  const { count, date, bin } = displayData;
  const hovered = bin ?? { count, date };

  return (
    <TooltipBox
      animate={false}
      backgroundColor={backgroundColor}
      className={className}
      containerHeight={height}
      containerRef={containerRef}
      containerWidth={width}
      entrance={!instant}
      panelStyle={panelStyle}
      visible
      x={displayData.x}
      y={displayData.y}>
      <div className="overflow-hidden">
        <div className="px-3 py-2.5 text-left">
          <div className="font-medium text-chart-tooltip-foreground text-xs">
            {formatTitle(hovered)}
          </div>
          <div className="mt-0.5 text-chart-tooltip-muted text-xs">
            {formatSubtitle(hovered)}
          </div>
          <div className="my-2 border-chart-tooltip-muted/30 border-t" />
          <div className="text-chart-tooltip-foreground text-sm">
            {formatLabel(count, date, hovered)}
          </div>
        </div>
      </div>
    </TooltipBox>
  );
});

HeatmapTooltip.displayName = "HeatmapTooltip";

export default HeatmapTooltip;
