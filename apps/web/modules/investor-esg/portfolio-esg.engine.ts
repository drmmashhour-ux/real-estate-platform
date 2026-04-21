import { bandExpectedRoi } from "@/modules/investment/roi.calculator";
import {
  PORTFOLIO_ESG_DISCLAIMER,
  POSITIONING_PORTFOLIO_ESG,
  type PortfolioEsgRecommendation,
  type PortfolioEsgResult,
  type PortfolioPropertyInput,
} from "./portfolio.types";
import {
  bucketDistribution,
  computeWeightedPortfolioScore,
  resolvePortfolioRiskLevel,
} from "./portfolio-scoring";

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10));
}

const TARGET_ESG_FOR_UPGRADE = 72;

function portfolioDeltaIfAssetReaches(
  properties: PortfolioPropertyInput[],
  propertyId: string,
  targetScore: number,
  currentPortfolio: number,
): { portfolioDelta: number; assetGain: number } {
  const totalValue = properties.reduce((s, p) => s + (p.propertyValue > 0 ? p.propertyValue : 0), 0);
  if (totalValue <= 0) return { portfolioDelta: 0, assetGain: 0 };
  const p = properties.find((x) => x.id === propertyId);
  if (!p || p.propertyValue <= 0) return { portfolioDelta: 0, assetGain: 0 };
  const w = p.propertyValue / totalValue;
  const s0 = clampScore(p.esgScore);
  const t = clampScore(targetScore);
  const newPortfolio = currentPortfolio - w * s0 + w * t;
  return {
    portfolioDelta: clampScore(newPortfolio - currentPortfolio),
    assetGain: clampScore(t - s0),
  };
}

function buildRecommendations(properties: PortfolioPropertyInput[], currentPortfolio: number): PortfolioEsgRecommendation[] {
  const candidates = properties
    .filter((p) => clampScore(p.esgScore) < TARGET_ESG_FOR_UPGRADE - 2)
    .map((p) => {
      const { portfolioDelta, assetGain } = portfolioDeltaIfAssetReaches(
        properties,
        p.id,
        TARGET_ESG_FOR_UPGRADE,
        currentPortfolio,
      );
      const drag = (TARGET_ESG_FOR_UPGRADE - clampScore(p.esgScore)) * (p.propertyValue > 0 ? p.propertyValue : 1);
      return { p, portfolioDelta, assetGain, drag };
    })
    .sort((a, b) => b.drag - a.drag);

  const out: PortfolioEsgRecommendation[] = [];
  for (const row of candidates.slice(0, 8)) {
    const s = clampScore(row.p.esgScore);
    const priority: PortfolioEsgRecommendation["priority"] =
      s < 42 ? "HIGH" : s < 55 ? "MEDIUM" : "LOW";
    out.push({
      propertyId: row.p.id,
      label: row.p.label,
      action:
        s < 48
          ? "Prioritize envelope + HVAC upgrades; stack grants where eligible."
          : "Targeted retrofit roadmap (windows/insulation/electrification) to lift asset band.",
      expectedPortfolioImpactPoints: Math.max(0, row.portfolioDelta),
      expectedAssetEsgGainPoints: Math.max(0, row.assetGain),
      priority,
    });
  }
  return out;
}

/**
 * Aggregate multi-property ESG view for investors — weighted score, risk band, upgrade list.
 */
export function runPortfolioEsgAnalysis(properties: PortfolioPropertyInput[]): PortfolioEsgResult {
  const valid = properties.filter((p) => p.propertyValue > 0 && Number.isFinite(p.esgScore));
  const portfolioScore =
    valid.length > 0 ? computeWeightedPortfolioScore(valid) : properties.length > 0 ? computeWeightedPortfolioScore(properties) : 0;

  const riskLevel = resolvePortfolioRiskLevel(portfolioScore, valid.length > 0 ? valid : properties);
  const distribution = bucketDistribution(valid.length > 0 ? valid : properties);
  const lowEsgPropertyIds = (valid.length > 0 ? valid : properties)
    .filter((p) => clampScore(p.esgScore) < 50)
    .map((p) => p.id);

  const recommendations = buildRecommendations(valid.length > 0 ? valid : properties, portfolioScore);

  const composite01 = Math.min(1, Math.max(0, portfolioScore / 100));
  const illustrativeResilienceRoiHintPercent =
    valid.length > 0 ? bandExpectedRoi({ compositeScore01: composite01, yieldRoi: null }) * 100 : null;

  return {
    portfolioScore,
    riskLevel,
    recommendations,
    lowEsgPropertyIds,
    distribution,
    illustrativeResilienceRoiHintPercent,
    disclaimer: PORTFOLIO_ESG_DISCLAIMER,
    positioning: POSITIONING_PORTFOLIO_ESG,
  };
}
