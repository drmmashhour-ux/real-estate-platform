/**
 * Fraud and Risk Monitoring Agent – monitors risk for properties and users.
 */

import { prisma } from "@/lib/db";
import type { RiskOutput } from "../types";

export async function evaluateRisk(params: {
  propertyIdentityId?: string;
  userId?: string;
}): Promise<RiskOutput> {
  const { propertyIdentityId, userId } = params;
  const factors: string[] = [];
  let riskScore = 30;
  let propertyRiskSummary = "No significant risk signals in scope.";

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
      where: { OR: [{ reporterId: userId }, { accusedUserId: userId }] },
    });
    if (incidents > 0) {
      riskScore = Math.min(100, riskScore + incidents * 5);
      factors.push("Trust & safety history");
    }
  }

  const riskLevel = riskScore >= 70 ? "critical" : riskScore >= 50 ? "high" : riskScore >= 30 ? "medium" : "low";
  const reviewPriority = riskScore >= 70 ? "high" : riskScore >= 50 ? "high" : "low";

  return {
    riskScore,
    riskLevel,
    propertyRiskSummary,
    recommendedAction: riskScore >= 50 ? "Manual review recommended" : "Routine monitoring",
    reviewPriority,
    confidenceScore: Math.min(80, 40 + factors.length * 15),
    reasonSummary: factors.length > 0 ? `Risk based on ${factors.join("; ")}.` : "Limited data for risk evaluation.",
    contributingFactors: factors,
    humanReviewRequired: riskScore >= 50,
    timestamp: new Date().toISOString(),
  };
}
