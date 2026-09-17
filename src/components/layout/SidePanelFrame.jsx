import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function SidePanelFrame({ widthClassName, onClose, children }) {
  const [open, setOpen] = useState(false);
  const closingRef = useRef(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function handleClose() {
    if (closingRef.current) return;
    closingRef.current = true;
    setOpen(false);
    window.setTimeout(() => onClose?.(), 300);
  }

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div
        className={`absolute inset-0 bg-black/25 transition-opacity duration-300 ease-out ${open ? "opacity-100" : "opacity-0"}`}
        aria-hidden="true"
        onClick={handleClose}
      />
      <aside
        className={`absolute inset-y-0 right-0 flex ${widthClassName} flex-col border-l border-black/10 bg-[#ffffff] shadow-[0_24px_64px_rgba(15,25,48,0.24)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {children(handleClose)}
      </aside>
    </div>,
    document.body
  );
}

export default SidePanelFrame;
