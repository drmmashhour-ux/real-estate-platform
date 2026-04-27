import type { Prisma } from "@/generated/prisma";
import { appendSyriaSybnbCoreAudit } from "@/lib/sybnb/sybnb-financial-audit";

/**
 * Structured security / compliance logging — never log raw tokens or full connection strings.
 * Persists to append-only SYBNB audit when a booking exists; otherwise metadata-only event.
 */
export async function logSecurityEvent(input: {
  action: string;
  userId?: string | null;
  bookingId?: string | null;
  metadata?: Prisma.JsonObject;
}): Promise<void> {
  const metadata: Prisma.JsonObject = {
    ...(input.metadata ?? {}),
    securityAction: input.action,
    userId: input.userId ?? null,
  };
  try {
    await appendSyriaSybnbCoreAudit({
      bookingId: input.bookingId ?? null,
      event: `security_${input.action}`,
      metadata,
    });
  } catch {
    /* best-effort */
  }
}
