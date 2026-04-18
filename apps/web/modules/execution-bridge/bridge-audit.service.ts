import { prisma } from "@/lib/db";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";

export type BridgeAuditAction =
  | "oaciq_session_created"
  | "oaciq_export_built"
  | "oaciq_provider_submit"
  | "oaciq_map_run"
  | "oaciq_validate_run";

export async function logBridgeAudit(input: {
  dealId: string;
  actorUserId: string | null;
  action: BridgeAuditAction;
  payload: Record<string, unknown>;
}): Promise<{ id: string }> {
  const row = await prisma.dealExecutionAuditLog.create({
    data: {
      dealId: input.dealId,
      actorUserId: input.actorUserId,
      actionKey: input.action,
      payload: asInputJsonValue(input.payload),
    },
  });
  return { id: row.id };
}
