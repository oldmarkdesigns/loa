import { useEffect, useMemo, useRef, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, RotateCcw } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { TooltipProvider } from "@/components/ui/tooltip";
import { defaultLayout, layoutsEqual, moveItem, setItemSize, setItemVisible, visibleItems, widgetById } from "../../../lib/dashboardLayout";
import { LayoutPreview, SizeControl } from "./CustomizerParts";
import { WIDGET_VIEWS } from "./registry";

/**
 * "Anpassa översikten": which widgets the broker's overview shows, in which order and how wide each is. A list of every
 * widget, each row with a handle to drag it by, a size control and a switch, and beside it a miniature of the result. It
 * works on a copy: nothing changes on the overview until "Spara", and closing the overlay drops the copy.
 *
 * Dragging is dnd-kit, so it works with the keyboard and a screen reader as well: focus a handle, press space to lift the
 * widget, the arrow keys to move it, space to put it down and escape to let go.
 */

const instructions =
  "Tryck på mellanslag för att lyfta en widget. Flytta den med piltangenterna uppåt och nedåt och släpp den med mellanslag. Escape avbryter.";

function WidgetRow({ item, position, onVisible, onSize, onPoint }) {
  const widget = widgetById(item.id);
  const { icon: Icon } = WIDGET_VIEWS[item.id];
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-widget-row={item.id}
      data-hidden={!item.visible}
      data-dragging={isDragging || undefined}
      onPointerEnter={() => onPoint(item.id)}
      onPointerLeave={() => onPoint(null)}
      className={cn(
        "group/row relative flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border bg-surface px-3 py-2.5 sm:flex-nowrap",
        item.visible ? "border-veil/10" : "border-veil/10 bg-canvas",
        isDragging && "z-20 border-strong"
      )}
    >
      <Button
        ref={setActivatorNodeRef}
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Flytta ${widget.title}`}
        className="min-h-0 shrink-0 cursor-grab touch-none text-ink-400 hover:text-ink-700 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </Button>

      <span aria-hidden="true" className="w-4 shrink-0 text-center text-xs font-semibold tabular-nums text-ink-400 group-data-[hidden=true]/row:opacity-50">
        {position ?? "–"}
      </span>

      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-tint text-ink-700 group-data-[hidden=true]/row:opacity-50"
      >
        <Icon className="size-[18px]" />
      </span>

      <span className="min-w-0 flex-1 basis-40 group-data-[hidden=true]/row:opacity-50">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold text-strong">{widget.title}</span>
          <Badge variant="outline" className="hidden h-5 rounded-full px-2 text-[10px] font-medium text-ink-500 sm:inline-flex">
            {widget.group}
          </Badge>
        </span>
        <span className="mt-0.5 block truncate text-xs text-ink-500">{widget.description}</span>
      </span>

      <span className="ml-auto flex shrink-0 items-center gap-3">
        <SizeControl title={widget.title} size={item.size} disabled={!item.visible} onChange={(size) => onSize(item.id, size)} />
        <Switch checked={item.visible} onCheckedChange={(checked) => onVisible(item.id, checked)} aria-label={`Visa ${widget.title} på översikten`} />
      </span>
    </li>
  );
}

function CustomizerBody({ layout, onSave, onCancel, onDirtyChange, onDraggingChange }) {
  const [items, setItems] = useState(layout.items);
  const [dragId, setDragId] = useState(null);
  const [pointId, setPointId] = useState(null);
  // The spoken announcements of a drag need a place inside the overlay: the rest of the page is inert while it is open.
  const [liveHost, setLiveHost] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    // Instant, not smooth, when a key moves a widget past the edge of the list: no animation to wait for.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates, scrollBehavior: "auto" })
  );
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const positions = useMemo(() => new Map(visibleItems({ items }).map((item, index) => [item.id, index + 1])), [items]);
  const shownCount = positions.size;
  const changed = !layoutsEqual({ items }, layout);
  const isDefault = layoutsEqual({ items }, defaultLayout());
  useEffect(() => onDirtyChange(changed), [changed, onDirtyChange]);

  const title = (id) => widgetById(id)?.title ?? "widgeten";
  const place = (id) => `position ${ids.indexOf(id) + 1} av ${ids.length}`;
  const accessibility = {
    container: liveHost ?? undefined,
    screenReaderInstructions: { draggable: instructions },
    announcements: {
      onDragStart: ({ active }) => `Du lyfte ${title(active.id)}, ${place(active.id)}.`,
      onDragOver: ({ active, over }) => (over ? `${title(active.id)} flyttades till ${place(over.id)}.` : undefined),
      onDragEnd: ({ active, over }) => (over ? `${title(active.id)} placerades på ${place(over.id)}.` : `${title(active.id)} släpptes där den var.`),
      onDragCancel: ({ active }) => `Flytten avbröts. ${title(active.id)} är kvar på ${place(active.id)}.`
    }
  };

  return (
    <TooltipProvider delay={300}>
      <DialogHeader className="gap-1.5 border-b border-veil/10 px-6 pb-4 pr-14 pt-6">
        <DialogTitle className="text-lg font-semibold leading-tight text-strong">Anpassa översikten</DialogTitle>
        <DialogDescription>
          Välj vilka widgets som visas, dra dem i den ordning du vill ha dem och bestäm hur stor plats var och en får. Det du väljer gäller först när du sparar.
        </DialogDescription>
      </DialogHeader>

      <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex min-h-0 flex-col">
          <div className="flex items-center justify-between gap-3 px-6 pb-2 pt-4 text-xs text-ink-500">
            <span aria-live="polite">
              <span className="font-semibold text-ink-800">{shownCount}</span> av {items.length} widgets visas
            </span>
            <span className="hidden sm:inline">Dra i handtaget eller använd tangentbordet</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              accessibility={accessibility}
              onDragStart={({ active }) => {
                setDragId(active.id);
                onDraggingChange(true);
              }}
              onDragEnd={({ active, over }) => {
                setDragId(null);
                onDraggingChange(false);
                if (over && active.id !== over.id) setItems((current) => moveItem(current, active.id, over.id));
              }}
              onDragCancel={() => {
                setDragId(null);
                onDraggingChange(false);
              }}
            >
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <ul aria-label="Widgets på översikten" className="flex flex-col gap-2">
                  {items.map((item) => (
                    <WidgetRow
                      key={item.id}
                      item={item}
                      position={positions.get(item.id)}
                      onVisible={(id, visible) => setItems((current) => setItemVisible(current, id, visible))}
                      onSize={(id, size) => setItems((current) => setItemSize(current, id, size))}
                      onPoint={setPointId}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <aside className="hidden min-h-0 flex-col border-l border-veil/10 bg-canvas md:flex">
          <LayoutPreview items={items} markedId={dragId ?? pointId} />
        </aside>
      </div>
      <div ref={setLiveHost} />

      <DialogFooter className="items-center border-t border-veil/10 bg-surface px-6 py-4 sm:justify-between">
        <Button type="button" variant="ghost" disabled={isDefault} onClick={() => setItems(defaultLayout().items)} className="min-h-0 gap-2 self-start text-ink-700 sm:self-auto">
          <RotateCcw aria-hidden="true" className="size-4" />
          Återställ standard
        </Button>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} className="min-h-0">
            Avbryt
          </Button>
          <Button type="button" onClick={() => onSave({ ...layout, items })} className="min-h-0" disabled={!changed} data-changed={changed || undefined}>
            Spara
          </Button>
        </div>
      </DialogFooter>
    </TooltipProvider>
  );
}

export default function DashboardCustomizer({ open, onOpenChange, layout, onSave }) {
  // With changes that are not saved, a click beside the overlay does not close it (it would throw them away); "Avbryt", the
  // cross and escape still do.
  const [dirty, setDirty] = useState(false);
  // Every time the overlay is opened it starts from the layout the overview has, not from what was left in it (it can still
  // be on screen, fading out, when it is opened again).
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSession((count) => count + 1);
  }
  // While a widget is lifted, escape lets go of it and does not also close the overlay. The end of the drag is noted a moment
  // late so that it makes no difference which of the two hears the key first.
  const dragging = useRef(false);
  const setDragging = (active) => {
    if (active) dragging.current = true;
    else window.setTimeout(() => (dragging.current = false), 0);
  };
  return (
    <Dialog
      open={open}
      disablePointerDismissal={dirty}
      onOpenChange={(next, details) => {
        if (!next && dragging.current && details?.reason === "escape-key") {
          details.allowPropagation();
          details.cancel();
          return;
        }
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="flex max-h-[min(44rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
        // A dialog does not let arrow keys travel on to the document (Base UI stops them, for the sake of menus and lists inside
        // it). dnd-kit listens on the document for the arrows that move a lifted widget, so on a handle they are let through.
        onKeyDown={(event) => {
          if (event.target instanceof Element && event.target.getAttribute("aria-roledescription") === "sortable") event.preventBaseUIHandler?.();
        }}
      >
        <CustomizerBody
          key={session}
          layout={layout}
          onDirtyChange={setDirty}
          onDraggingChange={setDragging}
          onCancel={() => onOpenChange(false)}
          onSave={(next) => {
            onSave(next);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
