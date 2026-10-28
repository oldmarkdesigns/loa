import { useMemo } from "react";
import { accountPagesFor, accountPath } from "../../lib/accountPages";
import { navigateTo, normalizeAppRole } from "../../lib/router";
import PanelProfileSection from "../../pages/app/PanelProfileSection";
import { AccountOverlay } from "./AccountLayout";
import CompanyProfilePage from "./CompanyProfilePage";
import { ContactPage, FaqPage, GettingStartedPage } from "./HelpPages";
import { GeneralSettingsPage, ShortcutsPage } from "./SettingsPages";

/**
 * The account window of a workspace panel, over whatever page the person was on: it is what the profile menu's Profil, Adminprofil,
 * Inställningar and Hjälp open, and it is a route (`/app/admin/profil/sparat`), so the address, the back button and a reload all
 * work. `base` is the panel (`/app/admin` or `/app/broker`) and `pageKey` the page (see src/lib/accountPages.js).
 *
 * Closing goes back to the page behind it when the window was opened from one (the router keeps that in the history entry), and
 * to the start page of the panel when it was opened by address.
 */

export function closeAccountWindow(base) {
  if (typeof window !== "undefined" && window.history.state?.accountBackground) window.history.back();
  else navigateTo(base, { replace: true });
}

const PROFILE_PAGES = ["profil", "lokalprogram", "sparat"];

export default function AccountWindow({ app, base, pageKey }) {
  const role = normalizeAppRole(app?.user?.role);
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
    <AccountOverlay pages={pages} active={pageKey} onSelect={select} onClose={() => closeAccountWindow(base)}>
      {body}
    </AccountOverlay>
  );
}
