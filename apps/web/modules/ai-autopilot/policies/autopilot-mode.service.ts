import type { AutopilotMode } from "@prisma/client";
import { prisma } from "@/lib/db";

const DEFAULT_MODE: AutopilotMode = "ASSIST";

/** Resolves effective mode for a scope (user or platform). */
export async function getEffectiveAutopilotMode(scopeType: string, scopeId: string): Promise<AutopilotMode> {
  const row = await prisma.platformAutopilotPolicy.findUnique({
    where: { scopeType_scopeId: { scopeType, scopeId } },
    select: { mode: true },
  });
  return row?.mode ?? DEFAULT_MODE;
}

export function modeAllowsSafeAuto(mode: AutopilotMode): boolean {
  return mode === "SAFE_AUTOPILOT" || mode === "FULL_AUTOPILOT_APPROVAL";
}

export function modeAllowsPreparedExecution(mode: AutopilotMode): boolean {
  return mode === "FULL_AUTOPILOT_APPROVAL";
}
