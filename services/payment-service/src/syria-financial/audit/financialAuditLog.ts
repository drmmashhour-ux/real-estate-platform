import { randomUUID } from "node:crypto";
import { redactFinancialSecrets } from "../security.js";
import { createAuditLogSchema, type CreateSyriaAuditLogInput, type SyriaFinancialAuditLog } from "./types.js";

export function createSyriaFinancialAuditLog(
  input: CreateSyriaAuditLogInput,
  createdAt: Date = new Date(),
): SyriaFinancialAuditLog {
  const parsed = createAuditLogSchema.parse(input);
  return Object.freeze({
    id: randomUUID(),
    category: parsed.category,
    action: parsed.action,
    actor: parsed.actor,
    requestCorrelationId: parsed.requestCorrelationId,
    targetId: parsed.targetId,
    metadata: Object.freeze(redactFinancialSecrets(parsed.metadata) as CreateSyriaAuditLogInput["metadata"]),
    createdAt,
    immutable: true,
  });
}
