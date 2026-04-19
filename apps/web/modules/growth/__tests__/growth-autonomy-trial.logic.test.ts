import { describe, it, expect, beforeEach } from "vitest";
import { isGrowthAutonomyPrefilledDisposition } from "../growth-autonomy.types";
import { ADJACENT_INTERNAL_TRIAL_ACTION_ID } from "../growth-autonomy-trial-boundaries";
import {
  getGrowthAutonomyTrialApprovalRecord,
  resetGrowthAutonomyTrialStateForTests,
  setGrowthAutonomyTrialApprovalRecord,
} from "../growth-autonomy-trial-state.repository";
import type { GrowthAutonomyTrialApprovalRecord } from "../growth-autonomy-trial.types";
import { rollbackGrowthAutonomyTrial } from "../growth-autonomy-trial-rollback.service";

describe("growth autonomy trial helpers", () => {
  beforeEach(() => {
    resetGrowthAutonomyTrialStateForTests();
  });

  it("prefilled_only is treated like prefilled_action for disposition checks", () => {
    expect(isGrowthAutonomyPrefilledDisposition("prefilled_only")).toBe(true);
    expect(isGrowthAutonomyPrefilledDisposition("prefilled_action")).toBe(true);
    expect(isGrowthAutonomyPrefilledDisposition("suggest_only")).toBe(false);
  });

  it("adjacent trial uses fixed catalog id", () => {
    expect(ADJACENT_INTERNAL_TRIAL_ACTION_ID).toMatch(/^trial-/);
  });

  it("rollback clears approval record", () => {
    const rec: GrowthAutonomyTrialApprovalRecord = {
      trialActionId: ADJACENT_INTERNAL_TRIAL_ACTION_ID,
      candidateActionType: "internal_review_note_variant",
      evidenceSummary: "test",
      approvedBy: "u1",
      approvedAt: new Date().toISOString(),
      activationStatus: "approved_internal_trial",
      rollbackStatus: "none",
      notes: null,
      executionArtifactId: null,
    };
    setGrowthAutonomyTrialApprovalRecord(rec);
    const out = rollbackGrowthAutonomyTrial({ actorUserId: "admin", notes: "undo" });
    expect(out.ok).toBe(true);
    expect(getGrowthAutonomyTrialApprovalRecord()).toBeNull();
  });
});
