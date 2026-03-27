import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { formatCurrencyCAD } from "@/lib/investment/format";

export const dynamic = "force-dynamic";

export default async function AdminSharedDealsLeaderboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?returnUrl=/admin/growth/shared-deals");
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (u?.role !== "ADMIN") redirect("/");

  const tallies = await prisma.$queryRaw<Array<{ deal_id: string; c: bigint }>>(
    Prisma.sql`
      SELECT deal_id, COUNT(*)::bigint AS c
      FROM shared_deal_visits
      GROUP BY deal_id
      ORDER BY c DESC
      LIMIT 40
    `
  );

  const ids = tallies.map((t) => t.deal_id);
  const deals =
    ids.length === 0
      ? []
      : await prisma.investmentDeal.findMany({
          where: { id: { in: ids } },
          select: { id: true, city: true, propertyPrice: true, createdAt: true },
        });
  const dealMap = new Map(deals.map((d) => [d.id, d]));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-xl font-semibold">Shared deals — viral leaderboard</h1>
        <p className="mt-2 text-sm text-slate-400">
          Public <code className="text-slate-300">/deal/[id]</code> page views (tracked once per browser session per deal).
        </p>

        <div className="mt-8 overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Public link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {tallies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-slate-500">
                    No share views recorded yet. Views are logged when someone opens a shared deal link.
                  </td>
                </tr>
              ) : (
                tallies.map((row) => {
                  const d = dealMap.get(row.deal_id);
                  const n = Number(row.c);
                  return (
                    <tr key={row.deal_id} className="hover:bg-slate-900/40">
                      <td className="px-4 py-3 font-mono text-emerald-300">{n}</td>
                      <td className="px-4 py-3">{d?.city ?? "—"}</td>
                      <td className="px-4 py-3">{d ? formatCurrencyCAD(d.propertyPrice) : "—"}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/deal/${row.deal_id}`}
                          className="text-xs text-amber-400 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          /deal/{row.deal_id.slice(0, 8)}…
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
