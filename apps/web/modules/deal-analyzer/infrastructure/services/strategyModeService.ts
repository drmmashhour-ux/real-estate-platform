import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import type { UserStrategyMode } from "@/modules/deal-analyzer/domain/strategyModes";
import { UserStrategyMode as M } from "@/modules/deal-analyzer/domain/strategyModes";

export function getStrategyWeights(mode: UserStrategyMode | null | undefined): {
  cashFlow: number;
  pricePosition: number;
  trust: number;
  risk: number;
} {
  const w = dealAnalyzerConfig.phase3.strategyWeights;
  const allowed: UserStrategyMode[] = [
    M.BUY_TO_LIVE,
    M.BUY_TO_RENT,
    M.BUY_TO_FLIP,
    M.BUY_FOR_BNHUB,
    M.HOLD_LONG_TERM,
  ];
  const key = mode && allowed.includes(mode) ? mode : M.BUY_TO_LIVE;
  return { ...w[key] };
}

export function strategyModeLabel(mode: UserStrategyMode | null | undefined): string {
  const m = mode ?? M.BUY_TO_LIVE;
  return m.replace(/_/g, " ");
}
