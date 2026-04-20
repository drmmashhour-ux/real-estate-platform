export interface BanditArm {
  id: string;
  trials: number;
  reward: number;
}

export function chooseBestArm(arms: BanditArm[]): BanditArm | null {
  if (!arms.length) return null;

  return [...arms].sort((a, b) => {
    const aScore = a.trials ? a.reward / a.trials : 0;
    const bScore = b.trials ? b.reward / b.trials : 0;
    return bScore - aScore;
  })[0];
}

export function updateArmReward(arm: BanditArm, rewardDelta: number): BanditArm {
  return {
    ...arm,
    trials: arm.trials + 1,
    reward: arm.reward + rewardDelta,
  };
}
