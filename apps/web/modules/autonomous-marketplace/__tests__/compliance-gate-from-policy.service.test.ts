import { describe, expect, it } from "vitest";
import { buildComplianceGateSnapshotFromPolicy } from "../execution/compliance-gate-from-policy.service";
import type { PolicyDecision } from "../types/domain.types";

const basePolicy = (): PolicyDecision => ({
  id: "p",
  actionId: "a",
  disposition: "ALLOW",
  violations: [],
  warnings: [],
  evaluatedAt: new Date().toISOString(),
  ruleResults: [],
});

describe("buildComplianceGateSnapshotFromPolicy", () => {
  it("never throws on empty rules", () => {
    const s = buildComplianceGateSnapshotFromPolicy(basePolicy());
    expect(s.blocked).toBe(false);
  });
});
