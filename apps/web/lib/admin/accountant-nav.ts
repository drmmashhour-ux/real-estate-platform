import type { NavItem } from "@/lib/hub/navigation";

export const ACCOUNTANT_NAV: NavItem[] = [
  { label: "Financial dashboard", href: "/admin/finance" },
  { label: "Platform transactions", href: "/admin/finance/transactions" },
  { label: "Commissions", href: "/admin/commissions" },
  { label: "Broker payouts (manual)", href: "/admin/finance/payouts" },
  { label: "Tax & documents", href: "/admin/finance/tax" },
  { label: "Reports & exports", href: "/admin/finance/reports" },
  { label: "Broker tax (GST/QST)", href: "/admin/broker-tax" },
  { label: "Income", href: "/admin/income" },
  { label: "RE deal monitor", href: "/admin/transactions" },
];
