import { describe, expect, it } from "vitest";
import { generateDailyReport } from "../application/generateDailyReport";

describe("generateDailyReport (daily-execution)", () => {
  it("aggregates task rows", () => {
    const r = generateDailyReport(
      [
        { taskType: "messages_sent", targetCount: 20, completedCount: 5, repliesNote: "3 warm" },
        { taskType: "content_posted", targetCount: 1, completedCount: 1 },
        { taskType: "calls_booked", targetCount: 1, completedCount: 1, metadata: { callCompleted: true } },
        { taskType: "users_onboarded", targetCount: 1, completedCount: 0 },
      ],
      "2026-03-27"
    );
    expect(r.messagesSent).toBe(5);
    expect(r.repliesNote).toBe("3 warm");
    expect(r.contentPosted).toBe(1);
    expect(r.callCompleted).toBe(true);
    expect(r.summaryLines.some((l) => l.includes("manually"))).toBe(true);
  });
});
