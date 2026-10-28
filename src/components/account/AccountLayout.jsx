import { useMemo, useRef, useState } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import { cn } from "cn";
import { groupAccountPages } from "../../lib/accountPages";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/**
 * The window of the account pages (profile, company profile, settings, help): a header with where you are and the way out, a side
 * panel of every page in groups (with a search over them), and the page itself to the right. It is sized like a settings window, not a
 * screen: about 60rem wide and 41rem high, and less on a small screen, where the side panel becomes a row of pages above the page.
 * `pages` are the pages this person has, `active` the key of the open one; `children` is the page.
 */

const plain = (text) => String(text ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

function matches(page, query) {
  const needle = plain(query).trim();
  if (!needle) return true;
  return [page.label, page.title, page.group, page.keywords, page.description].some((field) => plain(field).includes(needle));
}

function PageButton({ page, active, onSelect }) {
  const { Icon } = page;
  return (
    <Button
      type="button"
      variant="ghost"
      aria-current={active ? "page" : undefined}
      className={cn(
        "h-9 min-h-0 w-full justify-start gap-2.5 !rounded-md px-3 text-sm font-medium focus-visible:ring-veil/20",
        active ? "bg-tint-2 text-strong hover:bg-tint-2 hover:text-strong" : "text-ink-700 hover:bg-veil/5 hover:text-strong"
      )}
      onClick={() => onSelect(page.key)}
    >
      <Icon aria-hidden="true" className={cn("size-[17px] shrink-0", active ? "text-strong" : "text-ink-500")} />
      <span className="min-w-0 flex-1 truncate text-left">{page.label}</span>
    </Button>
  );
}

export function AccountOverlay({ pages, active, onSelect, onClose, children }) {
  const [query, setQuery] = useState("");
  const contentRef = useRef(null);
  const current = pages.find((page) => page.key === active) ?? pages[0];
  const found = useMemo(() => pages.filter((page) => matches(page, query)), [pages, query]);
  const groups = useMemo(() => groupAccountPages(found), [found]);

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent
        showCloseButton={false}
        initialFocus={contentRef}
        className="flex h-[min(41rem,calc(100dvh-3rem))] w-[min(60rem,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-none"
      >
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-veil/10 pl-6 pr-3">
          <DialogTitle className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-strong">
            <span>{current.group}</span>
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ink-500" />
            <span className="truncate font-medium text-ink-500">{current.label}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">Konto och inställningar. Välj en sida i listan.</DialogDescription>
          <DialogClose
            render={<Button type="button" variant="ghost" size="icon" aria-label="Stäng" className="size-9 min-h-0 shrink-0 !rounded-md text-ink-600 hover:bg-veil/5 hover:text-strong" />}
          >
            <X aria-hidden="true" className="size-[18px]" />
          </DialogClose>
        </header>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <nav aria-label="Konto och inställningar" className="hidden w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r border-veil/10 p-3 md:flex">
            <label className="relative mb-2 block">
              <span className="sr-only">Sök i inställningar</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Sök i inställningar"
                className="h-9 min-h-0 rounded-md border-veil/10 bg-control pl-9 text-sm shadow-none"
              />
            </label>
            {groups.length === 0 ? <p className="px-3 py-2 text-sm text-ink-500">Inga träffar.</p> : null}
            {groups.map((group) => (
              <div key={group.label} role="group" aria-label={group.label} className="pb-1.5">
                <p aria-hidden="true" className="px-3 pb-1.5 pt-3 text-[12.5px] font-medium text-ink-500">{group.label}</p>
                <div className="space-y-0.5">
                  {group.pages.map((page) => (
                    <PageButton key={page.key} page={page} active={page.key === current.key} onSelect={onSelect} />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <nav aria-label="Sidor" className="flex shrink-0 gap-1 overflow-x-auto border-b border-veil/10 p-2 md:hidden">
            {pages.map((page) => (
              <Button
                key={page.key}
                type="button"
                variant="ghost"
                aria-current={page.key === current.key ? "page" : undefined}
                className={cn(
                  "h-8 min-h-0 shrink-0 !rounded-md px-3 text-sm font-medium",
                  page.key === current.key ? "bg-tint-2 text-strong hover:bg-tint-2" : "text-ink-600 hover:bg-veil/5"
                )}
                onClick={() => onSelect(page.key)}
              >
                {page.label}
              </Button>
            ))}
          </nav>

          <div ref={contentRef} tabIndex={-1} className="min-h-0 min-w-0 flex-1 overflow-y-auto outline-none">
            <div className="mx-auto max-w-[48rem] px-6 pb-10 pt-6 md:px-8 md:pt-8">{children}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** A page: its title and what it is for, then its sections. */
export function AccountPage({ title, description, children }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-strong">{title}</h2>
      {description ? <p className="mt-1.5 text-sm text-ink-500">{description}</p> : null}
      <div className="mt-7 space-y-9">{children}</div>
    </div>
  );
}

/** A group of rows under a heading and a rule, with room for an action (a button) at the end of the heading. */
export function AccountSection({ title, description, action, children, className }) {
  return (
    <section className={className}>
      <div className="flex items-end justify-between gap-4 border-b border-veil/10 pb-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-strong">{title}</h3>
          {description ? <p className="mt-0.5 text-sm text-ink-500">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}

/**
 * One line of a section: what it is (and a line of help under it) to the left, its value or its control to the right, and a rule
 * under it. `field` gives the right side the width of a field, for inputs and selects.
 */
export function AccountRow({ label, description, htmlFor, field = false, align = "center", children, className }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-veil/10 py-4 last:border-b-0 sm:flex-row sm:justify-between sm:gap-6",
        align === "start" ? "sm:items-start" : "sm:items-center",
        className
      )}
    >
      <div className="min-w-0 sm:flex-1">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-strong">{label}</label>
        {description ? <p className="mt-0.5 text-[13px] leading-5 text-ink-500">{description}</p> : null}
      </div>
      <div className={cn("min-w-0 text-sm text-ink-700 sm:text-right", field && "sm:w-72", !field && "sm:max-w-[60%]")}>{children}</div>
    </div>
  );
}

/** A quiet note in a page (the small print). */
export function AccountNote({ children, className }) {
  return <p className={cn("text-[13px] leading-5 text-ink-500", className)}>{children}</p>;
}
