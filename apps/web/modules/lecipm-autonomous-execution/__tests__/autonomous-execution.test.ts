import { describe, expect, it } from "vitest";
import { canExecuteTask } from "../autonomous-execution.engine";
import { classifyExecutionRisk } from "../execution-risk-classifier";
import { buildIdempotencyKey } from "../execution-safety.service";

describe("lecipm autonomous execution", () => {
  it("classifyExecutionRisk marks prep vs outreach sensibly", () => {
    expect(classifyExecutionRisk("MESSAGE")).toBe("LOW");
    expect(classifyExecutionRisk("OFFER_PREP")).toBe("MEDIUM");
    expect(classifyExecutionRisk("INVESTOR_PACKET_PREP")).toBe("MEDIUM");
  });

  it("canExecuteTask blocks OFF mode", () => {
    const r = canExecuteTask({ status: "QUEUED", riskLevel: "LOW" }, "OFF");
    expect(r.ok).toBe(false);
  });

  it("canExecuteTask allows SAFE_AUTOMATION low-risk queued tasks", () => {
    const r = canExecuteTask({ status: "QUEUED", riskLevel: "LOW" }, "SAFE_AUTOMATION");
    expect(r.ok).toBe(true);
  });

  it("canExecuteTask requires approval for medium risk", () => {
    const r = canExecuteTask({ status: "QUEUED", riskLevel: "MEDIUM" }, "SAFE_AUTOMATION");
    expect(r.ok).toBe(false);
    const ok = canExecuteTask({ status: "APPROVED", riskLevel: "MEDIUM" }, "SAFE_AUTOMATION");
    expect(ok.ok).toBe(true);
  });

  it("canExecuteTask requires approval for all tasks in APPROVAL_REQUIRED mode", () => {
    const r = canExecuteTask({ status: "QUEUED", riskLevel: "LOW" }, "APPROVAL_REQUIRED");
    expect(r.ok).toBe(false);
    const ok = canExecuteTask({ status: "APPROVED", riskLevel: "LOW" }, "APPROVAL_REQUIRED");
    expect(ok.ok).toBe(true);
  });

  it("buildIdempotencyKey is stable per bucket", () => {
    expect(buildIdempotencyKey("2026-04-24", "MESSAGE", "CONVERSATION", "c1")).toBe("2026-04-24:MESSAGE:CONVERSATION:c1");
  });
});
