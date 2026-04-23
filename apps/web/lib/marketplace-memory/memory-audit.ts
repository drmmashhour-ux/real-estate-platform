import { logAuditEvent } from "@/lib/compliance/log-audit-event";

export type MemoryAuditAction =
  | "event_captured"
  | "memory_aggregated"
  | "insight_generated"
  | "memory_used_in_engine"
  | "memory_reset"
  | "memory_read"
  | "memory_updated"
  | "memory_export";

export async function logMemoryAudit(input: {
  userId: string;
  actionType: MemoryAuditAction;
  summary: string;
  details?: Record<string, unknown> | null;
  actorId?: string | null;
}) {
  return logAuditEvent({
    ownerType: "user",
    ownerId: input.userId,
    entityType: "marketplace_memory",
    entityId: input.userId,
    actionType: input.actionType,
    moduleKey: "memory",
    actorId: input.actorId ?? input.userId,
    aiAssisted: false,
    summary: input.summary,
    details: input.details ?? null,
  });
}
