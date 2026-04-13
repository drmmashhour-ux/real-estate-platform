"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs: { href: string; label: string }[] = [
  { href: "/admin/finance", label: "Overview" },
  { href: "/admin/finance/overview", label: "Model" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/finance/taxes", label: "GST / QST" },
  { href: "/admin/finance/invoices", label: "Invoices" },
  { href: "/admin/finance/payouts", label: "Payouts" },
  { href: "/admin/finance/commissions", label: "Commissions" },
  { href: "/admin/finance/brokers", label: "Brokers" },
  { href: "/admin/finance/transactions", label: "Line items" },
  { href: "/admin/finance/tax", label: "Tax docs" },
];

export function FinanceHubTabs() {
  const pathname = usePathname();
  if (!pathname?.startsWith("/admin/finance")) return null;

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-slate-800 pb-3">
      {tabs.map((t) => {
        const active =
          t.href === "/admin/finance"
            ? pathname === "/admin/finance"
            : pathname === t.href || pathname?.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              active
                ? "border-premium-gold/60 bg-premium-gold/15 text-premium-gold"
                : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-amber-700/50 hover:text-amber-200"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
      <Link
        href="/admin/payouts"
        className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-300 hover:border-amber-700/50 hover:text-amber-200"
      >
        Host payouts (BNHUB)
      </Link>
    </nav>
  );
}
