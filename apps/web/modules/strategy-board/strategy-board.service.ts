import { aggregateCompanyMetrics } from "../company-metrics/company-metrics-aggregation.service";
import type { CompanyMetricsSnapshot, CompanyMetricsWindow } from "../company-metrics/company-metrics.types";
import type { ExecutiveScope } from "../owner-access/owner-access.types";
import { buildStrategyInsights } from "./strategy-board.engine";
import { strategyBoardDisclaimer } from "./strategy-board-explainer";
import type { StrategyBoardPayload } from "./strategy-board.types";

export async function buildStrategyBoardPayload(
  scope: ExecutiveScope,
  window: CompanyMetricsWindow,
  custom?: { from: string; to: string },
): Promise<StrategyBoardPayload> {
  const metrics = await aggregateCompanyMetrics(scope, window, custom);
  return buildStrategyBoardFromMetrics(metrics);
}

export function buildStrategyBoardFromMetrics(metrics: CompanyMetricsSnapshot): StrategyBoardPayload {
  return {
    generatedAt: new Date().toISOString(),
    insights: buildStrategyInsights(metrics),
    disclaimer: strategyBoardDisclaimer(),
  };
}

export async function buildStrategyBoardWithMetrics(
  scope: ExecutiveScope,
  window: CompanyMetricsWindow,
  custom?: { from: string; to: string },
): Promise<{ metrics: CompanyMetricsSnapshot; board: StrategyBoardPayload }> {
  const metrics = await aggregateCompanyMetrics(scope, window, custom);
  return { metrics, board: buildStrategyBoardFromMetrics(metrics) };
}

export { buildStrategyInsights } from "./strategy-board.engine";
