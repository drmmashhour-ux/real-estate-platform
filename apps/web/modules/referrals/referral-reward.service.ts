/**
 * Reward eligibility checks — operational rewards stay off until fraud review passes.
 */
export function describeRewardEligibility(opts: { referralStatus: string; rewardGiven: boolean }) {
  if (opts.rewardGiven) return { eligible: false as const, reason: "Reward already recorded." };
  if (opts.referralStatus !== "converted") return { eligible: false as const, reason: "Referral not in converted state." };
  return { eligible: true as const, reason: "Eligible pending fraud checks and program rules." };
}
