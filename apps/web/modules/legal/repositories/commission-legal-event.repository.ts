import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { legalAuditLog } from "../legal-logging";

export async function insertCommissionLegalEventSafe(params: {
  entityType: string;
  entityId: string;
  reasonKey: string;
  severity: string;
  detail: string;
  metadata?: Record<string, unknown> | null;
}): Promise<string | null> {
  try {
    const row = await prisma.commissionLegalEvent.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        reasonKey: params.reasonKey,
        severity: params.severity,
        detail: params.detail,
        metadata:
          params.metadata === undefined || params.metadata === null
            ? undefined
            : (JSON.parse(JSON.stringify(params.metadata)) as Prisma.InputJsonValue),
      },
    });
    return row.id;
  } catch (e) {
    legalAuditLog("commission legal event insert failed", { error: String(e) });
    return null;
  }
}
