import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isFinancialStaff } from "@/lib/admin/finance-access";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { FinanceHubTabs } from "@/components/admin/FinanceHubTabs";
import { getBrokerEarningsSummary, generateBrokerTaxSlipData } from "@/modules/finance/broker-tax-reports";

export const dynamic = "force-dynamic";

export default async function AdminFinanceBrokerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!isFinancialStaff(user?.role)) redirect("/");

  const { id } = await params;
  const broker = await prisma.user.findFirst({
    where: { id, role: "BROKER" },
    select: { id: true, email: true, name: true },
  });
  if (!broker) notFound();

  const now = new Date();
  const y = now.getFullYear();
  const yearStart = new Date(y, 0, 1);
  const yearEnd = new Date(y, 11, 31, 23, 59, 59, 999);

  const [ytd, slip] = await Promise.all([
    getBrokerEarningsSummary(broker.id, { start: yearStart, end: yearEnd }),
    generateBrokerTaxSlipData(broker.id, y),
  ]);

  return (
    <HubLayout title={`Broker: ${broker.email}`} hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher>
      <FinanceHubTabs />
      <div className="space-y-6">
        <div>
          <Link href="/admin/finance/brokers" className="text-sm text-amber-400 hover:text-amber-300">
            ← Brokers
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-white">Broker earnings summary</h1>
          <p className="mt-1 text-sm text-slate-400">
            {broker.email} {broker.name ? `· ${broker.name}` : ""}
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-950/40 p-4 text-sm text-amber-100/90">
          Tax preparation summary only — not an official government slip. Validate with your accountant.
        </div>

        {ytd ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">YTD gross commissions</p>
              <p className="mt-1 text-xl font-semibold text-white">${(ytd.grossCommissionsCents / 100).toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">YTD broker net (commission rows)</p>
              <p className="mt-1 text-xl font-semibold text-amber-300">${(ytd.brokerNetCents / 100).toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">Payout batches paid (YTD window)</p>
              <p className="mt-1 text-xl font-semibold text-emerald-300">${(ytd.payoutPaidCents / 100).toFixed(2)}</p>
            </div>
          </div>
        ) : null}

        {slip ? (
          <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <h2 className="text-sm font-semibold text-slate-200">{y} — Monthly breakdown (estimates)</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Month</th>
                    <th className="py-2 pr-4">Commissions</th>
                    <th className="py-2 pr-4">Payouts recorded</th>
                  </tr>
                </thead>
                <tbody>
                  {slip.months.map((m) => (
                    <tr key={m.month} className="border-t border-white/5 text-slate-300">
                      <td className="py-2">{m.month}</td>
                      <td className="py-2">{(m.commissionsCents / 100).toFixed(2)}</td>
                      <td className="py-2">{(m.payoutsCents / 100).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </HubLayout>
  );
}
