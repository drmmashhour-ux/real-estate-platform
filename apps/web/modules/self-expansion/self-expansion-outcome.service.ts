import { prisma } from "@/lib/db";
import type { ExpansionMeasurementSummary } from "@/modules/self-expansion/self-expansion.types";

export async function computeExpansionMeasurements(): Promise<ExpansionMeasurementSummary> {
  const rows = await prisma.lecipmSelfExpansionRecommendation.findMany({
    select: {
      decisionStatus: true,
      confidenceScore: true,
      territoryId: true,
    },
  });

  let proposed = 0;
  let approved = 0;
  let rejected = 0;
  let inProgress = 0;
  let completed = 0;
  let paused = 0;
  let completedConfidence = 0;
  let completedN = 0;
  const launched = new Set<string>();

  for (const r of rows) {
    switch (r.decisionStatus) {
      case "PROPOSED":
        proposed++;
        break;
      case "APPROVED":
        approved++;
        launched.add(r.territoryId);
        break;
      case "REJECTED":
        rejected++;
        break;
      case "IN_PROGRESS":
        inProgress++;
        launched.add(r.territoryId);
        break;
      case "COMPLETED":
        completed++;
        completedConfidence += r.confidenceScore;
        completedN++;
        launched.add(r.territoryId);
        break;
      case "PAUSED":
        paused++;
        break;
      default:
        break;
    }
  }

  return {
    recommendationCount: rows.length,
    proposedCount: proposed,
    approvedCount: approved,
    rejectedCount: rejected,
    inProgressCount: inProgress,
    completedCount: completed,
    pausedCount: paused,
    avgConfidenceCompleted: completedN === 0 ? null : completedConfidence / completedN,
    territoriesWithLaunches: launched.size,
  };
}
