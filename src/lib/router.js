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

export function defaultAppPathForRole(role) {
  if (role === "company_admin") return "/app/admin";
  return role === "broker" || role === "publisher" ? "/app/my-listings" : "/app/rent";
}

export function defaultAppPathForUser(user) {
  if (!user) return "/app/rent";
  const normalizedRoles = Array.isArray(user.roles)
    ? user.roles.map((role) => role === "publisher" ? "broker" : role)
    : [user.role === "publisher" ? "broker" : (user.role || "renter")];
  if (normalizedRoles.includes("company_admin")) return "/app/admin";
  return defaultAppPathForRole(user.role);
}
