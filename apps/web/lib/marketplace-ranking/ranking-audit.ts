import { logAuditEvent } from "@/lib/compliance/log-audit-event";

export type RankingAuditAction =
  | "ranking_generated"
  | "listing_penalized"
  | "explanation_viewed"
  | "experiment_applied"
  | "ranking_outcome_recorded";

export async function logRankingAudit(input: {
  ownerId: string;
  actionType: RankingAuditAction;
  summary: string;
  details?: Record<string, unknown> | null;
  actorId?: string | null;
  listingId?: string | null;
}) {
  return logAuditEvent({
    ownerType: "user",
    ownerId: input.ownerId,
    entityType: "listing_ranking",
    entityId: input.listingId ?? input.ownerId,
    actionType: input.actionType,
    moduleKey: "ranking",
    actorId: input.actorId ?? input.ownerId,
    aiAssisted: false,
    summary: input.summary,
    details: input.details ?? null,
    linkedListingId: input.listingId ?? null,
  });
}
