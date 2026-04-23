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
  return role === "broker" || role === "company_admin" || role === "publisher" ? "/app/my-listings" : "/app/rent";
}
