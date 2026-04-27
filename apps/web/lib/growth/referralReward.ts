/**
 * Order 121 — tiered copy for referral incentive (V1).
 * `count` = successful signups (or your chosen success metric) from referral analytics.
 */
export function getReferralReward(count: number) {
  if (count >= 5) return "🎁 Priority access + better deals";
  if (count >= 1) return "⭐ Early user perks";
  return null;
}
