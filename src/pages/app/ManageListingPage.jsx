import { useEffect, useMemo } from "react";
import AdminPanelShell from "../../components/layout/AdminPanelShell";
import ListingEditorOverlay from "../../components/app/ListingEditorOverlay";
import { navigateTo, normalizeAppRole } from "../../lib/router";
import { ADMIN_NAV_ITEMS, ADMIN_BOTTOM_NAV_ITEMS } from "./AdminPanelPage";
import { BROKER_NAV_ITEMS, BROKER_BOTTOM_NAV_ITEMS } from "./BrokerPanelPage";

function ManageListingPage({ app, listingId }) {
  const { user, listings } = app;
  useEffect(() => {
    if (!user?.id) return;
    void app.refreshCoreData(user);
  }, [app, user]);

  const activeRole = normalizeAppRole(user?.role);
  const isCompanyAdmin = activeRole === "company_admin";
  const panelNavItems = isCompanyAdmin ? ADMIN_NAV_ITEMS : BROKER_NAV_ITEMS;
  const panelBottomNavItems = isCompanyAdmin ? ADMIN_BOTTOM_NAV_ITEMS : BROKER_BOTTOM_NAV_ITEMS;
  const myListingsPath = isCompanyAdmin ? "/app/admin/annonser" : "/app/broker/objekt";

  const listing = useMemo(
    () => listings.find((item) => String(item.id) === String(listingId) && item.ownerId === user?.id),
    [listings, listingId, user?.id]
  );

  return (
    <AdminPanelShell
      pathname={myListingsPath}
      navItems={panelNavItems}
      bottomNavItems={panelBottomNavItems}
      sectionTitle="Hantera objekt"
      onLogout={app?.logout}
    >
      {listing ? (
        <ListingEditorOverlay listing={listing} app={app} onClose={() => navigateTo(myListingsPath)} />
      ) : (
        <div className="rounded-2xl border border-veil/10 bg-surface p-6">
          <h1 className="text-2xl font-semibold">Objektet kunde inte öppnas</h1>
          <p className="mt-2 text-sm text-ink-600">Du har inte åtkomst till objektet eller så har det tagits bort.</p>
        </div>
      )}
    </AdminPanelShell>
  );
}

export default ManageListingPage;
