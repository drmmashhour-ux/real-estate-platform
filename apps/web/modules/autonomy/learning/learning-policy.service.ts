export function canLearningUpdateRule(params: {
  rewardScore: number;
  currentWeight: number;
}) {
  // Learning can only nudge small preference weights.
  // It cannot modify safety limits, price caps, or mode flags.
  if (params.currentWeight < 0.5 || params.currentWeight > 1.5) {
    return false;
  }

  if (params.rewardScore < -1 || params.rewardScore > 1) {
    return false;
  }

  return true;
}
