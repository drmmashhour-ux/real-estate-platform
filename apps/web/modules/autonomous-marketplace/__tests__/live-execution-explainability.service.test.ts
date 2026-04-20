import { describe, expect, it } from "vitest";
import { explainControlledExecutionDecision } from "../explainability/live-execution-explainability.service";

describe("live-execution-explainability.service", () => {
  it("explains compliance block deterministically", () => {
    const x = explainControlledExecutionDecision({
      gate: {
        allowed: false,
        status: "blocked",
        reasons: ["compliance_block"],
        requiresApproval: false,
      },
      decision: {
        actionId: "a1",
        actionType: "CREATE_TASK",
        status: "blocked",
        reasons: ["compliance_block"],
        allowExecution: false,
        requiresApproval: false,
      },
    });
    expect(x.summary.length).toBeGreaterThan(5);
    expect(x.bullets.some((b) => b.includes("Compliance"))).toBe(true);
  });
});
