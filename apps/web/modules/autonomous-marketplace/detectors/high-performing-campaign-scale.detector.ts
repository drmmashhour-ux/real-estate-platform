import { autonomyConfig } from "../config/autonomy.config";
import type { ObservationSnapshot } from "../types/domain.types";
import { makeOpportunity, makeProposedAction } from "./detector-utils";
import type { AutonomyDetector } from "./detector.types";

export const highPerformingCampaignScaleDetector: AutonomyDetector = {
  id: "high_performing_campaign_scale",
  description: "Strong CTR and conversion — bounded budget scale suggestion.",
  run(obs: ObservationSnapshot) {
    if (obs.target.type !== "campaign" || !obs.target.id) return [];

    const c = obs.signals.find((s) => s.signalType === "campaign_performance");
    if (!c || c.signalType !== "campaign_performance") return [];

    const ctr = c.metadata.ctr ?? 0;
    const leads = c.metadata.leads ?? 0;
    const conv = c.metadata.conversionRate ?? 0;
    if (ctr < autonomyConfig.detectors.highCtrThreshold || leads < 2) return [];

    const pa = makeProposedAction({
      type: "SCALE_CAMPAIGN_BUDGET",
      target: obs.target,
      detectorId: highPerformingCampaignScaleDetector.id,
      opportunityId: "opp-cmp-1",
      confidence: 0.65,
      risk: "HIGH",
      title: "Scale winning campaign cautiously",
      explanation: `CTR ${(ctr * 100).toFixed(2)}% with positive lead flow — advisory scale only.`,
      humanReadableSummary: "Produces bounded scale recommendation for manual Ads Manager application.",
      metadata: {
        suggestedScalePct: Math.min(autonomyConfig.budget.maxScalePctPerRun, 15),
        ctr,
        leads,
        conversionRate: conv,
      },
    });

    return [
      makeOpportunity({
        detectorId: highPerformingCampaignScaleDetector.id,
        title: "High-performing campaign",
        explanation: "Funnel efficiency supports incremental budget test.",
        confidence: 0.64,
        risk: "HIGH",
        evidence: { ctr, leads, conversionRate: conv },
        actions: [pa],
      }),
    ];
  },
};
