import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isFinancialStaff } from "@/lib/admin/finance-access";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { FinanceHubTabs } from "@/components/admin/FinanceHubTabs";

export const dynamic = "force-dynamic";

export default async function AdminFinanceBrokersPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!isFinancialStaff(user?.role)) redirect("/");

  const brokers = await prisma.user.findMany({
    where: { role: "BROKER" },
    select: {
      id: true,
      email: true,
      name: true,
      brokerStatus: true,
    },
    orderBy: { email: "asc" },
    take: 200,
  });

  const agg = await prisma.brokerCommission.groupBy({
    by: ["brokerId"],
    where: { brokerId: { not: null } },
    _sum: { brokerAmountCents: true, grossAmountCents: true },
  });
  const map = new Map<string, { brokerAmountCents: number | null; grossAmountCents: number | null }>();
  for (const a of agg) {
    if (a.brokerId) map.set(a.brokerId, a._sum);
  }

  return (
    <HubLayout title="Broker earnings" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher>
      <FinanceHubTabs />
      <div className="space-y-6">
        <div>
          <Link href="/admin/finance" className="text-sm text-amber-400 hover:text-amber-300">
            ← Finance overview
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-white">Broker earnings summaries</h1>
          <p className="mt-2 text-sm text-slate-400">
            Tax preparation summaries — not official T-slips. Review with a qualified accountant before filing.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-slate-500">
              <tr>
                <th className="px-3 py-2">Broker</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Lifetime gross (comm.)</th>
                <th className="px-3 py-2">Lifetime broker (comm.)</th>
                <th className="px-3 py-2">Detail</th>
              </tr>
            </thead>
            <tbody>
              {brokers.map((b) => {
                const s = map.get(b.id);
                return (
                  <tr key={b.id} className="border-b border-white/5 text-slate-300">
                    <td className="px-3 py-2">
                      <div className="font-medium">{b.email}</div>
                      <div className="text-xs text-slate-500">{b.name ?? ""}</div>
                    </td>
                    <td className="px-3 py-2 text-xs">{b.brokerStatus}</td>
                    <td className="px-3 py-2">{((s?.grossAmountCents ?? 0) / 100).toFixed(2)}</td>
                    <td className="px-3 py-2">{((s?.brokerAmountCents ?? 0) / 100).toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <Link href={`/admin/finance/brokers/${b.id}`} className="text-premium-gold hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </HubLayout>
  );
}
