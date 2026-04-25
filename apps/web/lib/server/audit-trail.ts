import { prisma } from "@/lib/db";
import { logAudit } from "./logger";

export type AuditAction =
  | "DRAFT_CREATE"
  | "DRAFT_UPDATE"
  | "NOTICE_ACK"
  | "AI_CORRECT"
  | "AUTOPILOT_ACT"
  | "SIGN_ATTEMPT"
  | "SIGN_BLOCK"
  | "PAYMENT_SUCCESS"
  | "PDF_EXPORT";

export type AuditEntity = "DRAFT" | "DEAL" | "LEAD" | "NOTICE" | "SYSTEM";

export async function recordAuditLog(params: {
  userId: string | null;
  action: AuditAction;
  entityType: AuditEntity;
  entityId?: string | null;
  payload?: any;
  traceId?: string;
}) {
  const { userId, action, entityType, entityId, payload, traceId } = params;

  try {
    // 1. Log to structured console logs
    logAudit(action, entityType, entityId || "none", userId || "anonymous");

    // 2. Persist to DB
    await (prisma as any).systemAuditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        payloadJson: payload ? payload : undefined,
        traceId,
      },
    });
  } catch (error) {
    // Failsafe: don't crash if audit logging fails, just log to stderr
    console.error("[CRITICAL] Audit logging failed:", error);
  }
}
