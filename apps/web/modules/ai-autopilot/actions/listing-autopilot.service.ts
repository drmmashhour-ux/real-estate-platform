import { aiAutopilotV1Flags } from "@/config/feature-flags";
import type { NormalizedSignal, ProposedAction } from "../ai-autopilot.types";

export function proposalsFromListingSignals(signals: NormalizedSignal[], subjectUserId: string): ProposedAction[] {
  if (!aiAutopilotV1Flags.aiAutopilotV1) return [];
  const out: ProposedAction[] = [];
  for (const s of signals) {
    if (s.domain !== "listing" || s.signalType !== "optimization_pending") continue;
    out.push({
      domain: "listing",
      entityType: "user",
      entityId: subjectUserId,
      actionType: "open_listing_autopilot_queue",
      title: "Review AI optimization suggestions",
      summary: "You have pending listing optimization items — approve or reject before any auto-apply (per your mode).",
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: { route: "/dashboard/autopilot" },
      reasons: {
        triggeredBy: "pending ListingOptimizationSuggestion rows",
        dataSources: ["listingOptimizationSuggestion"],
        expectedBenefit: "Faster iteration on titles/descriptions with human review",
        confidence: 1,
      },
      subjectUserId,
      audience: "host",
    });
  }
  return out;
}
