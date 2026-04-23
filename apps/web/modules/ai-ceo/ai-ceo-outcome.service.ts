import { prisma } from "@/lib/db";
import type { AiCeoMeasurementSummary } from "@/modules/ai-ceo/ai-ceo.types";

export async function computeAiCeoMeasurements(): Promise<AiCeoMeasurementSummary> {
  const rows = await prisma.lecipmAiCeoRecommendation.findMany({
    select: {
      decisionStatus: true,
      confidenceScore: true,
      outcomeImpactBand: true,
      outcomeNotesJson: true,
      lastRefreshedAt: true,
    },
  });

  let pending = 0;
  let approved = 0;
  let rejected = 0;
  let inProgress = 0;
  let completed = 0;
  let completedConfidenceSum = 0;
  let completedConfidenceN = 0;
  let positiveOutcome = 0;
  let outcomeN = 0;
  let falsePositiveReports = 0;
  let ignoredStalePending = 0;

  const staleCutoff = Date.now() - 14 * 24 * 3_600_000;

  for (const r of rows) {
    switch (r.decisionStatus) {
      case "pending":
        pending++;
        if (r.lastRefreshedAt.getTime() < staleCutoff) ignoredStalePending++;
        break;
      case "approved":
        approved++;
        break;
      case "rejected":
        rejected++;
        break;
      case "in_progress":
        inProgress++;
        break;
      case "completed":
        completed++;
        completedConfidenceSum += r.confidenceScore;
        completedConfidenceN++;
        if (r.outcomeImpactBand) {
          outcomeN++;
          if (
            r.outcomeImpactBand.includes("positive") ||
            r.outcomeImpactBand === "meaningful" ||
            r.outcomeImpactBand === "moderate"
          ) {
            positiveOutcome++;
          }
        }
        break;
      default:
        break;
    }

    const notes = r.outcomeNotesJson as { text?: string } | null;
    if (notes?.text?.toLowerCase().includes("false_positive")) {
      falsePositiveReports++;
    }
  }

  return {
    recommendationCount: rows.length,
    pendingCount: pending,
    approvedCount: approved,
    rejectedCount: rejected,
    inProgressCount: inProgress,
    completedCount: completed,
    successRateProxy: outcomeN === 0 ? null : positiveOutcome / outcomeN,
    avgConfidenceCompleted:
      completedConfidenceN === 0 ? null : completedConfidenceSum / completedConfidenceN,
    falsePositiveReports,
    ignoredStalePending,
  };
}
