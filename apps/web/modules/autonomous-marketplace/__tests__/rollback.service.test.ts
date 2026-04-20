import { describe, expect, it } from "vitest";
import { rollbackControlledAction } from "../execution/rollback.service";
import type { ExecutionResult, ProposedAction } from "../types/domain.types";

function task(id: string): ProposedAction {
  return {
    id,
    type: "CREATE_TASK",
    target: { type: "fsbo_listing", id: "l1" },
    confidence: 1,
    risk: "LOW",
    title: "",
    explanation: "",
    humanReadableSummary: "",
    metadata: {},
    suggestedAt: new Date().toISOString(),
    sourceDetectorId: "d",
    opportunityId: "o",
  };
}

function exec(status: ExecutionResult["status"], meta?: ExecutionResult["metadata"]): ExecutionResult {
  const now = new Date().toISOString();
  return {
    status,
    startedAt: now,
    finishedAt: now,
    detail: "",
    metadata: meta ?? {},
  };
}

describe("rollback.service", () => {
  it("rollbackControlledAction returns ok without throwing", async () => {
    const r = await rollbackControlledAction({
      runId: "run-x",
      proposed: task("a1"),
      execution: exec("EXECUTED", { advisory: true }),
      actorUserId: null,
    });
    expect(r.ok).toBe(true);
    expect(typeof r.reversible).toBe("boolean");
  });

  it("rollbackControlledBatch counts processed items", async () => {
    const { rollbackControlledBatch } = await import("../execution/rollback.service");
    const n = await rollbackControlledBatch([
      {
        runId: "run-x",
        proposed: task("a2"),
        execution: exec("DRY_RUN"),
        actorUserId: null,
      },
    ]);
    expect(n.processed).toBe(1);
  });
});
