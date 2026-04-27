import { prisma } from "@/lib/db";

export type PaymentAuditAction = "created" | "confirmed" | "rejected";

export async function appendPaymentAudit(input: {
  requestId: string;
  action: PaymentAuditAction;
  adminId?: string | null;
  ip?: string | null;
}): Promise<void> {
  try {
    await prisma.syriaPaymentAuditLog.create({
      data: {
        requestId: input.requestId,
        action: input.action,
        adminId: input.adminId ?? null,
        ip: input.ip && input.ip.length > 0 ? input.ip.slice(0, 128) : null,
      },
    });
  } catch (e) {
    console.error("[payment-audit]", e);
  }
}
