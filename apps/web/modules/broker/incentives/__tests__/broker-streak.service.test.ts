import { describe, expect, it } from "vitest";

import { computeBrokerStreaks } from "@/modules/broker/incentives/broker-streak.service";

describe("broker-streak.service", () => {
  it("breaks current streak when latest activity is older than yesterday UTC", () => {
    const old = new Date("2026-01-01T15:00:00.000Z");
    const leads = [{ firstContactAt: old, lastContactAt: null, lastContactedAt: null, lastFollowUpAt: null, contactUnlockedAt: null }];
    const nowMs = Date.parse("2026-02-01T12:00:00.000Z");
    const streaks = computeBrokerStreaks(leads, nowMs);
    expect(streaks.find((s) => s.type === "activity")?.currentCount).toBe(0);
    expect(streaks.find((s) => s.type === "activity")?.bestCount).toBeGreaterThanOrEqual(1);
  });

  it("counts consecutive activity days ending today", () => {
    const today = new Date("2026-03-10T14:00:00.000Z");
    const y = new Date("2026-03-09T14:00:00.000Z");
    const leads = [
      { firstContactAt: today, lastContactAt: null, lastContactedAt: null, lastFollowUpAt: null, contactUnlockedAt: null },
      { firstContactAt: y, lastContactAt: null, lastContactedAt: null, lastFollowUpAt: null, contactUnlockedAt: null },
    ];
    const nowMs = Date.parse("2026-03-10T20:00:00.000Z");
    const streaks = computeBrokerStreaks(leads, nowMs);
    expect(streaks.find((s) => s.type === "activity")?.currentCount).toBeGreaterThanOrEqual(2);
  });

  it("counts fast-response days deterministically", () => {
    const unlocked = new Date("2026-04-01T10:00:00.000Z");
    const contact = new Date("2026-04-01T18:00:00.000Z");
    const leads = [
      {
        firstContactAt: contact,
        lastContactAt: null,
        lastContactedAt: null,
        lastFollowUpAt: null,
        contactUnlockedAt: unlocked,
      },
    ];
    const nowMs = Date.parse("2026-04-02T12:00:00.000Z");
    const streaks = computeBrokerStreaks(leads, nowMs);
    expect(streaks.find((s) => s.type === "response")?.bestCount).toBeGreaterThanOrEqual(1);
  });
});
