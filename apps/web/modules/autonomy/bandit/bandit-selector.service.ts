import type { AutonomyActionCandidate } from "@/modules/autonomy/autonomy.types";
import type { BanditArm } from "./bandit.types";
import { computeUCB1 } from "./ucb1.service";

export type BanditArmWithCandidate = BanditArm & {
  originalAction: AutonomyActionCandidate;
};

export type BanditArmScored = BanditArmWithCandidate & {
  score: number;
};

export function selectBestActions(
  arms: BanditArmWithCandidate[],
  maxActions: number = 2
): BanditArmScored[] {
  if (arms.length === 0) return [];

  const totalSelections = arms.reduce((sum, a) => sum + a.selectionCount, 0) + 1;

  const scored: BanditArmScored[] = arms.map((arm) => {
    let raw = computeUCB1(arm, totalSelections);
    let score = Number.isFinite(raw) ? raw : Number.MAX_VALUE;
    if (arm.selectionCount < 3) {
      score += 1;
    }
    return {
      ...arm,
      score,
      originalAction: arm.originalAction,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const limit = Math.max(1, maxActions);
  return scored.slice(0, Math.min(limit, scored.length));
}
