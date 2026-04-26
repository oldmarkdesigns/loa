import { navigateTo } from "../../lib/router";
import { Icon } from "../icons/Icon";

function ProfileMenuDropdown({
  menuOpen,
  setMenuOpen,
  profileMenuPanelRef,
  user,
  onSwitchRole,
  onLogout,
  onHelp
}) {
  if (!menuOpen) return null;

  const normalizedRoles = Array.from(new Set([
    ...(Array.isArray(user?.roles) ? user.roles : []),
    user?.role
  ].filter(Boolean).map((role) => role === "publisher" ? "broker" : role)));
  const roleSet = new Set(normalizedRoles);
  const hasBrokerAccess = roleSet.has("broker") || roleSet.has("company_admin");
  const hasCompanyAdminAccess = roleSet.has("company_admin");
  const activeRoleRaw = user?.role === "publisher" ? "broker" : user?.role;
  const activeRole = activeRoleRaw === "broker" || activeRoleRaw === "company_admin" ? activeRoleRaw : "renter";
  const isRenterMode = activeRole === "renter";

  return (
    <>
      <div ref={profileMenuPanelRef} className="fixed right-4 top-[72px] z-[60] w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-black/10 bg-white p-3 shadow-[0_10px_28px_rgba(15,25,48,0.10)]">
        <div className="space-y-2 text-sm">
          {isRenterMode && !hasBrokerAccess ? (
            <button
              type="button"
              className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
              onClick={() => {
                setMenuOpen(false);
                navigateTo("/onboarding/publisher-profile?role=broker&intent=add-role");
              }}
            >
              <Icon name="building" className="h-4 w-4" />
              <span>Verifiera dig som mäklare</span>
            </button>
          ) : !isRenterMode ? (
            <>
              <button
                type="button"
                className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
                onClick={() => {
                  setMenuOpen(false);
                  navigateTo("/app/my-listings");
                }}
              >
                <Icon name="building" className="h-4 w-4" />
                <span>Mina objekt</span>
              </button>
              <button
                type="button"
                className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
                onClick={() => {
                  setMenuOpen(false);
                  navigateTo("/app/viewings");
                }}
              >
                <Icon name="calendar" className="h-4 w-4" />
                <span>Mina hyresavtal</span>
              </button>
            </>
          ) : null}
          <div className="my-3 h-px bg-black/10" />
          <button
            type="button"
            className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
            onClick={() => {
              setMenuOpen(false);
              navigateTo("/app/profile");
            }}
          >
            <Icon name="user" className="h-4 w-4" />
            <span>Profil</span>
          </button>
          {hasCompanyAdminAccess && activeRole === "renter" ? (
            <button
              type="button"
              className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
              onClick={async () => {
                setMenuOpen(false);
                await onSwitchRole?.("company_admin");
                navigateTo("/app/admin");
              }}
            >
              <Icon name="switchHorizontal" className="h-4 w-4" />
              <span>Växla till Företag</span>
            </button>
          ) : null}
          {!hasCompanyAdminAccess && hasBrokerAccess && activeRole === "renter" ? (
            <button
              type="button"
              className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
              onClick={async () => {
                setMenuOpen(false);
                await onSwitchRole?.("broker");
              }}
            >
              <Icon name="switchHorizontal" className="h-4 w-4" />
              <span>Växla till hyresvärd</span>
            </button>
          ) : null}
          <button
            type="button"
            className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
            onClick={() => {
              setMenuOpen(false);
              navigateTo("/app/profile?tab=favorites");
            }}
          >
            <Icon name="star" className="h-4 w-4" />
            <span>Sparade objekt</span>
          </button>
          <button
            type="button"
            className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
            onClick={() => {
              setMenuOpen(false);
              navigateTo("/app/profile?tab=history");
            }}
          >
            <Icon name="search" className="h-4 w-4" />
            <span>Sparade sökningar</span>
          </button>
          <button
            type="button"
            className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
            onClick={() => {
              setMenuOpen(false);
              navigateTo("/app/settings");
            }}
          >
            <Icon name="settingsGear" className="h-4 w-4" />
            <span>Inställningar</span>
          </button>
          <div className="my-3 h-px bg-black/10" />
          <button
            type="button"
            className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
            onClick={() => {
              setMenuOpen(false);
              if (isRenterMode) {
                navigateTo("/onboarding/publisher-profile?role=broker&intent=add-role");
                return;
              }
              navigateTo("/app/publish");
            }}
          >
            <Icon name="infoCircle" className="h-4 w-4" />
            <span>{isRenterMode ? "Verifiera dig som mäklare" : "För hyresvärdar"}</span>
          </button>
          <button
            type="button"
            className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
            onClick={() => {
              setMenuOpen(false);
              if (onHelp) {
                onHelp();
                return;
              }
              navigateTo("/#faq");
            }}
          >
            <Icon name="support" className="h-4 w-4" />
            <span>Hjälp</span>
          </button>
          <button
            type="button"
            className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
            onClick={async () => {
              setMenuOpen(false);
              await onLogout?.();
              navigateTo("/", { replace: true });
            }}
          >
            <Icon name="logout" className="h-4 w-4" />
            <span>Logga ut</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default ProfileMenuDropdown;
