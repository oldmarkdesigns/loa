import { useEffect, useState } from "react";

export function navigateTo(pathname, options = {}) {
  const target = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (options.replace) {
    window.history.replaceState({}, "", target);
  } else {
    window.history.pushState({}, "", target);
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
