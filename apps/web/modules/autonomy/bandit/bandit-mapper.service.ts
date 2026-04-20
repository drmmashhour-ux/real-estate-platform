import type { AutonomyActionCandidate } from "@/modules/autonomy/autonomy.types";
import { getOrCreateRuleWeight } from "@/modules/autonomy/learning/rule-weight.service";
import type { BanditArmWithCandidate } from "./bandit-selector.service";

export async function mapActionsToArms(
  scopeType: string,
  scopeId: string,
  actions: AutonomyActionCandidate[]
): Promise<BanditArmWithCandidate[]> {
  const arms: BanditArmWithCandidate[] = [];

  for (const action of actions) {
    if (!action.signalKey) {
      continue;
    }

    const rule = await getOrCreateRuleWeight({
      scopeType,
      scopeId,
      domain: action.domain,
      signalKey: action.signalKey,
      actionType: action.actionType,
    });

    arms.push({
      id: rule.id,
      domain: action.domain,
      signalKey: action.signalKey,
      actionType: action.actionType,
      weight: Number(rule.weight ?? 1),
      selectionCount: rule.selectionCount ?? 0,
      averageReward: Number(rule.averageReward ?? 0),
      originalAction: action,
    });
  }

  return arms;
}
