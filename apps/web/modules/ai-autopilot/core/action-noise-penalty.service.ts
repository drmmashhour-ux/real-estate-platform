import type { RankedAction } from "../ai-autopilot.types";
import type { PlatformAutopilotAction } from "@prisma/client";

export type NoisePenaltyContext = {
  duplicateRefresh?: boolean;
  existingDuplicateCount?: number;
  existing?: Pick<PlatformAutopilotAction, "status" | "createdAt" | "updatedAt"> | null;
};

/**
 * Aggregated noise / friction penalties (0–100 scale contribution before clamp in quality).
 */
export function computeNoisePenalty(action: RankedAction, ctx?: NoisePenaltyContext): { total: number; breakdown: string[] } {
  const breakdown: string[] = [];
  let total = 0;

  if (action.severity === "low" || action.severity === "info") {
    total += 6;
    breakdown.push("low/info severity +6");
  }

  if (ctx?.duplicateRefresh) {
    const n = ctx.existingDuplicateCount ?? 1;
    const dup = Math.min(25, 5 + (n - 1) * 3);
    total += dup;
    breakdown.push(`duplicate refresh +${dup}`);
  }

  if (ctx?.existing?.status === "rejected") {
    total += 15;
    breakdown.push("prior rejection +15");
  }

  return { total, breakdown };
}
