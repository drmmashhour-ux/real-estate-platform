import { autonomyConfig } from "../config/autonomy.config";
import type { ObservationSnapshot } from "../types/domain.types";
import { makeOpportunity, makeProposedAction } from "./detector-utils";
import type { AutonomyDetector } from "./detector.types";

export const inactiveHostOrBrokerFollowupDetector: AutonomyDetector = {
  id: "inactive_host_or_broker_followup",
  description: "Host/broker idle — internal nudge task.",
  run(obs: ObservationSnapshot) {
    const hb = obs.signals.filter((s) => s.signalType === "host_broker_engagement");
    if (hb.length === 0) return [];

    const out = [];
    for (const s of hb) {
      if (s.signalType !== "host_broker_engagement") continue;
      const hours = s.metadata.lastHostActivityHours;
      if (hours == null || hours < autonomyConfig.detectors.inactiveHostHours) continue;

      const pa = makeProposedAction({
        type: "CREATE_TASK",
        target: obs.target,
        detectorId: inactiveHostOrBrokerFollowupDetector.id,
        opportunityId: "opp-inactive-1",
        confidence: 0.6,
        risk: "LOW",
        title: "Re-engage inactive operator",
        explanation: `No meaningful activity for ~${Math.floor(hours / 24)} days — align on blockers.`,
        humanReadableSummary: "Creates an internal coaching task — no outbound guest spam.",
        metadata: { lastHostActivityHours: hours, userId: s.metadata.userId },
      });

      out.push(
        makeOpportunity({
          detectorId: inactiveHostOrBrokerFollowupDetector.id,
          title: "Inactive host/broker follow-up",
          explanation: "Engagement gap risks pipeline decay.",
          confidence: 0.59,
          risk: "LOW",
          evidence: { lastHostActivityHours: hours },
          actions: [pa],
        }),
      );
    }
    return out;
  },
};
