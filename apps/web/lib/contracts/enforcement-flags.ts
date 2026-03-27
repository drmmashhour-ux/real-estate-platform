/** Global kill-switch for contract gates in development (never enable in production). */
export function contractEnforcementDisabled(): boolean {
  return process.env.CONTRACT_ENFORCEMENT_DISABLED === "true";
}
