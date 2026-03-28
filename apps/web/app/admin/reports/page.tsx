import Link from "next/link";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";

import { prisma } from "@/lib/db";
import { hubNavigation } from "@/lib/hub/navigation";

const LINKS = [
  { label: "Daily report", desc: "KPIs, charts, export — DB-backed.", href: "/admin/reports/daily" },
  { label: "Weekly report", desc: "Trend comparison + finance signals.", href: "/admin/reports/weekly" },
  { label: "Monthly report", desc: "Executive snapshot + GST/QST hints.", href: "/admin/reports/monthly" },
  { label: "Yearly report", desc: "Annual roll-up and hub revenue mix.", href: "/admin/reports/yearly" },
  { label: "Finance reports & exports", desc: "CSV / PDF exports and rollups.", href: "/admin/finance/reports" },
  { label: "GST / QST remittance", desc: "Collected tax by period (operational).", href: "/admin/finance/taxes" },
  { label: "Tax documents", desc: "GST/QST document register.", href: "/admin/finance/tax" },
  { label: "Broker tax (GST/QST)", desc: "Broker registration context.", href: "/admin/broker-tax" },
  { label: "Accounting workspace", desc: "Ledger-aligned views.", href: "/admin/accounting" },
  { label: "Platform transactions", desc: "Payment-level inspection.", href: "/admin/finance/transactions" },
];

export default async function AdminReportsHubPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/reports");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN" && me?.role !== "ACCOUNTANT") redirect("/");
  const role = await getUserRole();
  return (
    <HubLayout title="Reports" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Financial & tax reports</h1>
          <p className="mt-2 text-sm text-slate-400">
            GST/QST grouping and exports are implemented in the finance and broker-tax modules — this hub centralizes
            navigation.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-premium-gold/30 bg-premium-gold/[0.06] p-5 transition hover:border-premium-gold/50"
            >
              <p className="text-sm font-semibold text-premium-gold">{item.label}</p>
              <p className="mt-2 text-xs text-slate-500">{item.desc}</p>
              <span className="mt-3 inline-block text-xs text-slate-400">Open →</span>
            </Link>
          ))}
        </div>
      </div>
    </HubLayout>
  );
}
