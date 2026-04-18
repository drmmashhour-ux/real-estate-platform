import type { PlatformAutopilotRiskClass } from "@prisma/client";
import { aiAutopilotV1Flags } from "@/config/feature-flags";

/** Returns whether an automatic (no human click) execution is allowed for this risk class. */
export function mayAutoExecuteLowRisk(risk: PlatformAutopilotRiskClass): boolean {
  if (risk !== "LOW") return false;
  return aiAutopilotV1Flags.safeActionsV1;
}

export function requiresApproval(risk: PlatformAutopilotRiskClass): boolean {
  return risk === "MEDIUM" || risk === "HIGH" || risk === "CRITICAL";
}

export function isBlockedByPolicy(actionType: string, blocked: unknown): boolean {
  if (!Array.isArray(blocked)) return false;
  return blocked.some((b) => typeof b === "string" && b === actionType);
}
