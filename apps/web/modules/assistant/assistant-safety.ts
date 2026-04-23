/**
 * Broker assistant execution safety — defaults keep user confirmation on all actions.
 * Env: `LECIPM_BROKER_ASSISTANT_MODE` = OFF | ASSIST | SAFE_AUTOPILOT | FULL_AUTOPILOT
 */
export type BrokerAssistantSafetyMode = "OFF" | "ASSIST" | "SAFE_AUTOPILOT" | "FULL_AUTOPILOT";

export function getBrokerAssistantSafetyMode(): BrokerAssistantSafetyMode {
  const v = process.env.LECIPM_BROKER_ASSISTANT_MODE?.trim().toUpperCase();
  if (v === "OFF") return "OFF";
  if (v === "ASSIST") return "ASSIST";
  if (v === "FULL_AUTOPILOT") return "FULL_AUTOPILOT";
  return "SAFE_AUTOPILOT";
}

/** Whether the assistant panel should load suggestions at all. */
export function assistantSuggestionsEnabled(mode: BrokerAssistantSafetyMode): boolean {
  return mode !== "OFF";
}

/** Whether one-click / confirmed execution is allowed (SAFE_AUTOPILOT+). */
export function assistantExecutionEnabled(mode: BrokerAssistantSafetyMode): boolean {
  return mode === "SAFE_AUTOPILOT" || mode === "FULL_AUTOPILOT";
}

/**
 * Even in FULL_AUTOPILOT this codebase keeps broker confirmation for outward actions (SAFE policy).
 */
export function requiresUserConfirmationForExecution(): boolean {
  return true;
}
