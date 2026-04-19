import { computeTeamLeadRollup } from "@/modules/broker/team/broker-team.service";
import type { BrokerPerformanceLeadRow } from "@/modules/broker/performance/broker-performance.service";

const MS_HOUR = 60 * 60 * 1000;

describe("broker-team.service — computeTeamLeadRollup", () => {
  const nowMs = Date.parse("2026-04-02T12:00:00.000Z");

  it("counts active non-terminal leads and overdue stalls (72h+)", () => {
    const leads: BrokerPerformanceLeadRow[] = [
      {
        aiExplanation: null,
        pipelineStage: "won",
        pipelineStatus: null,
        wonAt: new Date(nowMs - MS_HOUR),
        lostAt: null,
        contactUnlockedAt: null,
        firstContactAt: null,
        lastContactedAt: null,
        lastContactAt: null,
        dmStatus: "none",
        engagementScore: null,
        lastFollowUpAt: null,
        createdAt: new Date(nowMs - 10 * MS_HOUR),
        meetingScheduledAt: null,
        meetingAt: null,
      },
      {
        aiExplanation: null,
        pipelineStage: "contacted",
        pipelineStatus: null,
        wonAt: null,
        lostAt: null,
        contactUnlockedAt: null,
        firstContactAt: new Date(nowMs - 100 * MS_HOUR),
        lastContactedAt: new Date(nowMs - 100 * MS_HOUR),
        lastContactAt: new Date(nowMs - 100 * MS_HOUR),
        dmStatus: "none",
        engagementScore: null,
        lastFollowUpAt: null,
        createdAt: new Date(nowMs - 120 * MS_HOUR),
        meetingScheduledAt: null,
        meetingAt: null,
      },
    ];

    const rollup = computeTeamLeadRollup(leads, nowMs);
    expect(rollup.leadsActive).toBe(1);
    expect(rollup.followUpsOverdue).toBe(1);
    expect(rollup.stalledAfterContact).toBe(1);
    expect(rollup.lastTouchMs).toBeGreaterThan(0);
  });
});
