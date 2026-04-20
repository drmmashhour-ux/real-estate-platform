import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { LEGAL_HUB_AUDIT_ACTION, LEGAL_HUB_AUDIT_ENTITY } from "./legal-hub-phase2.constants";

export type LegalAuditEntityType =
  | (typeof LEGAL_HUB_AUDIT_ENTITY)[keyof typeof LEGAL_HUB_AUDIT_ENTITY]
  | string;

/**
 * Append-only audit log. Swallows DB errors — callers should not rely on throws.
 */
export async function logLegalAction(params: {
  entityType: LegalAuditEntityType;
  entityId: string;
  action: (typeof LEGAL_HUB_AUDIT_ACTION)[keyof typeof LEGAL_HUB_AUDIT_ACTION] | string;
  actorId: string | null;
  actorType: string;
  metadata?: Record<string, unknown> | null;
}): Promise<{ ok: true } | { ok: false }> {
  try {
    const safeMeta: Prisma.InputJsonValue | undefined =
      params.metadata === undefined || params.metadata === null
        ? undefined
        : (JSON.parse(JSON.stringify(params.metadata)) as Prisma.InputJsonValue);

    await prisma.legalAuditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        actorId: params.actorId,
        actorType: params.actorType,
        metadata: safeMeta,
      },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function getAuditTrail(
  entityType: string,
  entityId: string,
): Promise<
  Array<{
    id: string;
    action: string;
    actorId: string | null;
    actorType: string;
    metadata: unknown;
    createdAt: Date;
  }>
> {
  try {
    const rows = await prisma.legalAuditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        action: true,
        actorId: true,
        actorType: true,
        metadata: true,
        createdAt: true,
      },
    });
    return rows;
  } catch {
    return [];
  }
}
