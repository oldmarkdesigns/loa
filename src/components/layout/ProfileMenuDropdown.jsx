import { navigateTo, normalizeAppRole } from "../../lib/router";
import { useTheme } from "../../lib/theme";
import { Icon } from "../icons/Icon";
import { ThemeToggle } from "./ThemeToggle";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

function MenuRow({ icon, children, onClick }) {
  return (
    <DropdownMenuItem
      className="menu-hover-row w-full gap-2 rounded-xl px-3 py-2 font-semibold text-ink-700 focus:bg-veil/5 focus:text-ink-700"
      onClick={onClick}
    >
      <Icon name={icon} className="h-4 w-4" />
      <span>{children}</span>
    </DropdownMenuItem>
  );
}

function ProfileMenuDropdown({
  setMenuOpen,
  user,
  onSwitchRole,
  onLogout,
  onHelp
}) {
  const { available: themeAvailable } = useTheme();
  const normalizedRoles = Array.from(new Set([
    ...(Array.isArray(user?.roles) ? user.roles : []),
    user?.role
  ].filter(Boolean).map(normalizeAppRole)));
  const roleSet = new Set(normalizedRoles);
  const hasBrokerAccess = roleSet.has("broker") || roleSet.has("company_admin");
  const hasCompanyAdminAccess = roleSet.has("company_admin");
  const activeRoleRaw = normalizeAppRole(user?.role);
  const activeRole = activeRoleRaw === "broker" || activeRoleRaw === "company_admin" ? activeRoleRaw : "renter";
  const isRenterMode = activeRole === "renter";
  const willBeCompanyAdmin = activeRole === "company_admin" || (isRenterMode && hasCompanyAdminAccess);
  const profileBasePath = activeRole === "company_admin"
    ? "/app/admin/profil"
    : activeRole === "broker"
      ? "/app/broker/profil"
      : "/app/profile";
  // In the panels the saved listings and searches are cards on the profile.
  const savedListingsPath = activeRole === "renter" ? "/app/profile?tab=favorites" : `${profileBasePath}#sparade-objekt`;
  const savedSearchesPath = activeRole === "renter" ? "/app/profile?tab=history" : `${profileBasePath}#sparade-sokningar`;

  function navigateToBrokerPath(path) {
    setMenuOpen(false);
    navigateTo(path);
  }

  function switchToAdminMode() {
    setMenuOpen(false);
    navigateTo(hasCompanyAdminAccess ? "/app/admin" : "/app/broker");
  }

  return (
    <>
      {/* The theme, at the top as in the profile menu of the workspace: the one place to switch it in search mode (so a visitor who is
          not signed in has none, and gets what is stored in the browser, light by default). */}
      {themeAvailable ? (
        <>
          <div className="flex items-center justify-between gap-3 px-3 py-0.5">
            <span className="text-[13px] font-medium text-ink-600">Tema</span>
            <ThemeToggle />
          </div>
          <DropdownMenuSeparator className="my-3 bg-veil/10" />
        </>
      ) : null}
      {hasBrokerAccess ? (
        <>
          <MenuRow icon="switchMode" onClick={switchToAdminMode}>
            Växla till adminläge
          </MenuRow>
          <MenuRow icon="building" onClick={() => navigateToBrokerPath(willBeCompanyAdmin ? "/app/admin/annonser" : "/app/broker/objekt")}>
            Dina objekt
          </MenuRow>
          <MenuRow icon="plus" onClick={() => navigateToBrokerPath("/app/publish")}>
            Publicera annons
          </MenuRow>
          <MenuRow icon="calendar" onClick={() => navigateToBrokerPath(willBeCompanyAdmin ? "/app/admin/leads" : "/app/broker/leads")}>
            Intresse och visningar
          </MenuRow>
          <DropdownMenuSeparator className="my-3 bg-veil/10" />
        </>
      ) : null}
      <MenuRow
        icon="user"
        onClick={() => {
          setMenuOpen(false);
          navigateTo(profileBasePath);
        }}
      >
        Profil
      </MenuRow>
      <MenuRow
        icon="star"
        onClick={() => {
          setMenuOpen(false);
          navigateTo(savedListingsPath);
        }}
      >
        Sparade objekt
      </MenuRow>
      <MenuRow
        icon="search"
        onClick={() => {
          setMenuOpen(false);
          navigateTo(savedSearchesPath);
        }}
      >
        Sparade sökningar
      </MenuRow>
      <MenuRow
        icon="settingsGear"
        onClick={() => {
          setMenuOpen(false);
          navigateTo("/app/settings");
        }}
      >
        Inställningar
      </MenuRow>
      <DropdownMenuSeparator className="my-3 bg-veil/10" />
      {isRenterMode && !hasBrokerAccess ? (
        <MenuRow
          icon="checkBadge"
          onClick={() => {
            setMenuOpen(false);
            navigateTo("/onboarding/publisher-profile?role=broker&intent=add-role");
          }}
        >
          Verifiera dig som mäklare
        </MenuRow>
      ) : !isRenterMode ? (
        <MenuRow
          icon="infoCircle"
          onClick={() => {
            setMenuOpen(false);
            navigateTo("/app/publish");
          }}
        >
          För hyresvärdar
        </MenuRow>
      ) : null}
      <MenuRow
        icon="support"
        onClick={() => {
          setMenuOpen(false);
          if (onHelp) {
            onHelp();
            return;
          }
          navigateTo("/#faq");
        }}
      >
        Hjälp
      </MenuRow>
      <MenuRow
        icon="logout"
        onClick={async () => {
          setMenuOpen(false);
          await onLogout?.();
          navigateTo("/", { replace: true });
        }}
      >
        Logga ut
      </MenuRow>
    </>
  );
}

export default ProfileMenuDropdown;
