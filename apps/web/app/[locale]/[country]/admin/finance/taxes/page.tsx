import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isFinancialStaff } from "@/lib/admin/finance-access";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { FinanceHubTabs } from "@/components/admin/FinanceHubTabs";
import { getTaxSummary } from "@/modules/finance/reporting";
import { getPlatformIncomeSummary } from "@/modules/finance/platform-tax-report";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return `$${(cents / 100).toLocaleString("en-CA", { maximumFractionDigits: 2 })}`;
}

export default async function AdminFinanceTaxesRemittancePage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!isFinancialStaff(user?.role)) redirect("/");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const q = Math.floor(now.getMonth() / 3);
  const qStart = new Date(now.getFullYear(), q * 3, 1);
  const qEnd = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

  const [m, qtr, y, platMonth] = await Promise.all([
    getTaxSummary({ start: monthStart, end: monthEnd }),
    getTaxSummary({ start: qStart, end: qEnd }),
    getTaxSummary({ start: yearStart, end: yearEnd }),
    getPlatformIncomeSummary({ start: monthStart, end: monthEnd }),
  ]);

  return (
    <HubLayout title="GST / QST (operational)" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher>
      <FinanceHubTabs />
      <div className="space-y-6">
        <div>
          <Link href="/admin/finance" className="text-sm text-amber-400 hover:text-amber-300">
            ← Finance overview
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-white">GST / QST remittance (operational)</h1>
          <p className="mt-2 text-sm text-slate-400">
            Totals are derived from <code className="text-slate-500">platform_invoices</code> rows with GST/QST fields. This is
            not a filed return — reconcile with your accounting system before remitting.
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-950/40 p-4 text-sm text-amber-100/90">
          Operational tax summary for administration and preparation only. Does not replace formal accounting or government
          filings.
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-semibold uppercase text-slate-500">This month</p>
            <p className="mt-2 text-2xl font-semibold text-white">{money(m.gstCollectedCents)} GST</p>
            <p className="text-lg text-slate-300">{money(m.qstCollectedCents)} QST</p>
            <p className="mt-2 text-xs text-slate-500">Base (est.) {money(m.taxableBaseCents)} · {m.invoiceCount} invoices</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-semibold uppercase text-slate-500">This quarter</p>
            <p className="mt-2 text-2xl font-semibold text-white">{money(qtr.gstCollectedCents)} GST</p>
            <p className="text-lg text-slate-300">{money(qtr.qstCollectedCents)} QST</p>
            <p className="mt-2 text-xs text-slate-500">Base (est.) {money(qtr.taxableBaseCents)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-semibold uppercase text-slate-500">This year</p>
            <p className="mt-2 text-2xl font-semibold text-white">{money(y.gstCollectedCents)} GST</p>
            <p className="text-lg text-slate-300">{money(y.qstCollectedCents)} QST</p>
            <p className="mt-2 text-xs text-slate-500">Base (est.) {money(y.taxableBaseCents)}</p>
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-sm font-semibold text-slate-200">GST / QST by payment type (this month)</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            {Object.entries(m.byPaymentType).length === 0 ? (
              <li>No invoice tax rows in range.</li>
            ) : (
              Object.entries(m.byPaymentType).map(([pt, v]) => (
                <li key={pt}>
                  <span className="text-slate-200">{pt}</span> — base {money(v.base)} · GST {money(v.gst)} · QST {money(v.qst)}
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-sm font-semibold text-slate-200">Platform gross (paid) vs tax (month)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Gross from platform payments; tax from invoices — may not tie 1:1 if invoices lag payments.
          </p>
          <p className="mt-3 text-sm text-slate-300">
            Gross paid (month): {money(platMonth.grossPlatformPaymentsCents)} · GST+QST on invoices:{" "}
            {money(platMonth.tax.gstCollectedCents + platMonth.tax.qstCollectedCents)}
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <a
            href="/api/admin/finance/export?format=csv&type=tax_invoices"
            className="rounded-xl bg-premium-gold px-4 py-2 text-sm font-semibold text-black"
          >
            Export invoice tax CSV
          </a>
          <Link href="/admin/finance/tax" className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-300">
            Tax document register
          </Link>
        </div>
      </div>
    </HubLayout>
  );
}
