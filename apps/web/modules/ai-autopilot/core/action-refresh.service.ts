import type { PlatformAutopilotAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { RankedAction } from "../ai-autopilot.types";
import type { ActionQualityResult } from "./action-quality-score.service";
import type { PriorityBucket } from "./action-priority.service";

function mergeReasons(incoming: Record<string, unknown>, existing: unknown): Prisma.InputJsonValue {
  const ex =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};
  return { ...ex, ...incoming, lastRefreshAt: new Date().toISOString() } as Prisma.InputJsonValue;
}

type RefreshParams = {
  dup: Pick<
    PlatformAutopilotAction,
    "id" | "summary" | "title" | "reasons" | "duplicateCount"
  >;
  ranked: RankedAction;
  quality: ActionQualityResult;
  priorityBucket: PriorityBucket;
};

/**
 * Merges a new detection into an existing queue row (dedupe path).
 */
export async function mergeDedupedAutopilotAction(p: RefreshParams): Promise<void> {
  const dup = p.dup;
  const r = p.ranked;
  const strongerSummary = r.summary.length >= dup.summary.length ? r.summary : dup.summary;
  const strongerTitle = r.title.length >= dup.title.length ? r.title : dup.title;

  await prisma.platformAutopilotAction.update({
    where: { id: dup.id },
    data: {
      duplicateCount: { increment: 1 },
      lastDetectedAt: new Date(),
      lastRefreshedAt: new Date(),
      qualityScore: p.quality.qualityScore,
      valueScore: p.quality.valueScore,
      noisePenalty: p.quality.noisePenalty,
      priorityBucket: p.priorityBucket,
      title: strongerTitle,
      summary: strongerSummary,
      severity: r.severity,
      riskLevel: r.riskLevel,
      recommendedPayload: r.recommendedPayload as Prisma.InputJsonValue,
      reasons: mergeReasons(r.reasons as Record<string, unknown>, dup.reasons),
    },
  });
}
