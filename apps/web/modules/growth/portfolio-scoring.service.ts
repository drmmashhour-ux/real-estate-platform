import type { CampaignPortfolioInput, PortfolioCampaignScore } from "./portfolio-optimization.types";

export function scoreCampaignForPortfolio(input: CampaignPortfolioInput): PortfolioCampaignScore {
  let score = 0;
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (input.profitabilityStatus === "PROFITABLE") {
    score += 40;
    reasons.push("Campaign is profitable.");
  } else if (input.profitabilityStatus === "BREAKEVEN") {
    score += 20;
    reasons.push("Campaign is near break-even.");
  } else if (input.profitabilityStatus === "UNPROFITABLE") {
    score -= 25;
    warnings.push("Campaign is unprofitable.");
  } else {
    warnings.push("Profitability is uncertain.");
  }

  if ((input.confidenceScore ?? 0) >= 0.75) {
    score += 20;
    reasons.push("Profit confidence is high.");
  } else if ((input.confidenceScore ?? 0) >= 0.5) {
    score += 10;
    reasons.push("Profit confidence is moderate.");
  } else {
    warnings.push("Low confidence data.");
  }

  if ((input.ltvToCplRatio ?? 0) >= 2) {
    score += 20;
    reasons.push("Strong LTV/CPL ratio.");
  } else if ((input.ltvToCplRatio ?? 0) >= 1.2) {
    score += 10;
    reasons.push("Healthy LTV/CPL ratio.");
  } else if (input.ltvToCplRatio != null) {
    score -= 10;
    warnings.push("Weak LTV/CPL ratio.");
  }

  if (input.trend === "IMPROVING") {
    score += 10;
    reasons.push("Trend is improving.");
  } else if (input.trend === "DECLINING") {
    score -= 10;
    warnings.push("Trend is declining.");
  } else if (input.trend === "UNSTABLE") {
    score -= 5;
    warnings.push("Trend is unstable.");
  }

  if (input.leads >= 10) {
    score += 10;
    reasons.push("Sufficient lead volume.");
  } else if (input.leads < 3) {
    warnings.push("Very low lead volume.");
  }

  let qualityLabel: PortfolioCampaignScore["qualityLabel"] = "UNKNOWN";
  if (score >= 70) qualityLabel = "TOP";
  else if (score >= 50) qualityLabel = "GOOD";
  else if (score >= 30) qualityLabel = "WATCH";
  else if (score < 30) qualityLabel = "WEAK";

  return {
    campaignKey: input.campaignKey,
    portfolioScore: Number(score.toFixed(2)),
    qualityLabel,
    reasons,
    warnings,
  };
}
