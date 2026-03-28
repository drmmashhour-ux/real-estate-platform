import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isFraudDetectionEnabled } from "@/src/modules/fraud/fraudEnv";
import type { ExecutiveRecommendationInput } from "@/src/modules/executive/recommendationEngine";

/**
 * Surfaces high LECIPM fraud scores to the executive layer (recommendations only; no auto takedown).
 */
export async function buildFraudExecutiveRecommendations(): Promise<ExecutiveRecommendationInput[]> {
  if (!isFraudDetectionEnabled()) return [];

  const rows = await prisma.fraudRiskScore.findMany({
    where: { riskLevel: { in: ["critical", "high"] } },
    orderBy: { riskScore: "desc" },
    take: 12,
    select: {
      entityType: true,
      entityId: true,
      riskScore: true,
      riskLevel: true,
      evidenceJson: true,
    },
  });

  const out: ExecutiveRecommendationInput[] = [];
  for (const r of rows) {
    let city: string | null = null;
    if (r.entityType === "listing") {
      const l = await prisma.shortTermListing.findUnique({
        where: { id: r.entityId },
        select: { city: true, title: true },
      });
      city = l?.city ?? null;
    }
    const title =
      r.entityType === "listing" && city
        ? `High fraud risk: ${r.entityType} in ${city}`
        : `High fraud risk: ${r.entityType} ${r.entityId.slice(0, 8)}…`;

    out.push({
      recommendationType: "trust_safety",
      priorityScore: r.riskLevel === "critical" ? 92 : 78,
      title,
      summary:
        "LECIPM rule-based fraud engine elevated this entity. Review internal flags and queue before any guest-facing action.",
      detailsJson: {
        source: "lecipm_fraud_risk_scores",
        entityType: r.entityType,
        entityId: r.entityId,
        riskLevel: r.riskLevel,
        riskScore: r.riskScore,
        city,
      },
      evidenceJson: r.evidenceJson as Prisma.InputJsonValue,
      targetEntityType: r.entityType,
      targetEntityId: r.entityId,
    });
  }
  return out;
}
