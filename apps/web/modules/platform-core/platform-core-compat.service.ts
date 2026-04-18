import { prisma } from "@/lib/db";
import { platformCoreFlags } from "@/config/feature-flags";
import type { ProfitRecommendation } from "@/modules/growth/profit-engine.types";
import { registerDecision } from "./platform-core.service";
import type { CoreEntityType, CoreSystemSource } from "./platform-core.types";

/** Mirrors legacy operator recommendation rows into Platform Core (additive; does not delete source). */
export async function mirrorOperatorRecommendationToCore(limit = 50) {
  if (!platformCoreFlags.platformCoreV1) return { mirrored: 0 };
  const rows = await prisma.operatorRecommendationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  let mirrored = 0;
  for (const r of rows) {
    await registerDecision({
      source: r.source as CoreSystemSource,
      entityType: "UNKNOWN",
      entityId: r.targetId,
      title: `[mirror] ${r.title}`,
      summary: r.summary,
      reason: r.reason,
      confidenceScore: r.confidenceScore,
      evidenceScore: r.evidenceScore,
      status: "MONITORING",
      actionType: r.actionType,
      expectedImpact: r.expectedImpact,
      warnings: Array.isArray(r.warnings) ? (r.warnings as string[]) : undefined,
      blockers: Array.isArray(r.blockers) ? (r.blockers as string[]) : undefined,
      metadata: {
        mirrorFrom: "operator_recommendation_logs",
        legacyId: r.id,
      },
    });
    mirrored += 1;
  }
  return { mirrored };
}

export async function mirrorMarketplaceDecisionToCore(limit = 40) {
  if (!platformCoreFlags.platformCoreV1) return { mirrored: 0 };
  const rows = await prisma.marketplaceDecisionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  let mirrored = 0;
  for (const r of rows) {
    const entityType: CoreEntityType = "LISTING";
    await registerDecision({
      source: "MARKETPLACE",
      entityType,
      entityId: r.listingId,
      title: `[mirror] ${r.decisionType}`,
      summary: r.reason,
      reason: r.reason,
      confidenceScore: r.confidence,
      evidenceScore: r.confidence,
      status: "PENDING",
      actionType: r.decisionType,
      expectedImpact: null,
      metadata: {
        mirrorFrom: "marketplace_decision_logs_v6",
        legacyId: r.id,
        priority: r.priority,
      },
    });
    mirrored += 1;
  }
  return { mirrored };
}

export async function mirrorProfitRecommendationToCore(rows: ProfitRecommendation[]) {
  if (!platformCoreFlags.platformCoreV1) return { mirrored: 0 };
  let mirrored = 0;
  for (const p of rows) {
    await registerDecision({
      source: "PROFIT",
      entityType: "CAMPAIGN",
      entityId: p.campaignId,
      title: `[mirror] Profit ${p.action}`,
      summary: p.reason,
      reason: p.reason,
      confidenceScore: p.confidence,
      evidenceScore: p.confidence,
      status: "PENDING",
      actionType: p.action,
      metadata: { mirrorFrom: "profit_engine_inline" },
    });
    mirrored += 1;
  }
  return { mirrored };
}
