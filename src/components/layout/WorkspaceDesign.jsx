import { createContext, useContext } from "react";

// React context crosses portals, unlike descendant CSS. Every nested workspace
// popup opts into the same visual system without changing its interaction code.
const WorkspaceDesignContext = createContext(false);
export function WorkspaceDesignProvider({ children }) {
  return <WorkspaceDesignContext.Provider value={true}>{children}</WorkspaceDesignContext.Provider>;
}
export function useWorkspaceSurface(kind = "panel") {
  return useContext(WorkspaceDesignContext) ? kind : undefined;
}
