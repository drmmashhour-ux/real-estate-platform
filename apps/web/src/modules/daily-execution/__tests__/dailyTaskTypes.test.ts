import { describe, expect, it } from "vitest";
import {
  computeIncrementedCount,
  deriveTaskStatus,
  DEFAULT_DAILY_TASKS,
  isDailyTaskType,
} from "../domain/dailyTaskTypes";

describe("dailyTaskTypes", () => {
  it("default tasks match spec", () => {
    expect(DEFAULT_DAILY_TASKS).toHaveLength(4);
    expect(DEFAULT_DAILY_TASKS.find((t) => t.taskType === "messages_sent")?.targetCount).toBe(20);
    expect(DEFAULT_DAILY_TASKS.find((t) => t.taskType === "content_posted")?.targetCount).toBe(1);
  });

  it("deriveTaskStatus", () => {
    expect(deriveTaskStatus(0, 20)).toBe("pending");
    expect(deriveTaskStatus(1, 20)).toBe("in_progress");
    expect(deriveTaskStatus(20, 20)).toBe("completed");
  });

  it("computeIncrement caps at target", () => {
    expect(computeIncrementedCount(19, 20, 5).nextCompleted).toBe(20);
    expect(computeIncrementedCount(20, 20, 1).nextCompleted).toBe(20);
    expect(computeIncrementedCount(0, 20, 0).nextCompleted).toBe(0);
  });

  it("isDailyTaskType", () => {
    expect(isDailyTaskType("messages_sent")).toBe(true);
    expect(isDailyTaskType("bogus")).toBe(false);
  });
});
