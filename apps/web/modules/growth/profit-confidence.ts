/** Shared profit confidence + evidence quality (Profit Engine V2). */

export function computeProfitConfidence(input: {
  leads: number;
  bookings: number;
  spend: number;
  ltvEstimate: number | null;
}): number {
  const { leads, bookings, spend, ltvEstimate } = input;

  if (!leads || leads < 3) return 0.2;
  if (!ltvEstimate) return 0.3;

  let score = 0.4;

  if (leads >= 5) score += 0.2;
  if (bookings >= 2) score += 0.2;
  if (spend > 0) score += 0.1;

  return Math.min(1, score);
}

export function mapProfitEvidenceQuality(
  confidence: number,
  leads: number,
): "LOW" | "MEDIUM" | "HIGH" {
  if (leads < 5 || confidence < 0.45) return "LOW";
  if (leads < 10 || confidence < 0.75) return "MEDIUM";
  return "HIGH";
}
