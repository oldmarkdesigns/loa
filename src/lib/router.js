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

export function defaultAppPathForRole(role) {
  const normalizedRole = normalizeAppRole(role);
  if (normalizedRole === "company_admin") return "/app/admin";
  return normalizedRole === "broker" ? "/app/broker" : "/app/rent";
}

export function defaultAppPathForUser(user) {
  if (!user) return "/app/rent";
  const normalizedRoles = Array.isArray(user.roles)
    ? user.roles.map(normalizeAppRole)
    : [normalizeAppRole(user.role)];
  if (normalizedRoles.includes("company_admin")) return "/app/admin";
  return defaultAppPathForRole(user.role);
}
