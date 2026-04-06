/**
 * Canonical entry points for LECIPM “hubs” — used by marketing nav, footer, and home strips.
 * Public routes work without sign-in; dashboard routes require login (middleware).
 */

export type HubLink = { href: string; label: string; hint?: string };

export const HUB_LINKS_PUBLIC: HubLink[] = [
  { href: "/listings", label: "Buy hub", hint: "Search listings" },
  { href: "/sell", label: "Seller hub", hint: "FSBO & seller tools" },
  { href: "/bnhub", label: "BNHub", hint: "Short-term stays" },
  { href: "/bnhub/stays", label: "Find a stay", hint: "Guest search" },
  { href: "/mortgage", label: "Mortgage hub", hint: "Financing & experts" },
];

export const HUB_LINKS_TOOLS: HubLink[] = [
  { href: "/analyze", label: "Analyze a property", hint: "AI insights" },
  { href: "/search/bnhub", label: "Smart BNHub search", hint: "AI-ranked stays" },
  { href: "/tools/deal-analyzer", label: "Deal analyzer", hint: "Tools" },
];

/** Shown as “after sign-in” in marketing — routes still exist for deep links. */
export const HUB_LINKS_DASHBOARDS: HubLink[] = [
  { href: "/dashboard", label: "Main dashboard", hint: "Portfolio & hub" },
  { href: "/dashboard/buyer", label: "Buyer dashboard", hint: "" },
  { href: "/dashboard/seller", label: "Seller dashboard", hint: "" },
  { href: "/dashboard/bnhub", label: "BNHub host hub", hint: "" },
  { href: "/dashboard/finance", label: "Finance hub", hint: "Payments & invoices" },
  { href: "/dashboard/ai", label: "AI hub", hint: "Copilot & control center" },
  { href: "/broker/dashboard", label: "Broker dashboard", hint: "CRM & pipeline" },
];

export const HUB_LINKS_SUPPORT: HubLink[] = [{ href: "/help", label: "Help center", hint: "Guides & support" }];

export const HUB_LINKS_ADMIN: HubLink[] = [{ href: "/admin", label: "Admin console", hint: "Staff" }];

/** Short list for marketing footer — mirrors the Hubs menu. */
export const HUB_LINKS_FOOTER: HubLink[] = [
  { href: "/listings", label: "Buy hub" },
  { href: "/sell", label: "Seller hub" },
  { href: "/bnhub", label: "BNHub" },
  { href: "/mortgage", label: "Mortgage hub" },
  { href: "/dashboard/finance", label: "Finance hub", hint: "Sign in" },
  { href: "/analyze", label: "AI analysis" },
  { href: "/dashboard/ai", label: "AI hub", hint: "Sign in" },
  { href: "/help", label: "Help center" },
  { href: "/dashboard", label: "Dashboard", hint: "Sign in" },
  { href: "/admin", label: "Admin console", hint: "Staff" },
];
