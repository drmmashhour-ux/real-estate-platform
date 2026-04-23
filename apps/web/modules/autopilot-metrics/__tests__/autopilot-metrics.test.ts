import { describe, expect, it, vi, beforeEach } from "vitest";

import { getAutopilotOperatorWidgets } from "../autopilot-metrics.service";

vi.mock("@/lib/db", () => ({
  prisma: {
    lecipmFullAutopilotExecution: {
      count: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
        if ("rolledBackAt" in where) return Promise.resolve(2);
        if (where.decisionOutcome === "ALLOW_AUTOMATIC") return Promise.resolve(5);
        if ("outcomeDeltaJson" in where) return Promise.resolve(1);
        return Promise.resolve(0);
      }),
    },
  },
}));

describe("autopilot metrics widgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates rollback and linkage counts", async () => {
    const since = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const w = await getAutopilotOperatorWidgets(since, start);
    expect(w.rollbacksToday).toBe(2);
    expect(w.estimatedMinutesSaved7d).toBeGreaterThanOrEqual(0);
    expect(w.outcomeLinkedExecutions7d).toBe(1);
  });
});
