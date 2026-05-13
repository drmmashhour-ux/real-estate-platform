import { z } from "zod";
import { providerMetadataSchema } from "../providers/types.js";

export const SYRIA_AUDIT_CATEGORIES = [
  "payment_attempt",
  "payout_attempt",
  "verification_change",
  "admin_action",
  "suspicious_event",
  "provider_failure",
  "api_failure",
] as const;

export const syriaAuditCategorySchema = z.enum(SYRIA_AUDIT_CATEGORIES);

export const auditActorSchema = z.object({
  actorType: z.enum(["system", "payer", "merchant", "admin", "provider"]),
  actorId: z.string().trim().min(1).optional(),
});

export const createAuditLogSchema = z.object({
  category: syriaAuditCategorySchema,
  action: z.string().trim().min(1),
  actor: auditActorSchema,
  requestCorrelationId: z.string().trim().min(1),
  targetId: z.string().trim().min(1).optional(),
  metadata: providerMetadataSchema,
});

export type SyriaAuditCategory = z.infer<typeof syriaAuditCategorySchema>;
export type CreateSyriaAuditLogInput = z.infer<typeof createAuditLogSchema>;

export interface SyriaFinancialAuditLog {
  id: string;
  category: SyriaAuditCategory;
  action: string;
  actor: CreateSyriaAuditLogInput["actor"];
  requestCorrelationId: string;
  targetId?: string;
  metadata: Readonly<CreateSyriaAuditLogInput["metadata"]>;
  createdAt: Date;
  immutable: true;
}
