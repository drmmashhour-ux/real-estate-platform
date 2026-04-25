import type { RoiScopeType } from "@prisma/client";
import { prisma } from "@repo/db";
import { investIntelLog } from "./investor-intel-logger";
import type { RoiInsight } from "./investor-intelligence.types";

const CENTS_TO_DOLLAR = 0.01;
const WON = new Set(["closed"]);
const LOST = new Set(["cancelled"]);

/**
 * Composites: outcome ratio + cycle penalty + (revenue-spend) ratio when spend known. All bounded; no “precise” ROI.
 */
function computeScores(revenue: number, spend: number | null, won: number, lost: number, cycleDays: number | null) {
  const w = won + lost;
  const winRate = w > 0 ? won / w : 0.5;
  const cycleN = cycleDays == null || cycleDays < 0 ? 0.5 : Math.max(0.2, 1 - Math.min(0.5, cycleDays / 200));
  const eff = 0.55 * winRate + 0.45 * cycleN;
  let roi: number | null = null;
  if (spend != null && spend > 0) {
    roi = Math.max(0, Math.min(1, 0.5 * ((revenue - spend) / (spend + 1) + 1) * 0.5 + 0.5 * winRate));
  } else {
    roi = Math.max(0, Math.min(1, 0.4 * winRate + 0.3 * (revenue > 0 ? 0.6 : 0.2) + 0.3 * eff));
  }
  const efficiencyScore = Math.max(0, Math.min(1, eff));
  return { roiScore: roi, efficiencyScore, trace: ["winRate from won/(won+lost) when w>0", "cycle factor from avgDays", "spend branch"] };
}

function addTrace(ins: RoiInsight, line: string) {
  ins.trace = [...(ins.trace ?? []), line];
}

/**
 * Build ROI rows by market (jurisdiction), broker, channel (lead leadSource), and segment (crm coarse label).
 * Persists to `roi_performance_aggregates` (best-effort, never throws).
 */
export async function analyzeRoiPerformance(options?: { lookbackDays?: number; persist?: boolean }): Promise<RoiInsight[]> {
  const lookback = options?.lookbackDays ?? 120;
  const from = new Date();
  from.setDate(from.getDate() - lookback);
  const out: RoiInsight[] = [];
  const persist = options?.persist !== false;
  try {
    const rows = await prisma.deal.findMany({
      where: { updatedAt: { gte: from } },
      take: 4000,
      select: {
        id: true,
        priceCents: true,
        status: true,
        brokerId: true,
        jurisdiction: true,
        crmStage: true,
        createdAt: true,
        updatedAt: true,
        lead: { select: { leadSource: true, dynamicLeadPriceCents: true, estimatedValue: true } },
      },
    });
    const buckets: Record<string, { scopeType: RoiScopeType; key: string; r: number; s: number | null; w: number; l: number; cycles: number[]; n: number }> = {};
    function bKey(t: RoiScopeType, k: string) {
      return `${t}::${k.slice(0, 200)}`;
    }
    for (const d of rows) {
      const $ = (d.priceCents ?? 0) * CENTS_TO_DOLLAR;
      const won = WON.has((d.status ?? "").toLowerCase());
      const lost = LOST.has((d.status ?? "").toLowerCase());
      if (!won && !lost) continue;
      const rev = won ? $ : 0;
      const spendCents = d.lead?.dynamicLeadPriceCents ?? 0;
      const spendDoll = spendCents > 0 ? spendCents * 0.01 * 0.1 : null;
      const cycleD = (d.updatedAt.getTime() - d.createdAt.getTime()) / 864e5;
      const mk = (d.jurisdiction ?? "NA").toUpperCase();
      const ch = d.lead?.leadSource?.slice(0, 64) ?? "unknown";
      const br = d.brokerId ?? "unassigned";
      const seg = (d.crmStage ?? "na").toLowerCase().match(/[a-z0-9]+/i)?.[0] ?? "na";
      for (const [t, k] of [
        ["MARKET" as RoiScopeType, mk],
        ["CHANNEL" as RoiScopeType, ch],
        ["BROKER" as RoiScopeType, br],
        ["SEGMENT" as RoiScopeType, `crm_${seg}`],
      ] as [RoiScopeType, string][]) {
        const k2 = bKey(t, k);
        if (!buckets[k2]) {
          buckets[k2] = { scopeType: t, key: k, r: 0, s: 0, w: 0, l: 0, cycles: [], n: 0 };
        }
        const B = buckets[k2]!;
        B.r += rev;
        B.n += 1;
        if (spendDoll != null) B.s = (B.s ?? 0) + spendDoll;
        if (won) {
          B.w += 1;
          B.cycles.push(cycleD);
        } else B.l += 1;
      }
    }
    for (const b of Object.values(buckets)) {
      const avgC = b.cycles.length ? b.cycles.reduce((a, x) => a + x, 0) / b.cycles.length : null;
      const spend = b.s;
      const { roiScore, efficiencyScore, trace } = computeScores(b.r, spend, b.w, b.l, avgC);
      const ins: RoiInsight = {
        scopeType: b.scopeType,
        scopeKey: b.key,
        revenue: Math.round(b.r * 100) / 100,
        wonDeals: b.w,
        lostDeals: b.l,
        avgDealCycleDays: avgC == null ? null : Math.round(avgC * 10) / 10,
        estimatedLeadSpend: spend,
        roiScore,
        efficiencyScore,
        trace: [
          `window=${lookback}d, deals in bucket n=${b.n}, revenue from closed only`,
          ...trace,
        ],
      };
      addTrace(
        ins,
        `revenue: sum of price (CAD) for status closed in bucket; spend: proxy from lead dynamicLeadPriceCents when present`
      );
      out.push(ins);
      if (persist) {
        try {
          await prisma.roiPerformanceAggregate.upsert({
            where: { scopeType_scopeKey: { scopeType: b.scopeType, scopeKey: b.key } },
            create: {
              scopeType: b.scopeType,
              scopeKey: b.key,
              revenue: b.r,
              wonDeals: b.w,
              lostDeals: b.l,
              avgDealCycleDays: avgC,
              estimatedLeadSpend: spend,
              roiScore: roiScore ?? null,
              efficiencyScore: efficiencyScore ?? null,
            },
            update: {
              revenue: b.r,
              wonDeals: b.w,
              lostDeals: b.l,
              avgDealCycleDays: avgC,
              estimatedLeadSpend: spend,
              roiScore: roiScore ?? null,
              efficiencyScore: efficiencyScore ?? null,
            },
          });
        } catch (e) {
          investIntelLog.warn("roi_persist", { err: e instanceof Error ? e.message : String(e) });
        }
      }
    }
    // STRATEGY: pull strategy aggregates if table exists
    try {
      const srows = await prisma.strategyPerformanceAggregate.findMany({ take: 40 });
      for (const s of srows) {
        const t = s.wins + s.losses + s.stalls;
        const w = t > 0 ? s.wins / t : 0.3;
        const { roiScore, efficiencyScore, trace } = computeScores(0, null, Math.round(s.wins), Math.round(s.losses + s.stalls), s.avgClosingTime);
        out.push({
          scopeType: "STRATEGY",
          scopeKey: `${s.domain}:${s.strategyKey}`,
          revenue: 0,
          wonDeals: Math.round(s.wins),
          lostDeals: Math.round(s.losses + s.stalls),
          avgDealCycleDays: s.avgClosingTime,
          estimatedLeadSpend: null,
          roiScore: roiScore,
          efficiencyScore: Math.max(0, Math.min(1, w * 0.7 + (efficiencyScore ?? 0.3) * 0.3)),
          trace: [
            "strategy row from strategy_performance_aggregates (outcome mix; not $ revenue by default)", ...trace,
          ],
        });
      }
    } catch {
      /* no-op */
    }
    investIntelLog.roi({ rows: out.length });
    return out.sort((a, b) => (b.efficiencyScore ?? 0) - (a.efficiencyScore ?? 0));
  } catch (e) {
    investIntelLog.warn("analyzeRoiPerformance", { err: e instanceof Error ? e.message : String(e) });
    return [];
  }
}

export async function listRoiFromDb(take = 200): Promise<RoiInsight[]> {
  try {
    const r = await prisma.roiPerformanceAggregate.findMany({ take, orderBy: { updatedAt: "desc" } });
    return r.map(
      (x) =>
        ({
          scopeType: x.scopeType,
          scopeKey: x.scopeKey,
          revenue: x.revenue,
          wonDeals: x.wonDeals,
          lostDeals: x.lostDeals,
          avgDealCycleDays: x.avgDealCycleDays,
          estimatedLeadSpend: x.estimatedLeadSpend,
          roiScore: x.roiScore,
          efficiencyScore: x.efficiencyScore,
          trace: ["from roi_performance_aggregates"],
        }) as RoiInsight
    );
  } catch {
    return [];
  }
}
