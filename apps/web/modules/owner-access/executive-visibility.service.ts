import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ExecutiveSession } from "./owner-access.types";
import { resolveExecutiveScope } from "./role-scope.service";

/**
 * Owner / brokerage executive views — ADMIN or residential office owner/admin/managing broker.
 */
export async function getExecutiveSession(userId: string, role: PlatformRole): Promise<ExecutiveSession | null> {
  const scope = await resolveExecutiveScope(userId, role);
  if (!scope) return null;
  return { userId, role, scope };
}

export async function logExecutiveOfficeAudit(input: {
  officeId: string;
  actorUserId: string;
  actionKey: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await prisma.brokerageOfficeAuditLog.create({
    data: {
      officeId: input.officeId,
      actorUserId: input.actorUserId,
      actionKey: input.actionKey,
      payload: (input.payload ?? {}) as object,
    },
  });
}
