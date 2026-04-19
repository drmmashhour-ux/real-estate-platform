import { describe, expect, it } from "vitest";

import { buildBrokerAiDailyAssist } from "@/modules/broker/ai-assist/broker-ai-daily-assist.service";
import { resetBrokerAiAssistMonitoringForTests } from "@/modules/broker/ai-assist/broker-ai-assist-monitoring.service";

describe("broker-ai-daily-assist.service", () => {
  const now = Date.UTC(2026, 5, 10, 12, 0, 0);

  it("handles sparse cohort without throwing", () => {
    resetBrokerAiAssistMonitoringForTests();
    const d = buildBrokerAiDailyAssist([], now);
    expect(d.lines.length).toBeGreaterThan(0);
    expect(d.followUpNow).toEqual([]);
  });

  it("prioritizes overdue contacted leads for follow-up list", () => {
    resetBrokerAiAssistMonitoringForTests();
    const d = buildBrokerAiDailyAssist(
      [
        {
          leadId: "a",
          name: "A",
          score: 50,
          closing: {
            leadId: "a",
            brokerId: "b",
            stage: "contacted",
            responseReceived: false,
            lastContactAt: new Date(now - 80 * 3600000).toISOString(),
            createdAt: new Date(now - 900000000).toISOString(),
            updatedAt: new Date(now - 80 * 3600000).toISOString(),
          },
          nextAction: {
            actionType: "follow_up",
            actionLabel: "Follow up",
            urgency: "high",
            reason: "r",
            followUpDraftHint: "follow_up",
          },
        },
      ],
      now,
    );
    expect(d.followUpNow.map((x) => x.leadId)).toContain("a");
  });
});
