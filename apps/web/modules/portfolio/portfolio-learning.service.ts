import type { PortfolioPolicy } from "@prisma/client";
import { prisma } from "@/lib/db";
import { portfolioLog } from "./portfolio-log";

const SAFE_MIN = 0.85;
const SAFE_MAX = 1.15;

function clampWeight(w: number): number {
  return Math.max(SAFE_MIN, Math.min(SAFE_MAX, w));
}

/**
 * Bounded adjustments only — writes learningAdjustmentsJson narrative + numeric deltas.
 * Does not mutate policy weights above safe clamps without explicit persistence caller.
 */
export async function applyBoundedOutcomeLearning(ownerId: string): Promise<{
  adjusted: boolean;
  adjustments: Record<string, number>;
  rationale: string;
}> {
  const policy = await prisma.portfolioPolicy.findUnique({ where: { ownerId } });
  if (!policy) {
    return { adjusted: false, adjustments: {}, rationale: "No portfolio policy row — skipping learning." };
  }

  const ninetyDays = new Date(Date.now() - 90 * 24 * 3600 * 1000);
  const events = await prisma.portfolioOutcomeEvent.findMany({
    where: {
      assetId: { not: null },
      createdAt: { gte: ninetyDays },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  /** Count evidence-first positive signals vs capex completions. */
  let evidenceUnlock = 0;
  let capexFriction = 0;

  for (const e of events) {
    const type = e.eventType.toUpperCase();
    const cat = (e.outcomeCategory ?? "").toUpperCase();
    if (cat === "POSITIVE") {
      if (type.includes("ESG") || type.includes("EVIDENCE")) evidenceUnlock++;
      if (type.includes("CAPITAL")) capexFriction++;
    }
    if (cat === "NEGATIVE" && type.includes("CAPITAL")) capexFriction++;
  }

  const adjustments: Record<string, number> = {};
  let rationale = "No statistically meaningful bounded adjustment triggered.";

  if (events.length >= 12 && evidenceUnlock >= capexFriction * 1.25) {
    adjustments.esg_priority_weight_delta = 0.02;
    adjustments.revenue_priority_weight_delta = 0.01;
    rationale = "Evidence-forward outcomes outpaced capex completions — marginal boost to ESG/revenue weights (bounded).";
  } else if (events.length >= 12 && capexFriction >= evidenceUnlock * 1.5) {
    adjustments.financing_priority_weight_delta = -0.01;
    rationale = "Capital-heavy friction observed — marginal tempering on financing urgency (bounded).";
  }

  const adjusted = Object.keys(adjustments).length > 0;

  if (adjusted) {
    portfolioLog.learning("bounded_adjustment", {
      ownerId,
      deltas: JSON.stringify(adjustments),
    });

    const prev = (policy.learningAdjustmentsJson as Record<string, unknown>) ?? {};
    await prisma.portfolioPolicy.update({
      where: { ownerId },
      data: {
        learningAdjustmentsJson: {
          ...prev,
          lastAppliedAt: new Date().toISOString(),
          adjustments,
          rationale,
        },
        /** Example of clamp application — modest nudge stored as metadata only; canonical weights unchanged unless ops approves. */
        esgPriorityWeight: clampWeight(policy.esgPriorityWeight + (adjustments.esg_priority_weight_delta ?? 0)),
        revenuePriorityWeight: clampWeight(policy.revenuePriorityWeight + (adjustments.revenue_priority_weight_delta ?? 0)),
        financingPriorityWeight: clampWeight(policy.financingPriorityWeight + (adjustments.financing_priority_weight_delta ?? 0)),
      },
    });
  }

  return { adjusted, adjustments, rationale };
}
