import { AccountStatus, PlatformRole } from "@prisma/client";
import { prisma } from "@repo/db";
import { portfolioIntelLog } from "./brokerage-intelligence-logger";
import type { BrokerLoadEntry, LoadRebalanceAction, LoadRebalanceSuggestion } from "./brokerage-intelligence.types";

const CLOSED = new Set(["closed", "cancelled", "lost"]);
const TERMINAL_LEAD = new Set(["won", "lost"]);

/**
 * Recompute and persist load rows (bounded; never throws). workloadScore: 0–100 heuristic.
 */
export async function computeBrokerLoadMetrics(
  options?: { brokerIdSubset?: string[]; maxBrokers?: number }
): Promise<BrokerLoadEntry[]> {
  const maxB = options?.maxBrokers ?? 80;
  const subset = options?.brokerIdSubset;
  try {
    const brokers = await prisma.user.findMany({
      where: {
        role: PlatformRole.BROKER,
        accountStatus: AccountStatus.ACTIVE,
        ...(Array.isArray(subset) && subset.length ? { id: { in: subset } } : {}),
      },
      take: maxB,
      select: { id: true, homeRegion: true, homeCity: true },
    });
    const out: BrokerLoadEntry[] = [];
    for (const b of brokers) {
      const [ad, al] = await Promise.all([
        prisma.deal.count({ where: { brokerId: b.id, status: { notIn: Array.from(CLOSED) } } }),
        prisma.lead.count({
          where: {
            introducedByBrokerId: b.id,
            pipelineStatus: { notIn: Array.from(TERMINAL_LEAD) },
          },
        }),
      ]);
      const firstTouch = await prisma.lead
        .findFirst({
          where: { introducedByBrokerId: b.id },
          orderBy: { createdAt: "desc" },
          select: { firstContactAt: true, createdAt: true },
        })
        .catch(() => null);
      let avgResp: number | null = null;
      if (firstTouch?.firstContactAt && firstTouch?.createdAt) {
        const ms = firstTouch.firstContactAt.getTime() - firstTouch.createdAt.getTime();
        if (ms >= 0 && Number.isFinite(ms)) avgResp = Math.min(168, ms / (1000 * 60 * 60 * 24));
      }
      const workload = Math.min(100, ad * 8 + al * 2.5);
      out.push({ brokerId: b.id, activeDeals: ad, activeLeads: al, avgResponseTime: avgResp, workloadScore: workload });
    }
    for (const e of out) {
      try {
        await prisma.brokerLoadMetric.upsert({
          where: { brokerId: e.brokerId },
          create: {
            brokerId: e.brokerId,
            activeDeals: e.activeDeals,
            activeLeads: e.activeLeads,
            avgResponseTime: e.avgResponseTime,
            workloadScore: e.workloadScore,
          },
          update: {
            activeDeals: e.activeDeals,
            activeLeads: e.activeLeads,
            avgResponseTime: e.avgResponseTime,
            workloadScore: e.workloadScore,
          },
        });
      } catch {
        /* no-op */
      }
    }
    portfolioIntelLog.brokerLoad({ rows: out.length });
    return out;
  } catch (e) {
    portfolioIntelLog.warn("computeBrokerLoadMetrics", { err: e instanceof Error ? e.message : String(e) });
    return [];
  }
}

/**
 * Advisory: brokers over threshold get soft suggestions; never reassigns automatically.
 */
export async function recommendLoadRebalancing(opts?: { overloadThreshold?: number }): Promise<{
  suggestions: LoadRebalanceSuggestion[];
  rationale: string[];
}> {
  const thr = opts?.overloadThreshold ?? 72;
  const rationale: string[] = [
    "Suggestions are human-reviewed; the product does not auto-reassign or silence leads for brokers.",
  ];
  try {
    const rows = await prisma.brokerLoadMetric.findMany({
      where: { workloadScore: { gte: thr } },
      orderBy: { workloadScore: "desc" },
      take: 20,
    });
    const suggestions: LoadRebalanceSuggestion[] = rows.map((r) => {
      const action: LoadRebalanceAction =
        r.workloadScore >= 90
          ? "escalate_support"
          : r.activeLeads > r.activeDeals
            ? "shift_leads"
            : "reduce_new_assignments";
      return {
        targetBrokerId: r.brokerId,
        action,
        rationale: `workload score ${Math.round(r.workloadScore)}; activeDeals ${r.activeDeals}, activeLeads ${r.activeLeads} (heuristic).`,
      };
    });
    portfolioIntelLog.brokerLoad({ rebalancing: suggestions.length });
    return { suggestions, rationale };
  } catch (e) {
    portfolioIntelLog.warn("recommendLoadRebalancing", { err: e instanceof Error ? e.message : String(e) });
    return { suggestions: [], rationale: ["Service unavailable."] };
  }
}

export async function getLoadMetricsSnapshot(): Promise<Record<string, number>> {
  try {
    const m = await prisma.brokerLoadMetric.findMany({ take: 200, select: { brokerId: true, workloadScore: true } });
    const o: Record<string, number> = {};
    for (const x of m) o[x.brokerId] = x.workloadScore;
    return o;
  } catch {
    return {};
  }
}
