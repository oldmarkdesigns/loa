import { useEffect, useId, useRef, useState } from "react";
import { Chevron } from "./SiteChrome";

// A pill that opens a small panel under it: the filter bar on /lokaler is made
// of these. The pill shows its label, and the chosen value beside it once there
// is one (then it fills in ink). Outside a click or Escape closes it; on phones
// the panel rises from the bottom as a sheet over a dimmed page.
export default function Dropdown({ label, value, active = Boolean(value), align = "start", wide = false, children }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    // Focus moves into the panel: the chosen option, else the first control.
    const first = panelRef.current?.querySelector('[aria-pressed="true"], button, input');
    first?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div className={`lo-dd${open ? " is-open" : ""}`} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`lo-dd-btn${active ? " is-active" : ""}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="lo-dd-label">{label}</span>
        {value ? <span className="lo-dd-value">{value}</span> : null}
        <Chevron />
      </button>
      {open ? (
        <>
          <span className="lo-dd-scrim" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            id={id}
            className={`lo-dd-panel${align === "end" ? " is-end" : ""}${wide ? " is-wide" : ""}`}
            role="group"
            aria-label={label}
            data-lenis-prevent
          >
            <p className="lo-dd-title">{label}</p>
            {typeof children === "function" ? children(close) : children}
          </div>
        </>
      ) : null}
    </div>
  );
}

// One choice in a panel: its name, a count of the lokaler it would show, and a
// check when it is the one chosen.
export function Option({ selected = false, count, onClick, children }) {
  return (
    <button type="button" className="lo-dd-option" aria-pressed={selected} onClick={onClick}>
      <span className="lo-dd-check" aria-hidden="true" />
      <span className="lo-dd-option-name">{children}</span>
      {count !== undefined ? <span className="lo-dd-count">{count}</span> : null}
    </button>
  );
}
