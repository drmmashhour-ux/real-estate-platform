import { describe, expect, it } from "vitest";
import { generateSystemReport } from "../generateSystemReport";
import type { FlowRunResult } from "../types";

describe("generateSystemReport", () => {
  it("aggregates flow success rates and recommendations", () => {
    const flows: FlowRunResult[] = [
      { flowId: "crm_lead", ok: true, durationMs: 10 },
      { flowId: "crm_lead", ok: false, durationMs: 5 },
    ];
    const report = generateSystemReport({
      usersCreated: 2,
      userSummaries: [],
      flows,
      errors: [{ type: "data", message: "x", flowId: "crm_lead" }],
      performance: [{ label: "slow", durationMs: 3000, slow: true }],
      conversion: {
        activationRate: 0.5,
        simulatorRunsObserved: 3,
        dropOffStage: null,
        upgradeTriggerObserved: true,
        conversionSimulated: true,
      },
      stripe: { sandboxOnly: true, notes: [] },
    });
    expect(report.flowSuccessRate.crm_lead).toBe(0.5);
    expect(report.recommendations.some((r) => r.includes("slow"))).toBe(true);
    expect(report.recommendations.some((r) => r.includes("crm_lead"))).toBe(true);
  });
});
