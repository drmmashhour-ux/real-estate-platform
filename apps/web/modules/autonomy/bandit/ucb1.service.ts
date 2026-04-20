import type { BanditArm } from "./bandit.types";

export function computeUCB1(arm: BanditArm, totalSelections: number) {
  if (arm.selectionCount === 0) {
    return Infinity; // force exploration
  }

  const exploitation = arm.averageReward;
  const exploration = Math.sqrt((2 * Math.log(totalSelections)) / arm.selectionCount);

  return exploitation + exploration;
}
