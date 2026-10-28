import { useCallback, useEffect, useState } from "react";
import { clearLayout, defaultLayout, layoutStorageKey, layoutsEqual, normalizeLayout, readLayout, writeLayout } from "../../../lib/dashboardLayout";

/**
 * The broker's overview layout: the order, size and visibility of the widgets, kept in this browser for each person. `save`
 * takes the choice made in the customizer, `reset` goes back to the default. A change made in another tab of the same browser
 * shows up here too.
 */
export default function useDashboardLayout(userId) {
  const key = layoutStorageKey(userId);
  const [state, setState] = useState(() => ({ key, layout: readLayout(key) }));

  // A different person (the key changes) gets their own layout.
  if (state.key !== key) setState({ key, layout: readLayout(key) });

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === key || event.key === null) setState({ key, layout: readLayout(key) });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const save = useCallback(
    (next) => {
      const layout = normalizeLayout(next);
      setState({ key, layout });
      writeLayout(key, layout);
    },
    [key]
  );

  const reset = useCallback(() => {
    setState({ key, layout: defaultLayout() });
    clearLayout(key);
  }, [key]);

  return { layout: state.layout, save, reset, isDefault: layoutsEqual(state.layout, defaultLayout()) };
}
