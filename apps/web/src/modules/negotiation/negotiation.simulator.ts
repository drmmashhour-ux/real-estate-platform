/**
 * Discrete outcome simulation — illustrative probabilities only (not a prediction of acceptance).
 */

export type NegotiationSimInput = {
  offerCents: number;
  listCents: number;
  daysOnMarketApprox: number;
};

export type NegotiationSimResult = {
  scenarios: Array<{ label: string; probability: number }>;
  disclaimer: string;
};

export function simulateNegotiationOutcomes(input: NegotiationSimInput): NegotiationSimResult {
  const ratio = input.listCents > 0 ? input.offerCents / input.listCents : 1;
  const stale = input.daysOnMarketApprox > 45 ? 0.08 : 0;
  const baseAccept = Math.max(0.08, Math.min(0.72, 0.35 + (1 - ratio) * 0.5 - stale));

  return {
    scenarios: [
      { label: "seller_counters", probability: Math.round((0.55 - baseAccept * 0.3) * 100) / 100 },
      { label: "seller_accepts_or_near", probability: Math.round(baseAccept * 100) / 100 },
      { label: "no_response_14d", probability: Math.round((0.25 + stale) * 100) / 100 },
    ],
    disclaimer:
      "Illustrative scenario weights from list/offer ratio and time-on-market proxy — not a statistical forecast. Subject to contract law and broker guidance.",
  };
}
