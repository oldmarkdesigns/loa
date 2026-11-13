import { useEffect, useState } from "react";

// The account window of the panels (Profil, Adminprofil, Inställningar, Hjälp and their pages) is a route that opens over a page.
const ACCOUNT_PATH = /^\/app\/(admin|broker)\/(profil|adminprofil|installningar|hjalp)(?:\/|$|[?#])/;

export function navigateTo(pathname, options = {}) {
  const target = pathname.startsWith("/") ? pathname : `/${pathname}`;
  let state = target === "/app/publish" && !options.replace && window.location.pathname.startsWith("/app/") && window.location.pathname !== target
    ? { publishBackground: window.location.pathname + window.location.search + window.location.hash }
    : {};
  if (ACCOUNT_PATH.test(target)) {
    // Remember the page the window opened over, so that closing it goes back there; moving between its pages keeps what was remembered.
    const here = window.location.pathname;
    const background = ACCOUNT_PATH.test(here)
      ? window.history.state?.accountBackground
      : here + window.location.search + window.location.hash;
    if (background) state = { ...state, accountBackground: background };
  }
  if (options.replace) {
    window.history.replaceState(state, "", target);
  } else {
    window.history.pushState(state, "", target);
  }
  window.dispatchEvent(new Event("app:navigate"));
}

export function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname || "/");

  useEffect(() => {
    function syncPath() {
      setPathname(window.location.pathname || "/");
    }

    window.addEventListener("popstate", syncPath);
    window.addEventListener("app:navigate", syncPath);
    return () => {
      window.removeEventListener("popstate", syncPath);
      window.removeEventListener("app:navigate", syncPath);
    };
  }, []);

  return pathname;
}

export function routeMatches(pathname, basePath) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function normalizeAppRole(role) {
  if (role === "company-admin" || role === "companyAdmin" || role === "admin") return "company_admin";
  if (role === "publisher") return "broker";
  return role === "company_admin" || role === "broker" || role === "renter" ? role : "renter";
}

// Legacy roles never select a legacy panel in LOA.
export function defaultAppPathForRole() { return "/lokaler"; }
export function defaultAppPathForUser() { return "/lokaler"; }

export function publicReturnTo(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/lokaler";
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return "/lokaler";
    return url.pathname === "/lokaler" || /^\/lokaler\/[^/]+$/.test(url.pathname)
      ? url.pathname + url.search + url.hash : "/lokaler";
  } catch { return "/lokaler"; }
}
