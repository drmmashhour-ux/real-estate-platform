import type { ConfidenceBand } from "./revenue.types";

export function confidenceBandFromNumeric(confidence01: number): ConfidenceBand {
  if (confidence01 >= 0.72) return "high";
  if (confidence01 >= 0.45) return "medium";
  return "low";
}

/**
 * Maps observable monetization proxies to 0–100 — transparent weights only.
 */
export function scoreRevenuePotentialProxy(input: {
  hasPaidPublish: boolean;
  isFeatured: boolean;
  leadCount: number;
  viewCount: number;
  trustScore: number | null;
}): { score: number; explanation: string[] } {
  let score = 35;
  const explanation: string[] = ["base=35 (neutral prior)"];

  if (input.hasPaidPublish) {
    score += 20;
    explanation.push("+20 paid_publish observed");
  }
  if (input.isFeatured) {
    score += 12;
    explanation.push("+12 featured_until active");
  }
  score += Math.min(18, Math.floor(input.leadCount * 2));
  if (input.leadCount > 0) explanation.push(`+${Math.min(18, Math.floor(input.leadCount * 2))} from lead_count`);
  score += Math.min(15, Math.floor(input.viewCount / 40));
  if (input.viewCount > 0) explanation.push(`+${Math.min(15, Math.floor(input.viewCount / 40))} from view_count bucket`);

  if (input.trustScore != null) {
    if (input.trustScore < 40) {
      score -= 15;
      explanation.push("-15 low trust_score");
    } else if (input.trustScore > 75) {
      score += 8;
      explanation.push("+8 high trust_score");
    }
  }

  return { score: Math.max(0, Math.min(100, score)), explanation };
}
