import { prisma } from "@/lib/db";

export async function logFinancialAction(params: {
  actorUserId: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await prisma.financialAuditLog.create({
      data: {
        actorUserId: params.actorUserId,
        action: params.action,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        ipAddress: params.ipAddress ?? null,
        metadata: params.metadata ? (params.metadata as object) : undefined,
      },
    });
  } catch (e) {
    console.error("[financial-audit] log failed", e);
  }
}
