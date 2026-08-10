import { useState } from "react";
import { navigateTo, routeMatches } from "../../lib/router";
import { LogoutIcon, PanelLeftIcon, XIcon } from "../icons/UiIcons";

function PanelSidebarNav({ pathname, navItems, rootPath, onNavigate, badges }) {
  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const active = item.path === rootPath
          ? pathname === rootPath || pathname === `${rootPath}/`
          : routeMatches(pathname, item.path);
        const badgeValue = badges[item.key] > 0 ? badges[item.key] : null;
        return (
          <button
            key={item.key}
            type="button"
            className={`menu-hover-row w-full px-3 py-2.5 text-left text-sm font-semibold transition ${
              active ? "bg-[#0b0a0e] text-white" : "text-ink-700 hover:bg-black/5"
            }`}
            onClick={() => onNavigate(item.path)}
          >
            <span className="flex items-center gap-2">
              <item.Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {badgeValue ? (
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? "bg-[#ffffff]/20 text-white" : "bg-black/10 text-ink-700"}`}>
                  {badgeValue}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function PanelSidebar({ pathname, navItems, bottomNavItems, onNavigate, onLogout, badges }) {
  const rootPath = navItems[0]?.path;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
        <PanelSidebarNav pathname={pathname} navItems={navItems} rootPath={rootPath} onNavigate={onNavigate} badges={badges} />
      </div>

      <div className="mt-auto p-4 pt-0 sm:px-6">
        <div className="mb-3 border-t border-black/10 pt-3">
          <div className="space-y-1">
            {bottomNavItems.map((item) => {
              const active = routeMatches(pathname, item.path);
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`menu-hover-row w-full px-3 py-2.5 text-left text-sm font-semibold transition ${
                    active ? "bg-[#0b0a0e] text-white" : "text-ink-700 hover:bg-black/5"
                  }`}
                  onClick={() => onNavigate(item.path)}
                >
                  <span className="flex items-center gap-2">
                    <item.Icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              className="menu-hover-row w-full px-3 py-2.5 text-left text-sm font-semibold text-ink-700 transition hover:bg-black/5"
              onClick={async () => {
                await onLogout?.();
                navigateTo("/", { replace: true });
              }}
            >
              <span className="flex items-center gap-2">
                <LogoutIcon className="h-[18px] w-[18px] shrink-0" />
                <span className="min-w-0 flex-1 truncate">Logga ut</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPanelShell({ pathname, navItems, bottomNavItems, sectionTitle, onLogout, badges = {}, children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <section className="flex h-full min-h-0 bg-[#ffffff]">
      <aside className="hidden h-full w-[296px] shrink-0 border-r border-black/10 bg-[#ffffff] lg:block">
        <PanelSidebar
          pathname={pathname}
          navItems={navItems}
          bottomNavItems={bottomNavItems}
          onNavigate={(nextPath) => navigateTo(nextPath)}
          onLogout={onLogout}
          badges={badges}
        />
      </aside>

      <div data-admin-scroll-container="true" className="min-h-0 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-black/10 bg-[#ffffff] px-4 py-2.5 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="inline-flex min-h-0 items-center gap-1.5 rounded-full border border-black/20 bg-[#ffffff] px-3 py-2 text-xs font-semibold text-ink-700"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <PanelLeftIcon className="h-4 w-4" />
              Meny
            </button>
            <p className="text-sm font-semibold text-ink-800">{sectionTitle}</p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6">
          {children}
        </div>
      </div>

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-[70] bg-transparent lg:hidden" onClick={() => setMobileSidebarOpen(false)}>
          <div className="h-full w-[min(88vw,320px)] border-r border-black/10 bg-[#ffffff]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-end border-b border-black/10 p-3">
              <button
                type="button"
                className="inline-flex h-9 w-9 min-h-0 items-center justify-center rounded-full border border-black/10 bg-[#ffffff] text-ink-700"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <PanelSidebar
              pathname={pathname}
              navItems={navItems}
              bottomNavItems={bottomNavItems}
              onNavigate={(nextPath) => {
                setMobileSidebarOpen(false);
                navigateTo(nextPath);
              }}
              onLogout={onLogout}
              badges={badges}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default AdminPanelShell;
