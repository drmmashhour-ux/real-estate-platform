import { describe, expect, it } from "vitest";

import { evaluateSoinsRisk } from "../soins-ai-risk.service";

describe("evaluateSoinsRisk", () => {
  const rid = "resident-test-1";

  it("emergency button signals => CRITICAL", () => {
    const r = evaluateSoinsRisk({
      residentId: rid,
      signalCounts: { EMERGENCY_BUTTON: 1 },
      familyConcernLevel: "none",
    });
    expect(r.riskLevel).toBe("CRITICAL");
    expect(r.notifyAdmin).toBe(true);
    expect(r.reasons.some((x) => /Emergency/i.test(x))).toBe(true);
  });

  it("missed medication + missed meal => HIGH", () => {
    const r = evaluateSoinsRisk({
      residentId: rid,
      signalCounts: { MISSED_MEDICATION: 1, MISSED_MEAL: 1 },
      familyConcernLevel: "none",
    });
    expect(r.riskLevel).toBe("HIGH");
    expect(r.notifyAdmin).toBe(true);
  });

  it("abnormal activity + camera inactive infrastructure => HIGH", () => {
    const r = evaluateSoinsRisk({
      residentId: rid,
      signalCounts: { ABNORMAL_ACTIVITY: 1 },
      cameraInactive: true,
      familyConcernLevel: "none",
    });
    expect(r.riskLevel).toBe("HIGH");
  });

  it("repeated low-like operational signals escalate MEDIUM then HIGH", () => {
    const medium = evaluateSoinsRisk({
      residentId: rid,
      signalCounts: { MOVEMENT_MISSED: 3 },
      familyConcernLevel: "none",
    });
    expect(medium.riskLevel).toBe("MEDIUM");

    const high = evaluateSoinsRisk({
      residentId: rid,
      signalCounts: { MOVEMENT_MISSED: 6 },
      familyConcernLevel: "none",
    });
    expect(high.riskLevel).toBe("HIGH");
  });

  it("elevated family concern bumps LOW -> MEDIUM when no other triggers", () => {
    const r = evaluateSoinsRisk({
      residentId: rid,
      signalCounts: {},
      familyConcernLevel: "elevated",
    });
    expect(r.riskLevel).toBe("MEDIUM");
  });

  it("explainability references rule identifiers", () => {
    const r = evaluateSoinsRisk({
      residentId: rid,
      signalCounts: { EMERGENCY_BUTTON: 1 },
      familyConcernLevel: "none",
    });
    expect(r.explainability.length).toBeGreaterThan(0);
    expect(r.explainability.every((x) => x.ruleId.length > 0)).toBe(true);
  });

  it("never emits diagnosis wording in reasons", () => {
    const r = evaluateSoinsRisk({
      residentId: rid,
      signalCounts: {
        MISSED_MEAL: 2,
        MISSED_MEDICATION: 2,
        EMERGENCY_BUTTON: 1,
      },
      familyConcernLevel: "elevated",
    });
    const blob = [...r.reasons, ...r.recommendedActions].join(" ").toLowerCase();
    expect(blob).not.toContain("diagnos");
    expect(blob).not.toContain("prescribe");
    expect(blob).not.toContain("pathology");
  });
});
