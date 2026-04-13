import { getStylePerformanceRollup } from "@/lib/content-machine/analytics";
import {
  analyzeOptimizationSignals,
  getTopMachineContentByScore,
  getWorstMachineContentByScore,
} from "./get-winners";
import { generateContentRecommendations } from "./generate-recommendations";

export async function loadContentIntelligenceDashboard() {
  const [signals, top, worst, rollup] = await Promise.all([
    analyzeOptimizationSignals(0.12),
    getTopMachineContentByScore(15),
    getWorstMachineContentByScore(15),
    getStylePerformanceRollup(),
  ]);

  const recommendations = generateContentRecommendations(signals, {});

  return {
    signals,
    top,
    worst,
    rollup,
    recommendations,
  };
}
