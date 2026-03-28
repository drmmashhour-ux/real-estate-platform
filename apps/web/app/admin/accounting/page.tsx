import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isFinancialStaff } from "@/lib/admin/finance-access";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { AccountingSubnav } from "@/components/accounting/AccountingSubnav";
import { aggregateMonthEnd } from "@/lib/accounting/summary";

export const dynamic = "force-dynamic";

export default async function AdminAccountingOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!isFinancialStaff(user?.role)) redirect("/");

  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year ?? now.getFullYear());
  const month = Number(params.month ?? now.getMonth() + 1);

  const entries = await prisma.accountingEntry.findMany({
    where: {
      entryDate: {
        gte: new Date(year, month - 1, 1),
        lte: new Date(year, month, 0, 23, 59, 59, 999),
      },
    },
  });

  const summary = aggregateMonthEnd(entries, year, month);
  const theme = getHubTheme("admin");

  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

  return (
    <HubLayout title="Accounting" hubKey="admin" navigation={hubNavigation.admin} theme={theme}>
      <div className="space-y-6">
        <AccountingSubnav current="/admin/accounting" />
        <div>
          <h1 className="text-xl font-semibold text-white">Internal accounting</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Revenue, expense, and payout ledgers for visibility. Reconciliation status is{" "}
            <strong className="text-slate-300">manual</strong> — we do not claim automatic bank matching unless a bank feed
            is connected.
          </p>
        </div>

        <form className="flex flex-wrap items-end gap-3 text-sm">
          <label className="text-slate-400">
            Year
            <input
              type="number"
              name="year"
              defaultValue={year}
              className="ml-2 rounded border border-white/10 bg-black/40 px-2 py-1 text-white"
            />
          </label>
          <label className="text-slate-400">
            Month
            <input
              type="number"
              name="month"
              min={1}
              max={12}
              defaultValue={month}
              className="ml-2 rounded border border-white/10 bg-black/40 px-2 py-1 text-white"
            />
          </label>
          <button type="submit" className="rounded-lg bg-premium-gold/90 px-3 py-1.5 font-medium text-black">
            Apply
          </button>
        </form>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-premium-gold/30 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-wider text-premium-gold">Gross revenue (subtotal)</p>
            <p className="mt-2 text-2xl font-semibold text-white">{fmt(summary.grossRevenueCents)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">GST collected (revenue)</p>
            <p className="mt-2 text-xl text-white">{fmt(summary.revenueGstCents)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">QST collected (revenue)</p>
            <p className="mt-2 text-xl text-white">{fmt(summary.revenueQstCents)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Expenses (subtotal)</p>
            <p className="mt-2 text-xl text-white">{fmt(summary.totalExpenseCents)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">GST on expenses</p>
            <p className="mt-2 text-xl text-white">{fmt(summary.expenseGstCents)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">QST on expenses</p>
            <p className="mt-2 text-xl text-white">{fmt(summary.expenseQstCents)}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-black/40 p-4 sm:col-span-2">
            <p className="text-xs uppercase tracking-wider text-emerald-400/90">Net revenue (illustrative)</p>
            <p className="mt-2 text-2xl font-semibold text-white">{fmt(summary.netRevenueCents)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Profit estimate (illustrative)</p>
            <p className="mt-2 text-xl text-white">{fmt(summary.profitEstimateCents)}</p>
          </div>
        </section>

        <p className="text-xs text-slate-500">
          Internal summary only — not a government filing or audited statement. Verify with your accountant.
        </p>

        <div className="flex flex-wrap gap-3">
          <a
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5"
            href={`/api/admin/accounting/export?format=csv&type=month&year=${year}&month=${month}`}
          >
            Export month CSV
          </a>
          <a
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5"
            href={`/api/admin/accounting/export?format=pdf&type=month&year=${year}&month=${month}`}
          >
            Export month PDF
          </a>
          <Link href="/admin/accounting/revenue" className="rounded-lg bg-premium-gold/90 px-4 py-2 text-sm font-medium text-black">
            Revenue ledger →
          </Link>
        </div>
      </div>
    </HubLayout>
  );
}
