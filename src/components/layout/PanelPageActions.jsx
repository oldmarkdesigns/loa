import { createContext, useContext } from "react";
import { createPortal } from "react-dom";

// Keep event handlers with their page while the shell owns toolbar alignment.
const ActionsHost = createContext(null);
export const PanelActionsHost = ActionsHost.Provider;
export function PanelPageActions({ children }) {
  const host = useContext(ActionsHost);
  return host ? createPortal(children, host) : null;
}
export function PanelSectionHeader({ title, description, actions }) {
  return <header className="loa-section-header">
    <div className="loa-section-heading"><h2>{title}</h2>{description && <p>{description}</p>}</div>
    {actions && <div className="loa-page-actions">{actions}</div>}
  </header>;
}
