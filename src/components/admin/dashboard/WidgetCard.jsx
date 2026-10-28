import { cn } from "cn";
import { Card } from "@/components/ui/card";
import { Legend, LegendItem, LegendLabel, LegendProgress } from "@/components/charts";
import { useLegendItem } from "@/components/charts/legend";

/** The pieces the widgets of the broker overview are made of, so that they all look and behave alike. */

export const number = (value) => Number(value || 0).toLocaleString("sv-SE");
const percentFormat = new Intl.NumberFormat("sv-SE", { style: "percent", maximumFractionDigits: 1 });
export const percent = (share) => percentFormat.format(share || 0);

// The charts take Bklit's own palette (the --chart-* variables of index.css, a light and a dark value each); a series that needs a
// colour of its own is named by its role here.
export const CHART_PRIMARY = "var(--chart-line-primary)";

/** The small segmented control in the corner of a widget (the period of a chart, what to rank by). */
export const rangeToggleClass = "rounded-lg bg-tint p-1";
export const rangeToggleItemClass = "h-7 rounded-md px-2.5 text-xs data-[pressed]:bg-control data-[pressed]:shadow-sm";

/**
 * The card every chart widget is made in: a title with a line under it, an optional control in the corner, an optional big
 * number, the content, and an optional note along the bottom. It fills the height of its row so that widgets side by side
 * are equally tall.
 */
export function WidgetCard({ title, subtitle, action, headline, headlineNote, footer, className, children, ...props }) {
  return (
    <Card className={cn("h-full gap-0 p-5 sm:p-6", className)} {...props}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-strong">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-ink-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {headline !== undefined ? (
        <div className="mb-2 mt-5 flex flex-wrap items-baseline gap-x-2">
          <span className="text-3xl font-semibold tabular-nums">{headline}</span>
          {headlineNote ? <span className="text-xs text-ink-500">{headlineNote}</span> : null}
        </div>
      ) : (
        <div className="mt-4" />
      )}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {footer ? <p className="mt-4 border-t border-veil/5 pt-3 text-xs text-ink-500">{footer}</p> : null}
    </Card>
  );
}

/**
 * What a widget shows while it has nothing to draw: the data is loading, could not be fetched, or there is none yet. Each
 * keeps the height of the chart so the widget does not jump when the data arrives.
 */
export function WidgetBody({ loading, error, empty, emptyText, minHeight = 200, children }) {
  if (!loading && !error && !empty) return children;
  return (
    <div role="status" style={{ minHeight }} className="grid flex-1 place-items-center px-2 text-center text-sm text-ink-500">
      {loading ? "Laddar statistik…" : error ? "Statistik kunde inte hämtas" : emptyText}
    </div>
  );
}

/** One row of a BarList: the label and the value over a bar (the Bklit legend row, with its progress bar). */
function BarListRow() {
  const { item } = useLegendItem();
  return (
    <LegendItem className="px-0 py-0 hover:bg-transparent data-[hovered]:bg-transparent">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <LegendLabel className="min-w-0 truncate text-sm font-normal text-ink-700" />
        <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-900">{item.display ?? number(item.value)}</span>
      </div>
      <LegendProgress height="h-2" trackClassName="bg-tint-2" />
    </LegendItem>
  );
}

/**
 * A horizontal bar chart as a list: a label, its value and a bar under them, one row per item. It reads well at any width
 * (long labels are cut short). `max` is the value a full bar stands for (the biggest by default). `display` is what is written
 * for a row instead of its plain value.
 */
export function BarList({ rows, max, label, className }) {
  const top = max ?? Math.max(1, ...rows.map((row) => row.value));
  const items = rows.map((row) => ({
    key: row.key,
    label: row.label,
    value: row.value,
    maxValue: top,
    color: row.color || CHART_PRIMARY,
    display: row.display,
    valueText: row.text ?? (typeof row.display === "string" ? row.display : number(row.value))
  }));
  return (
    <div role="group" aria-label={label} className={cn(className)}>
      <Legend items={items} className="gap-3.5">
        <BarListRow />
      </Legend>
    </div>
  );
}
