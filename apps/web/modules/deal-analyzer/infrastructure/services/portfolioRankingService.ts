import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import {
  PortfolioBucket,
  PortfolioFilter,
  type PortfolioRankedItem,
} from "@/modules/deal-analyzer/domain/portfolio";

export type PortfolioRankingInput = {
  listingId: string;
  investmentScore: number;
  riskScore: number;
  confidenceScore: number | null;
  trustScore: number | null;
  readinessSignal: number;
  comparableConfidence: "low" | "medium" | "high" | null;
  scenarioConfidence: "low" | "medium" | "high" | null;
  documentCompleteness: number;
  isBnhubCandidate: boolean;
};

function confidencePoints(c: "low" | "medium" | "high" | null): number {
  if (c === "high") return 90;
  if (c === "medium") return 65;
  if (c === "low") return 35;
  return 45;
}

function bucketForScore(composite: number, risk: number): PortfolioBucket {
  const p = dealAnalyzerConfig.portfolio;
  if (risk >= 78) return PortfolioBucket.SPECULATIVE;
  if (composite >= p.topOpportunityThreshold) return PortfolioBucket.TOP_OPPORTUNITIES;
  if (composite >= p.stableThreshold) return PortfolioBucket.STABLE_CANDIDATES;
  if (composite >= p.needsReviewThreshold) return PortfolioBucket.NEEDS_REVIEW;
  return PortfolioBucket.SPECULATIVE;
}

export function computeCompositeScore(row: PortfolioRankingInput): number {
  const w = dealAnalyzerConfig.portfolio.weights;
  const inv = row.investmentScore;
  const riskAdj = 100 - row.riskScore;
  const conf = confidencePoints(
    row.comparableConfidence && row.scenarioConfidence
      ? row.comparableConfidence === "low" || row.scenarioConfidence === "low"
        ? "low"
        : row.comparableConfidence === "high" && row.scenarioConfidence === "high"
          ? "high"
          : "medium"
      : "medium",
  );
  const trust = row.trustScore ?? row.readinessSignal;
  return (
    w.investment * inv +
    w.inverseRisk * riskAdj +
    w.confidence * conf +
    w.trustReadiness * trust
  );
}

export function rankPortfolioItems(
  rows: PortfolioRankingInput[],
  filters: Set<string>,
): PortfolioRankedItem[] {
  let filtered = rows;

  if (filters.has(PortfolioFilter.HIGH_TRUST)) {
    filtered = filtered.filter((r) => (r.trustScore ?? 0) >= 68);
  }
  if (filters.has(PortfolioFilter.LOWER_RISK)) {
    filtered = filtered.filter((r) => r.riskScore < 55);
  }
  if (filters.has(PortfolioFilter.COMPLETE_DOCS)) {
    filtered = filtered.filter((r) => r.documentCompleteness >= 0.75);
  }
  if (filters.has(PortfolioFilter.BNHUB_CANDIDATES)) {
    filtered = filtered.filter((r) => r.isBnhubCandidate);
  }
  if (filters.has(PortfolioFilter.BETTER_CASH_FLOW)) {
    filtered = filtered.filter((r) => r.investmentScore >= 58 && r.riskScore < 62);
  }

  const ranked = filtered
    .map((r) => {
      const compositeScore = computeCompositeScore(r);
      const bucket = bucketForScore(compositeScore, r.riskScore);
      const reasons = [
        `Composite ${compositeScore.toFixed(1)} (investment ${r.investmentScore}, risk ${r.riskScore}).`,
      ];
      return { listingId: r.listingId, compositeScore, bucket, investmentScore: r.investmentScore, riskScore: r.riskScore, reasons };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore);

  return ranked;
}
