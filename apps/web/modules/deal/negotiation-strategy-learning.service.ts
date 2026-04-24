import { prisma } from "@/lib/db";

/**
 * After a deal closes or fails, compare the latest negotiation strategy run to the realized outcome
 * for evolution analytics (calibration — not auto-optimization).
 */
export async function recordNegotiationStrategyOutcome(dealId: string, didClose: boolean): Promise<void> {
  const last = await prisma.negotiationStrategy.findFirst({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    select: { strategyRunId: true },
  });
  if (!last) return;

  const pack = await prisma.negotiationStrategy.findMany({
    where: { dealId, strategyRunId: last.strategyRunId },
    select: {
      strategyType: true,
      suggestedPrice: true,
      confidenceScore: true,
      workflowStatus: true,
    },
  });
  if (pack.length === 0) return;

  const balanced = pack.find((p) => p.strategyType === "BALANCED");
  const expectedProb = balanced != null ? clamp01(balanced.confidenceScore / 100) : avgConfidence(pack);
  const actual = didClose ? 1 : 0;
  const varianceScore = Math.round(Math.abs(expectedProb - actual) * 1000) / 1000;

  await prisma.evolutionOutcomeEvent.create({
    data: {
      domain: "deals",
      metricType: "negotiation_strategy",
      entityType: "Deal",
      entityId: dealId,
      strategyKey: "negotiation_ai_v1",
      expectedJson: {
        strategyRunId: last.strategyRunId,
        balancedPrice: balanced?.suggestedPrice ?? null,
        expectedSuccessProxy: expectedProb,
        pack: pack.map((p) => ({
          type: p.strategyType,
          price: p.suggestedPrice,
          confidence: p.confidenceScore,
          workflowStatus: p.workflowStatus,
        })),
      },
      actualJson: { closed: didClose },
      varianceScore,
      notes: didClose
        ? "Deal closed — review whether balanced strategy confidence matched realized success."
        : "Deal cancelled/lost — compare AI posture to fallout reasons in broker file.",
    },
  });
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function avgConfidence(pack: { confidenceScore: number }[]): number {
  if (pack.length === 0) return 0.5;
  const s = pack.reduce((a, b) => a + b.confidenceScore, 0) / pack.length;
  return clamp01(s / 100);
}
