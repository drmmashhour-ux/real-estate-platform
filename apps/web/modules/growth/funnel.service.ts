import type { PrismaClient } from "@prisma/client";

import type { LeadFunnelRow, LeadFunnelStage, LeadFunnelSummary } from "./funnel.types";

const EMPTY_STAGES: Record<LeadFunnelStage, number> = {
  new: 0,
  contacted: 0,
  qualified: 0,
  showing: 0,
  offer: 0,
  closed: 0,
};

/**
 * Maps CRM `pipelineStatus` strings to Growth funnel stages.
 * `lost` and unknown values are excluded from `byStage` (tracked via `lostCount` in API).
 */
export function mapPipelineStatusToFunnelStage(
  status: string,
): LeadFunnelStage | "lost" | "excluded" {
  const s = status.toLowerCase().trim();
  if (s === "lost") return "lost";
  if (s === "new" || s === "pending") return "new";
  if (s === "contacted" || s === "follow_up" || s === "follow-up") return "contacted";
  if (s === "qualified") return "qualified";
  if (s === "meeting" || s === "meeting_scheduled" || s === "showing") return "showing";
  if (s === "negotiation" || s === "closing") return "offer";
  if (s === "won" || s === "closed") return "closed";
  return "excluded";
}

export function computeConversionRate(summary: LeadFunnelSummary): number {
  if (summary.total <= 0) return 0;
  return summary.byStage.closed / summary.total;
}

/** Prisma `pipeline_status` values that roll up to each funnel stage. */
const STAGE_TO_PIPELINES: Record<LeadFunnelStage, string[]> = {
  new: ["new", "pending"],
  contacted: ["contacted", "follow_up", "follow-up"],
  qualified: ["qualified"],
  showing: ["meeting", "meeting_scheduled", "showing"],
  offer: ["negotiation", "closing"],
  closed: ["won", "closed"],
};

export async function buildFunnelSummary(prisma: PrismaClient): Promise<{
  summary: LeadFunnelSummary;
  lostCount: number;
  excludedCount: number;
}> {
  const rows = await prisma.lead.findMany({
    select: {
      id: true,
      pipelineStatus: true,
      pipelineStage: true,
    },
  });

  const byStage: Record<LeadFunnelStage, number> = { ...EMPTY_STAGES };
  let lostCount = 0;
  let excludedCount = 0;

  for (const row of rows) {
    const mapped = mapPipelineStatusToFunnelStage(row.pipelineStatus);
    if (mapped === "lost") {
      lostCount += 1;
      continue;
    }
    if (mapped === "excluded") {
      excludedCount += 1;
      continue;
    }
    byStage[mapped] += 1;
  }

  const funnelTotal = Object.values(byStage).reduce((a, b) => a + b, 0);
  const summary: LeadFunnelSummary = {
    total: funnelTotal,
    byStage,
    conversionRate: 0,
  };
  summary.conversionRate = computeConversionRate(summary);

  return { summary, lostCount, excludedCount };
}

export async function getLeadsByStage(
  prisma: PrismaClient,
  stage: LeadFunnelStage,
  take = 50,
): Promise<LeadFunnelRow[]> {
  const inList = STAGE_TO_PIPELINES[stage];
  const rows = await prisma.lead.findMany({
    where: { pipelineStatus: { in: inList } },
    take,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      pipelineStatus: true,
      pipelineStage: true,
      score: true,
      lastContactedAt: true,
      meetingScheduledAt: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    pipelineStatus: r.pipelineStatus,
    pipelineStage: r.pipelineStage,
    score: r.score,
    lastContactedAt: r.lastContactedAt,
    meetingScheduledAt: r.meetingScheduledAt,
  }));
}
