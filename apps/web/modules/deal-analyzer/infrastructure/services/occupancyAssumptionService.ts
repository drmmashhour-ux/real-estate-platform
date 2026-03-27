import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import { ScenarioKind } from "@/modules/deal-analyzer/domain/scenarios";

export function defaultBnhubOccupancy(): number {
  return dealAnalyzerConfig.bnhub.defaultOccupancy;
}

export function occupancyForBnhubScenario(kind: (typeof ScenarioKind)[keyof typeof ScenarioKind]): number {
  if (kind === ScenarioKind.CONSERVATIVE) return dealAnalyzerConfig.bnhub.conservativeOccupancy;
  if (kind === ScenarioKind.AGGRESSIVE) return dealAnalyzerConfig.bnhub.aggressiveOccupancy;
  return dealAnalyzerConfig.bnhub.defaultOccupancy;
}
