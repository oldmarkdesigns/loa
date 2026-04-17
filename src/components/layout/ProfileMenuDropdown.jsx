import { navigateTo } from "../../lib/router";
import {
  BuildingIcon,
  CalendarIcon,
  InfoCircleIcon,
  LogoutIcon,
  SearchIcon,
  SettingsGearIcon,
  StarIcon,
  SupportIcon,
  SwitchHorizontalIcon,
  UserIcon
} from "../icons/UiIcons";

function ProfileMenuDropdown({
  menuOpen,
  setMenuOpen,
  profileMenuPanelRef,
  onSwitchRole,
  onLogout,
  onHelp
}) {
  if (!menuOpen) return null;

  return (
    <>
      <div ref={profileMenuPanelRef} className="fixed right-4 top-[72px] z-[60] w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-black/10 bg-white p-3 shadow-[0_10px_28px_rgba(15,25,48,0.10)]">
        <div className="space-y-2 text-sm">
          <button
            type="button"
            className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
            onClick={() => {
              setMenuOpen(false);
              navigateTo("/app/my-listings");
            }}
          >
            <BuildingIcon className="h-4 w-4" />
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
            <CalendarIcon className="h-4 w-4" />
            <span>Mina hyresavtal</span>
          </button>
          <div className="my-3 h-px bg-black/10" />
          <button
            type="button"
            className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
            onClick={() => {
              setMenuOpen(false);
              navigateTo("/app/profile");
            }}
          >
            <UserIcon className="h-4 w-4" />
            <span>Profil</span>
          </button>
          <button
            type="button"
            className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
            onClick={async () => {
              setMenuOpen(false);
              await onSwitchRole?.("publisher");
            }}
          >
            <SwitchHorizontalIcon className="h-4 w-4" />
            <span>Växla till hyresvärd</span>
          </button>
          <button
            type="button"
            className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
            onClick={() => {
              setMenuOpen(false);
              navigateTo("/app/profile?tab=favorites");
            }}
          >
            <StarIcon className="h-4 w-4" />
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
            <SearchIcon className="h-4 w-4" />
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
            <SettingsGearIcon className="h-4 w-4" />
            <span>Inställningar</span>
          </button>
          <div className="my-3 h-px bg-black/10" />
          <button
            type="button"
            className="menu-hover-row inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-ink-700 transition hover:bg-black/5"
            onClick={() => {
              setMenuOpen(false);
              navigateTo("/app/publish");
            }}
          >
            <InfoCircleIcon className="h-4 w-4" />
            <span>För hyresvärdar</span>
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
            <SupportIcon className="h-4 w-4" />
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
            <LogoutIcon className="h-4 w-4" />
            <span>Logga ut</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default ProfileMenuDropdown;
