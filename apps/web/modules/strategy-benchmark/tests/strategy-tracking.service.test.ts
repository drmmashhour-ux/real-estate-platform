import { describe, expect, it, vi, beforeEach } from "vitest";
import { trackStrategyExecution } from "../strategy-tracking.service";

const create = vi.fn();
const upsert = vi.fn();

vi.mock("@/lib/db/legacy", () => ({
  getLegacyDB: () => ({
    strategyExecutionEvent: { create: (...a: unknown[]) => create(...a) },
    strategyPerformanceAggregate: { upsert: (...a: unknown[]) => upsert(...a) },
  })
}));

vi.mock("../strategy-benchmark-logger", () => ({
  strategyBenchmarkLog: { execution: vi.fn(), warn: vi.fn() },
}));

describe("trackStrategyExecution", () => {
  beforeEach(() => {
    create.mockReset();
    upsert.mockReset();
    create.mockResolvedValue({ id: "e1" });
    upsert.mockResolvedValue({});
  });

  it("persists execution and bumps aggregate totalUses", async () => {
    const r = await trackStrategyExecution({
      strategyKey: "propose_visit",
      domain: "OFFER",
      dealId: "d1",
      contextSnapshot: { k: 1 },
    });
    expect(r.ok).toBe(true);
    expect(create).toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { totalUses: { increment: 1 } },
      })
    );
  });
});
