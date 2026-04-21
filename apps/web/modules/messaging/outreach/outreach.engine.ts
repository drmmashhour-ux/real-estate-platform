import { logMessagingInfo } from "@/modules/messaging/messaging-logger";
import { isUnderDailyCap, outreachCooldownMs, type OutreachKind } from "@/modules/messaging/outreach/automation.policy";

export type OutreachEvaluation = {
  allow: boolean;
  reason: string;
  nextEligibleAt?: string;
};

/**
 * Gate automated outreach before enqueueing notifications or inserting system messages.
 * Persist last-sent timestamps per user/thread in DB before relying on this alone.
 */
export function evaluateAutomatedOutreach(params: {
  kind: OutreachKind;
  sendsTodayForBroker: number;
  lastSentAt?: Date | null;
}): OutreachEvaluation {
  if (!isUnderDailyCap(params.sendsTodayForBroker)) {
    return { allow: false, reason: "daily_automation_cap" };
  }
  const cooldown = outreachCooldownMs(params.kind);
  if (params.lastSentAt) {
    const elapsed = Date.now() - params.lastSentAt.getTime();
    if (elapsed < cooldown) {
      return {
        allow: false,
        reason: "cooldown",
        nextEligibleAt: new Date(params.lastSentAt.getTime() + cooldown).toISOString(),
      };
    }
  }
  logMessagingInfo("outreach.allow", { kind: params.kind });
  return { allow: true, reason: "ok" };
}
