import type { InvestorListingContext } from "@/modules/investor/investor-context.loader";

export type AcquisitionScreenResult = {
  acquisitionScore: number | null;
  acquisitionGrade: string | null;
  screenStatus: "PASS" | "CONDITIONAL" | "FAIL" | "UNKNOWN";
  investorFit: string | null;
  whyItPassesOrFails: string;
};

function gradeFromScore(score: number): string {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

export function buildAcquisitionSummary(ctx: InvestorListingContext): AcquisitionScreenResult {
  const opp = ctx.investmentOpportunity;
  if (!opp) {
    return {
      acquisitionScore: null,
      acquisitionGrade: null,
      screenStatus: "UNKNOWN",
      investorFit: null,
      whyItPassesOrFails:
        "No acquisition opportunity snapshot is stored for this listing yet — screening conclusions cannot be asserted from structured data alone.",
    };
  }

  const acquisitionScore = opp.score;
  const acquisitionGrade = gradeFromScore(acquisitionScore);
  const investorFit =
    opp.riskLevel === "LOW" ? "Fits conservative profiles (platform tag)"
    : opp.riskLevel === "MEDIUM" ? "Moderate risk posture (platform tag)"
    : opp.riskLevel === "HIGH" ? "Higher modeled risk — requires underwriting alignment"
    : opp.riskLevel;

  let screenStatus: AcquisitionScreenResult["screenStatus"] = "CONDITIONAL";
  if (acquisitionScore >= 62 && opp.riskLevel !== "HIGH") screenStatus = "PASS";
  if (acquisitionScore < 38 || opp.riskLevel === "HIGH") screenStatus = "FAIL";

  const why =
    `Based on **InvestmentOpportunity** row (score ${acquisitionScore.toFixed(1)}, modeled ROI ${opp.expectedROI.toFixed(2)}%, risk tag **${opp.riskLevel}**). ` +
    `These are platform estimates — not an appraisal, OM, or IC decision.`;

  return {
    acquisitionScore,
    acquisitionGrade,
    screenStatus,
    investorFit,
    whyItPassesOrFails: why,
  };
}
