import { useLayoutEffect, useRef, useState } from "react";
import { navigateTo, routeMatches } from "../../lib/router";
import { LogoutIcon, PanelLeftIcon, XIcon } from "../icons/UiIcons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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
          <Button
            key={item.key}
            type="button"
            variant="ghost"
            data-active={active ? "true" : "false"}
            title={collapsed ? item.label : undefined}
            aria-label={item.label}
            className={`admin-nav-row menu-hover-row h-auto relative z-[1] w-full justify-start text-left text-sm font-semibold ${
              collapsed ? "flex justify-center px-0 py-2.5" : "px-3 py-2.5"
            } ${active ? "text-white hover:bg-transparent hover:text-white" : "text-ink-700 hover:bg-black/5"}`}
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
          </Button>
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
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-black/10 text-ink-700 hover:border-[#0b0a0e]/25 hover:bg-transparent"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? "Expandera meny" : "Fäll ihop meny"}
              aria-pressed={collapsed}
              title={collapsed ? "Expandera meny" : "Fäll ihop meny"}
            >
              <PanelLeftIcon className={`admin-sidebar-toggle-icon h-4 w-4 ${collapsed ? "rotate-180" : ""}`} />
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-auto p-4 pt-0 sm:px-6">
        <div className="mb-3 border-t border-black/10 pt-3">
          <div className="space-y-1">
            {bottomNavItems.map((item) => {
              const active = routeMatches(pathname, item.path);
              return (
                <Button
                  key={item.key}
                  type="button"
                  variant="ghost"
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                  className={`admin-nav-row menu-hover-row h-auto w-full justify-start text-left text-sm font-semibold ${
                    collapsed ? "flex justify-center px-0 py-2.5" : "px-3 py-2.5"
                  } ${active ? "admin-nav-row--active bg-[#0b0a0e] text-white hover:bg-[#0b0a0e] hover:text-white" : "text-ink-700 hover:bg-black/5"}`}
                  onClick={() => onNavigate(item.path)}
                >
                  <span className={`flex items-center ${collapsed ? "justify-center" : "gap-2"}`}>
                    <item.Icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
                  </span>
                </Button>
              );
            })}
            <Button
              type="button"
              variant="ghost"
              title={collapsed ? "Logga ut" : undefined}
              aria-label="Logga ut"
              className={`admin-nav-row menu-hover-row h-auto w-full justify-start text-left text-sm font-semibold text-ink-700 hover:bg-black/5 ${
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
            </Button>
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
            <Button
              type="button"
              variant="outline"
              className="h-auto gap-1.5 rounded-full border-black/20 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-transparent"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <PanelLeftIcon className="h-4 w-4" />
              Meny
            </Button>
            <p className="text-sm font-semibold text-ink-800">{sectionTitle}</p>
          </div>
        </div>

        {fullBleedContent ? (
          <div key={contentKey ?? pathname} className="admin-section-enter min-h-0 flex-1">{children}</div>
        ) : (
          <div key={contentKey ?? pathname} className="admin-section-enter--lift mx-auto w-full max-w-[1600px] p-4 sm:p-6">{children}</div>
        )}
      </div>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-[min(88vw,320px)] max-w-none gap-0 bg-[#ffffff] p-0">
          <div className="flex items-center justify-end border-b border-black/10 p-3">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="h-9 w-9 rounded-full border-black/10 text-ink-700 hover:bg-transparent"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
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
        </SheetContent>
      </Sheet>
    </section>
  );
}

export default AdminPanelShell;
