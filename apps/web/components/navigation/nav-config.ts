import type { ReactNode } from "react";

export type HubRole = "user" | "host" | "broker" | "admin";

export type NavItem = {
  href: string;
  label: string;
  icon?: ReactNode;
};

/** Minimal cross-hub map — extend per product; keep labels short. */
export const primaryNavByRole: Record<HubRole, NavItem[]> = {
  user: [
    { href: "/listings", label: "Listings" },
    { href: "/bnhub/stays", label: "Stays" },
    { href: "/search", label: "Search" },
    { href: "/dashboard", label: "Dashboard" },
  ],
  host: [
    { href: "/host", label: "Host home" },
    { href: "/host/listings", label: "Listings" },
    { href: "/bnhub/host/dashboard", label: "BNHub" },
    { href: "/host/pricing", label: "Pricing" },
  ],
  broker: [
    { href: "/broker/dashboard", label: "Broker" },
    { href: "/listings", label: "Listings" },
    { href: "/dashboard", label: "Workspace" },
  ],
  admin: [
    { href: "/admin", label: "Admin" },
    { href: "/admin/dashboard", label: "Overview" },
    { href: "/admin/listings", label: "Listings" },
  ],
};
