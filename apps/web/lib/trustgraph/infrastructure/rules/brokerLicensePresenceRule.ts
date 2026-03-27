import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

/** Placeholder for broker-entity pipeline — listing pipeline does not invoke this yet. */
export function evaluateBrokerLicensePresenceRule(_ctx: { brokerLicenseNumber?: string | null }): RuleEvaluationResult {
  return {
    ruleCode: "broker_license_presence",
    ruleVersion: "1",
    passed: true,
    scoreDelta: 0,
    confidence: 0.5,
    details: { skipped: true },
  };
}
