import { prisma } from "@/lib/db";

export type InvestmentFlowAuditAction =
  | "commitment_created"
  | "commitment_approved"
  | "commitment_rejected"
  | "commitment_withdrawn"
  | "subscription_created"
  | "subscription_signed"
  | "payment_received"
  | "cap_table_updated";

export async function recordInvestmentFlowAudit(input: {
  dealId: string;
  actorUserId?: string | null;
  action: InvestmentFlowAuditAction | string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  diff?: unknown;
}): Promise<void> {
  try {
    await prisma.lecipmInvestmentFlowAuditLog.create({
      data: {
        dealId: input.dealId,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? {},
        diff: input.diff === undefined ? undefined : (input.diff as object),
      },
    });
  } catch {
    // Non-fatal: surface via ops monitoring if audit insert fails.
  }
}
