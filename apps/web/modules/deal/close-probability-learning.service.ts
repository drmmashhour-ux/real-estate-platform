import { prisma } from "@/lib/db";

/**
 * When a deal reaches a terminal state, compare the latest close-probability snapshot to the outcome
 * for autonomous calibration analytics (`EvolutionOutcomeEvent`).
 */
export async function recordCloseProbabilityOutcome(dealId: string, didClose: boolean): Promise<void> {
  const latest = await prisma.closeProbability.findFirst({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    select: { id: true, probability: true, category: true, createdAt: true },
  });
  if (!latest) return;

  const predicted = latest.probability / 100;
  const actual = didClose ? 1 : 0;
  const varianceScore = Math.round(Math.abs(predicted - actual) * 1000) / 1000;

  await prisma.evolutionOutcomeEvent.create({
    data: {
      domain: "deals",
      metricType: "close_probability",
      entityType: "Deal",
      entityId: dealId,
      strategyKey: `close_probability_v1`,
      expectedJson: {
        probabilityPct: latest.probability,
        category: latest.category,
        snapshotId: latest.id,
        predictedAt: latest.createdAt.toISOString(),
      },
      actualJson: {
        closed: didClose,
      },
      varianceScore,
      notes: didClose
        ? "Deal closed — compare predicted likelihood to realized success."
        : "Deal failed/cancelled — compare predicted likelihood to realized outcome.",
    },
  });
}
