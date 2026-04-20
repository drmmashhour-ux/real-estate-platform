import { prisma } from "@/lib/db";
import { runCausalEvaluationPipeline } from "./causal-evaluation.service";

export async function runDueCounterfactualEvaluations() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setTime(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000);

  const actions = await prisma.autonomyAction.findMany({
    where: {
      createdAt: { lte: sevenDaysAgo },
      learningEligible: true,
      outcome: { isNot: null },
      counterfactualEvaluation: null,
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const results: Array<{
    actionId: string;
    success: boolean;
    result?: unknown;
    error?: string;
  }> = [];

  for (const action of actions) {
    try {
      const result = await runCausalEvaluationPipeline(action.id);
      results.push({ actionId: action.id, success: true, result });
    } catch (error) {
      results.push({
        actionId: action.id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}
