import { navigateTo } from "../../lib/router";
import { ArrowUpRight } from "lucide-react";
import loaLogo from "../../site/assets/loa-logo.png";

export default function WorkspaceHeader() {
  return <header className="loa-workspace-header">
    <div className="loa-workspace-brand">
      <a href="/" onClick={event => { event.preventDefault(); navigateTo("/"); }} aria-label="LOA, till startsidan"><img src={loaLogo} alt="LOA" width="120" height="71" /></a>
      <span className="loa-workspace-context">Arbetsyta</span>
    </div>
    <button type="button" className="loa-search-mode-button" onClick={() => navigateTo("/lokaler")}>Byt till sökläge <ArrowUpRight size={16} aria-hidden="true" /></button>
  </header>;
}
