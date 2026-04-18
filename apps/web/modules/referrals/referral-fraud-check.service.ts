/**
 * Lightweight fraud heuristics — does not auto-approve rewards.
 */
export function quickReferralFraudSignals(opts: { sameIpBurst?: boolean; velocityHigh?: boolean }) {
  if (opts.sameIpBurst) return { blockAutoReward: true, reason: "Unusual IP burst detected — manual review." };
  if (opts.velocityHigh) return { blockAutoReward: true, reason: "High velocity pattern — manual review." };
  return { blockAutoReward: false, reason: "No basic heuristics tripped — still require policy checks." };
}
