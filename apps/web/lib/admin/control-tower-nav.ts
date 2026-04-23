/** Canonical control-tower navigation (paths are locale-agnostic; middleware adds `[locale]/[country]`). */

export type ControlTowerNavItem = { label: string; href: string };

export type ControlTowerNavGroup = { title: string; items: ControlTowerNavItem[] };

export const CONTROL_TOWER_NAV_GROUPS: ControlTowerNavGroup[] = [
  {
    title: "Command",
    items: [
      { label: "Overview", href: "/admin/overview" },
      { label: "Soft launch", href: "/admin/soft-launch" },
      { label: "Signup traffic", href: "/admin/acquisition/traffic" },
      { label: "Analytics", href: "/admin/analytics" },
      { label: "Alerts", href: "/admin/alerts" },
      { label: "Assistant", href: "/admin/assistant" },
      { label: "AI Sales Agent", href: "/admin/ai-sales-agent" },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { label: "Deals", href: "/admin/deals" },
      { label: "Listings", href: "/admin/listings" },
      { label: "Users", href: "/admin/users" },
      { label: "Brokers", href: "/admin/brokers" },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Content", href: "/admin/content" },
      { label: "Content intelligence", href: "/admin/content-intelligence" },
    ],
  },
  {
    title: "BNHUB & money",
    items: [
      { label: "BNHUB", href: "/admin/bnhub" },
      { label: "Bookings", href: "/admin/bookings" },
      { label: "Payments", href: "/admin/payments" },
      { label: "Payouts", href: "/admin/payouts" },
      { label: "Documents", href: "/admin/documents" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Hosts", href: "/admin/hosts" },
      { label: "Disputes", href: "/admin/disputes" },
      { label: "Promotions", href: "/admin/promotions" },
      { label: "AI control", href: "/admin/ai" },
      { label: "Settings", href: "/admin/settings" },
    ],
  },
];

export const CONTROL_TOWER_NAV_FLAT: ControlTowerNavItem[] = CONTROL_TOWER_NAV_GROUPS.flatMap((g) => g.items);
