import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { requireWorkspacePermission } from "@/modules/enterprise/infrastructure/requireWorkspacePermission";
import {
  workspaceDealWhere,
  workspaceLeadWhere,
} from "@/modules/enterprise/domain/workspaceDataScope";
import { DealInsightsDashboard } from "@/components/lecipm-monopoly/DealInsightsDashboard";
import { BenchmarkView } from "@/components/lecipm-monopoly/BenchmarkView";
import { CollaborationPanel } from "@/components/lecipm-monopoly/CollaborationPanel";
import type { BenchmarkBrokerRow } from "@/components/lecipm-monopoly/BrokerBenchmarkPanel";

export default async function WorkspaceMonopolyPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const { userId } = await requireAuthenticatedUser();
  const auth = await requireWorkspacePermission(prisma, {
    userId,
    workspaceId,
    permission: "view_internal_analytics",
  });
  if (!auth.ok) notFound();

  const dealWhere = workspaceDealWhere(workspaceId, auth.role, auth.userId);
  const leadWhere = workspaceLeadWhere(workspaceId, auth.role, auth.userId);

  const [deals, reps, leadCounts] = await Promise.all([
    prisma.deal.findMany({
      where: dealWhere,
      select: { id: true, brokerId: true, status: true, priceCents: true },
      take: 500,
    }),
    prisma.workspaceBrokerReputation.findMany({
      where: { workspaceId },
      select: {
        brokerUserId: true,
        score: true,
        successRate: true,
        activityScore: true,
        dealsCounted: true,
      },
    }),
    prisma.lead.groupBy({
      by: ["introducedByBrokerId"],
      where: {
        AND: [leadWhere, { introducedByBrokerId: { not: null } }],
      },
      _count: true,
    }),
  ]);

  const brokerIds = [...new Set(deals.map((d) => d.brokerId).filter(Boolean))] as string[];
  const users =
    brokerIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: brokerIds } },
          select: { id: true, name: true, email: true },
        })
      : [];

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const repMap = Object.fromEntries(reps.map((r) => [r.brokerUserId, r]));

  const byBroker: Record<
    string,
    { deals: number; closed: number; leadTouches: number; priceSum: number; priceN: number }
  > = {};

  for (const d of deals) {
    const bid = d.brokerId;
    if (!bid) continue;
    if (!byBroker[bid]) byBroker[bid] = { deals: 0, closed: 0, leadTouches: 0, priceSum: 0, priceN: 0 };
    byBroker[bid].deals += 1;
    if (d.status === "closed") byBroker[bid].closed += 1;
    byBroker[bid].priceSum += d.priceCents;
    byBroker[bid].priceN += 1;
  }
  for (const g of leadCounts) {
    const bid = g.introducedByBrokerId;
    if (!bid) continue;
    if (!byBroker[bid]) byBroker[bid] = { deals: 0, closed: 0, leadTouches: 0, priceSum: 0, priceN: 0 };
    byBroker[bid].leadTouches += g._count;
  }

  const benchmarkRows: BenchmarkBrokerRow[] = Object.entries(byBroker).map(([brokerUserId, v]) => {
    const rep = repMap[brokerUserId];
    const u = userMap[brokerUserId];
    return {
      brokerUserId,
      label: u?.name || u?.email || brokerUserId,
      dealsOpenOrActive: v.deals,
      dealsClosed: v.closed,
      avgPriceCents: v.priceN > 0 ? Math.round(v.priceSum / v.priceN) : null,
      leadTouches: v.leadTouches,
      reputation: rep
        ? {
            score: rep.score,
            successRate: rep.successRate,
            activityScore: rep.activityScore,
            dealsCounted: rep.dealsCounted,
          }
        : null,
    };
  });
  benchmarkRows.sort((a, b) => (b.reputation?.score ?? 0) - (a.reputation?.score ?? 0));

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 text-slate-100">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#C9A646]/90">Monopoly layer</p>
            <h1 className="text-2xl font-semibold">Data & network advantage</h1>
            <p className="mt-1 text-sm text-slate-500">
              Isolated per organization · aggregated insights · internal collaboration
            </p>
          </div>
          <Link href={`/dashboard/workspaces/${workspaceId}/team`} className="text-sm text-emerald-400/90 hover:text-emerald-300">
            ← Team dashboard
          </Link>
        </header>

        <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-6">
          <DealInsightsDashboard workspaceId={workspaceId} />
        </section>

        <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-6">
          <BenchmarkView workspaceId={workspaceId} initialRows={benchmarkRows} />
        </section>

        <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-6">
          <h2 className="text-lg font-medium text-slate-100">Collaboration</h2>
          <p className="mt-1 text-xs text-slate-500">Internal messaging and shared deal visibility.</p>
          <div className="mt-6">
            <CollaborationPanel workspaceId={workspaceId} />
          </div>
        </section>
      </div>
    </div>
  );
}
