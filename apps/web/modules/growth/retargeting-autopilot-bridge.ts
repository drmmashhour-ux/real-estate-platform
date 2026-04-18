/**
 * Recommendation-only autopilot descriptors — LOW risk; no auto-execution.
 * Wire to UI or queue as `PlatformAutopilotAction` manually if desired.
 */

export const RETARGETING_AUTOPILOT_ACTIONS = {
  RETARGET_HIGH_INTENT_USERS: {
    actionType: "RETARGET_HIGH_INTENT_USERS",
    domain: "growth",
    riskLevel: "LOW" as const,
    title: "Retarget high-intent listing viewers",
    summary:
      "Export audience from `buildRetargetingAudiences` → highIntent segment; use suggested copy in Meta/Google.",
  },
  RECOVER_ABANDONED_BOOKINGS: {
    actionType: "RECOVER_ABANDONED_BOOKINGS",
    domain: "growth",
    riskLevel: "LOW" as const,
    title: "Recover abandoned BNHub checkouts",
    summary:
      "When abandonedBookings > 0, run urgency recovery creative + email/SMS if consented; never auto-charge.",
  },
  BOOST_TOP_LISTINGS: {
    actionType: "BOOST_TOP_LISTINGS",
    domain: "growth",
    riskLevel: "LOW" as const,
    title: "Boost top listings in search",
    summary:
      "Use featured placement + growth boost hooks (`listing-monetization-hooks`) for winners — manual approval for spend.",
  },
} as const;

export type RetargetingAutopilotActionKey = keyof typeof RETARGETING_AUTOPILOT_ACTIONS;

export function listRetargetingAutopilotRecommendations(input: {
  highIntentCount: number;
  abandonedBookings: number;
  hotLeads: number;
}): (typeof RETARGETING_AUTOPILOT_ACTIONS)[RetargetingAutopilotActionKey][] {
  const out: (typeof RETARGETING_AUTOPILOT_ACTIONS)[RetargetingAutopilotActionKey][] = [];
  if (input.highIntentCount > 0) out.push(RETARGETING_AUTOPILOT_ACTIONS.RETARGET_HIGH_INTENT_USERS);
  if (input.abandonedBookings > 0) out.push(RETARGETING_AUTOPILOT_ACTIONS.RECOVER_ABANDONED_BOOKINGS);
  if (input.highIntentCount >= 3 || input.hotLeads >= 3) {
    out.push(RETARGETING_AUTOPILOT_ACTIONS.BOOST_TOP_LISTINGS);
  }
  return out;
}
