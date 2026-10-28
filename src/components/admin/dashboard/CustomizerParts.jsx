import { cn } from "cn";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SIZE_META, WIDGET_SIZES, visibleItems, widgetById } from "../../../lib/dashboardLayout";
import { WIDGET_VIEWS } from "./registry";
import { rangeToggleClass, rangeToggleItemClass } from "./WidgetCard";

/** The smaller parts of the customizer: the size control of a row and the miniature of the whole overview. */

/** A row of twelve columns with the part a size takes filled in: a third, a half, two thirds or all of it. */
function SizeGlyph({ span }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 12" className="h-3 w-5" fill="none">
      <rect x="0.5" y="0.5" width="19" height="11" rx="2.5" stroke="currentColor" opacity="0.4" />
      <rect x="2" y="2" width={(16 * span) / 12} height="8" rx="1.5" fill="currentColor" />
    </svg>
  );
}

/** How wide a widget is: the four sizes as a segmented control, each with its name in a tooltip and for a screen reader. */
export function SizeControl({ title, size, disabled, onChange }) {
  return (
    <ToggleGroup
      aria-label={`Storlek för ${title}`}
      value={[size]}
      disabled={disabled}
      onValueChange={(value) => value[0] && onChange(value[0])}
      className={cn(rangeToggleClass, "shrink-0", disabled && "opacity-50")}
    >
      {WIDGET_SIZES.map((option) => {
        const meta = SIZE_META[option];
        return (
          <Tooltip key={option}>
            <TooltipTrigger
              render={
                <ToggleGroupItem
                  value={option}
                  aria-label={`${meta.label}, ${meta.hint}`}
                  className={cn(rangeToggleItemClass, "w-9 min-h-0 px-0")}
                />
              }
            >
              <SizeGlyph span={meta.span} />
            </TooltipTrigger>
            <TooltipContent>
              {meta.label} · {meta.fraction}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </ToggleGroup>
  );
}

/**
 * The whole overview in miniature, drawn on the same 12 columns as the real one at its widest, with each widget as a block
 * that carries its number. It follows the list as it is changed, and the block of the row being dragged or pointed at is
 * marked. The heights are only for show; on the real overview a row is as tall as its tallest widget.
 */
export function LayoutPreview({ items, markedId }) {
  const shown = visibleItems({ items });
  return (
    <section aria-label="Förhandsvisning av översikten" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-5">
      <div>
        <h3 className="text-sm font-semibold text-strong">Förhandsvisning</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-500">Så placeras widgetarna på en bred skärm. Siffran är ordningen.</p>
      </div>
      {shown.length ? (
        <ol className="grid grid-cols-12 gap-1.5 rounded-xl border border-veil/10 bg-surface p-2">
          {shown.map((item, index) => {
            const widget = widgetById(item.id);
            const { icon: Icon } = WIDGET_VIEWS[item.id];
            const marked = markedId === item.id;
            return (
              <li
                key={item.id}
                data-preview={item.id}
                data-size={item.size}
                data-marked={marked || undefined}
                style={{ gridColumn: `span ${SIZE_META[item.size].span}` }}
                className={cn(
                  "flex h-14 min-w-0 flex-col justify-between rounded-md border px-2 py-1.5 transition-colors",
                  marked ? "border-strong bg-tint" : "border-veil/10 bg-canvas"
                )}
              >
                <span className="flex items-center justify-between gap-1 text-ink-500">
                  <span className="text-[10px] font-semibold tabular-nums">{index + 1}</span>
                  <Icon aria-hidden="true" className="h-3 w-3 shrink-0" />
                </span>
                <span className="line-clamp-2 text-[10px] font-medium leading-tight text-ink-800">{widget.title}</span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="rounded-xl border border-dashed border-veil/15 p-5 text-center text-xs leading-relaxed text-ink-500">
          Inga widgets är valda. Slå på minst en i listan.
        </p>
      )}
    </section>
  );
}
