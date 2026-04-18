import { ingestOptimizerLearning } from "./ads-learning-store";

export type PerformanceSignals = {
  ctrPercent: number | null;
  cpl: number | null;
  conversionRatePercent: number | null;
};

export type OptimizationResult = {
  improvedHeadlines: string[];
  improvedTargeting: string[];
  recommendation: "scale" | "pause" | "test_variation";
  summary: string;
};

/**
 * Rule-based optimization — feeds learning store for headline bias. No auto-spend.
 */
export function analyzePerformanceAndImprove(data: PerformanceSignals): OptimizationResult {
  const ctr = data.ctrPercent ?? 0;
  const conv = data.conversionRatePercent ?? 0;
  const cpl = data.cpl;

  let recommendation: OptimizationResult["recommendation"] = "test_variation";
  let summary = "Mixed signals — run a controlled creative test before changing budget.";

  if (ctr >= 1.5 && conv >= 3 && (cpl == null || cpl <= 75)) {
    recommendation = "scale";
    summary = "Strong efficiency vs internal guardrails — increase budget gradually in-network.";
  } else if (ctr < 1 || (cpl != null && cpl > 120)) {
    recommendation = "pause";
    summary = "Weak CTR or high CPL — pause or reduce spend until landing + creative refresh.";
  } else {
    recommendation = "test_variation";
    summary = "Hold budget flat; test new headline/primary text combinations.";
  }

  const improvedHeadlines =
    recommendation === "pause"
      ? [
          "Paused variant — refresh hook with city-specific proof",
          "Try question-led headline vs statement-led",
        ]
      : recommendation === "scale"
        ? [
            "Scale winner: duplicate ad set with +1 headline variant",
            "Add social proof line — verified stays only",
          ]
        : [
            "A/B: urgency vs reassurance in first 5 words",
            "Try “Compare nightly rates” vs “Book verified stays”",
          ];

  const improvedTargeting =
    recommendation === "pause"
      ? ["Tighten geo to core metro", "Exclude low-intent placements (when reviewing network stats)"]
      : recommendation === "scale"
        ? ["Lookalike from last 30d site visitors (export required)", "Retarget engaged sessions"]
        : ["Split audience: new vs returning site visitors", "Layer interest stack lightly — avoid overlap"];

  const result: OptimizationResult = {
    improvedHeadlines,
    improvedTargeting,
    recommendation,
    summary,
  };

  ingestOptimizerLearning({
    improvedHeadlines,
    recommendation,
  });

  return result;
}
