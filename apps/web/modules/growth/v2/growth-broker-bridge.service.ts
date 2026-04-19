/**
 * Read-only broker signals for Growth Engine V2 — adapter only; no circular imports with growth-engine-v2.service.
 */

import { prisma } from "@/lib/db";
import { brokerPerformanceFlags } from "@/config/feature-flags";
import { buildInternalBrokerLeaderboard } from "@/modules/broker/performance/broker-leaderboard.service";

export type GrowthBrokerBridgeSnapshot = {
  brokersSampled: number;
  avgOverallScore: number | null;
  insufficientDataShare: number | null;
  weakBandShare: number | null;
  coachingNeedsEstimate: "low" | "medium" | "high" | "unknown";
  sparse: boolean;
  notes: string[];
};

export async function buildGrowthBrokerBridgeSnapshot(options?: {
  maxBrokers?: number;
}): Promise<GrowthBrokerBridgeSnapshot> {
  const notes: string[] = [];
  if (!brokerPerformanceFlags.brokerPerformanceV1) {
    notes.push("Broker performance engine flag is off — broker channel signals are nominal only.");
    return {
      brokersSampled: 0,
      avgOverallScore: null,
      insufficientDataShare: null,
      weakBandShare: null,
      coachingNeedsEstimate: "unknown",
      sparse: true,
      notes,
    };
  }

  const lb = await buildInternalBrokerLeaderboard({ maxBrokers: options?.maxBrokers ?? 36 });
  const rows = lb.rows;
  const n = rows.length;
  if (n === 0) {
    notes.push("No brokers returned in scoring sample.");
    return {
      brokersSampled: 0,
      avgOverallScore: null,
      insufficientDataShare: null,
      weakBandShare: null,
      coachingNeedsEstimate: "unknown",
      sparse: true,
      notes,
    };
  }

  const sufficient = rows.filter((r) => r.band !== "insufficient_data");
  const insufficientDataShare = rows.filter((r) => r.band === "insufficient_data").length / n;
  const weakBandShare = sufficient.filter((r) => r.band === "weak").length / Math.max(1, sufficient.length);

  const avgOverallScore =
    sufficient.length > 0
      ? Math.round(sufficient.reduce((a, r) => a + r.overallScore, 0) / sufficient.length)
      : null;

  let coachingNeedsEstimate: GrowthBrokerBridgeSnapshot["coachingNeedsEstimate"] = "low";
  if (weakBandShare >= 0.25 || insufficientDataShare >= 0.45) coachingNeedsEstimate = "high";
  else if (weakBandShare >= 0.12 || insufficientDataShare >= 0.25) coachingNeedsEstimate = "medium";

  const sparse = n < 8 || insufficientDataShare > 0.55;
  if (sparse) {
    notes.push("Thin broker cohort — treat averages as directional.");
  }

  return {
    brokersSampled: n,
    avgOverallScore,
    insufficientDataShare,
    weakBandShare,
    coachingNeedsEstimate,
    sparse,
    notes,
  };
}

/** Follow-up debt proxy: share of CRM leads stuck in contacted-ish stages (bounded read). */
export async function estimateBrokerFollowUpDebtProxy(): Promise<{ ratio: number | null; note: string }> {
  try {
    const recent = await prisma.lead.findMany({
      where: { updatedAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      select: { pipelineStage: true, pipelineStatus: true },
      take: 400,
      orderBy: { updatedAt: "desc" },
    });
    if (recent.length === 0) return { ratio: null, note: "No recent pipeline rows sampled." };
    const contactedLike = recent.filter((r) => {
      const p = `${r.pipelineStage ?? ""} ${r.pipelineStatus ?? ""}`.toLowerCase();
      return p.includes("contact") && !p.includes("won") && !p.includes("lost");
    }).length;
    return {
      ratio: contactedLike / recent.length,
      note: "Heuristic contacted-share on a recent slice — not verified sends.",
    };
  } catch {
    return { ratio: null, note: "Pipeline debt proxy unavailable." };
  }
}
