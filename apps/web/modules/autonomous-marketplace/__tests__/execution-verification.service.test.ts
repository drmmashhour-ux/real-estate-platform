import { describe, expect, it } from "vitest";
import { verifyActionOutcome, verifyBatchOutcome } from "../execution/execution-verification.service";
import type { ExecutionResult } from "../types/domain.types";
import type { ProposedAction } from "../types/domain.types";

const proposed: ProposedAction = {
  id: "p",
  type: "CREATE_TASK",
  target: { type: "fsbo_listing", id: "l" },
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

function er(status: ExecutionResult["status"], meta?: ExecutionResult["metadata"]): ExecutionResult {
  const now = new Date().toISOString();
  return { status, startedAt: now, finishedAt: now, detail: "", metadata: meta ?? {} };
}

describe("execution-verification.service", () => {
  it("dry_run is verified as simulation", () => {
    const v = verifyActionOutcome({ proposed, execution: er("DRY_RUN") });
    expect(v.verified).toBe(true);
    expect(v.notes).toContain("dry_run");
  });

  it("EXECUTED with advisory metadata verifies", () => {
    const v = verifyActionOutcome({ proposed, execution: er("EXECUTED", { advisory: true }) });
    expect(v.verified).toBe(true);
    expect(v.reversible).toBe(true);
  });

  it("verifyBatchOutcome maps items", () => {
    const b = verifyBatchOutcome([{ proposed, execution: er("FAILED") }]);
    expect(b.results).toHaveLength(1);
    expect(b.results[0].verified).toBe(false);
  });
});
