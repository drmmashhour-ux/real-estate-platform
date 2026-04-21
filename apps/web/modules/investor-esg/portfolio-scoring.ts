import type {
  PortfolioDistributionBucket,
  PortfolioPropertyInput,
  PortfolioRiskLevel,
} from "./portfolio.types";

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10));
}

/** Value-weighted mean: SUM(score × value) / SUM(value) */
export function computeWeightedPortfolioScore(properties: PortfolioPropertyInput[]): number {
  let num = 0;
  let den = 0;
  for (const p of properties) {
    const v = p.propertyValue;
    if (!Number.isFinite(v) || v <= 0) continue;
    num += clampScore(p.esgScore) * v;
    den += v;
  }
  if (den <= 0) return 0;
  return clampScore(num / den);
}

export function bucketDistribution(properties: PortfolioPropertyInput[]): PortfolioDistributionBucket[] {
  const buckets: { label: string; minScore: number; maxScore: number }[] = [
    { label: "0–39", minScore: 0, maxScore: 39 },
    { label: "40–54", minScore: 40, maxScore: 54 },
    { label: "55–69", minScore: 55, maxScore: 69 },
    { label: "70–100", minScore: 70, maxScore: 100 },
  ];
  const n = properties.length || 1;
  return buckets.map((b) => {
    const count = properties.filter((p) => {
      const s = clampScore(p.esgScore);
      return s >= b.minScore && s <= b.maxScore;
    }).length;
    return {
      ...b,
      count,
      sharePct: Math.round((count / n) * 1000) / 10,
    };
  });
}

export function resolvePortfolioRiskLevel(
  portfolioScore: number,
  properties: PortfolioPropertyInput[],
): PortfolioRiskLevel {
  const n = properties.length;
  const lowShare = n > 0 ? properties.filter((p) => clampScore(p.esgScore) < 48).length / n : 0;
  if (portfolioScore < 48 || lowShare >= 0.4) return "HIGH";
  if (portfolioScore < 62 || lowShare >= 0.22) return "MEDIUM";
  return "LOW";
}

/** If scenario row has no ESG, derive a stable illustrative score from optional signals */
export function deriveIllustrativeEsgScore(args: {
  riskLevel?: string | null;
  fitScore?: number | null;
}): number {
  const risk = (args.riskLevel ?? "").toUpperCase();
  let base = 56;
  if (risk === "HIGH") base = 44;
  else if (risk === "LOW") base = 68;
  else if (risk === "MEDIUM") base = 56;
  const fit = args.fitScore;
  if (fit != null && Number.isFinite(fit)) {
    const f01 = fit > 1 ? fit / 100 : fit;
    base = clampScore(38 + f01 * 52);
  }
  return clampScore(base);
}
