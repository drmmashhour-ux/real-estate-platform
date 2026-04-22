import { buildExplainabilityEntries } from "./soins-ai-explainability.service";
import type {
  SoinsAiAssessment,
  SoinsRiskInput,
  SoinsRiskLevel,
  SoinsSignalType,
} from "./soins-ai.types";

const OPS_ACTION_CHECK_IN = "Operational check-in with residence staff is recommended.";
const OPS_ACTION_REVIEW_PATTERN = "Review recent operational signal pattern with on-site team.";
const OPS_ACTION_VERIFY_CAMERA = "Verify camera connectivity and permissions with the residence (operational follow-up).";
const OPS_ACTION_FAMILY_CALLBACK = "Return family outreach within agreed service windows.";
const OPS_ACTION_PROTOCOL_ESCALATION = "Follow residence emergency protocol — operational coordination only.";

function count(input: SoinsRiskInput, signal: SoinsSignalType): number {
  return input.signalCounts[signal] ?? 0;
}

function sumLowLikeSignals(input: SoinsRiskInput): number {
  const lowLike: SoinsSignalType[] = [
    "MOVEMENT_MISSED",
    "MISSED_MEAL",
    "CAMERA_INACTIVITY",
    "CHAT_DISTRESS_SIGNAL",
  ];
  return lowLike.reduce((s, k) => s + count(input, k), 0);
}

/**
 * Deterministic, non-diagnostic risk evaluation for operational routing.
 * Does not interpret vitals or diseases — only aggregates operational signals.
 */
export function evaluateSoinsRisk(input: SoinsRiskInput): SoinsAiAssessment {
  const reasons: string[] = [];
  const ruleIds: string[] = [];
  const actions: string[] = [];

  const emergency = count(input, "EMERGENCY_BUTTON") >= 1;
  const missedMed = count(input, "MISSED_MEDICATION") >= 1;
  const missedMeal = count(input, "MISSED_MEAL") >= 1;
  const abnormal = count(input, "ABNORMAL_ACTIVITY") >= 1;
  const camInactive = input.cameraInactive === true;
  const lowRepeats = sumLowLikeSignals(input);
  const fam = input.familyConcernLevel ?? "none";

  let risk: SoinsRiskLevel = "LOW";

  if (emergency) {
    risk = "CRITICAL";
    reasons.push("Emergency button or equivalent operational emergency signal recorded.");
    ruleIds.push("RULE_EMERGENCY_ESCALATOR");
    actions.push(OPS_ACTION_PROTOCOL_ESCALATION);
  } else if (missedMed && missedMeal) {
    risk = "HIGH";
    reasons.push("Operational signals indicate both missed medication workflow flag and missed meal workflow flag.");
    ruleIds.push("RULE_MED_MEAL_COMBO");
    actions.push(OPS_ACTION_CHECK_IN, OPS_ACTION_REVIEW_PATTERN);
  } else if (abnormal && camInactive) {
    risk = "HIGH";
    reasons.push("Abnormal activity operational flag coincided with camera infrastructure inactivity.");
    ruleIds.push("RULE_ACTIVITY_CAMERA");
    actions.push(OPS_ACTION_VERIFY_CAMERA, OPS_ACTION_CHECK_IN);
  } else if (lowRepeats >= 6) {
    risk = "HIGH";
    reasons.push("Repeated operational signals in the monitoring window exceeded the high threshold.");
    ruleIds.push("RULE_REPEATED_LOW_OPS");
    actions.push(OPS_ACTION_REVIEW_PATTERN);
  } else if (lowRepeats >= 3) {
    risk = "MEDIUM";
    reasons.push("Repeated operational signals in the monitoring window exceeded the medium threshold.");
    ruleIds.push("RULE_REPEATED_LOW_OPS");
    actions.push(OPS_ACTION_REVIEW_PATTERN);
  }

  if (risk === "LOW" && fam === "elevated") {
    risk = "MEDIUM";
    reasons.push("Elevated family-reported operational concern recorded.");
    ruleIds.push("RULE_FAMILY_CONCERN_ELEV");
    actions.push(OPS_ACTION_FAMILY_CALLBACK);
  } else if (risk === "LOW" && fam === "standard") {
    reasons.push("Family-reported operational concern recorded.");
    ruleIds.push("RULE_FAMILY_CONCERN_STD");
    actions.push(OPS_ACTION_FAMILY_CALLBACK);
  }

  if (reasons.length === 0) {
    reasons.push("No threshold-based operational escalation in this window.");
    ruleIds.push("RULE_BASELINE_OK");
  }

  const notifyAdmin = risk === "CRITICAL" || risk === "HIGH";
  const notifyStaff = risk !== "LOW" || fam !== "none";
  const notifyFamily = risk !== "LOW" || fam !== "none";

  return {
    residentId: input.residentId,
    riskLevel: risk,
    reasons,
    recommendedActions: [...new Set(actions)],
    explainability: buildExplainabilityEntries(ruleIds),
    notifyFamily,
    notifyStaff,
    notifyAdmin,
  };
}
