import type { VerificationCase, VerificationSeverity } from "@prisma/client";

const SEVERITY_RANK: Record<VerificationSeverity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

function maxSeverity(signals: { severity: VerificationSeverity }[]): VerificationSeverity | null {
  let best: VerificationSeverity | null = null;
  let rank = 0;
  for (const s of signals) {
    const r = SEVERITY_RANK[s.severity] ?? 0;
    if (r > rank) {
      rank = r;
      best = s.severity;
    }
  }
  return best;
}

export type QueueItemDto = {
  id: string;
  entityType: string;
  entityId: string;
  status: string;
  overallScore: number | null;
  trustLevel: string | null;
  readinessLevel: string | null;
  topSeverity: string | null;
  assignedTo: string | null;
  updatedAt: string;
};

export function toQueueItemDto(
  row: Pick<
    VerificationCase,
    "id" | "entityType" | "entityId" | "status" | "overallScore" | "trustLevel" | "readinessLevel" | "assignedTo" | "updatedAt"
  > & {
    signals?: { severity: VerificationSeverity }[];
  }
): QueueItemDto {
  const top = row.signals?.length ? maxSeverity(row.signals) : null;
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    status: row.status,
    overallScore: row.overallScore,
    trustLevel: row.trustLevel,
    readinessLevel: row.readinessLevel,
    topSeverity: top,
    assignedTo: row.assignedTo,
    updatedAt: row.updatedAt.toISOString(),
  };
}
