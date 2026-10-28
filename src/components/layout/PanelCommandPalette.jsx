import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "cn";
import { shortcutLabel } from "../../lib/shortcuts";
import { SearchIcon } from "../icons/UiIcons";
import { PanelHint } from "./PanelHint";
import { menuIcon, menuRow, menuRowIconOnly, menuRowInset } from "./menuScale";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";

/**
 * The search of the side menu. The field at the top of the menu is only a button; it (and ⌘K, Ctrl K elsewhere) opens the
 * palette: one field and a list of what can be reached, grouped, that narrows while typing. The arrow keys move through it,
 * Enter does what the row says, Escape closes it. Focus stays in the field the whole time (the rows are announced with
 * aria-activedescendant), the way a combobox works.
 *
 * `items` is a list of `{ id, group, label, keywords?, Icon, hint?, onSelect }`; the groups come in the order they first appear.
 */

const plain = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** The items that answer a query: each word of it is somewhere in the label or the keywords, without regard to case or accents. */
export function filterPaletteItems(items, query) {
  const words = plain(query).split(/\s+/).filter(Boolean);
  if (!words.length) return items;
  return items.filter((item) => {
    const text = plain(`${item.label} ${item.keywords || ""}`);
    return words.every((word) => text.includes(word));
  });
}

function groupItems(items) {
  const groups = [];
  for (const item of items) {
    let group = groups.find((entry) => entry.name === item.group);
    if (!group) {
      group = { name: item.group, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

/** The field of the side menu that opens the palette: a quiet bar with the shortcut, or only the icon in the folded rail. */
export function PanelSearchButton({ collapsed = false, onOpen }) {
  if (collapsed) {
    return (
      <PanelHint
        label="Sök"
        shortcut={shortcutLabel("K")}
        side="right"
        render={
          <Button
            type="button"
            variant="ghost"
            aria-label="Sök"
            aria-keyshortcuts="Control+K Meta+K"
            className={cn(menuRow, menuRowIconOnly, "text-ink-600 hover:bg-veil/5 hover:text-strong")}
            onClick={onOpen}
          />
        }
      >
        <SearchIcon aria-hidden="true" className={menuIcon} />
      </PanelHint>
    );
  }
  return (
    <Button
      type="button"
      variant="ghost"
      aria-label="Sök"
      aria-keyshortcuts="Control+K Meta+K"
      className={cn(menuRow, menuRowInset, "bg-veil/5 font-normal text-ink-500 hover:bg-veil/10 hover:text-ink-700")}
      onClick={onOpen}
    >
      <SearchIcon aria-hidden="true" className={menuIcon} />
      <span className="min-w-0 flex-1 truncate text-left">Sök</span>
      <Kbd className="bg-transparent px-0 text-xs [@media(hover:none)]:hidden">{shortcutLabel("K")}</Kbd>
    </Button>
  );
}

export function PanelCommandPalette({ open, onOpenChange, items }) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(null);
  const inputRef = useRef(null);
  const listId = useId();
  const optionId = (item) => `${listId}-${item.id}`;

  const results = useMemo(() => filterPaletteItems(items, query), [items, query]);
  const groups = useMemo(() => groupItems(results), [results]);
  // The first result is the one to act on until the arrow keys move it (or what it was has been filtered away).
  const active = results.find((item) => item.id === activeId) ?? results[0] ?? null;

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveId(null);
    }
  }, [open]);

  useEffect(() => {
    if (open && active) document.getElementById(optionId(active))?.scrollIntoView?.({ block: "nearest" });
  }, [open, active?.id]);

  function run(item) {
    onOpenChange(false);
    item.onSelect?.();
  }

  function onKeyDown(event) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!results.length) return;
      const index = Math.max(0, results.indexOf(active));
      const next = event.key === "ArrowDown" ? (index + 1) % results.length : (index - 1 + results.length) % results.length;
      setActiveId(results[next].id);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (active) run(active);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        initialFocus={inputRef}
        data-panel-palette="true"
        className="h-[min(32rem,calc(100vh-4rem))] max-w-[calc(100%-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">Sök i arbetsytan</DialogTitle>
        <DialogDescription className="sr-only">Sök bland sidor och åtgärder, välj med piltangenterna och tryck Enter.</DialogDescription>
        <div className="flex items-center gap-3 border-b border-veil/10 px-4">
          <SearchIcon aria-hidden="true" className={cn(menuIcon, "text-ink-500")} />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="Sök i arbetsytan"
            aria-expanded={results.length > 0}
            aria-controls={results.length > 0 ? listId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={active ? optionId(active) : undefined}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Sök sidor och åtgärder…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            className="h-[52px] min-w-0 flex-1 bg-transparent text-[15px] text-strong outline-none placeholder:text-ink-500"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-2.5">
          {results.length === 0 ? (
            <p role="status" className="px-3 py-10 text-center text-sm text-ink-500">
              Inga träffar för ”{query.trim()}”.
            </p>
          ) : (
            <div id={listId} role="listbox" aria-label="Resultat">
              {groups.map((group, index) => (
                <div key={group.name} role="group" aria-label={group.name} className={cn(index > 0 && "mt-1.5 border-t border-veil/10 pt-1")}>
                  <p aria-hidden="true" className="px-3 pb-1 pt-3 text-[12.5px] font-medium text-ink-500">
                    {group.name}
                  </p>
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      id={optionId(item)}
                      role="option"
                      aria-selected={item.id === active?.id}
                      className={cn("flex h-11 cursor-default items-center gap-3 rounded-lg px-3 text-sm text-ink-800", item.id === active?.id && "bg-veil/5 text-strong")}
                      onPointerMove={() => {
                        if (item.id !== active?.id) setActiveId(item.id);
                      }}
                      onClick={() => run(item)}
                    >
                      <item.Icon aria-hidden="true" className={cn(menuIcon, "text-ink-500")} />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.hint ? <span className="shrink-0 text-xs text-ink-500">{item.hint}</span> : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PanelCommandPalette;
