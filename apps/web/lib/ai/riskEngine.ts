export type RiskInput = {
  price?: number;
  marketPrice?: number;
  userAgeDays?: number;
  bookingsLast24h?: number;
  /** 0–1 from an IP reputation provider (optional). */
  ipReputation?: number;
};

export function computeRisk(input: RiskInput): number {
  let score = 0;

  if (input.price && input.marketPrice && input.marketPrice > 0) {
    const ratio = input.price / input.marketPrice;
    if (ratio < 0.5 || ratio > 2) {
      score += 30;
    }
  }

  if ((input.userAgeDays ?? 0) < 2) {
    score += 20;
  }

  if ((input.bookingsLast24h ?? 0) > 5) {
    score += 30;
  }

  if (input.ipReputation !== undefined && input.ipReputation < 0.3) {
    score += 20;
  }

  return Math.min(100, score);
}
