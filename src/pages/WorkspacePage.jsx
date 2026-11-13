import AppShell from "../components/layout/AppShell";
import AdminPanelPage from "./app/AdminPanelPage";
import BrokerPanelPage from "./app/BrokerPanelPage";
import ManageListingPage from "./app/ManageListingPage";
import MyListingsPage from "./app/MyListingsPage";
import MessagesPage from "./app/MessagesPage";
import ProfilePage from "./app/ProfilePage";
import SettingsPage from "./app/SettingsPage";
import ViewingsPage from "./app/ViewingsPage";
import ProspectRenterPage from "./app/ProspectRenterPage";
import PublishPage from "./app/PublishPage";
import { defaultAppPathForUser, navigateTo, routeMatches } from "../lib/router";

export default function WorkspacePage({ app, pathname }) {
  const publishing = pathname === "/app/publish";
  const background = publishing ? window.history.state?.publishBackground : null;
  const path = publishing ? background?.split(/[?#]/)[0] || defaultAppPathForUser(app.user) : pathname;
  const managedListing = path.match(/^\/app\/my-listings\/([^/]+)$/);
  const prospect = path.match(/^\/app\/prospekt\/([^/]+)$/);
  let content;
  if (routeMatches(path, "/app/admin")) content = <AdminPanelPage app={app} pathname={path} />;
  else if (routeMatches(path, "/app/broker")) content = <BrokerPanelPage app={app} pathname={path} />;
  else if (managedListing) content = <ManageListingPage app={app} listingId={decodeURIComponent(managedListing[1])} />;
  else if (path === "/app/my-listings") content = <MyListingsPage app={app} />;
  else if (prospect) content = <ProspectRenterPage app={app} prospectId={decodeURIComponent(prospect[1])} />;
  else if (path === "/app/messages") content = <MessagesPage app={app} />;
  else if (path === "/app/profile") content = <ProfilePage app={app} />;
  else if (path === "/app/settings") content = <SettingsPage app={app} />;
  else if (path === "/app/viewings") content = <ViewingsPage app={app} />;
  return <AppShell pathname={path} user={app.user} listings={app.listings} myCompanies={app.myCompanies} onSwitchRole={app.switchRole} onSwitchCompany={app.switchActiveCompany} onLogout={app.logout}>
    {content}
    {publishing && <PublishPage app={app} onClose={() => background ? window.history.back() : navigateTo(path, { replace: true })} />}
  </AppShell>;
}
