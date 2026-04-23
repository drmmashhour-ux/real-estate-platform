import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { isFinancialStaff } from "@/lib/admin/finance-access";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { AccountingSubnav } from "@/components/accounting/AccountingSubnav";
import { ReconciliationControls } from "@/components/accounting/ReconciliationControls";

export const dynamic = "force-dynamic";

export default async function AdminAccountingReconciliationPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!isFinancialStaff(user?.role)) redirect("/");

  const entries = await prisma.accountingEntry.findMany({
    orderBy: { entryDate: "desc" },
    take: 100,
    include: { reconciliation: true },
  });

  const theme = getHubTheme("admin");
  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

  return (
    <HubLayout title="Reconciliation" hubKey="admin" navigation={hubNavigation.admin} theme={theme}>
      <div className="space-y-6">
        <AccountingSubnav current="/admin/accounting/reconciliation" />
        <h1 className="text-xl font-semibold text-white">Manual reconciliation</h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Mark lines as <strong className="text-slate-200">unreconciled</strong>,{" "}
          <strong className="text-slate-200">matched</strong>, or <strong className="text-slate-200">flagged</strong> when
          you have reviewed them against bank or processor records. This is not automatic bank reconciliation unless a
          bank connection is enabled.
        </p>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-white/5">
                  <td className="px-3 py-2 whitespace-nowrap">{e.entryDate.toISOString().slice(0, 10)}</td>
                  <td className="px-3 py-2">{e.entryType}</td>
                  <td className="px-3 py-2">{e.category.replace(/_/g, " ")}</td>
                  <td className="px-3 py-2">{fmt(e.totalCents)}</td>
                  <td className="px-3 py-2">
                    {e.reconciliation ? (
                      <ReconciliationControls entryId={e.id} initialStatus={e.reconciliation.status} />
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </HubLayout>
  );
}
