import { describe, it, expect } from "vitest";
import { policyEnforcementSnapshotLooksPartial } from "../growth-policy-enforcement-rollout.helpers";

describe("policyEnforcementSnapshotLooksPartial", () => {
  const base = {
    rules: [],
    blockedTargets: [],
    frozenTargets: [],
    approvalRequiredTargets: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    inputCompleteness: "complete" as const,
    missingDataWarnings: [] as string[],
  };

  it("returns true when inputCompleteness is partial", () => {
    expect(
      policyEnforcementSnapshotLooksPartial({
        ...base,
        notes: [],
        inputCompleteness: "partial",
      }),
    ).toBe(true);
  });

  it("returns true when missingDataWarnings nonempty", () => {
    expect(
      policyEnforcementSnapshotLooksPartial({
        ...base,
        notes: [],
        missingDataWarnings: ["gov"],
      }),
    ).toBe(true);
  });

  it("returns true when embedded partial note string present", () => {
    expect(
      policyEnforcementSnapshotLooksPartial({
        ...base,
        notes: ["Partial inputs: x"],
      }),
    ).toBe(true);
  });

  it("returns false when complete and empty warnings", () => {
    expect(
      policyEnforcementSnapshotLooksPartial({
        ...base,
        notes: ["Enforcement applies to non-critical advisory"],
      }),
    ).toBe(false);
  });
});
