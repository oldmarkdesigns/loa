import { useLayoutEffect, useRef, useState } from "react";

/** Shared sidebar-style motion for single-selection toggle and tab menus. */
export function useSelectionIndicator(selector) {
  const ref = useRef(null);
  const [box, setBox] = useState(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const measure = () => {
      const selected = root.querySelectorAll(selector);
      if (selected.length !== 1) { setBox(null); return; }
      const item = selected[0];
      const bounds = root.getBoundingClientRect();
      const rect = item.getBoundingClientRect();
      const next = { x: rect.left - bounds.left + root.scrollLeft - root.clientLeft, y: rect.top - bounds.top + root.scrollTop - root.clientTop, width: rect.width, height: rect.height };
      setBox((prev) => prev && Object.keys(next).every((key) => prev[key] === next[key]) ? prev : next);
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(root);
    Array.from(root.children).forEach((child) => resize.observe(child));
    const mutation = new MutationObserver(measure);
    mutation.observe(root, { subtree: true, attributes: true, attributeFilter: ["aria-pressed", "aria-selected", "data-active"], childList: true });
    return () => { resize.disconnect(); mutation.disconnect(); };
  }, [selector]);
  return { ref, box };
}

export function SelectionIndicator({ box }) {
  return box ? <span aria-hidden="true" className="menu-selection-indicator" style={{ transform: `translate(${box.x}px, ${box.y}px)`, width: box.width, height: box.height }} /> : null;
}
