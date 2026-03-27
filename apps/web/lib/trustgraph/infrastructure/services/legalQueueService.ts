import { prisma } from "@/lib/db";
import type { LegalQueueSummaryDto } from "@/lib/trustgraph/domain/sla";
import { isTrustGraphLegalSlaEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

export async function getLegalQueueSummaryForWorkspace(
  workspaceId: string | null | undefined
): Promise<LegalQueueSummaryDto | null> {
  if (!isTrustGraphEnabled() || !isTrustGraphLegalSlaEnabled()) return null;

  const where =
    workspaceId === undefined || workspaceId === ""
      ? {}
      : workspaceId === null
        ? { workspaceId: null }
        : { workspaceId };
  const rows = await prisma.trustgraphCaseSlaState.findMany({
    where,
  });

  let overdueCount = 0;
  let dueSoonCount = 0;
  let escalatedCount = 0;
  let onTrackCount = 0;
  for (const r of rows) {
    if (r.state === "overdue") overdueCount += 1;
    else if (r.state === "due_soon") dueSoonCount += 1;
    else if (r.state === "escalated") escalatedCount += 1;
    else if (r.state === "on_track") onTrackCount += 1;
  }

  return {
    overdueCount,
    dueSoonCount,
    escalatedCount,
    onTrackCount,
    avgReviewHoursEstimate: null,
  };
}

export async function listLegalQueueCaseIds(
  workspaceId: string | null | undefined,
  limit: number
): Promise<string[]> {
  if (!isTrustGraphEnabled() || !isTrustGraphLegalSlaEnabled()) return [];

  const where =
    workspaceId === undefined || workspaceId === ""
      ? {}
      : workspaceId === null
        ? { workspaceId: null }
        : { workspaceId };
  const rows = await prisma.trustgraphCaseSlaState.findMany({
    where,
    take: limit,
    orderBy: { updatedAt: "desc" },
    select: { caseId: true },
  });
  return rows.map((r) => r.caseId);
}
