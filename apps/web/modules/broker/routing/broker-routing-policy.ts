/**
 * Routing V2 policy — env-tunable; defaults favor human review unless explicitly relaxed.
 */

function policyBool(envKey: string, defaultOn: boolean): boolean {
  const v = process.env[envKey];
  if (v === "0" || v === "false" || v === "off") return false;
  if (v === "1" || v === "true" || v === "on") return true;
  return defaultOn;
}

/** Confidence below this → `requiresApproval` on the decision (still suggestable). */
export const ROUTING_V2_CONFIDENCE_APPROVAL_THRESHOLD = 72;

/** Minimum confidence for optional auto-assign path (in addition to flags + policy.allowAutoAssign). */
export const ROUTING_V2_AUTO_ASSIGN_MIN_CONFIDENCE = 88;

/**
 * When `FEATURE_SMART_ROUTING_AUTO_ASSIGN` is on, still require this policy to allow DB writes.
 * Set `SMART_ROUTING_AUTO_ASSIGN_POLICY=off` to hard-disable auto-assign while keeping V2 UI.
 */
export const routingV2Policy = {
  allowAutoAssign: policyBool("SMART_ROUTING_AUTO_ASSIGN_POLICY", true),
} as const;
