/** Dev-only bypass for legal gates (never enable in production). */
export function legalEnforcementDisabled(): boolean {
  return process.env.LEGAL_ENFORCEMENT_DISABLED === "true";
}
