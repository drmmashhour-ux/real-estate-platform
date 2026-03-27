import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import type { ScenarioKind } from "@/modules/deal-analyzer/domain/scenarios";
import { ScenarioKind as SK } from "@/modules/deal-analyzer/domain/scenarios";

export function estimateMonthlyOperatingCostCents(monthlyRentCents: number, kind: ScenarioKind): number {
  const pct =
    kind === SK.CONSERVATIVE
      ? dealAnalyzerConfig.scenario.rental.operatingCostPctOfRent.conservative
      : kind === SK.EXPECTED
        ? dealAnalyzerConfig.scenario.rental.operatingCostPctOfRent.expected
        : dealAnalyzerConfig.scenario.rental.operatingCostPctOfRent.aggressive;
  return Math.round(monthlyRentCents * pct);
}
