import { useMemo } from "react";
import { accountPagesFor, accountPath } from "../../lib/accountPages";
import { navigateTo, normalizeAppRole } from "../../lib/router";
import PanelProfileSection from "../../pages/app/PanelProfileSection";
import { AccountOverlay } from "./AccountLayout";
import CompanyProfilePage from "./CompanyProfilePage";
import { ContactPage, FaqPage, GettingStartedPage } from "./HelpPages";
import { GeneralSettingsPage, ShortcutsPage } from "./SettingsPages";

/**
 * Full-page profile, company, settings and help navigation. Route changes preserve the
 * existing form state; returning to the workspace restores the originating page.
 */
export function closeAccountWindow(base) {
  if (typeof window !== "undefined" && window.history.state?.accountBackground) window.history.back();
  else navigateTo(base, { replace: true });
}

const PROFILE_PAGES = ["profil", "lokalprogram", "sparat"];

export default function AccountWindow({ app, base, pageKey }) {
  const role = base === "/app/admin" ? "company_admin" : normalizeAppRole(app?.user?.role);
  const pages = useMemo(() => accountPagesFor(role), [role]);

  // Between the pages of the window the address changes but no history entry is added: one step back leaves the window.
  const select = (key) => {
    const page = pages.find((item) => item.key === key);
    if (page) navigateTo(accountPath(base, page), { replace: true });
  };

  let body = null;
  // One profile component for its three pages, so what is being edited survives a click on another page.
  if (PROFILE_PAGES.includes(pageKey)) body = <PanelProfileSection app={app} page={pageKey} />;
  else if (pageKey === "adminprofil") body = <CompanyProfilePage app={app} />;
  else if (pageKey === "installningar") body = <GeneralSettingsPage app={app} />;
  else if (pageKey === "genvagar") body = <ShortcutsPage />;
  else if (pageKey === "hjalp") body = <GettingStartedPage app={app} base={base} />;
  else if (pageKey === "fragor") body = <FaqPage app={app} />;
  else if (pageKey === "kontakt") body = <ContactPage onOpenPage={select} />;

  return (
    <AccountOverlay user={app.user} onLogout={app.logout} pages={pages} active={pageKey} onSelect={select} onClose={() => closeAccountWindow(base)}>
      {body}
    </AccountOverlay>
  );
}
