import { useEffect, useMemo, useRef, useState } from "react";
import { navigateTo, usePathname } from "../lib/router";
import { districtOptions } from "../data/mockData";
import loaLogo from "./assets/loa-logo.png";
import strandvagen from "./assets/strandvagen.jpg";
import {
  SUPPORT_EMAIL,
  SUPPORT_HOURS,
  SUPPORT_PHONE,
  go,
  linkTo,
  listingHref,
  listingImages,
  prefersReducedMotion,
  scrollToTop,
  sek,
  siteListings,
  useReveal,
  useSmoothScroll
} from "./siteUtils";
import "./site.css";

// The parts every public page shares: the bar, the dark invitation band, the
// footer, the page head and sections, and the small pieces they are made of.
// After the studio site: white paper, one typeface, hairlines, a lot of room.

// ─── Small pieces ────────────────────────────────────────────────────────────
export function Arrow({ size = 14, back = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      style={back ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function Chevron({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function Logo({ light = false }) {
  return <img className={`lo-logo-img${light ? " is-light" : ""}`} src={loaLogo} alt="LOA" width="120" height="71" />;
}

// The sign-in and sign-up doors, used by the bar, the bands and the pages.
export function useAuthDoors() {
  
  return {
    login: (returnTo = "/lokaler") => navigateTo(`/login?returnTo=${encodeURIComponent(returnTo)}`),
    signup: (query = "") => navigateTo(`/signup${query}`)
  };
}

// ─── Navigation ──────────────────────────────────────────────────────────────
// Transparent over the top of the page; once scrolled, a nearly opaque bar with
// a hairline fades in behind the same content. "Lokaler" opens a panel that
// drops from the bar as one surface: two image cards and the districts. Below
// 900 px a two-stroke burger opens a full-height panel.
const NAV_LINKS = [
  ["/hyresvardar", "Hyresvärdar"],
  ["#lokalprogram", "Lokalprogram"],
  ["#kalkylator", "Kalkylator"],
  ["#faq", "Frågor"]
];

export function Nav({ user, listings, actions = true }) {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const burgerRef = useRef(null);
  const timer = useRef(0);
  const pathname = usePathname();
  const doors = useAuthDoors();
  const all = siteListings(listings);
  const counts = useMemo(() => {
    const map = Object.fromEntries(districtOptions.map((name) => [name, 0]));
    all.forEach((item) => {
      if (item.district in map) map[item.district] += 1;
    });
    return map;
  }, [all]);
  const cardImages = [all[1]?.image || all[0]?.image, strandvagen];

  useEffect(() => {
    const sentinel = document.getElementById("lo-top-sentinel");
    if (!sentinel) return undefined;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!menu && !mobile) return undefined;
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      if (menu) {
        setMenu(false);
        buttonRef.current?.focus();
      }
      if (mobile) {
        setMobile(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu, mobile]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const onChange = (event) => event.matches && setMobile(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const fine = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hoverIn = () => {
    if (!fine()) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMenu(true), 90);
  };
  const hoverOut = () => {
    if (!fine()) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMenu(false), 220);
  };
  const closeAll = () => {
    window.clearTimeout(timer.current);
    setMenu(false);
    setMobile(false);
  };
  const toTop = (event) => {
    event.preventDefault();
    closeAll();
    if (pathname === "/") scrollToTop();
    else navigateTo("/");
  };

  const cards = [
    { href: "/lokaler", label: "Alla lediga lokaler", note: `${all.length} just nu`, img: cardImages[0] },
    { href: "/lokaler#sok", label: "Sök med AI eller karta", note: "Beskriv behovet", img: cardImages[1] }
  ];
  const districtRows = districtOptions.map((name) => (
    <li key={name}>
      <a className="lo-menu-row" href={`/lokaler?district=${encodeURIComponent(name)}`} onClick={linkTo(`/lokaler?district=${encodeURIComponent(name)}`, closeAll)}>
        <span className="lo-menu-row-name">{name}</span>
        <span className="lo-menu-row-meta">{counts[name]}</span>
      </a>
    </li>
  ));

  const endActions = !actions ? null : (
    <>
      <button type="button" className="lo-nav-login" onClick={() => doors.login()}>
        Logga in
      </button>
      <a className="lo-nav-cta" href="/signup" onClick={linkTo("/signup", closeAll)}>
        Skapa konto
      </a>
    </>
  );

  return (
    <>
      <header className={`lo-nav${scrolled ? " is-scrolled" : ""}${menu || mobile ? " is-open" : ""}${mobile ? " is-mobile-open" : ""}`}>
        <div className="lo-wrap lo-nav-bar">
          <a className="lo-logo" href="/" onClick={toTop} aria-label="LOA, till startsidan">
            <Logo />
          </a>

          <nav className="lo-nav-links" aria-label="Huvudmeny">
            <div
              className="lo-drop"
              ref={menuRef}
              onMouseEnter={hoverIn}
              onMouseLeave={hoverOut}
              onBlur={(event) => {
                if (!menuRef.current?.contains(event.relatedTarget)) setMenu(false);
              }}
            >
              <button
                type="button"
                ref={buttonRef}
                className="lo-drop-btn"
                aria-expanded={menu}
                aria-controls="lo-menu-lokaler"
                onClick={() => setMenu((value) => !value)}
              >
                Lokaler
                <Chevron />
              </button>
              <div className="lo-panel" id="lo-menu-lokaler">
                <div className="lo-wrap lo-panel-inner">
                  <ul className="lo-menu-cards">
                    {cards.map((card) => (
                      <li key={card.href}>
                        <a className="lo-menu-card" href={card.href} onClick={linkTo(card.href, closeAll)}>
                          <img src={card.img} alt="" loading="lazy" decoding="async" />
                          <span className="lo-menu-card-label">
                            {card.label}
                            <span className="lo-menu-card-note">{card.note}</span>
                          </span>
                          <span className="lo-menu-card-arrow" aria-hidden="true">
                            <Arrow size={16} />
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  <div className="lo-menu-side">
                    <p className="lo-label">Områden</p>
                    <ul className="lo-menu-list">{districtRows}</ul>
                  </div>
                </div>
              </div>
            </div>
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href.startsWith("#") ? `/${href}` : href} onClick={linkTo(href, closeAll)} aria-current={pathname === href ? "page" : undefined}>
                {label}
              </a>
            ))}
          </nav>

          <div className="lo-nav-end">
            <span className="lo-nav-end-wide">{endActions}</span>
            <button
              type="button"
              ref={burgerRef}
              className="lo-burger"
              aria-expanded={mobile}
              aria-controls="lo-mobile-menu"
              aria-label={mobile ? "Stäng meny" : "Meny"}
              onClick={() => setMobile((value) => !value)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>

        <div className="lo-mobile" id="lo-mobile-menu" data-lenis-prevent>
          <nav className="lo-wrap lo-mobile-nav" aria-label="Huvudmeny">
            <details className="lo-mobile-group">
              <summary>
                Lokaler
                <Chevron size={16} />
              </summary>
              <ul className="lo-menu-list">
                <li>
                  <a className="lo-menu-row" href="/lokaler" onClick={linkTo("/lokaler", closeAll)}>
                    <span className="lo-menu-row-name">Alla lediga lokaler</span>
                    <span className="lo-menu-row-meta">{all.length}</span>
                  </a>
                </li>
                {districtRows}
              </ul>
            </details>
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href.startsWith("#") ? `/${href}` : href} onClick={linkTo(href, closeAll)}>
                {label}
              </a>
            ))}
            <div className="lo-mobile-actions">
              {!actions ? null : (
                <>
                  <a className="lo-btn" href="/signup" onClick={linkTo("/signup", closeAll)}>
                    Skapa konto
                  </a>
                  <button type="button" className="lo-btn lo-btn--ghost" onClick={() => doors.login()}>
                    Logga in
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
      <div className={`lo-scrim${menu || mobile ? " is-open" : ""}`} onClick={closeAll} aria-hidden="true" />
    </>
  );
}

// ─── Demo request: a quiet sheet over the page ───────────────────────────────
export function DemoDialog({ open, onClose }) {
  const ref = useRef(null);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", message: "" });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) setSent(false);
  }, [open]);

  const set = (key) => (event) => setForm((previous) => ({ ...previous, [key]: event.target.value }));

  return (
    <dialog
      ref={ref}
      className="lo-dialog"
      aria-labelledby="lo-demo-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      data-lenis-prevent
    >
      <div className="lo-dialog-inner">
        <div className="lo-dialog-head">
          <div>
            <p className="lo-label">Boka en demo</p>
            <h2 id="lo-demo-title" className="lo-dialog-title">
              {sent ? "Tack, vi hör av oss." : "Berätta hur vi når dig."}
            </h2>
          </div>
          <button type="button" className="lo-icon-btn" onClick={onClose} aria-label="Stäng">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {sent ? (
          <div className="lo-dialog-body">
            <p className="lo-muted">Vi återkommer med en tid för en kort genomgång av hur LOA kan användas för era objekt.</p>
            <button type="button" className="lo-btn" onClick={onClose}>
              Stäng
            </button>
          </div>
        ) : (
          <form
            className="lo-dialog-body lo-form"
            onSubmit={(event) => {
              event.preventDefault();
              setSent(true);
            }}
          >
            <div className="lo-form-row">
              <Field label="Namn">
                <input required value={form.name} onChange={set("name")} placeholder="För- och efternamn" autoComplete="name" />
              </Field>
              <Field label="Företag">
                <input value={form.company} onChange={set("company")} placeholder="Bolagsnamn" autoComplete="organization" />
              </Field>
            </div>
            <div className="lo-form-row">
              <Field label="E-post">
                <input required type="email" value={form.email} onChange={set("email")} placeholder="namn@foretag.se" autoComplete="email" />
              </Field>
              <Field label="Telefon">
                <input type="tel" value={form.phone} onChange={set("phone")} placeholder="070 000 00 00" autoComplete="tel" />
              </Field>
            </div>
            <Field label="Vad vill ni se?">
              <textarea rows={3} value={form.message} onChange={set("message")} placeholder="Till exempel publicering, matchning eller lokalprogram." />
            </Field>
            <div className="lo-actions">
              <button type="submit" className="lo-btn">
                Skicka förfrågan
                <Arrow />
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}

// ─── Fields ──────────────────────────────────────────────────────────────────
// A caption over the control, a hairline under it. `hint` and `error` sit below.
export function Field({ label, hint, error, children, className = "" }) {
  return (
    <label className={`lo-field${error ? " is-error" : ""} ${className}`}>
      <span className="lo-field-label">{label}</span>
      {children}
      {error ? <span className="lo-field-error">{error}</span> : hint ? <span className="lo-field-hint">{hint}</span> : null}
    </label>
  );
}

// ─── The dark band before the footer ─────────────────────────────────────────
export function Band({ label = "Kontakt", title, body, children }) {
  return (
    <section className="lo-band" id="kontakt">
      <div className="lo-wrap">
        <p className="lo-label">{label}</p>
        <h2 className="lo-band-title">{title}</h2>
        {body ? <p className="lo-band-body">{body}</p> : null}
        <div className="lo-band-actions">{children}</div>
      </div>
    </section>
  );
}

// The band most pages end with: the demo, and the way to write.
export function DemoBand({ title = "Vill du se hur LOA fungerar?", body = "Tjugo minuter, så visar vi hur ni publicerar objekt, får bättre förfrågningar och följer upp intresse." }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Band title={title} body={body}>
        <button type="button" className="lo-btn lo-btn--light" onClick={() => setOpen(true)}>
          Boka en demo
          <Arrow />
        </button>
        <a className="lo-link" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>
      </Band>
      <DemoDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
export function Footer({ slim = false }) {
  const doors = useAuthDoors();
  const toTop = (event) => {
    event.preventDefault();
    scrollToTop();
  };
  const year = new Date().getFullYear();

  const groups = [
    {
      head: "Lokaler",
      links: [["/lokaler", "Alla lediga lokaler"], ...districtOptions.slice(0, 4).map((name) => [`/lokaler?district=${encodeURIComponent(name)}`, name])]
    },
    {
      head: "Plattformen",
      links: [
        ["#sa-fungerar-det", "Så fungerar det"],
        ["#lokalprogram", "Lokalprogram"],
        ["#kalkylator", "Kalkylator"],
        ["/hyresvardar", "För hyresvärdar"],
        ["#faq", "Frågor"]
      ]
    }
  ];

  return (
    <footer className={`lo-footer${slim ? " is-slim" : ""}`}>
      <div className="lo-wrap">
        {slim ? null : (
          <div className="lo-footer-grid">
            <div className="lo-footer-mark">
              <a href="/" onClick={linkTo("/")} aria-label="LOA, till startsidan">
                <Logo light />
              </a>
              <p>Lediga lokaler i Stockholm, från första sökning till signerat avtal.</p>
            </div>
            {groups.map((group) => (
              <nav key={group.head} aria-label={group.head}>
                <p className="lo-footer-head">{group.head}</p>
                <ul>
                  {group.links.map(([href, label]) => (
                    <li key={href}>
                      <a href={href.startsWith("#") ? `/${href}` : href} onClick={linkTo(href)}>
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
            <nav aria-label="Konto">
              <p className="lo-footer-head">Konto</p>
              <ul>
                <li>
                  <a href="/signup" onClick={linkTo("/signup")}>
                    Skapa konto
                  </a>
                </li>
                <li>
                  <button type="button" onClick={() => doors.login()}>
                    Logga in
                  </button>
                </li>
                <li>
                  <a href="/forgot-password" onClick={linkTo("/forgot-password")}>
                    Glömt lösenord
                  </a>
                </li>
              </ul>
            </nav>
            <div>
              <p className="lo-footer-head">Kundservice</p>
              <ul>
                <li>
                  <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                </li>
                <li>{SUPPORT_PHONE}</li>
                <li>{SUPPORT_HOURS}</li>
              </ul>
            </div>
          </div>
        )}
        <div className="lo-footer-base">
          <span>© {year} LOA</span>
          <span className="lo-footer-legal">
            <span>Integritet</span>
            <span>Villkor</span>
            <span>Cookies</span>
          </span>
          <a href="#top" onClick={toTop}>
            Till toppen ↑
          </a>
        </div>
      </div>
    </footer>
  );
}

// ─── The frame of every public page ──────────────────────────────────────────
// `band` is the page's dark invitation before the footer (a node), `slim` keeps
// the footer to its base line (the account pages).
export function SiteFrame({ user, listings, band, slim = false, navActions = true, pageKey, children }) {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = "sv";
  }, []);

  // A new page starts at its top, unless it opens at a section.
  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, pageKey]);

  useSmoothScroll();
  useReveal(`${pathname}|${pageKey ?? ""}`);

  return (
    <div className={`lo${slim ? " lo--slim" : ""}`} data-no-reveal>
      <div id="lo-top-sentinel" className="lo-sentinel" aria-hidden="true" />
      <Nav user={user} listings={listings} actions={navActions} />
      <main id="top">{children}</main>
      {band}
      <Footer slim={slim} />
    </div>
  );
}

// ─── Page head ───────────────────────────────────────────────────────────────
export function BackLink({ href = "/", children }) {
  return (
    <a className="lo-back" href={href} onClick={linkTo(href)}>
      <Arrow back />
      {children}
    </a>
  );
}

export function PageHead({ back, backHref, label, title, lede, media, children }) {
  const text = (
    <>
      {label ? <p className="lo-label">{label}</p> : null}
      <h1 className="lo-page-title">{title}</h1>
      {lede ? <p className="lo-page-lede">{lede}</p> : null}
      {children}
    </>
  );
  if (!media) {
    return (
      <header className="lo-wrap lo-page-head">
        {back ? <BackLink href={backHref}>{back}</BackLink> : null}
        {text}
      </header>
    );
  }
  return (
    <header className="lo-wrap lo-page-head lo-page-head--media">
      {back ? <BackLink href={backHref}>{back}</BackLink> : null}
      <div className="lo-page-head-row">
        <div className="lo-page-head-text">{text}</div>
        <figure className="lo-page-head-media">
          <img src={media.src} alt={media.alt} />
        </figure>
      </div>
    </header>
  );
}

// ─── A wide photograph under the head ───────────────────────────────────────
export function PageMedia({ src, alt, position }) {
  return (
    <div className="lo-wrap lo-page-media">
      <figure>
        <img src={src} alt={alt} style={position ? { objectPosition: position } : undefined} />
      </figure>
    </div>
  );
}

// ─── An account page: the words on the left, the form on the right ──────────
// `steps` ({ count, current }) draws the short progress marks under the title.
export function AccountLayout({ label, title, lede, steps, aside, children }) {
  return (
    <div className="lo-wrap lo-account">
      <div className="lo-account-side">
        {label ? <p className="lo-label">{label}</p> : null}
        <h1 className="lo-page-title">{title}</h1>
        {lede ? <p className="lo-page-lede">{lede}</p> : null}
        {steps ? (
          <div className="lo-account-steps" aria-label={`Steg ${steps.current} av ${steps.count}`} role="img">
            {Array.from({ length: steps.count }, (_, index) => (
              <span key={index} className={index < steps.current ? "is-done" : undefined} />
            ))}
          </div>
        ) : null}
        {aside}
      </div>
      <div className="lo-account-body">{children}</div>
    </div>
  );
}

// ─── A section: label (and title) on the left, content on the right ─────────
export function Section({ id, label, title, intro, side, children, className = "" }) {
  return (
    <section className={`lo-section ${className}`} id={id}>
      <div className="lo-wrap lo-split">
        <div className="lo-section-side">
          {label ? <p className="lo-label">{label}</p> : null}
          {title ? <h2 className="lo-section-title">{title}</h2> : null}
          {intro ? <p className="lo-section-intro">{intro}</p> : null}
          {side}
        </div>
        <div className="lo-section-body">{children}</div>
      </div>
    </section>
  );
}

export function RuleList({ items, cols = 2 }) {
  return (
    <ul className={`lo-rules${cols === 1 ? " lo-rules--one" : ""}`}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

// Rows of a title and a text between rules; `numbered` counts them off.
export function Rows({ items, numbered = false }) {
  return (
    <ul className={numbered ? "lo-steps" : "lo-rows"}>
      {items.map((item) => (
        <li key={item.title}>
          <h3 className="lo-row-title">{item.title}</h3>
          <div className="lo-row-text">
            <p>{item.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

// Questions that open in place, between hairlines.
export function Faq({ items }) {
  return (
    <div className="lo-faq">
      {items.map((item) => (
        <details key={item.q}>
          <summary>
            <span>{item.q}</span>
            <span className="lo-faq-mark" aria-hidden="true" />
          </summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}

// ─── A listing as a card: the photograph, then the words ─────────────────────
export function ListingCard({ listing, href: hrefOverride }) {
  const href = hrefOverride || listingHref(listing);
  const image = listingImages(listing)[0];
  return (
    <a className="lo-card" href={href} onClick={linkTo(href)}>
      <span className="lo-cover">
        {image ? <img src={image} alt="" loading="lazy" decoding="async" /> : null}
        <span className="lo-cover-tag">{listing.availability || "Ledig"}</span>
      </span>
      <span className="lo-card-text">
        <span className="lo-card-top">
          <span className="lo-card-name">{listing.title}</span>
          <span className="lo-card-price">
            {sek(listing.priceMonthly)}
            <span>/mån</span>
          </span>
        </span>
        <span className="lo-card-line">
          {[listing.address, listing.district].filter(Boolean).join(", ")}
        </span>
        <span className="lo-card-meta">
          {[listing.type, listing.sizeSqm ? `${listing.sizeSqm} kvm` : null, listing.capacity ? `${listing.capacity} platser` : null].filter(Boolean).join(" · ")}
        </span>
      </span>
    </a>
  );
}

// ─── A rail of equal cards that scrolls sideways when there are more ─────────
export function Rail({ label, title, items, more }) {
  const railRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;
    const update = () =>
      setEdges({
        start: rail.scrollLeft <= 2,
        end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2
      });
    update();
    rail.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(rail);
    return () => {
      rail.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [items.length]);

  function step(direction) {
    const rail = railRef.current;
    const card = rail?.querySelector("li");
    if (!card) return;
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
    rail.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  const scrollable = !(edges.start && edges.end);

  return (
    <>
      <div className="lo-rail-head">
        <div>
          <p className="lo-label">{label}</p>
          {title ? <h2 className="lo-title">{title}</h2> : null}
        </div>
        <div className="lo-rail-end">
          {more}
          {scrollable ? (
            <div className="lo-rail-nav">
              <button type="button" onClick={() => step(-1)} disabled={edges.start} aria-label="Föregående">
                <Arrow size={16} back />
              </button>
              <button type="button" onClick={() => step(1)} disabled={edges.end} aria-label="Nästa">
                <Arrow size={16} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <ul className="lo-rail" ref={railRef}>
        {items.map((listing) => (
          <li key={listing.id}>
            <ListingCard listing={listing} />
          </li>
        ))}
      </ul>
    </>
  );
}

// Re-exported for pages that need to follow links themselves.
export { go, linkTo };
