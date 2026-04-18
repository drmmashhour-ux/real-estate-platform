import { buildInvestorMetricTable } from "@/modules/investor-metrics/investor-metrics.service";
import { buildScalingGrowthBundle } from "@/modules/scaling-growth/scaling-growth.service";
import { generateTractionSummary } from "./traction-summary.generator";
import { buildTractionMilestones } from "./milestone-tracker.service";
import { buildGrowthNarrativeFromScaling } from "./growth-narrative.service";

export type InvestorStoryBundle = {
  generatedAt: string;
  metrics: Awaited<ReturnType<typeof buildInvestorMetricTable>>;
  tractionSummary: ReturnType<typeof generateTractionSummary>;
  tractionMilestones: Awaited<ReturnType<typeof buildTractionMilestones>>;
  growthNarrative: ReturnType<typeof buildGrowthNarrativeFromScaling>;
};

export async function buildInvestorStoryBundle(): Promise<InvestorStoryBundle> {
  const [metrics, tractionMilestones, scaling] = await Promise.all([
    buildInvestorMetricTable(),
    buildTractionMilestones(),
    buildScalingGrowthBundle(),
  ]);

  const tractionSummary = generateTractionSummary(metrics.rows);
  const growthNarrative = buildGrowthNarrativeFromScaling(scaling);

  return {
    generatedAt: new Date().toISOString(),
    metrics,
    tractionSummary,
    tractionMilestones,
    growthNarrative,
  };
}
