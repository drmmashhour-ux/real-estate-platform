import { autonomyConfig } from "../config/autonomy.config";
import type { ObservationSnapshot } from "../types/domain.types";
import { makeOpportunity, makeProposedAction } from "./detector-utils";
import type { AutonomyDetector } from "./detector.types";

export const abandonedLeadReengagementDetector: AutonomyDetector = {
  id: "abandoned_lead_reengagement",
  description: "Lead idle beyond SLA — safe follow-up or review flag.",
  run(obs: ObservationSnapshot) {
    if (obs.target.type !== "lead" || !obs.target.id) return [];

    const lf = obs.signals.find((s) => s.signalType === "lead_funnel");
    if (!lf || lf.signalType !== "lead_funnel") return [];

    const hours = lf.metadata.hoursSinceFollowUp ?? lf.metadata.hoursSinceCreated ?? 0;
    if (hours < autonomyConfig.detectors.abandonedLeadHours) return [];

    const attempts = lf.metadata.followUpAttempts ?? 0;
    const highSpam = attempts >= autonomyConfig.outreach.maxFollowUpsBeforeReviewFlag;

    const pa = highSpam
      ? makeProposedAction({
          type: "FLAG_REVIEW",
          target: obs.target,
          detectorId: abandonedLeadReengagementDetector.id,
          opportunityId: "opp-lead-1",
          confidence: 0.7,
          risk: "HIGH",
          title: "Lead needs human review (cadence)",
          explanation: "Multiple attempts without response — avoid automated spam; escalate for review.",
          humanReadableSummary: "Flag for operator review instead of another automated touch.",
          metadata: { attempts },
        })
      : makeProposedAction({
          type: "SEND_LEAD_FOLLOWUP",
          target: obs.target,
          detectorId: abandonedLeadReengagementDetector.id,
          opportunityId: "opp-lead-1",
          confidence: 0.72,
          risk: "MEDIUM",
          title: "Draft follow-up task",
          explanation: `Lead idle ~${hours.toFixed(1)}h — queue a manual follow-up or draft message.`,
          humanReadableSummary: "Creates an internal task/draft — does not auto-send externally.",
          metadata: { hoursSinceFollowUp: hours },
        });

    return [
      makeOpportunity({
        detectorId: abandonedLeadReengagementDetector.id,
        title: highSpam ? "Lead follow-up risk" : "Abandoned lead window",
        explanation: highSpam
          ? "Cadence suggests pausing automated outreach."
          : "Hot lead cooling — accelerate broker contact.",
        confidence: 0.71,
        risk: highSpam ? "HIGH" : "MEDIUM",
        evidence: { hours, attempts },
        actions: [pa],
      }),
    ];
  },
};
