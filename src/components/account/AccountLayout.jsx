import WorkspaceHeader from "../layout/WorkspaceHeader";
import "../layout/workspace.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "cn";
import { groupAccountPages } from "../../lib/accountPages";

/** Full-page account navigation. Form components and route callbacks stay shared with the workspace. */
const plain = (text) => String(text ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

function matches(page, query) {
  const needle = plain(query).trim();
  if (!needle) return true;
  return [page.label, page.title, page.group, page.keywords, page.description].some((field) => plain(field).includes(needle));
}

export function AccountOverlay({ pages, active, onSelect, onClose, user, onLogout, children }) {
  const [query, setQuery] = useState("");
  const current = pages.find(page => page.key === active) ?? pages[0];
  const found = useMemo(() => pages.filter(page => matches(page, query)), [pages, query]);
  const groups = useMemo(() => groupAccountPages(found), [found]);
  const contentRef = useRef(null);
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
    contentRef.current?.focus({ preventScroll: true });
  }, [active]);
  return <section className="loa-account admin-workspace">
    <WorkspaceHeader user={user} pathname={window.location.pathname} onLogout={onLogout} onBack={onClose} />
    <div className="loa-account-layout">
      <aside className="loa-account-sidebar">
        <h1>Ditt konto</h1>
        <label className="loa-account-search"><Search size={16} aria-hidden="true" /><span className="sr-only">Sök i kontot</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Sök i kontot" /></label>
        <nav aria-label="Konto och inställningar">
          {groups.length === 0 && <p role="status">Inga träffar.</p>}
          {groups.map(group => <div className="loa-account-group" key={group.label}>
            <p>{group.label}</p>
            {group.pages.map(page => <button key={page.key} type="button" aria-current={page.key === current.key ? "page" : undefined} onClick={() => onSelect(page.key)}>{page.key === "adminprofil" ? "Företagsprofil" : page.label}</button>)}
          </div>)}
        </nav>
      </aside>
      <div className="loa-account-body" ref={contentRef} tabIndex={-1}>
        <div className="loa-account-content">{children}</div>
      </div>
    </div>
  </section>;
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
