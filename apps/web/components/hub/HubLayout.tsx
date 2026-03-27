import Logo from "@/components/ui/Logo";
import { HubSwitcher } from "./HubSwitcher";
import type { HubKey } from "@/lib/hub/router";
import { getHubTheme } from "@/lib/hub/themes";
import type { NavItem } from "@/lib/hub/navigation";
import { getTrustGraphFeatureFlags } from "@/lib/trustgraph/feature-flags";
import { HubSidebarNav } from "./HubSidebarNav";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { WorkspaceTenantBadge } from "@/components/tenancy/WorkspaceTenantBadge";

type HubLayoutProps = {
  title: string;
  hubKey: HubKey;
  theme?: ReturnType<typeof getHubTheme>;
  navigation: NavItem[];
  navigationItems?: NavItem[];
  children: React.ReactNode;
  showAdminInSwitcher?: boolean;
  /** Show current multi-tenant workspace next to the title (broker CRM hubs). */
  showWorkspaceBadge?: boolean;
  quickActions?: React.ReactNode;
};

export function HubLayout({
  title,
  hubKey,
  theme: themeOverride,
  navigation,
  navigationItems,
  children,
  showAdminInSwitcher = false,
  showWorkspaceBadge = false,
  quickActions,
}: HubLayoutProps) {
  const theme = themeOverride ?? getHubTheme(hubKey);
  const baseNav = navigationItems ?? navigation;
  const navItems =
    hubKey === "admin" && !getTrustGraphFeatureFlags().adminQueue
      ? baseNav.filter((n) => n.href !== "/admin/trustgraph")
      : baseNav;
  const isDark =
    hubKey === "luxury" ||
    hubKey === "broker" ||
    hubKey === "investments" ||
    hubKey === "projects" ||
    hubKey === "admin";

  const bannerBorder = isDark ? "border-white/10" : "border-black/10";

  return (
    <div
      className="flex min-h-[80vh] flex-col"
      style={
        {
          "--hub-bg": theme.bg,
          "--hub-accent": theme.accent,
          "--hub-sidebar": theme.sidebarBg ?? theme.bg,
          "--hub-card": theme.cardBg ?? theme.bg,
        } as React.CSSProperties
      }
    >
      <div className="flex flex-1 flex-col lg:flex-row">
        <aside
          className={`w-full shrink-0 border-b py-4 lg:w-60 lg:border-b-0 lg:border-r ${bannerBorder}`}
          style={{ backgroundColor: "var(--hub-sidebar)" }}
        >
          <HubSidebarNav items={navItems} theme={theme} isDark={isDark} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="h-1 w-full shrink-0" style={{ backgroundColor: theme.accent }} aria-hidden />
          <header
            data-tour="hub-header"
            className={`flex min-w-0 flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${bannerBorder}`}
            style={{ backgroundColor: "var(--hub-sidebar)" }}
          >
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <Logo
                showName={true}
                className={
                  isDark
                    ? "shrink-0 text-white [&_span]:text-white"
                    : "shrink-0 text-slate-900 [&_span]:text-slate-900"
                }
              />
              <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <h1
                  className="truncate text-xl font-semibold"
                  style={{ color: isDark ? "#fff" : "#111" }}
                >
                  {title}
                </h1>
                {showWorkspaceBadge ? <WorkspaceTenantBadge /> : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <NotificationBell />
              <HubSwitcher showAdmin={showAdminInSwitcher} currentHubKey={hubKey} />
            </div>
          </header>
          {quickActions ? (
            <div
              className={`border-b px-4 py-2 sm:px-6 ${bannerBorder}`}
              style={{ backgroundColor: "var(--hub-sidebar)" }}
            >
              {quickActions}
            </div>
          ) : null}
          <main
            className="flex-1 p-4 sm:p-6 page-enter"
            style={{ backgroundColor: "var(--hub-bg)" }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
