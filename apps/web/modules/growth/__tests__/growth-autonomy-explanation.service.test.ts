import { describe, it, expect } from "vitest";
import { buildAutonomyExplanation } from "../growth-autonomy-explanation.service";

describe("buildAutonomyExplanation", () => {
  it("blocked path references policy review", () => {
    const e = buildAutonomyExplanation({
      autonomyMode: "ASSIST",
      disposition: "blocked",
      enforcementMode: "block",
      enforcementAvailable: true,
      snapshotPartial: false,
      label: "Test",
      whyInCatalog: "Because.",
    });
    expect(e.whatNext).toContain("governance");
  });

  it("suggest_only mentions manual apply when advisory_only", () => {
    const e = buildAutonomyExplanation({
      autonomyMode: "ASSIST",
      disposition: "suggest_only",
      enforcementMode: "advisory_only",
      enforcementAvailable: true,
      snapshotPartial: false,
      label: "Test",
      whyInCatalog: "Because.",
    });
    expect(e.whatNext.toLowerCase()).toMatch(/manual|panel/);
  });

  it("approval_required + request_manual_review routes to review focus", () => {
    const e = buildAutonomyExplanation({
      autonomyMode: "ASSIST",
      disposition: "approval_required",
      enforcementMode: "approval_required",
      enforcementAvailable: true,
      snapshotPartial: false,
      label: "Manual review",
      whyInCatalog: "Learning adjustments.",
      actionType: "request_manual_review",
    });
    expect(e.whatNext).toContain("growthAutonomyFocus=review");
    expect(e.whatNext.toLowerCase()).not.toContain("execute");
  });
});
