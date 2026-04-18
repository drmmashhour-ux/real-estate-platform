import { prisma } from "@/lib/db";
import { growthV3Flags } from "@/config/feature-flags";
import type { GrowthBrainDecision, GrowthOpportunityInput } from "./growth-brain.types";
import { getBrainMemory } from "./growth-brain.memory";
import { scoreOpportunity } from "./growth-brain.scoring";
import { autonomyEvaluate } from "@/src/modules/autonomy/autonomy.controller";

export async function decideOnOpportunity(op: GrowthOpportunityInput): Promise<GrowthBrainDecision> {
  const mem = await getBrainMemory(`action:${op.kind}`);
  const blended = scoreOpportunity(op.score ?? 50, mem.weights.successRate);

  const channels =
    blended >= 70 ? ["in_app", "email"] : blended >= 55 ? ["in_app"] : ["in_app"];

  const base: GrowthBrainDecision = {
    /** Higher bar than v1 — avoids queuing marginal opportunities as approved. */
    approved: blended >= 55,
    channels,
    nextBestAction: op.kind,
    riskScore: Math.max(0, 100 - blended),
    explanation: [
      `Blended priority score ${blended} (threshold ≥55 to approve) from base ${op.score ?? "n/a"} and memory success ${(mem.weights.successRate ?? 0.5).toFixed(2)}.`,
      "No outbound send without orchestration + consent checks; autonomy gate still applies.",
    ],
  };

  const gated = autonomyEvaluate({
    decisionType: "growth_opportunity",
    riskScore: base.riskScore,
    channels: base.channels,
  });

  if (growthV3Flags.growthBrainV1) {
    await prisma.growthBrainDecisionLog.create({
      data: {
        decisionType: "opportunity",
        inputJson: op as object,
        outputJson: { ...base, autonomy: gated } as object,
        explanation: [...base.explanation, ...gated.explanation].join("\n"),
        riskScore: base.riskScore,
        autonomyMode: gated.mode,
      },
    });
  }

  return { ...base, approved: base.approved && gated.allow, explanation: [...base.explanation, ...gated.explanation] };
}
