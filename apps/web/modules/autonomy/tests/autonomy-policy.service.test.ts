import { describe, expect, it } from "vitest";
import {
  evaluateCandidateAgainstPolicy,
  type ApplicablePolicy,
} from "@/modules/autonomy/autonomy-policy.service";
import type { AutonomousActionCandidate } from "@/modules/autonomy/autonomy.types";

const basePolicy = (): ApplicablePolicy => ({
  mode: "SAFE_AUTOPILOT",
  maxRiskLevel: "MEDIUM",
  allowedActionTypes: new Set(),
  blockedActionTypes: new Set(),
  requireApprovalFor: new Set(),
  emergencyFreeze: false,
  policyId: "p1",
  version: 1,
});

const candidate = (over: Partial<AutonomousActionCandidate>): AutonomousActionCandidate => ({
  id: "c1",
  domain: "DEAL",
  actionType: "PRIORITIZE_DEAL",
  riskLevel: "LOW",
  confidence: 0.7,
  rationale: "test",
  payload: {},
  requiresApproval: false,
  blockedReasons: [],
  sourceAgent: "test",
  relatedEntityIds: {},
  policyFlags: [],
  createdAt: new Date().toISOString(),
  ...over,
});

describe("autonomy-policy.service", () => {
  it("blocks everything when emergency freeze", () => {
    const p = { ...basePolicy(), emergencyFreeze: true };
    const ev = evaluateCandidateAgainstPolicy(candidate({}), p);
    expect(ev.blocked).toBe(true);
  });

  it("requires approval for message drafts", () => {
    const p = basePolicy();
    p.mode = "SAFE_AUTOPILOT";
    const ev = evaluateCandidateAgainstPolicy(
      candidate({ actionType: "GENERATE_MESSAGE_DRAFT", domain: "MESSAGING" }),
      p
    );
    expect(ev.requiresApproval).toBe(true);
  });

  it("blocks when risk exceeds policy max", () => {
    const p = { ...basePolicy(), maxRiskLevel: "LOW" as const };
    const ev = evaluateCandidateAgainstPolicy(candidate({ riskLevel: "HIGH" }), p);
    expect(ev.blocked).toBe(true);
  });

  it("ASSIST mode forces approval", () => {
    const p = { ...basePolicy(), mode: "ASSIST" };
    const ev = evaluateCandidateAgainstPolicy(candidate({ actionType: "PRIORITIZE_DEAL", riskLevel: "LOW" }), p);
    expect(ev.requiresApproval).toBe(true);
  });
});
