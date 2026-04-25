/**
 * AI investment analysis for New Development (Project) listings.
 * Used by project detail page and API. Safe fallbacks when data is missing.
 */

export type ProjectForAnalysis = {
  id: string;
  name?: string;
  city?: string;
  status?: string;
  startingPrice?: number;
  [key: string]: unknown;
};

export type UnitForAnalysis = {
  id: string;
  type: string;
  price: number;
  size: number;
  status?: string;
  [key: string]: unknown;
};

export type ProjectAnalysisResult = {
  expectedAppreciation: number;
  rentalYield: number;
  score: number;
  recommendation: string;
  bestUnit: UnitForAnalysis | null;
};

export function analyzeProject(
  project: ProjectForAnalysis,
  units: UnitForAnalysis[] = []
): ProjectAnalysisResult {
  const avgPrice =
    units.length > 0
      ? units.reduce((s, u) => s + u.price, 0) / units.length
      : (project.startingPrice ?? 0) || 1;

  const appreciation =
    project.status === "upcoming"
      ? 0.15
      : project.status === "under-construction"
        ? 0.1
        : 0.05;

  const city = (project.city ?? "").toLowerCase();
  const rentalYield =
    city === "montreal"
      ? 0.055
      : city === "laval"
        ? 0.06
        : 0.05;

  const score = Math.min(
    100,
    Math.round(
      50 +
        appreciation * 100 * 0.5 +
        rentalYield * 100 * 0.3 +
        (avgPrice > 0 && avgPrice < 800_000 ? 5 : 0)
    )
  );

  const recommendation =
    score > 75 ? "Strong investment" : score > 60 ? "Good opportunity" : "Moderate";

  const bestUnit =
    units.find((u) => u.type === "2bed") ||
    units.find((u) => u.type === "1bed") ||
    units[0] ||
    null;

  return {
    expectedAppreciation: appreciation,
    rentalYield,
    score,
    recommendation,
    bestUnit,
  };
}
