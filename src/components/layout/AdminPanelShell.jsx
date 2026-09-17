import { useLayoutEffect, useRef, useState } from "react";
import { navigateTo, routeMatches } from "../../lib/router";
import { LogoutIcon, PanelLeftIcon, XIcon } from "../icons/UiIcons";

function PanelSidebarNav({ pathname, navItems, rootPath, onNavigate, badges, collapsed = false }) {
  const navRef = useRef(null);
  const hasAnimatedRef = useRef(false);
  const [indicator, setIndicator] = useState(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const activeEl = nav.querySelector('[data-active="true"]');
    if (!activeEl) {
      setIndicator((prev) => (prev ? { ...prev, visible: false } : prev));
      return;
    }
    setIndicator({
      top: activeEl.offsetTop,
      height: activeEl.offsetHeight,
      visible: true,
      animate: hasAnimatedRef.current,
    });
    hasAnimatedRef.current = true;
  }, [pathname, collapsed, navItems]);

  return (
    <nav ref={navRef} className="relative">
      <span
        aria-hidden="true"
        className={`admin-nav-indicator ${indicator?.animate ? "is-animated" : ""}`}
        style={
          indicator?.visible
            ? { transform: `translateY(${indicator.top}px)`, height: `${indicator.height}px`, opacity: 1 }
            : { opacity: 0 }
        }
      />
      <div className="space-y-1">
      {navItems.map((item) => {
        const active = item.path === rootPath
          ? pathname === rootPath || pathname === `${rootPath}/`
          : routeMatches(pathname, item.path);
        const badgeValue = badges[item.key] > 0 ? badges[item.key] : null;
        return (
          <button
            key={item.key}
            type="button"
            data-active={active ? "true" : "false"}
            title={collapsed ? item.label : undefined}
            aria-label={item.label}
            className={`admin-nav-row menu-hover-row relative z-[1] w-full text-left text-sm font-semibold ${
              collapsed ? "flex justify-center px-0 py-2.5" : "px-3 py-2.5"
            } ${active ? "text-white" : "text-ink-700 hover:bg-black/5"}`}
            onClick={() => onNavigate(item.path)}
          >
            <span className={`flex items-center ${collapsed ? "justify-center" : "gap-2"}`}>
              <span className="relative inline-flex shrink-0">
                <item.Icon className="h-[18px] w-[18px] shrink-0" />
                {collapsed && badgeValue ? (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#e5484d] ring-2 ring-[#ffffff]" />
                ) : null}
              </span>
              {!collapsed ? (
                <>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {badgeValue ? (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? "bg-[#ffffff]/20 text-white" : "bg-black/10 text-ink-700"}`}>
                      {badgeValue}
                    </span>
                  ) : null}
                </>
              ) : null}
            </span>
          </button>
        );
      })}
      </div>
    </nav>
  );
}

function PanelSidebar({ pathname, navItems, bottomNavItems, onNavigate, onLogout, badges, collapsed = false, onToggleCollapsed }) {
  const rootPath = navItems[0]?.path;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
        <PanelSidebarNav pathname={pathname} navItems={navItems} rootPath={rootPath} onNavigate={onNavigate} badges={badges} collapsed={collapsed} />
        {onToggleCollapsed ? (
          <div className={`mt-2 flex ${collapsed ? "justify-center" : "justify-end"}`}>
            <button
              type="button"
              className="inline-flex h-9 w-9 min-h-0 shrink-0 items-center justify-center rounded-full border border-black/10 bg-[#ffffff] text-ink-700 transition hover:border-[#0b0a0e]/25"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? "Expandera meny" : "Fäll ihop meny"}
              aria-pressed={collapsed}
              title={collapsed ? "Expandera meny" : "Fäll ihop meny"}
            >
              <PanelLeftIcon className={`admin-sidebar-toggle-icon h-4 w-4 ${collapsed ? "rotate-180" : ""}`} />
            </button>
          </div>
        ) : null}
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
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                  className={`admin-nav-row menu-hover-row w-full text-left text-sm font-semibold ${
                    collapsed ? "flex justify-center px-0 py-2.5" : "px-3 py-2.5"
                  } ${active ? "admin-nav-row--active bg-[#0b0a0e] text-white" : "text-ink-700 hover:bg-black/5"}`}
                  onClick={() => onNavigate(item.path)}
                >
                  <span className={`flex items-center ${collapsed ? "justify-center" : "gap-2"}`}>
                    <item.Icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              title={collapsed ? "Logga ut" : undefined}
              aria-label="Logga ut"
              className={`admin-nav-row menu-hover-row w-full text-left text-sm font-semibold text-ink-700 hover:bg-black/5 ${
                collapsed ? "flex justify-center px-0 py-2.5" : "px-3 py-2.5"
              }`}
              onClick={async () => {
                await onLogout?.();
                navigateTo("/", { replace: true });
              }}
            >
              <span className={`flex items-center ${collapsed ? "justify-center" : "gap-2"}`}>
                <LogoutIcon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed ? <span className="min-w-0 flex-1 truncate">Logga ut</span> : null}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPanelShell({ pathname, navItems, bottomNavItems, sectionTitle, onLogout, badges = {}, fullBleedContent = false, contentKey, children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <section className="flex h-full min-h-0 bg-[#ffffff]">
      <aside
        className={`admin-sidebar-panel hidden h-full shrink-0 overflow-hidden border-r border-black/10 bg-[#ffffff] lg:block ${
          sidebarCollapsed ? "w-[84px]" : "w-[296px]"
        }`}
      >
        <PanelSidebar
          pathname={pathname}
          navItems={navItems}
          bottomNavItems={bottomNavItems}
          onNavigate={(nextPath) => navigateTo(nextPath)}
          onLogout={onLogout}
          badges={badges}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
        />
      </aside>

      <div
        data-admin-scroll-container="true"
        className={`flex min-h-0 flex-1 flex-col ${fullBleedContent ? "overflow-hidden" : "overflow-y-auto"}`}
      >
        <div className="sticky top-0 z-10 shrink-0 border-b border-black/10 bg-[#ffffff] px-4 py-2.5 lg:hidden">
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

        {fullBleedContent ? (
          <div key={contentKey ?? pathname} className="admin-section-enter min-h-0 flex-1">{children}</div>
        ) : (
          <div key={contentKey ?? pathname} className="admin-section-enter--lift mx-auto w-full max-w-[1600px] p-4 sm:p-6">{children}</div>
        )}
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
