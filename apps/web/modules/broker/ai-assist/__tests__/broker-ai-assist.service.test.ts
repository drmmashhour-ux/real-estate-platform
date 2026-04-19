import { describe, expect, it } from "vitest";

import { buildBrokerAiAssistSummary } from "@/modules/broker/ai-assist/broker-ai-assist.service";
import { resetBrokerAiAssistMonitoringForTests } from "@/modules/broker/ai-assist/broker-ai-assist-monitoring.service";

function closing(partial: Partial<import("@/modules/broker/closing/broker-closing.types").LeadClosingState>) {
  const now = new Date().toISOString();
  return {
    leadId: "l1",
    brokerId: "b1",
    stage: "contacted" as const,
    responseReceived: false,
    createdAt: now,
    updatedAt: now,
    lastContactAt: new Date(Date.now() - 50 * 3600000).toISOString(),
    ...partial,
  };
}

describe("broker-ai-assist.service", () => {
  it("returns max 3 suggestions deterministically", () => {
    resetBrokerAiAssistMonitoringForTests();
    const s = buildBrokerAiAssistSummary({
      leadId: "l1",
      name: "Alex",
      score: 55,
      closing: closing({}),
      nextAction: {
        actionType: "follow_up",
        actionLabel: "Send follow-up",
        urgency: "high",
        reason: "Cadence reminder.",
        followUpDraftHint: "follow_up",
      },
      nowMs: Date.now(),
    });
    expect(s.topSuggestions).toHaveLength(3);
    expect(s.primaryRecommendation).toContain("Send follow-up");
    expect(buildBrokerAiAssistSummary({
      leadId: "l1",
      name: "Alex",
      score: 55,
      closing: closing({}),
      nextAction: {
        actionType: "follow_up",
        actionLabel: "Send follow-up",
        urgency: "high",
        reason: "Cadence reminder.",
        followUpDraftHint: "follow_up",
      },
      nowMs: Date.now(),
    })).toEqual(s);
  });

  it("always sets safeOnly on suggestions", () => {
    resetBrokerAiAssistMonitoringForTests();
    const s = buildBrokerAiAssistSummary({
      leadId: "l1",
      name: "Alex",
      score: 80,
      closing: closing({ stage: "responded", responseReceived: true }),
      nextAction: {
        actionType: "push_meeting",
        actionLabel: "Push for meeting",
        urgency: "medium",
        reason: "Engaged lead.",
        followUpDraftHint: "meeting_push",
      },
      nowMs: Date.now(),
    });
    expect(s.topSuggestions.every((x) => x.safeOnly === true)).toBe(true);
  });
});
