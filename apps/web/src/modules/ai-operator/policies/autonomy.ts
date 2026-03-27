import type { AiOperatorActionType, AiOperatorAutonomyMode } from "@/src/modules/ai-operator/domain/operator.enums";
import { allowedInAutoRestrictedMode, requiresExplicitApproval } from "@/src/modules/ai-operator/policies/safety";

export function normalizeAutonomyMode(raw: string | null | undefined): AiOperatorAutonomyMode {
  const v = (raw ?? "manual").toLowerCase();
  if (v === "assisted") return "assisted";
  if (v === "auto_restricted" || v === "auto" || v === "restricted") return "auto_restricted";
  return "manual";
}

/**
 * In auto_restricted, only whitelisted action types may be auto-approved + executed on ingest.
 */
export function shouldAutoExecuteOnIngest(
  mode: AiOperatorAutonomyMode,
  type: AiOperatorActionType,
  confidenceScore: number
): boolean {
  if (mode !== "auto_restricted") return false;
  if (confidenceScore < 0.82) return false;
  return allowedInAutoRestrictedMode(type) && !requiresExplicitApproval(type);
}
