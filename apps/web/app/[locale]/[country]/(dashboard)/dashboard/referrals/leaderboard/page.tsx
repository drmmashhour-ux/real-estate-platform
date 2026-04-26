import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";

export default async function ReferralLeaderboardPage() {
  const rows = await prisma.commission.groupBy({
    by: ["ambassadorId"],
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 10,
  }).catch(() => []);
  const ambassadors = await prisma.ambassador.findMany({
    where: { id: { in: rows.map((r) => r.ambassadorId) } },
    include: { user: { select: { name: true, email: true } } },
  }).catch(() => []);
  const byId = new Map(ambassadors.map((a) => [a.id, a]));
  return (
    <HubLayout title="Referral Leaderboard" hubKey="referrals" navigation={hubNavigation.referrals} theme={getHubTheme("investments")}>
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">Top referrers</h2>
        <div className="mt-4 space-y-3">
          {rows.map((row, idx) => {
            const amb = byId.get(row.ambassadorId);
            return (
              <div key={row.ambassadorId} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
                <div>
                  <p className="font-medium text-white">#{idx + 1} {amb?.user.name ?? amb?.user.email?.split("@")[0] ?? "User"}</p>
                  <p className="text-xs text-slate-400">{row._count.id} conversions</p>
                </div>
                <p className="text-teal-300">${(row._sum.amount ?? 0).toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      </section>
    </HubLayout>
  );
}
