import { useEffect, useLayoutEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { navigateTo } from "../lib/router";
import { listings as baseListings } from "../data/mockData";

// Shared constants, data helpers and scrolling for the public site (everything a
// visitor sees before signing in). The parts built on them are in SiteChrome.jsx.

export const SUPPORT_EMAIL = "support@foretag.se";
export const SUPPORT_PHONE = "08-123 45 67";
export const SUPPORT_HOURS = "Vardagar 08:00–17:00";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─── Listings ────────────────────────────────────────────────────────────────
// The live listings from Convex when there are any, the sample set otherwise.
export function siteListings(listings) {
  return Array.isArray(listings) && listings.length > 0 ? listings : baseListings;
}

export function findListing(listings, id) {
  const key = String(id);
  return siteListings(listings).find((item) => String(item.id) === key)
    || baseListings.find((item) => String(item.id) === key)
    || null;
}

export function listingImages(listing) {
  if (!listing) return [];
  const extra = Array.isArray(listing.images)
    ? listing.images.map((entry) => (typeof entry === "string" ? entry : entry?.src)).filter(Boolean)
    : [];
  return [...new Set([listing.image, ...extra].filter(Boolean))];
}

export const listingHref = (listing) => `/lokaler/${encodeURIComponent(listing.id)}`;

export const sek = (value) => `${Math.round(Number(value) || 0).toLocaleString("sv-SE")} kr`;

// ─── Navigation ──────────────────────────────────────────────────────────────
// Smooth wheel and trackpad scrolling while a site page is open. Null when the
// visitor prefers reduced motion; the browser then scrolls natively.
let lenis = null;
const NAV_OFFSET = -72;

export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    lenis = new Lenis({
      lerp: 0.1,
      // Sideways gestures over a rail stay with the rail.
      virtualScroll: ({ deltaX, deltaY, event }) =>
        !(Math.abs(deltaX) > Math.abs(deltaY) && event.target.closest?.(".lo-rail"))
    });
    let raf = requestAnimationFrame(function loop(time) {
      lenis?.raf(time);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
      lenis = null;
    };
  }, []);
}

export function scrollToId(hash) {
  const target = document.querySelector(hash);
  if (!target) return;
  if (lenis) lenis.scrollTo(target, { offset: NAV_OFFSET });
  else {
    const top = target.getBoundingClientRect().top + window.scrollY + NAV_OFFSET;
    window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0);
  else window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

// One way to follow any site link: "#faq" scrolls when this page has it and
// otherwise opens the homepage there; a path navigates.
export function go(href) {
  if (!href) return;
  if (href.startsWith("#")) {
    if (document.querySelector(href)) {
      scrollToId(href);
      return;
    }
    navigateTo(`/${href}`);
    return;
  }
  navigateTo(href);
}

// An <a> handler: keep real hrefs for new tabs and the status bar, but route in-app.
export function linkTo(href, before) {
  return (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;
    event.preventDefault();
    before?.();
    go(href);
  };
}

// ─── Reveal ──────────────────────────────────────────────────────────────────
// One entrance for the whole site, as on the studio site: each block fades in and
// rises a little as it reaches the viewport, those arriving together a step apart.
const REVEAL = [
  ".lo-hero-copy > *",
  ".lo-hero-map",
  ".lo-intro > *",
  ".lo-rail-head",
  ".lo-rail",
  ".lo-grid > li",
  ".lo-steps-row > li",
  ".lo-split > *",
  ".lo-page-head > :not(.lo-page-head-row)",
  ".lo-page-head-text > *",
  ".lo-page-head-media",
  ".lo-page-media",
  ".lo-filters",
  ".lo-account-side > *",
  ".lo-account-body",
  ".lo-band .lo-wrap > *"
].join(",");
const STEP = 70;
const MAX_STEPS = 5;

export function useReveal(key) {
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const root = document.querySelector(".lo");
    if (!root) return undefined;
    const items = [...root.querySelectorAll(REVEAL)];
    items.forEach((el) => {
      el.style.transition = "none";
      el.classList.add("lo-rv");
    });
    void root.offsetHeight;
    items.forEach((el) => el.style.removeProperty("transition"));

    const done = (event) => {
      if (event.target !== event.currentTarget || event.propertyName !== "transform") return;
      event.currentTarget.classList.remove("lo-rv", "is-in");
      event.currentTarget.style.removeProperty("--rv-delay");
      event.currentTarget.removeEventListener("transitionend", done);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const arriving = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target);
        arriving.forEach((el, index) => {
          el.style.setProperty("--rv-delay", `${Math.min(index, MAX_STEPS) * STEP}ms`);
          el.addEventListener("transitionend", done);
          el.classList.add("is-in");
          io.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      items.forEach((el) => {
        el.removeEventListener("transitionend", done);
        el.classList.remove("lo-rv", "is-in");
        el.style.removeProperty("--rv-delay");
      });
    };
  }, [key]);
}
