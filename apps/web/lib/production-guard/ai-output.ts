import { getFormDefinition, validateFormSchema } from "./form-schema";
import { recordProductionGuardAudit } from "./audit-service";

export type ValidateAiOutputInput = {
  formKey: string;
  version: string;
  /** Baseline / template facts before AI (must include immutable clauses). */
  baseFacts: Record<string, unknown>;
  /** AI-proposed overlay — cannot delete immutable keys present in base. */
  aiPatch: Record<string, unknown>;
  dealId?: string | null;
  actorUserId?: string | null;
};

/**
 * Ensures AI suggestions never strip mandatory legal structure and always validate against the locked schema.
 */
export function validateAIOutput(input: ValidateAiOutputInput): { ok: true; merged: Record<string, unknown> } | { ok: false; errors: string[] } {
  const def = getFormDefinition(input.formKey, input.version);
  if (!def) {
    const err = `AI output validation refused: unknown form ${input.formKey}@${input.version}`;
    void recordProductionGuardAudit({
      dealId: input.dealId,
      actorUserId: input.actorUserId,
      action: "ai_suggestion_rejected",
      entityType: "form",
      entityId: input.formKey,
      metadata: { version: input.version, reason: "unknown_form" },
    });
    return { ok: false, errors: [err] };
  }

  const errors: string[] = [];
  const merged: Record<string, unknown> = { ...input.baseFacts };

  for (const [k, v] of Object.entries(input.aiPatch)) {
    merged[k] = v;
  }

  for (const key of def.immutableClauseKeys) {
    if (key in input.baseFacts && !(key in merged)) {
      errors.push(`AI cannot remove immutable clause field: ${key}`);
    }
    const before = input.baseFacts[key];
    const after = merged[key];
    if (before != null && typeof before === "string" && typeof after === "string") {
      if (after.trim().length < Math.min(before.trim().length * 0.85, before.trim().length - 5)) {
        errors.push(`AI shortened immutable clause "${key}" beyond allowed threshold.`);
      }
    }
  }

  if (errors.length) {
    void recordProductionGuardAudit({
      dealId: input.dealId,
      actorUserId: input.actorUserId,
      action: "ai_suggestion_rejected",
      entityType: "form",
      entityId: input.formKey,
      diff: { errors },
    });
    return { ok: false, errors };
  }

  const schemaCheck = validateFormSchema(input.formKey, input.version, merged);
  if (!schemaCheck.ok) {
    void recordProductionGuardAudit({
      dealId: input.dealId,
      actorUserId: input.actorUserId,
      action: "ai_suggestion_rejected",
      entityType: "form",
      entityId: input.formKey,
      diff: { errors: schemaCheck.errors },
    });
    return { ok: false, errors: schemaCheck.errors };
  }

  void recordProductionGuardAudit({
    dealId: input.dealId,
    actorUserId: input.actorUserId,
    action: "ai_suggestion_validated",
    entityType: "form",
    entityId: input.formKey,
    metadata: { version: input.version },
  });

  return { ok: true, merged: schemaCheck.data };
}
