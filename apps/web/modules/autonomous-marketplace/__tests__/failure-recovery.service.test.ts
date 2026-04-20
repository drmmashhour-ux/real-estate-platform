import { describe, expect, it } from "vitest";
import {
  classifyExecutionFailure,
  markActionForManualFollowup,
  markActionForRetry,
  recommendRecoveryPath,
} from "../execution/failure-recovery.service";
import type { ExecutionResult } from "../types/domain.types";

const exec = (status: ExecutionResult["status"]): ExecutionResult => ({
  status,
  startedAt: new Date().toISOString(),
  finishedAt: new Date().toISOString(),
  detail: "",
  metadata: {},
});

describe("failure-recovery.service", () => {
  it("classifies without throwing", () => {
    expect(classifyExecutionFailure(exec("FAILED"))).toBe("executor_failed");
    expect(classifyExecutionFailure(exec("DRY_RUN"))).toBe("transient_simulation");
    expect(recommendRecoveryPath(exec("FAILED"))).toBe("manual_followup");
  });

  it("retry / manual markers are deterministic", () => {
    expect(markActionForRetry("x")).toEqual({ marked: false });
    expect(markActionForManualFollowup("x")).toEqual({ marked: true });
  });
});
