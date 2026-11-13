import { useMemo, useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import MarketingNavLinks from "./MarketingNavLinks";
import { navigateTo } from "../../lib/router";
import { deriveNavbarRoleState } from "../../lib/navbarRoles";
import { LockIcon, MessageSquareIcon, UserIcon } from "../icons/UiIcons";
import ProfileMenuDropdown from "./ProfileMenuDropdown";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function loginReturnTo() {
  const requested = new URLSearchParams(window.location.search).get("returnTo");
  return requested && requested.startsWith("/") ? requested : "/app/rent";
}

function AuthFlowNav({ user, onSwitchRole, onLogout }) {
  const { signIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { hasCompanyAdminRole } = deriveNavbarRoleState(user);
  const initials = useMemo(() => {
    const source = String(user?.name || "AA").trim();
    const words = source.split(" ").filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0]?.[0] || ""}${words[1]?.[0] || ""}`.toUpperCase() || "AA";
  }, [user?.name]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-black/10 bg-[#ffffff]/95 backdrop-blur-md">
        <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Button type="button" variant="ghost" className="h-auto justify-self-start p-0 text-left hover:bg-transparent" onClick={() => navigateTo("/")}>
              <span className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-[#ffffff] px-2.5 py-1.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-black/30 bg-[#ffffff] text-[9px] font-semibold text-ink-500">
                  LOGGA
                </span>
                <span className="text-sm font-semibold text-ink-800">LOA</span>
              </span>
            </Button>
          </div>

          <nav className="hidden items-center justify-self-start gap-7 lg:flex">
            <MarketingNavLinks hrefPrefix="/" onPublish={() => navigateTo("/app/publish")} showPublish={false} />
          </nav>

          <div className="flex items-center justify-self-end gap-4">
            {user?.id ? (
              <>
                {!hasCompanyAdminRole ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Meddelanden"
                    className="h-11 w-11 rounded-full text-ink-700"
                    onClick={() => navigateTo("/app/messages")}
                  >
                    <MessageSquareIcon className="h-4 w-4" />
                  </Button>
                ) : null}
                {!hasCompanyAdminRole ? (
                  <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 w-11 overflow-hidden rounded-full p-0 text-sm font-semibold text-ink-700"
                          aria-label="Öppna profilmeny"
                        />
                      }
                    >
                      <Avatar className="h-full w-full">
                        <AvatarImage src={user?.profile?.avatarUrl} alt={user?.name || "Profil"} />
                        <AvatarFallback className="bg-transparent text-sm font-semibold text-ink-700">{initials}</AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8} className="w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-black/10 p-3 shadow-[0_10px_28px_rgba(15,25,48,0.10)]">
                      <ProfileMenuDropdown
                        setMenuOpen={setMenuOpen}
                        user={user}
                        onSwitchRole={onSwitchRole}
                        onLogout={onLogout}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </>
            ) : (
              <>
                <Button
                  type="button"
                  className="h-auto gap-2 rounded-full px-5 text-sm font-semibold"
                  onClick={() => navigateTo("/signup")}
                >
                  Skapa konto
                  <UserIcon className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-auto gap-2 rounded-full bg-black/5 px-5 text-sm font-semibold text-ink-800 hover:bg-black/10"
                  onClick={() => {
                    const returnTo = loginReturnTo();
                    signIn({ state: { returnTo } }).catch(() => {
                      navigateTo("/");
                    });
                  }}
                >
                  Logga in
                  <LockIcon className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export default AuthFlowNav;
