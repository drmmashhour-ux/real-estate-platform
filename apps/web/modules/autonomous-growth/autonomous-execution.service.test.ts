import { describe, expect, it, vi } from "vitest";
import { executeSafeCandidates } from "./autonomous-execution.service";

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    autonomousGrowthFlags: {
      ...a.autonomousGrowthFlags,
      autonomousGrowthExecutionV1: false,
    },
  };
});

vi.mock("./autonomous-growth.repository", () => ({
  appendAutonomousRunEvents: vi.fn().mockResolvedValue({ count: 1 }),
}));

describe("autonomous-execution.service", () => {
  it("skips execution when flag is off", async () => {
    const r = await executeSafeCandidates("run1", []);
    expect(r.executedIds).toEqual([]);
    expect(r.notes.some((n) => /EXECUTION_V1 is off/i.test(n))).toBe(true);
  });
});
