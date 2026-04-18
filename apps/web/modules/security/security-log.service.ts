import type { SecurityEventSeverity } from "@prisma/client";
import { prisma } from "@/lib/db";
import { asOptionalInputJsonValue } from "@/lib/prisma/as-input-json";
import { securityHardeningV1Flags } from "@/config/feature-flags";

export type SecurityLogInput = {
  type: string;
  severity?: SecurityEventSeverity;
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  path?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logSecurityEvent(input: SecurityLogInput): Promise<{ id: string } | { skipped: true }> {
  if (!securityHardeningV1Flags.securityLoggingV1) {
    return { skipped: true };
  }
  const row = await prisma.securityEvent.create({
    data: {
      type: input.type.slice(0, 64),
      severity: input.severity ?? "low",
      userId: input.userId ?? undefined,
      ip: input.ip?.slice(0, 64) ?? undefined,
      userAgent: input.userAgent?.slice(0, 512) ?? undefined,
      path: input.path?.slice(0, 512) ?? undefined,
      metadata: asOptionalInputJsonValue(input.metadata),
    },
  });
  return { id: row.id };
}

export async function listRecentSecurityEvents(take = 100) {
  return prisma.securityEvent.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
}

/** Bridge for fraud monitors — emits a low-severity audit row without changing fraud engine behavior. */
export async function logFraudSecurityHint(metadata: Record<string, unknown>) {
  return logSecurityEvent({
    type: "fraud_correlation_hint",
    severity: "low",
    metadata,
  });
}
