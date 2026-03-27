import type { AiListingInsight, AiRiskLevel } from "../domain/types";

function riskLevel(trust: number | null, deal: number | null): AiRiskLevel {
  const t = trust ?? 50;
  const d = deal ?? 50;
  if (t < 45 || d < 45) return "high";
  if (t < 65 || d < 65) return "medium";
  return "low";
}

export function buildListingInsight(input: {
  listingId: string;
  trustScore: number | null;
  dealScore: number | null;
  issues?: string[];
}): AiListingInsight {
  const risk = riskLevel(input.trustScore, input.dealScore);
  const rec: string[] = [];
  const exp: string[] = [];

  if ((input.dealScore ?? 50) >= 75 && (input.trustScore ?? 50) >= 70) {
    rec.push("High-value deal - prioritize this listing.");
  }
  if ((input.trustScore ?? 50) < 55) {
    rec.push("Low trust signal - verify listing details before proceeding.");
    exp.push("Trust score indicates missing or weak reliability signals.");
  }
  if ((input.dealScore ?? 50) < 55) {
    rec.push("Deal quality is moderate/low - compare against nearby alternatives.");
    exp.push("Deal score suggests lower upside versus market baseline.");
  }
  if (input.issues?.length) {
    exp.push(`Detected issues: ${input.issues.slice(0, 3).join(", ")}`);
  }
  if (rec.length === 0) rec.push("Listing looks balanced - continue with standard due diligence.");
  if (exp.length === 0) exp.push("Scores derived from trust and deal engines using platform data.");

  return {
    listingId: input.listingId,
    trustScore: input.trustScore,
    dealScore: input.dealScore,
    riskLevel: risk,
    recommendations: rec,
    explanations: exp,
  };
}
