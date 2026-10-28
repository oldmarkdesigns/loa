import { useEffect, useState } from "react";

/** Whether a CSS media query currently matches, kept up to date as the window changes. */
export function useMediaQuery(query, fallback = true) {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? fallback);
  useEffect(() => {
    const list = window.matchMedia?.(query);
    if (!list) return undefined;
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}
