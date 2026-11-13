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

export function workspaceRoles(user) {
  return new Set([...(user?.roles || []), user?.role].filter(Boolean).map(normalizeAppRole));
}

export function defaultAppPathForRole(role) {
  return normalizeAppRole(role) === "company_admin" ? "/app/admin"
    : normalizeAppRole(role) === "broker" ? "/app/broker" : "/app/profile";
}
export function defaultAppPathForUser(user) {
  const roles = workspaceRoles(user);
  return roles.has("company_admin") ? "/app/admin"
    : roles.has("broker") ? "/app/broker" : "/app/profile";
}

export function isWorkspacePath(path) {
  return ["/app/admin", "/app/broker", "/app/my-listings", "/app/prospekt"].some(base => routeMatches(path, base))
    || ["/app/publish", "/app/messages", "/app/profile", "/app/settings", "/app/viewings"].includes(path);
}

export function canAccessWorkspace(user, path) {
  if (!user || !isWorkspacePath(path)) return false;
  const roles = workspaceRoles(user);
  if (routeMatches(path, "/app/admin")) return roles.has("company_admin");
  if (routeMatches(path, "/app/broker") || routeMatches(path, "/app/my-listings") || path === "/app/publish") {
    return roles.has("company_admin") || roles.has("broker");
  }
  return true;
}

export function publicReturnTo(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/callback";
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return "/callback";
    return isWorkspacePath(url.pathname) || url.pathname === "/callback" || url.pathname === "/lokaler" || /^\/lokaler\/[^/]+$/.test(url.pathname)
      ? url.pathname + url.search + url.hash : "/lokaler";
  } catch { return "/callback"; }
}
