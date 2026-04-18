import { aiAutopilotV1Flags } from "@/config/feature-flags";
import type { ProposedAction } from "../ai-autopilot.types";

/**
 * Adapter — does not duplicate `SmartDealAutopilot` / `/api/deals/[id]/autopilot/*`.
 * Surfaces a single “open existing deal autopilot” hint for brokers.
 */
export function proposalsFromDealAutopilotAdapter(userId: string): ProposedAction[] {
  if (!aiAutopilotV1Flags.dealsDomain) return [];
  return [
    {
      domain: "broker_deal",
      entityType: "broker",
      entityId: userId,
      actionType: "open_deal_autopilot",
      title: "Use existing Deal Autopilot for active files",
      summary:
        "Continue to use `/broker/residential/deals/[id]/autopilot` for next steps — unified queue links here for visibility only.",
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: { hint: "Use existing deal autopilot APIs; no duplicate execution path." },
      reasons: {
        triggeredBy: "deals domain flag",
        expectedBenefit: "Single operational habit for deal progression",
        confidence: 0.6,
      },
      subjectUserId: userId,
      audience: "broker",
    },
  ];
}
