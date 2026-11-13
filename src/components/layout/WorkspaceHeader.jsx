import { accountPagesFor, accountPath } from "../../lib/accountPages";
import { navigateTo, normalizeAppRole, defaultAppPathForUser } from "../../lib/router";
import PanelProfileMenu from "./PanelProfileMenu";
import loaLogo from "../../site/assets/loa-logo.png";

export default function WorkspaceHeader({ user, pathname, onLogout, onBack }) {
  const base = defaultAppPathForUser(user).startsWith("/app/admin") ? "/app/admin" : "/app/broker";
  const items = accountPagesFor(base === "/app/admin" ? "company_admin" : normalizeAppRole(user?.role))
    .filter(page => !page.sub)
    .map(page => ({ ...page, path: accountPath(base, page), label: page.key === "adminprofil" ? "Företagsprofil" : page.label }));
  const go = (path) => (event) => { event.preventDefault(); navigateTo(path); };
  return <header className="loa-workspace-header">
    <div className="loa-workspace-brand">
      <a href="/" onClick={go("/")} aria-label="LOA, till startsidan"><img src={loaLogo} alt="LOA" width="120" height="71" /></a>
      {onBack ? <button type="button" className="loa-back-workspace" onClick={onBack}>Till arbetsytan</button> : <span className="loa-workspace-context">Arbetsyta</span>}
    </div>
    <nav aria-label="Plattformsläge" className="loa-mode-nav">
      <a href="/lokaler" onClick={go("/lokaler")}>Sök lokaler</a>
      <a href={defaultAppPathForUser(user)} onClick={go(defaultAppPathForUser(user))} aria-current="page">Admin</a>
    </nav>
    <div className="loa-workspace-person"><PanelProfileMenu variant="header" pathname={pathname} items={items} onNavigate={path => navigateTo(path)} onLogout={onLogout} /></div>
  </header>;
}
