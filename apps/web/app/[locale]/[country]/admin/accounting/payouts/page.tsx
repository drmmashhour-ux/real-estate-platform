import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { isFinancialStaff } from "@/lib/admin/finance-access";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { AccountingSubnav } from "@/components/accounting/AccountingSubnav";
import { AccountingEntryForm } from "@/components/accounting/AccountingEntryForm";
import { PAYOUT_CATEGORIES } from "@/lib/accounting/constants";

export const dynamic = "force-dynamic";

export default async function AdminAccountingPayoutsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!isFinancialStaff(user?.role)) redirect("/");

  const entries = await prisma.accountingEntry.findMany({
    where: { entryType: "payout" },
    orderBy: { entryDate: "desc" },
    take: 80,
    include: { reconciliation: true },
  });

  const theme = getHubTheme("admin");
  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

  return (
    <HubLayout title="Payout ledger" hubKey="admin" navigation={hubNavigation.admin} theme={theme}>
      <div className="space-y-6">
        <AccountingSubnav current="/admin/accounting/payouts" />
        <h1 className="text-xl font-semibold text-white">Payout ledger</h1>
        <p className="text-sm text-slate-400">
          Track host payouts, expert payouts, and broker commissions. Status: pending / completed / failed.
        </p>
        <AccountingEntryForm entryType="payout" categories={PAYOUT_CATEGORIES} defaultStatus="pending" />

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Recon.</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-white/5">
                  <td className="px-3 py-2 whitespace-nowrap">{e.entryDate.toISOString().slice(0, 10)}</td>
                  <td className="px-3 py-2">{e.category.replace(/_/g, " ")}</td>
                  <td className="px-3 py-2">{fmt(e.totalCents)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        e.status === "failed"
                          ? "text-red-400"
                          : e.status === "pending"
                            ? "text-amber-300"
                            : "text-emerald-400"
                      }
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">{e.reconciliation?.status ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </HubLayout>
  );
}
