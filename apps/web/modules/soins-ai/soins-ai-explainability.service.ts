import type { SoinsExplainabilityEntry } from "./soins-ai.types";

/** Maps internal rule identifiers to plain-language operational explanations only. */
const RULE_COPY: Record<string, string> = {
  RULE_EMERGENCY_ESCALATOR:
    "An emergency-call or equivalent operational signal was recorded — protocol escalation applies (not a medical interpretation).",
  RULE_MED_MEAL_COMBO:
    "Multiple operational signals (scheduled supports) were flagged in the same monitoring window — coordinated follow-up is advised.",
  RULE_ACTIVITY_CAMERA:
    "Activity anomaly flags coincided with camera infrastructure inactivity — verify equipment and operational procedures (not a diagnostic conclusion).",
  RULE_REPEATED_LOW_OPS:
    "Repeated low-severity operational signals exceeded the escalation threshold — pattern review recommended.",
  RULE_FAMILY_CONCERN_STD:
    "A family-reported operational concern was logged — routine follow-up is recommended.",
  RULE_FAMILY_CONCERN_ELEV:
    "A family-reported operational concern was logged with elevated urgency — timely check-in recommended.",
  RULE_BASELINE_OK:
    "No threshold-based operational escalation conditions were met in this evaluation window.",
};

export function describeRule(ruleId: keyof typeof RULE_COPY | string): string {
  return RULE_COPY[ruleId] ?? `Operational rule evaluated: ${ruleId}`;
}

export function buildExplainabilityEntries(ruleIds: string[]): SoinsExplainabilityEntry[] {
  return ruleIds.map((ruleId) => ({
    ruleId,
    description: describeRule(ruleId),
  }));
}
