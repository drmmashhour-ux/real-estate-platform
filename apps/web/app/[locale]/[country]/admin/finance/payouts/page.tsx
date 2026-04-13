import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isFinancialStaff } from "@/lib/admin/finance-access";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { FinanceHubTabs } from "@/components/admin/FinanceHubTabs";
import { getPayoutSummary } from "@/modules/finance/reporting";

export const dynamic = "force-dynamic";

export default async function AdminFinancePayoutsHubPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!isFinancialStaff(user?.role)) redirect("/");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const payoutRollup = await getPayoutSummary({ start: monthStart, end: monthEnd });

  const brokerRows = await prisma.brokerPayout.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { broker: { select: { email: true, name: true } } },
  });

  const hostPending = await prisma.payment.count({
    where: { status: "COMPLETED", hostPayoutReleasedAt: null },
  });

  return (
    <HubLayout title="Payouts" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher>
      <FinanceHubTabs />
      <div className="space-y-6">
        <div>
          <Link href="/admin/finance" className="text-sm text-amber-400 hover:text-amber-300">
            ← Finance overview
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-white">Payouts center</h1>
          <p className="mt-1 text-sm text-slate-400">
            Broker batches (manual recording) and BNHUB host release queue. For host actions use the dedicated admin tool.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-slate-500">Broker pending (open batches)</p>
            <p className="mt-1 text-2xl font-semibold text-amber-200">
              ${(payoutRollup.brokerPayoutsPendingCents / 100).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">{payoutRollup.brokerPayoutsPendingCount} batches</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-slate-500">Broker paid (all-time aggregate in module)</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-300">
              ${(payoutRollup.brokerPayoutsPaidCents / 100).toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-slate-500">BNHUB host transfers pending release</p>
            <p className="mt-1 text-2xl font-semibold text-white">{hostPending}</p>
            <Link href="/admin/payouts" className="mt-2 inline-block text-sm text-premium-gold hover:underline">
              Open host payouts →
            </Link>
          </div>
        </div>

        <section>
          <h2 className="text-lg font-medium text-slate-200">Recent broker payout batches</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-slate-500">
                <tr>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Broker</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Paid</th>
                </tr>
              </thead>
              <tbody>
                {brokerRows.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 text-slate-300">
                    <td className="px-3 py-2 text-xs">{r.createdAt.toISOString().slice(0, 10)}</td>
                    <td className="px-3 py-2">{r.broker.email}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">{(r.totalAmountCents / 100).toFixed(2)}</td>
                    <td className="px-3 py-2 text-xs">{r.paidAt?.toISOString().slice(0, 10) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <a
          href="/api/admin/finance/export?format=csv&type=payouts"
          className="inline-block rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-200"
        >
          Export broker payouts CSV
        </a>
      </div>
    </HubLayout>
  );
}
