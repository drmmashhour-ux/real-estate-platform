import type { ExecutionDay } from "@prisma/client";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildExecutionAlerts } from "../alerts";
import { DAILY_TARGETS, REVENUE_GOAL_USD } from "../constants";
import { computeProgressForDays } from "../progressTracker";
import { compareDayToTargets, compareWeekToTargets } from "../targetEngine";

vi.mock("@/lib/db", () => ({
  prisma: {
    executionDay: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    executionAction: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { logMessage, logRevenue } from "../dailyTracker";

describe("execution targetEngine", () => {
  it("compareDayToTargets detects gaps", () => {
    const day = {
      messagesSent: 5,
      brokersContacted: 2,
      bookingsCompleted: 0,
    } as ExecutionDay;
    const c = compareDayToTargets(day);
    expect(c.messages.met).toBe(false);
    expect(c.brokers.met).toBe(false);
    expect(c.bookings.met).toBe(false);
    expect(c.missedLabels.length).toBe(3);
  });

  it("compareWeekToTargets uses full period quota", () => {
    const w = compareWeekToTargets(
      [{ messagesSent: 200, brokersContacted: 40, bookingsCompleted: 10 } as ExecutionDay],
      7
    );
    expect(w.expected.messages).toBe(DAILY_TARGETS.messages * 7);
    expect(w.expected.bookings).toBe(DAILY_TARGETS.bookings * 7);
    expect(w.missedLabels.length).toBe(0);
  });
});

describe("execution progressTracker", () => {
  it("computeProgressForDays and pct toward goal", () => {
    const days = [
      { revenue: 1000, messagesSent: 20, brokersContacted: 5, bookingsCompleted: 1 } as ExecutionDay,
      { revenue: 500, messagesSent: 10, brokersContacted: 3, bookingsCompleted: 0 } as ExecutionDay,
    ];
    const p = computeProgressForDays(days, REVENUE_GOAL_USD);
    expect(p.totalRevenue).toBe(1500);
    expect(p.pctTowardGoal).toBeCloseTo((1500 / REVENUE_GOAL_USD) * 100, 5);
    expect(p.avgDailyRevenue).toBe(750);
  });
});

describe("execution alerts", () => {
  it("buildExecutionAlerts when counters zero", () => {
    const a = buildExecutionAlerts(null);
    expect(a.map((x) => x.code)).toEqual(["NO_MESSAGES", "NO_BOOKINGS", "ZERO_REVENUE"]);
  });
});

describe("execution dailyTracker (simulated)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.executionDay.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.executionAction.create).mockResolvedValue({} as never);
  });

  it("logMessage increments and writes action", async () => {
    await logMessage(3, new Date(), { userId: "u1" });
    expect(prisma.executionDay.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { messagesSent: { increment: 3 } },
      })
    );
    expect(prisma.executionAction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: "message", userId: "u1" }),
    });
  });

  it("logRevenue increments revenue only", async () => {
    await logRevenue(250, new Date());
    expect(prisma.executionDay.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { revenue: { increment: 250 } },
      })
    );
    expect(prisma.executionAction.create).not.toHaveBeenCalled();
  });
});
