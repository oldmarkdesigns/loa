import { useMemo, useRef, useState } from "react";
import MarketingNavLinks from "./MarketingNavLinks";
import { navigateTo } from "../../lib/router";
import { deriveNavbarRoleState } from "../../lib/navbarRoles";
import { MessageSquareIcon } from "../icons/UiIcons";
import ProfileMenuDropdown from "./ProfileMenuDropdown";

function AuthFlowNav({ user, onSwitchRole, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const profileMenuPanelRef = useRef(null);
  const { hasCompanyAdminRole } = deriveNavbarRoleState(user);
  const initials = useMemo(() => {
    const source = String(user?.name || "AA").trim();
    const words = source.split(" ").filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0]?.[0] || ""}${words[1]?.[0] || ""}`.toUpperCase() || "AA";
  }, [user?.name]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-black/10 bg-[#fffffe]/95 backdrop-blur-md">
        <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <button type="button" className="justify-self-start text-left" onClick={() => navigateTo("/")}>
              <span className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-[#fffffe] px-2.5 py-1.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-black/30 bg-[#fffffe] text-[9px] font-semibold uppercase tracking-wide text-ink-500">
                  LOGGA
                </span>
                <span className="text-sm font-semibold text-ink-800">Företagsnamn</span>
              </span>
            </button>
          </div>

          <nav className="hidden items-center justify-self-start gap-7 lg:flex">
            <MarketingNavLinks hrefPrefix="/" onPublish={() => navigateTo("/app/publish")} showPublish={false} />
          </nav>

          <div className="flex items-center justify-self-end gap-4">
            {user?.id ? (
              <>
                {!hasCompanyAdminRole ? (
                  <button
                    type="button"
                    aria-label="Meddelanden"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/20 bg-[#fffffe] text-ink-700"
                    onClick={() => navigateTo("/app/messages")}
                  >
                    <MessageSquareIcon className="h-4 w-4" />
                  </button>
                ) : null}
                {!hasCompanyAdminRole ? (
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-black/20 bg-[#fffffe] text-sm font-semibold text-ink-700"
                    onClick={() => setMenuOpen((value) => !value)}
                    aria-label="Öppna profilmeny"
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                  >
                    {user?.profile?.avatarUrl ? (
                      <img src={user.profile.avatarUrl} alt={user?.name || "Profil"} className="h-full w-full object-cover" />
                    ) : initials}
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-[#0f1930] bg-[#0f1930] px-4 py-2 text-xs font-semibold text-white hover:bg-[#16233f]"
                  onClick={() => navigateTo("/signup")}
                >
                  Skapa konto
                </button>
                <button
                  type="button"
                  className="inline-flex items-center bg-transparent px-1 py-2 text-xs font-semibold text-ink-700"
                  onClick={() => navigateTo("/login")}
                >
                  Logga in
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <ProfileMenuDropdown
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        profileMenuPanelRef={profileMenuPanelRef}
        user={user}
        onSwitchRole={onSwitchRole}
        onLogout={onLogout}
      />
    </>
  );
}

export default AuthFlowNav;
