/**
 * Blend liquidity into ranking-style score — trust floor prevents boosting risky listings.
 */
export function blendSearchScore(input: {
  relevance: number;
  dealScore: number;
  liquidityScore: number;
  trustScore: number;
}): number {
  const t = Math.max(0, Math.min(100, input.trustScore));
  const liq = t < 30 ? input.liquidityScore * 0.25 : input.liquidityScore;
  const wRel = 0.42;
  const wDeal = 0.18;
  const wLiq = 0.22;
  const wTrust = 0.18;
  return (
    input.relevance * wRel +
    input.dealScore * wDeal +
    liq * wLiq +
    t * wTrust
  );
}
