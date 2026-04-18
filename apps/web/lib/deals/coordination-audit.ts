import { prisma } from "@/lib/db";
import { asOptionalInputJsonValue } from "@/lib/prisma/as-input-json";

export type CoordinationAuditAction =
  | "request_created"
  | "request_updated"
  | "request_sent"
  | "request_overdue"
  | "request_fulfilled"
  | "request_blocked"
  | "item_validated"
  | "autopilot_suggestion"
  | "lender_status_changed"
  | "notary_package_updated"
  | "communication_draft_created"
  | "contact_registered";

export async function logCoordinationAudit(input: {
  dealId: string;
  action: CoordinationAuditAction | string;
  actorUserId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload?: Record<string, unknown> | null;
}) {
  await prisma.dealCoordinationAuditLog.create({
    data: {
      dealId: input.dealId,
      action: input.action,
      actorUserId: input.actorUserId ?? undefined,
      entityType: input.entityType ?? undefined,
      entityId: input.entityId ?? undefined,
      payload: asOptionalInputJsonValue(input.payload ?? undefined),
    },
  });
}
