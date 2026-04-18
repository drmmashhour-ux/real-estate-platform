import { aiAutopilotV1Flags } from "@/config/feature-flags";
import type { NormalizedSignal, ProposedAction } from "../ai-autopilot.types";

export function proposalsFromBnhubSignals(signals: NormalizedSignal[], subjectUserId: string): ProposedAction[] {
  if (!aiAutopilotV1Flags.bnhubDomain) return [];
  const out: ProposedAction[] = [];
  for (const s of signals) {
    if (s.domain !== "bnhub" || s.signalType !== "listing_quality_low" || !s.entityId) continue;
    out.push({
      domain: "bnhub",
      entityType: "short_term_listing",
      entityId: s.entityId,
      actionType: "listing_refresh_suggestion",
      title: "Refresh listing content & photos",
      summary:
        "Quality score is below the healthy band — review title, description, and hero photo before changing price.",
      severity: "medium",
      riskLevel: "MEDIUM",
      recommendedPayload: { listingId: s.entityId, openHostDashboard: true },
      reasons: {
        triggeredBy: "listing_quality_low signal",
        dataSources: ["listingQualityScore"],
        expectedBenefit: "Higher conversion and trust without automatic price moves",
        confidence: 0.82,
        cautions: ["Do not auto-change price without host policy"],
      },
      subjectUserId,
      audience: "host",
    });
  }
  return out;
}
