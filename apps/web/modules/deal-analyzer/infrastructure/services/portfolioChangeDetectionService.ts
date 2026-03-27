import type { PortfolioMonitoringSummaryCore } from "@/modules/deal-analyzer/domain/monitoring";

export function diffOpportunityLabels(
  prev: string | null | undefined,
  next: string | null | undefined,
): "upgraded" | "downgraded" | "same" | "unknown" {
  if (!prev || !next) return "unknown";
  const order = [
    "insufficient_data",
    "high_risk",
    "overpriced",
    "appreciation_candidate",
    "value_add_candidate",
    "cash_flow_candidate",
    "bnhub_candidate",
  ];
  const pi = order.indexOf(prev);
  const ni = order.indexOf(next);
  if (pi < 0 || ni < 0) return "unknown";
  if (ni > pi) return "upgraded";
  if (ni < pi) return "downgraded";
  return "same";
}

export function mergeMonitoringSummary(
  base: PortfolioMonitoringSummaryCore | null,
  patch: Partial<PortfolioMonitoringSummaryCore>,
): PortfolioMonitoringSummaryCore {
  return {
    watchlistId: patch.watchlistId ?? base?.watchlistId ?? "",
    evaluatedAt: patch.evaluatedAt ?? base?.evaluatedAt ?? new Date().toISOString(),
    upgradedCount: patch.upgradedCount ?? base?.upgradedCount ?? 0,
    downgradedCount: patch.downgradedCount ?? base?.downgradedCount ?? 0,
    trustDroppedCount: patch.trustDroppedCount ?? base?.trustDroppedCount ?? 0,
    repricingRecommendedCount: patch.repricingRecommendedCount ?? base?.repricingRecommendedCount ?? 0,
    biggestMovers: patch.biggestMovers ?? base?.biggestMovers ?? [],
    confidence: patch.confidence ?? base?.confidence ?? "low",
    warnings: patch.warnings ?? base?.warnings ?? [],
  };
}
