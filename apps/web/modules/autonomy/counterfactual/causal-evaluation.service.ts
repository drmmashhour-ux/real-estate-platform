import { evaluateAndStoreCounterfactual } from "./counterfactual-persist.service";
import { applyUpliftAdjustedReward } from "./uplift-reward.service";

export async function runCausalEvaluationPipeline(actionId: string) {
  const counterfactual = await evaluateAndStoreCounterfactual(actionId);

  try {
    const outcome = await applyUpliftAdjustedReward(actionId);
    return {
      success: true as const,
      counterfactual,
      outcome,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false as const,
      counterfactual,
      error: message,
    };
  }
}
