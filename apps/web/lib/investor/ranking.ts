export type PropertyScoreInput = {
  capRate?: number | null;
  roi?: number | null;
  cashflow?: number | null;
  dscr?: number | null;
  neighborhoodScore?: number | null;
  /** 0–100 style penalty input; higher = worse. */
  risk?: number | null;
};

export function computePropertyScore(input: PropertyScoreInput) {
  const cap = (input.capRate ?? 0) * 100;
  const roi = (input.roi ?? 0) * 100;
  const cf = (input.cashflow ?? 0) / 1000;
  const dscr = input.dscr ?? 0;
  const location = input.neighborhoodScore ?? 0;
  const riskPenalty = input.risk ?? 0;

  const score = cap * 0.25 + roi * 0.2 + cf * 0.2 + dscr * 10 + location * 0.15 - riskPenalty * 0.2;

  return Math.max(0, Math.min(100, score));
}

export function classifyProperty(score: number) {
  if (score >= 80) return "Top Performer";
  if (score >= 65) return "Strong";
  if (score >= 50) return "Average";
  if (score >= 35) return "Weak";
  return "High Risk";
}
