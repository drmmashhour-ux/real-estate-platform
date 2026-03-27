import { describe, expect, it } from "vitest";
import { generateDailyInsights } from "../domain/dailyInsights";

describe("generateDailyInsights", () => {
  it("flags low reply rate when enough sends", () => {
    const lines = generateDailyInsights({
      messagesSent: 10,
      repliesReceived: 0,
      callsBooked: 0,
      variantStats: {},
      followUpDueCount: 0,
    });
    expect(lines.some((l) => l.toLowerCase().includes("reply"))).toBe(true);
  });

  it("flags missing follow-ups", () => {
    const lines = generateDailyInsights({
      messagesSent: 1,
      repliesReceived: 0,
      callsBooked: 0,
      variantStats: {},
      followUpDueCount: 3,
    });
    expect(lines.some((l) => l.includes("Follow-ups"))).toBe(true);
  });

  it("mentions best script when variant has traction", () => {
    const lines = generateDailyInsights({
      messagesSent: 5,
      repliesReceived: 2,
      callsBooked: 0,
      variantStats: { curiosity: { uses: 3, replies: 2 } },
      followUpDueCount: 0,
    });
    expect(lines.some((l) => l.includes("curiosity") || l.includes("A "))).toBe(true);
  });
});
