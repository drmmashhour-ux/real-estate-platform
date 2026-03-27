function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

/**
 * Deterministic lead score (hybrid-ready): no hallucination.
 * leadScore = dealScore*0.4 + trustScore*0.3 + engagement*0.3
 */
export function calculateAiLeadScore(input: {
  dealScore: number | null;
  trustScore: number | null;
  engagement: number;
}): number {
  const d = input.dealScore ?? 50;
  const t = input.trustScore ?? 50;
  const e = input.engagement;
  return clamp(d * 0.4 + t * 0.3 + e * 0.3);
}

export function predictCloseLikelihood(input: {
  leadScore: number;
  urgency: number;
  highIntent: boolean;
}): number {
  const base = 0.55 * input.leadScore + 0.25 * input.urgency + (input.highIntent ? 12 : 0);
  return clamp(base);
}
