/**
 * Orchestrates adaptive intelligence snapshot — read-only suggestions.
 */

import { buildAdaptiveContext } from "@/modules/growth/adaptive-context.service";
import { generateAdaptiveDecisions } from "@/modules/growth/adaptive-decision.service";
import { attachAdaptiveExplanations } from "@/modules/growth/adaptive-explainer.service";
import type { AdaptiveIntelligenceSnapshot } from "@/modules/growth/adaptive-intelligence.types";
import {
  countByCategory,
  logAdaptiveIntelligenceBuilt,
  logAdaptiveIntelligenceSparse,
} from "@/modules/growth/adaptive-intelligence-monitoring.service";
import { prioritizeAdaptiveDecisions } from "@/modules/growth/adaptive-priority.service";

export async function buildAdaptiveIntelligenceSnapshot(): Promise<AdaptiveIntelligenceSnapshot> {
  const context = await buildAdaptiveContext();
  if (context.sparseSignals) void logAdaptiveIntelligenceSparse();

  const raw = generateAdaptiveDecisions(context);
  const ordered = prioritizeAdaptiveDecisions(raw).slice(0, 5);
  const decisions = attachAdaptiveExplanations(ordered);

  const lowConfidence = decisions.filter((d) => d.confidence === "low").length;
  logAdaptiveIntelligenceBuilt({
    decisionCount: decisions.length,
    byCategory: countByCategory(decisions),
    lowConfidence,
  });

  return {
    context,
    decisions,
    generatedAt: context.generatedAt,
    note:
      "Suggestions are correlational and require human approval — no messaging, pricing changes, or automated execution.",
  };
}
