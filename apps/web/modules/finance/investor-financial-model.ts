import type { FinancialModelPayload, FinancialPeriod } from "./financial-model-types";
import { buildFinancialModelPayload } from "./metrics";
import { getMonthlyCosts, getYearlyCosts } from "./costs";
import { getProfit } from "./profit";
import { projectGrowth } from "./projections";
import type { CostBreakdown } from "./financial-model-types";
import type { ProfitResult } from "./financial-model-types";
import type { GrowthProjection } from "./projections";

export type FullFinancialModel = {
  payload: FinancialModelPayload;
  monthlyCosts: CostBreakdown;
  yearlyCosts: CostBreakdown;
  profit: ProfitResult;
  projections: GrowthProjection[];
  aiSummary: string;
};

export function getDefaultFinancialPeriod(now = new Date()): FinancialPeriod {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setUTCFullYear(start.getUTCFullYear() - 1);
  start.setUTCHours(0, 0, 0, 0);
  return { start, end, label: "Last 12 months" };
}

function formatCad(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;
}

function buildAiSummary(
  payload: FinancialModelPayload,
  profit: ProfitResult,
  projections: GrowthProjection[]
): string {
  const top = [...payload.revenueBySource].sort((a, b) => b.totalCents - a.totalCents)[0];
  const topLabel = top?.label ?? "BNHub";
  const y2 = projections[1];
  const parts = [
    `Platform recorded about ${formatCad(payload.totalRevenueCents)} in attributed platform revenue for ${payload.period.label}.`,
    `Main revenue driver in this view: ${topLabel}.`,
    profit.netProfitCents >= 0
      ? `After modeled operating costs, net is about ${formatCad(profit.netProfitCents)} (operational estimate).`
      : `After modeled operating costs, net is negative by about ${formatCad(-profit.netProfitCents)} — typical while scaling.`,
  ];
  if (y2) {
    parts.push(
      `If annualized run-rate scales about ${y2.multiplier}×, projected revenue reaches roughly ${formatCad(y2.projectedRevenueCents)} with the simple growth model (not a forecast).`
    );
  }
  if (payload.demoMode) {
    parts.push("Figures include illustrative demo data where live revenue was minimal.");
  }
  return parts.join(" ");
}

export async function getFullFinancialModel(period?: FinancialPeriod): Promise<FullFinancialModel> {
  const p = period ?? getDefaultFinancialPeriod();
  const payload = await buildFinancialModelPayload(p);
  const monthlyCosts = getMonthlyCosts();
  const yearlyCosts = getYearlyCosts();
  const profit = await getProfit(p, "custom");
  const projections = await projectGrowth(p);
  const aiSummary = buildAiSummary(payload, profit, projections);

  return {
    payload,
    monthlyCosts,
    yearlyCosts,
    profit,
    projections,
    aiSummary,
  };
}
