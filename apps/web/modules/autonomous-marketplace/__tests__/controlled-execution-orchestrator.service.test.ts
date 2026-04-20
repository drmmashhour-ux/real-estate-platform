import { describe, expect, it } from "vitest";

describe("controlled-execution-orchestrator.service", () => {
  it("exports runControlledExecution alongside runControlledExecutionStep", async () => {
    const mod = await import("../execution/controlled-execution-orchestrator.service");
    expect(typeof mod.runControlledExecution).toBe("function");
    expect(typeof mod.runControlledExecutionStep).toBe("function");
    expect(typeof mod.runControlledExecutionBatch).toBe("function");
  });
});
