/**
 * LECIPM Senior Living Hub — config-driven navigation per role.
 * Paths are suffixes relative to `/${locale}/${country}/dashboard` unless `href` starts with `/`.
 */

export type LecipmShellRole = "RESIDENCE" | "MANAGEMENT" | "ADMIN";

export type NavPermission =
  | "authenticated"
  | "residence"
  | "management"
  | "admin"
  /** Feature-flagged sections */
  | "lecipm_ai_nav";

export type QuickActionPermission = NavPermission;

export type NavigationItem = {
  id: string;
  label: string;
  /** Short label for collapsed sidebar tooltip / mobile */
  shortLabel?: string;
  /** Lucide-style name; mapped in UI (see dashboard-shell icon map). */
  icon: string;
  /** Path under dashboard base, e.g. "residence/leads", or absolute app path */
  path: string;
  permissions: NavPermission[];
};

export type NavSection<T extends NavigationItem = NavigationItem> = {
  id: string;
  title: string;
  items: T[];
};

export type RoleNavConfig = {
  role: LecipmShellRole;
  label: string;
  sections: NavSection[];
};

/** Optional feature flags — extend via env without code edits. */
export function getNavFeatureFlags(): Record<string, boolean> {
  return {
    lecipm_ai_nav: process.env.NEXT_PUBLIC_LECIPM_AI_NAV === "1",
  };
}

export const RESIDENCE_NAV: RoleNavConfig = {
  role: "RESIDENCE",
  label: "Residence",
  sections: [
    {
      id: "primary",
      title: "",
      items: [
        {
          id: "overview",
          label: "Overview",
          icon: "home",
          path: "residence",
          permissions: ["authenticated", "residence"],
        },
        {
          id: "leads",
          label: "Leads",
          shortLabel: "Leads",
          icon: "inbox",
          path: "residence/leads",
          permissions: ["authenticated", "residence"],
        },
        {
          id: "visits",
          label: "Visits",
          icon: "calendar",
          path: "residence/calendar",
          permissions: ["authenticated", "residence"],
        },
        {
          id: "units",
          label: "Units / Availability",
          shortLabel: "Units",
          icon: "building",
          path: "residence/units",
          permissions: ["authenticated", "residence"],
        },
        {
          id: "messages",
          label: "Messages",
          icon: "message",
          path: "residence/messages",
          permissions: ["authenticated", "residence"],
        },
        {
          id: "performance",
          label: "Performance",
          icon: "chart",
          path: "residence/performance",
          permissions: ["authenticated", "residence"],
        },
        {
          id: "profile",
          label: "Profile",
          icon: "settings",
          path: "residence/profile",
          permissions: ["authenticated", "residence"],
        },
      ],
    },
    {
      id: "intelligence",
      title: "",
      items: [
        {
          id: "ai",
          label: "AI Suggestions",
          icon: "sparkles",
          path: "residence/ai",
          permissions: ["authenticated", "residence", "lecipm_ai_nav"],
        },
      ],
    },
  ],
};

export const MANAGEMENT_NAV: RoleNavConfig = {
  role: "MANAGEMENT",
  label: "Management",
  sections: [
    {
      id: "primary",
      title: "",
      items: [
        { id: "overview", label: "Overview", icon: "home", path: "management", permissions: ["authenticated", "management"] },
        { id: "residences", label: "Residences", icon: "building", path: "management/portfolio", permissions: ["authenticated", "management"] },
        { id: "team", label: "Team", icon: "users", path: "management/team", permissions: ["authenticated", "management"] },
        { id: "leads", label: "Leads", icon: "inbox", path: "management/leads", permissions: ["authenticated", "management"] },
        { id: "performance", label: "Performance", icon: "chart", path: "management/performance", permissions: ["authenticated", "management"] },
        { id: "occupancy", label: "Occupancy", icon: "layers", path: "management/occupancy", permissions: ["authenticated", "management"] },
        { id: "insights", label: "Insights", icon: "brain", path: "management/insights", permissions: ["authenticated", "management"] },
      ],
    },
  ],
};

export const ADMIN_NAV: RoleNavConfig = {
  role: "ADMIN",
  label: "Admin",
  sections: [
    {
      id: "core",
      title: "Core",
      items: [
        { id: "overview", label: "Overview", icon: "home", path: "admin", permissions: ["authenticated", "admin"] },
        { id: "marketplace", label: "Marketplace", icon: "globe", path: "admin/platform", permissions: ["authenticated", "admin"] },
      ],
    },
    {
      id: "supply",
      title: "Supply",
      items: [
        { id: "cities", label: "Cities", icon: "map", path: "senior/expansion", permissions: ["authenticated", "admin"] },
        {
          id: "operators",
          label: "Operators",
          icon: "building",
          path: "senior/command-center",
          permissions: ["authenticated", "admin"],
        },
        {
          id: "users",
          label: "Users",
          icon: "users",
          path: "admin/users",
          permissions: ["authenticated", "admin"],
        },
        {
          id: "soins_hub",
          label: "Soins Hub",
          icon: "heart",
          path: "admin/soins",
          permissions: ["authenticated", "admin"],
        },
      ],
    },
    {
      id: "performance",
      title: "Performance",
      items: [
        { id: "revenue", label: "Revenue", icon: "coins", path: "admin/revenue", permissions: ["authenticated", "admin"] },
        { id: "growth_engine", label: "Growth Engine", icon: "chart", path: "admin/growth-engine", permissions: ["authenticated", "admin"] },
        { id: "analytics", label: "Analytics", icon: "chart", path: "admin/analytics", permissions: ["authenticated", "admin"] },
      ],
    },
    {
      id: "intelligence",
      title: "Intelligence",
      items: [
        { id: "ai_actions", label: "AI Actions", icon: "bot", path: "admin/ai-actions", permissions: ["authenticated", "admin"] },
        {
          id: "call_replay",
          label: "Call replay",
          shortLabel: "Replay",
          icon: "phone",
          path: "admin/call-replay",
          permissions: ["authenticated", "admin"],
        },
        {
          id: "ai_sales_manager",
          label: "AI Sales Manager",
          shortLabel: "ASM",
          icon: "bot",
          path: "admin/ai-sales-manager",
          permissions: ["authenticated", "admin"],
        },
        {
          id: "revenue_predictor",
          label: "Revenue predictor",
          shortLabel: "Revenue",
          icon: "coins",
          path: "admin/revenue-predictor",
          permissions: ["authenticated", "admin"],
        },
        { id: "risk", label: "Risk & Alerts", icon: "alert", path: "admin/risk", permissions: ["authenticated", "admin"] },
      ],
    },
    {
      id: "system",
      title: "System",
      items: [{ id: "reports", label: "Reports", icon: "file", path: "admin/reports", permissions: ["authenticated", "admin"] }],
    },
  ],
};

export type AccessFlags = {
  residence: boolean;
  management: boolean;
  admin: boolean;
};

export function filterQuickActions(actions: QuickAction[], flags: AccessFlags): QuickAction[] {
  const ok = (p: QuickActionPermission): boolean => {
    if (p === "authenticated") return true;
    if (p === "residence") return flags.residence;
    if (p === "management") return flags.management;
    if (p === "admin") return flags.admin;
    if (p === "lecipm_ai_nav") return false;
    return false;
  };
  return actions.filter((a) => a.permissions.every(ok));
}

export function filterNavigationForAccess(
  config: RoleNavConfig,
  flags: AccessFlags,
  featureFlags: Record<string, boolean>,
): NavSection[] {
  const permOk = (p: NavPermission): boolean => {
    if (p === "authenticated") return true;
    if (p === "residence") return flags.residence;
    if (p === "management") return flags.management;
    if (p === "admin") return flags.admin;
    if (p === "lecipm_ai_nav") return Boolean(featureFlags.lecipm_ai_nav);
    return false;
  };

  return config.sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.permissions.every(permOk)),
    }))
    .filter((s) => s.items.length > 0);
}

export type QuickAction = {
  id: string;
  label: string;
  path: string;
  permissions: QuickActionPermission[];
};

export const RESIDENCE_QUICK_ACTIONS: QuickAction[] = [
  { id: "add_unit", label: "Add unit", path: "residence/units?action=new", permissions: ["residence"] },
  { id: "respond_lead", label: "Respond to lead", path: "residence/leads", permissions: ["residence"] },
  { id: "schedule_visit", label: "Schedule visit", path: "residence/calendar", permissions: ["residence"] },
];

export const MANAGEMENT_QUICK_ACTIONS: QuickAction[] = [
  { id: "add_residence", label: "Add residence", path: "management/portfolio?action=new", permissions: ["management"] },
  { id: "assign_manager", label: "Assign manager", path: "management/team", permissions: ["management"] },
];

export const ADMIN_QUICK_ACTIONS: QuickAction[] = [
  { id: "approve_operator", label: "Approve operator", path: "senior/command-center", permissions: ["admin"] },
  { id: "adjust_pricing", label: "Adjust pricing", path: "admin/platform", permissions: ["admin"] },
  { id: "review_alert", label: "Review alert", path: "admin/risk", permissions: ["admin"] },
];

/** Resolves navigation `path` to href. Dashboard-relative paths join `base`. `admin/users` → `/[locale]/[country]/admin/users`. */
export function resolveDashboardHref(base: string, path: string): string {
  if (path.startsWith("/")) return path;
  if (path === "admin/users") {
    const root = base.replace(/\/dashboard\/?$/, "");
    return `${root}/admin/users`;
  }
  const clean = path.replace(/^\//, "");
  return `${base.replace(/\/$/, "")}/${clean}`;
}

/** Active nav item: exact match for top-level hubs (`residence`, `admin`, …); prefix match for nested paths (`residence/leads`). */
export function isNavPathActive(pathname: string, base: string, itemPath: string): boolean {
  const href = resolveDashboardHref(base, itemPath);
  if (pathname === href) return true;
  const depth = itemPath.split("/").filter(Boolean).length;
  if (depth <= 1) return false;
  return pathname.startsWith(`${href}/`);
}
