import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { isFinancialStaff } from "@/lib/admin/finance-access";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { AccountingSubnav } from "@/components/accounting/AccountingSubnav";
import { AccountingEntryForm } from "@/components/accounting/AccountingEntryForm";
import { EXPENSE_CATEGORIES } from "@/lib/accounting/constants";

export const dynamic = "force-dynamic";

export default async function AdminAccountingExpensesPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!isFinancialStaff(user?.role)) redirect("/");

  const entries = await prisma.accountingEntry.findMany({
    where: { entryType: { in: ["expense", "refund"] } },
    orderBy: { entryDate: "desc" },
    take: 80,
    include: { reconciliation: true },
  });

  const theme = getHubTheme("admin");
  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

  return (
    <HubLayout title="Expense ledger" hubKey="admin" navigation={hubNavigation.admin} theme={theme}>
      <div className="space-y-6">
        <AccountingSubnav current="/admin/accounting/expenses" />
        <h1 className="text-xl font-semibold text-white">Expense ledger</h1>
        <AccountingEntryForm entryType="expense" categories={EXPENSE_CATEGORIES} />

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Subtotal</th>
                <th className="px-3 py-2">GST</th>
                <th className="px-3 py-2">QST</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Recon.</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-white/5">
                  <td className="px-3 py-2 whitespace-nowrap">{e.entryDate.toISOString().slice(0, 10)}</td>
                  <td className="px-3 py-2">{e.entryType}</td>
                  <td className="px-3 py-2">{e.category.replace(/_/g, " ")}</td>
                  <td className="px-3 py-2">{fmt(e.subtotalCents)}</td>
                  <td className="px-3 py-2">{fmt(e.gstCents)}</td>
                  <td className="px-3 py-2">{fmt(e.qstCents)}</td>
                  <td className="px-3 py-2">{fmt(e.totalCents)}</td>
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
