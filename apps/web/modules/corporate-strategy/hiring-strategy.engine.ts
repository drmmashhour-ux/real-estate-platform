import { prisma } from "@repo/db";
import { evaluateExpansionOpportunities } from "@/modules/investor-intelligence/expansion-analysis.engine";
import { analyzeRoiPerformance } from "@/modules/investor-intelligence/roi-engine.service";
import { corporateStrategyLog } from "./corporate-strategy-logger";
import type { HiringStrategy, StrategyTriage } from "./corporate-strategy.types";

const ADV =
  "Advisory only; does not post jobs, approve requisitions, or set compensation. Recruiting and HR decisions remain with leadership.";

function tri(n: number, openHigh: number): StrategyTriage {
  if (n < 2) return "low";
  if (openHigh < 4 && n < 6) return "medium";
  return "high";
}

/**
 * Suggest role focus from observed deal/broker load — never an employment commitment.
 */
export async function generateHiringStrategy(): Promise<HiringStrategy> {
  const dataSources: string[] = [
    "deals (brokerId, status, time window) — for load concentration",
    "expansion engine top markets/segments (platform signals)",
    "ROI aggregates for segment mix",
  ];
  const out: HiringStrategy = { disclaimer: ADV, dataSources, roles: [] };
  try {
    const from = new Date();
    from.setDate(from.getDate() - 90);
    const [open, closed, brokerLoad, ex, roi] = await Promise.all([
      prisma.deal
        .count({ where: { status: { notIn: ["closed", "cancelled"] }, updatedAt: { gte: from } } })
        .catch(() => 0),
      prisma.deal.count({ where: { status: { equals: "closed" }, updatedAt: { gte: from } } }).catch(() => 0),
      prisma.deal
        .groupBy({
          by: ["brokerId"],
          where: { brokerId: { not: null }, updatedAt: { gte: from } },
          _count: { _all: true },
        })
        .catch((): { brokerId: string | null; _count: { _all: number } }[] => []),
      evaluateExpansionOpportunities().catch(() => null),
      analyzeRoiPerformance({ persist: false, lookbackDays: 90 }).catch(() => []),
    ]);
    const loads = brokerLoad
      .filter((b) => b.brokerId)
      .map((b) => b._count._all)
      .sort((a, c) => c - a);
    const maxB = loads[0] ?? 0;
    const p95 = loads.length ? Math.max(1, loads[Math.floor(loads.length * 0.15)] ?? 0) : 0;
    if (open > 15 || (maxB > 12 && p95 > 4)) {
      out.roles.push({
        kind: "broker",
        priority: tri(open, maxB),
        headcountHint: { min: 1, max: 2, basis: "Non-linear proxy from high deal counts per active broker; confirm with OACIQ capacity" },
        rationale: [
          "Open pipeline or per-broker concentration in the 90d window — suggests capacity review before new market push.",
          "Hiring is a business decision; this is a data cue only.",
        ],
        dataTrace: `open~${open} maxPerBroker~${maxB} sample~${loads.length} brokers with activity`,
      });
    }
    if (open > 30 || (ex?.topMarkets?.length ?? 0) >= 3) {
      out.roles.push({
        kind: "operations",
        priority: (open > 50 ? "high" : "medium") as StrategyTriage,
        headcountHint: { min: 0, max: 1, basis: "Ops scaling when open deals × markets grows (qualitative band)" },
        rationale: [
          "Multiple active markets and/or a large open pipeline increase coordination and document load.",
        ],
        dataTrace: `open=${open} expansionMarkets=${(ex?.topMarkets?.length ?? 0)}`,
      });
    }
    const hasWeakSeg = roi.some(
      (r) => (r.wonDeals + r.lostDeals) > 2 && (r.efficiencyScore ?? 1) < 0.35
    );
    if (hasWeakSeg || (roi.length > 0 && !roi.some((r) => r.scopeType === "STRATEGY"))) {
      out.roles.push({
        kind: "engineering",
        priority: "low",
        headcountHint: { min: 0, max: 1, basis: "Product/infra to improve funnel instrumentation when conversion signals are noisy" },
        rationale: [
          "Weak segment efficiency in aggregates may reflect tooling gaps, not just personnel.",
        ],
        dataTrace: "roi mix + segment efficiency bands",
      });
    }
    if (out.roles.length === 0) {
      out.roles.push({
        kind: "coordination",
        priority: "low",
        headcountHint: { min: 0, max: 0, basis: "No strong overload signal; maintain hiring baseline" },
        rationale: [
          "Current window does not show a sharp per-broker overload vs historical bands used here (advisory, not a forecast).",
        ],
        dataTrace: `open=${open} closed=${closed}`,
      });
    }
    corporateStrategyLog.hiring({ n: out.roles.length });
  } catch (e) {
    corporateStrategyLog.warn("generateHiringStrategy", { err: e instanceof Error ? e.message : String(e) });
  }
  return out;
}
