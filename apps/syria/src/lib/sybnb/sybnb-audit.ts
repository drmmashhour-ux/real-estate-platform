import type { Prisma, SyriaUserRole } from "@/generated/prisma";
import { prisma } from "@/lib/db";

export type SybnbAuditActorRole = "guest" | "host" | "admin" | "system";

export type LogSybnbEventInput = {
  action: string;
  bookingId?: string | null;
  userId?: string | null;
  actorRole?: SybnbAuditActorRole | string | null;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Append-only audit row for SYBNB booking lifecycle. Never throws — failures are swallowed so flows continue.
 * Metadata must contain only non-sensitive fields (IDs, ISO dates, counts, statuses, currency codes).
 */
export async function logSybnbEvent(input: LogSybnbEventInput): Promise<void> {
  try {
    await prisma.sybnbAuditLog.create({
      data: {
        action: input.action,
        bookingId: input.bookingId ?? undefined,
        userId: input.userId ?? undefined,
        actorRole: input.actorRole ?? undefined,
        ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      },
    });
  } catch {
    console.error("[SYBNB_AUDIT_FAIL]", input.action);
  }
}

/** Host approve/decline APIs: platform admins log as `admin`, listing owners as `host`. */
export function sybnbAuditRoleHostAction(userRole: SyriaUserRole): "admin" | "host" {
  return userRole === "ADMIN" ? "admin" : "host";
}
