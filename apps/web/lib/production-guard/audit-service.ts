import { prisma } from "@/lib/db";
import { isProductionGuardVerboseLogging } from "./production-mode";

export type ProductionGuardAuditAction =
  | "field_change"
  | "notice_shown"
  | "notice_acknowledged"
  | "ai_suggestion_validated"
  | "ai_suggestion_rejected"
  | "ai_fallback_used"
  | "signature_blocked"
  | "signature_allowed"
  | "final_pdf_sealed"
  | "form_schema_rejected";

export async function recordProductionGuardAudit(input: {
  dealId?: string | null;
  actorUserId?: string | null;
  action: ProductionGuardAuditAction | string;
  entityType?: string | null;
  entityId?: string | null;
  diff?: unknown;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.lecipmProductionGuardAuditEvent.create({
      data: {
        dealId: input.dealId ?? null,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        diff: input.diff === undefined ? undefined : (input.diff as object),
        metadata: {
          ...(input.metadata ?? {}),
          ...(isProductionGuardVerboseLogging() ? { verbose: true, at: new Date().toISOString() } : {}),
        },
      },
    });
  } catch {
    // Non-fatal: never block primary flow on audit insert failure; ops should alert on missing audits.
  }
}

/** Persist a structured field diff (before/after) for compliance review. */
export async function recordProductionGuardFieldChange(input: {
  dealId: string;
  actorUserId: string;
  fieldKey: string;
  before: unknown;
  after: unknown;
  entityType?: string;
  entityId?: string;
}): Promise<void> {
  await recordProductionGuardAudit({
    dealId: input.dealId,
    actorUserId: input.actorUserId,
    action: "field_change",
    entityType: input.entityType ?? "form_field",
    entityId: input.entityId ?? input.fieldKey,
    diff: { fieldKey: input.fieldKey, before: input.before, after: input.after },
  });
}
