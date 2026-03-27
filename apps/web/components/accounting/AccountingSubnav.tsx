import Link from "next/link";

const LINKS = [
  { href: "/admin/accounting", label: "Overview" },
  { href: "/admin/accounting/revenue", label: "Revenue" },
  { href: "/admin/accounting/expenses", label: "Expenses" },
  { href: "/admin/accounting/payouts", label: "Payouts" },
  { href: "/admin/accounting/reconciliation", label: "Reconciliation" },
];

export function AccountingSubnav({ current }: { current?: string }) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-white/10 pb-4" aria-label="Accounting">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            current === l.href ? "bg-[#C9A646]/20 text-[#C9A646]" : "text-slate-300 hover:bg-white/5"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
