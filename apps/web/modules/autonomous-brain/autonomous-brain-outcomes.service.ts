/**
 * Links implemented optimization decisions to observable metric deltas (advisory reporting).
 */
import type { BaselineMetrics } from "@/modules/autonomy/autonomy-types";
import { AUTONOMY_DOMAINS } from "@/modules/autonomy/autonomy-types";

import { prisma } from "@/lib/db";

export type MetricDelta = {
  metric: "conversion" | "revenueProxy" | "closeRate" | "engagement" | "allocationQuality";
  before: number | null;
  after: number | null;
  delta: number | null;
  note?: string;
};

export type OptimizationOutcomeRow = {
  decisionId: string;
  domain: string;
  action: string;
  proposalType: string;
  appliedAt: string | null;
  patternSource: "autonomy_decision";
  opportunityType: "marketplace_optimization";
  metrics: MetricDelta[];
  linkage: {
    baselineFrom: "baselineMetricsJson";
    outcomeFrom: "outcomeMetricsJson";
  };
};

function num(n: unknown): number | null {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  if (typeof n === "string" && n.trim() !== "" && Number.isFinite(Number(n))) return Number(n);
  return null;
}

/** Compare autonomy baseline vs outcome snapshots where both exist. */
export function deltasFromSnapshots(
  baseline: unknown,
  outcome: unknown
): { seniorConversionDelta: number | null; avgLeadScoreDelta: number | null; leadVolumeDelta: number | null } {
  const b = baseline as BaselineMetrics | null | undefined;
  const o = outcome as BaselineMetrics | null | undefined;
  if (!b || !o) {
    return { seniorConversionDelta: null, avgLeadScoreDelta: null, leadVolumeDelta: null };
  }

  const seniorConversionDelta =
    b.seniorConversionRate30d != null && o.seniorConversionRate30d != null ?
      o.seniorConversionRate30d - b.seniorConversionRate30d
    : null;

  const avgLeadScoreDelta =
    b.avgLeadScore != null && o.avgLeadScore != null ? o.avgLeadScore - b.avgLeadScore : null;

  const leadVolumeDelta =
    b.leadVolume30d != null && o.leadVolume30d != null ? o.leadVolume30d - b.leadVolume30d : null;

  return { seniorConversionDelta, avgLeadScoreDelta, leadVolumeDelta };
}

export async function listOptimizationOutcomesForDashboard(take = 40): Promise<OptimizationOutcomeRow[]> {
  const rows = await prisma.autonomyDecision.findMany({
    where: {
      domain: { in: [...AUTONOMY_DOMAINS] },
      status: { in: ["APPLIED", "AUTO_APPLIED"] },
    },
    orderBy: { appliedAt: "desc" },
    take: Math.min(take, 200),
    select: {
      id: true,
      domain: true,
      action: true,
      baselineMetricsJson: true,
      outcomeMetricsJson: true,
      appliedAt: true,
      payloadJson: true,
    },
  });

  return rows.map((r) => {
    const { seniorConversionDelta, avgLeadScoreDelta, leadVolumeDelta } = deltasFromSnapshots(
      r.baselineMetricsJson,
      r.outcomeMetricsJson
    );

    const outcomeObj =
      r.outcomeMetricsJson && typeof r.outcomeMetricsJson === "object" ?
        (r.outcomeMetricsJson as Record<string, unknown>)
      : {};

    const demandAfter = num(outcomeObj["demandIndex"]);
    const matchTotalAfter = num(outcomeObj["matchingEventsTotal"]);

    const metrics: MetricDelta[] = [
      {
        metric: "conversion",
        before: num((r.baselineMetricsJson as Record<string, unknown> | undefined)?.["seniorConversionRate30d"]),
        after: num(outcomeObj["seniorConversionRate30d"]),
        delta: seniorConversionDelta,
        note: "Senior lead conversion rate (30d window) from autonomy snapshots.",
      },
      {
        metric: "closeRate",
        before: num((r.baselineMetricsJson as Record<string, unknown> | undefined)?.["seniorConversionRate30d"]),
        after: num(outcomeObj["seniorConversionRate30d"]),
        delta: seniorConversionDelta,
        note: "Proxy for close/completion rate in this pipeline slice.",
      },
      {
        metric: "engagement",
        before: num((r.baselineMetricsJson as Record<string, unknown> | undefined)?.["avgLeadScore"]),
        after: num(outcomeObj["avgLeadScore"]),
        delta: avgLeadScoreDelta,
        note: "Average lead score movement post-change.",
      },
      {
        metric: "allocationQuality",
        before: num((r.baselineMetricsJson as Record<string, unknown> | undefined)?.["demandIndex"]),
        after: demandAfter,
        delta:
          num((r.baselineMetricsJson as Record<string, unknown> | undefined)?.["demandIndex"]) != null &&
          demandAfter != null ?
            demandAfter -
            (num((r.baselineMetricsJson as Record<string, unknown> | undefined)?.["demandIndex"]) ?? 0)
          : null,
        note: "Demand index shift (marketplace signal).",
      },
      {
        metric: "revenueProxy",
        before: num((r.baselineMetricsJson as Record<string, unknown> | undefined)?.["leadVolume30d"]),
        after: num(outcomeObj["leadVolume30d"]),
        delta: leadVolumeDelta,
        note: "Lead volume proxy — not audited revenue; use finance systems for revenue truth.",
      },
    ];

    return {
      decisionId: r.id,
      domain: r.domain,
      action: r.action,
      proposalType: typeof r.payloadJson === "object" && r.payloadJson && "kind" in r.payloadJson ?
        String((r.payloadJson as { kind?: string }).kind)
      : "unknown",
      appliedAt: r.appliedAt?.toISOString() ?? null,
      patternSource: "autonomy_decision",
      opportunityType: "marketplace_optimization",
      metrics,
      linkage: {
        baselineFrom: "baselineMetricsJson",
        outcomeFrom: "outcomeMetricsJson",
      },
    };
  });
}

export async function getOutcomeTrackingSummary() {
  const outcomes = await listOptimizationOutcomesForDashboard(80);
  const improvedConversion = outcomes.filter((o) =>
    o.metrics.some((m) => m.metric === "conversion" && m.delta != null && m.delta > 0)
  ).length;

  return {
    implementedCount: outcomes.length,
    improvedConversionCount: improvedConversion,
    lastUpdated:
      outcomes[0]?.appliedAt ??
      null,
  };
}
