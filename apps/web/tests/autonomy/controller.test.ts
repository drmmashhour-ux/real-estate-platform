import { describe, expect, it } from "vitest";
import { shouldExecuteAction } from "@/lib/autonomy/controller";
import type { AutonomousAction } from "@/lib/autonomy/types";

function action(overrides: Partial<AutonomousAction> = {}): AutonomousAction {
  return {
    id: "a1",
    type: "content_update",
    payload: {},
    risk: "low",
    ...overrides,
  };
}

describe("shouldExecuteAction", () => {
  it("blocks guardrail types regardless of mode", () => {
    const a = action({ type: "payment_capture", risk: "low" });
    expect(shouldExecuteAction("SAFE_AUTOPILOT", a).execute).toBe(false);
    expect(shouldExecuteAction("SAFE_AUTOPILOT", a).reason).toBe("blocked_by_guardrail");
  });

  it("OFF and ASSIST never auto-execute", () => {
    const low = action({ risk: "low" });
    expect(shouldExecuteAction("OFF", low).execute).toBe(false);
    expect(shouldExecuteAction("ASSIST", low).execute).toBe(false);
  });

  it("SAFE_AUTOPILOT executes only low risk when not blocked", () => {
    expect(shouldExecuteAction("SAFE_AUTOPILOT", action({ risk: "low" })).execute).toBe(true);
    expect(shouldExecuteAction("SAFE_AUTOPILOT", action({ risk: "medium" })).execute).toBe(false);
    expect(shouldExecuteAction("SAFE_AUTOPILOT", action({ risk: "high" })).execute).toBe(false);
  });

  it("FULL_WITH_APPROVAL matches safe lane for risk tiers", () => {
    expect(shouldExecuteAction("FULL_WITH_APPROVAL", action({ risk: "low" })).execute).toBe(true);
    expect(shouldExecuteAction("FULL_WITH_APPROVAL", action({ risk: "medium" })).reason).toBe(
      "medium_risk_requires_approval",
    );
  });
});
