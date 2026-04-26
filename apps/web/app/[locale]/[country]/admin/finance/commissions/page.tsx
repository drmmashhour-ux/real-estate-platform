import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isFinancialStaff } from "@/lib/admin/finance-access";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { FinanceHubTabs } from "@/components/admin/FinanceHubTabs";
import { getCommissionSummary } from "@/modules/finance/reporting";

export const dynamic = "force-dynamic";

type Sp = { source?: string; brokerId?: string };

export default async function AdminFinanceCommissionsPage({ searchParams }: { searchParams?: Promise<Sp> }) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!isFinancialStaff(user?.role)) redirect("/");

  const sp = (await searchParams) ?? {};
  const source = sp.source?.trim();
  const brokerId = sp.brokerId?.trim();

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const monthSummary = await getCommissionSummary({ start, end });

  const rows = await prisma.brokerCommission.findMany({
    where: {
      ...(brokerId ? { brokerId } : {}),
      ...(source
        ? {
            payment: { paymentType: source },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 250,
    include: {
      broker: { select: { email: true, name: true } },
      payment: {
        select: {
          paymentType: true,
          amountCents: true,
          listingId: true,
          bookingId: true,
          dealId: true,
          createdAt: true,
        },
      },
    },
  });

  const platformRows = await prisma.platformCommissionRecord.findMany({
    where: {
      ...(source ? { commissionSource: source } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  return (
    <HubLayout title="Commissions" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher>
      <FinanceHubTabs />
      <div className="space-y-6">
        <div>
          <Link href="/admin/finance" className="text-sm text-amber-400 hover:text-amber-300">
            ← Finance overview
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-white">Commissions</h1>
          <p className="mt-1 text-sm text-slate-400">Broker commission rows and platform commission records (sources vary).</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-slate-500">Month gross (platform + broker tables)</p>
            <p className="mt-1 text-xl font-semibold text-white">
              ${(monthSummary.totalGrossCents / 100).toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-slate-500">Broker share (month)</p>
            <p className="mt-1 text-xl font-semibold text-amber-300">
              ${(monthSummary.totalBrokerCents / 100).toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-slate-500">Platform share (month)</p>
            <p className="mt-1 text-xl font-semibold text-emerald-300">
              ${(monthSummary.totalPlatformCents / 100).toLocaleString()}
            </p>
          </div>
        </div>

        <form className="flex flex-wrap gap-3" method="get">
          <input name="brokerId" placeholder="Broker user id" className="input-premium" defaultValue={sp.brokerId ?? ""} />
          <input name="source" placeholder="Source / paymentType" className="input-premium" defaultValue={sp.source ?? ""} />
          <button type="submit" className="btn-primary">
            Filter
          </button>
        </form>

        <section>
          <h2 className="text-lg font-medium text-slate-200">Broker commission lines</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-slate-500">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Broker</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Gross</th>
                  <th className="px-3 py-2">Broker</th>
                  <th className="px-3 py-2">Platform</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 text-slate-300">
                    <td className="px-3 py-2 text-xs">{r.createdAt.toISOString().slice(0, 10)}</td>
                    <td className="px-3 py-2 text-xs">{r.broker ? r.broker.email : "—"}</td>
                    <td className="px-3 py-2 text-xs">{r.payment.paymentType}</td>
                    <td className="px-3 py-2">{(r.grossAmountCents / 100).toFixed(2)}</td>
                    <td className="px-3 py-2">{(r.brokerAmountCents / 100).toFixed(2)}</td>
                    <td className="px-3 py-2">{(r.platformAmountCents / 100).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium text-slate-200">Platform commission records</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-slate-500">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {platformRows.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 text-slate-300">
                    <td className="px-3 py-2 text-xs">{r.createdAt.toISOString().slice(0, 10)}</td>
                    <td className="px-3 py-2 text-xs">{r.commissionSource ?? "—"}</td>
                    <td className="px-3 py-2">{((r.commissionAmountCents ?? 0) / 100).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <a
          href="/api/admin/finance/export?format=csv&type=commissions"
          className="inline-block rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-200"
        >
          Export commissions CSV
        </a>
      </div>
    </HubLayout>
  );
}
