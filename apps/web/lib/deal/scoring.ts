export function computeDealScore(input: {
  price: number;
  value: number;
  capRate?: number;
  roi?: number;
  cashflow?: number;
  neighborhoodScore?: number;
}) {
  const undervaluation =
    input.value && input.price ? ((input.value - input.price) / input.value) * 100 : 0;

  const cap = (input.capRate ?? 0) * 100;
  const roi = (input.roi ?? 0) * 100;
  const cf = (input.cashflow ?? 0) / 1000;
  const loc = input.neighborhoodScore ?? 0;

  const score = undervaluation * 0.35 + cap * 0.2 + roi * 0.2 + cf * 0.15 + loc * 0.1;

  return Math.max(0, Math.min(100, score));
}

export function classifyDeal(score: number, undervaluation: number, capRate: number) {
  if (undervaluation > 10) return "undervalued";
  if (capRate > 0.08) return "cashflow";
  if (score > 75) return "growth";
  return "balanced";
}
