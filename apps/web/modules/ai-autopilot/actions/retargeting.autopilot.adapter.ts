import {
  aiAutopilotV1Flags,
  croRetargetingDurabilityFlags,
  croRetargetingLearningFlags,
  engineFlags,
} from "@/config/feature-flags";
import { RETARGETING_AUTOPILOT_ACTIONS } from "@/modules/growth/retargeting-autopilot-bridge";
import { buildUnifiedSnapshot, computeUnifiedAutopilotConfidence } from "@/modules/growth/unified-learning.service";
import type { ProposedAction } from "../ai-autopilot.types";

/**
 * Growth retargeting — recommendation-only; no ad API or spend.
 */
export function proposalsRetargetingAutopilot(userId: string): ProposedAction[] {
  void userId;
  if (!engineFlags.growthMachineV1 || !aiAutopilotV1Flags.aiAutopilotV1 || !aiAutopilotV1Flags.growthDomain) {
    return [];
  }

  const u = buildUnifiedSnapshot();
  const persistOn =
    croRetargetingLearningFlags.croRetargetingPersistenceV1 ||
    croRetargetingDurabilityFlags.croRetargetingDurabilityV1;
  const croN = Number(u.persistedCroSignalTotal ?? 0);
  const rtN = Number(u.persistedRetargetingSignalTotal ?? 0);
  const durableVolume =
    (Number.isFinite(croN) ? croN : 0) + (Number.isFinite(rtN) ? rtN : 0);
  const monitorHold =
    persistOn &&
    durableVolume < 4 &&
    u.evidenceQualityHint !== "HIGH";

  const a = RETARGETING_AUTOPILOT_ACTIONS;
  return [
    {
      domain: "growth",
      entityType: "retargeting",
      entityId: "high_intent",
      actionType: a.RETARGET_HIGH_INTENT_USERS.actionType,
      title: a.RETARGET_HIGH_INTENT_USERS.title,
      summary: monitorHold
        ? `${a.RETARGET_HIGH_INTENT_USERS.summary} (Monitor: durable learning volume is still thin — validate audiences manually.)`
        : a.RETARGET_HIGH_INTENT_USERS.summary,
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: { module: "modules/ads/retargeting-audience.service#buildRetargetingAudiences", mode: "RECOMMENDATION_ONLY" },
      reasons: {
        confidence: computeUnifiedAutopilotConfidence(0.51),
        snapshotQuality: u.evidenceQualityHint,
        monitorHold,
      },
      subjectUserId: null,
      audience: "admin",
    },
    {
      domain: "growth",
      entityType: "retargeting",
      entityId: "abandoned",
      actionType: a.RECOVER_ABANDONED_BOOKINGS.actionType,
      title: a.RECOVER_ABANDONED_BOOKINGS.title,
      summary: a.RECOVER_ABANDONED_BOOKINGS.summary,
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: { mode: "MANUAL_CRM_AND_ADS_UI" },
      reasons: { confidence: computeUnifiedAutopilotConfidence(0.5), monitorHold },
      subjectUserId: null,
      audience: "admin",
    },
    {
      domain: "growth",
      entityType: "retargeting",
      entityId: "boost",
      actionType: a.BOOST_TOP_LISTINGS.actionType,
      title: a.BOOST_TOP_LISTINGS.title,
      summary: a.BOOST_TOP_LISTINGS.summary,
      severity: "low",
      riskLevel: "LOW",
      recommendedPayload: { mode: "MANUAL_FEATURED_PLACEMENT" },
      reasons: { confidence: computeUnifiedAutopilotConfidence(0.48), monitorHold },
      subjectUserId: null,
      audience: "admin",
    },
  ];
}
