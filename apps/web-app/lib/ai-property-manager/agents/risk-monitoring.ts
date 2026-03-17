/**
 * Fraud and Risk Monitoring Agent – monitors risk for properties and users.
 */

import { prisma } from "@/lib/db";
import type { RiskEvaluationOutput } from "../types";

export async function evaluateRisk(params: {
  propertyIdentityId?: string;
  userId?: string;
}): Promise<RiskEvaluationOutput> {
  const { propertyIdentityId, userId } = params;
  const factors: string[] = [];
  let riskScore = 30;
  let propertyRiskSummary = "No significant risk signals in scope.";
  let actorRiskSummary: string | undefined;

  if (propertyIdentityId) {
    const [riskRecords, openAlerts] = await Promise.all([
      prisma.propertyIdentityRisk.findMany({
        where: { propertyIdentityId },
        take: 1,
        orderBy: { lastEvaluatedAt: "desc" },
      }),
      prisma.propertyFraudAlert.count({
        where: { listing: { propertyIdentityId }, status: "open" },
      }),
    ]);
    const risk = riskRecords[0];
    if (risk) {
      riskScore = risk.riskScore;
      factors.push("Property risk record present");
    }
    if (openAlerts > 0) {
      riskScore = Math.min(100, riskScore + openAlerts * 15);
      propertyRiskSummary = `${openAlerts} open fraud alert(s) on listings.`;
      factors.push("Open fraud alerts");
    }
  }

  if (userId) {
    const incidents = await prisma.trustSafetyIncident.count({
      where: { OR: [{ reporterId: userId }, { accusedId: userId }] },
    });
    if (incidents > 0) {
      riskScore = Math.min(100, riskScore + incidents * 5);
      actorRiskSummary = `User linked to ${incidents} trust & safety incident(s).`;
      factors.push("Trust & safety history");
    }
  }

  const riskLevel = riskScore >= 70 ? "critical" : riskScore >= 50 ? "high" : riskScore >= 30 ? "medium" : "low";
  const reviewPriority = riskScore >= 70 ? "urgent" : riskScore >= 50 ? "high" : "normal";

  return {
    riskScore,
    riskLevel,
    propertyRiskSummary,
    actorRiskSummary,
    recommendedAction: riskScore >= 50 ? "Manual review recommended" : "Routine monitoring",
    reviewPriority,
    confidenceScore: Math.min(80, 40 + factors.length * 15),
    reasonSummary: factors.length > 0 ? `Risk based on ${factors.join("; ")}.` : "Limited data for risk evaluation.",
    contributingFactors: factors,
    humanReviewRequired: riskScore >= 50,
    timestamp: new Date().toISOString(),
  };
}
