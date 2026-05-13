import { z } from "zod";

export const SYRIA_FINANCIAL_NAMESPACE = "syria_financial" as const;

export const syriaProviderCodes = [
  "provider_stub",
  "provider_qnb_stub",
  "provider_chamcash_stub",
] as const;

export const syriaProviderCodeSchema = z.enum(syriaProviderCodes);
export type SyriaProviderCode = z.infer<typeof syriaProviderCodeSchema>;

export const financialCurrencySchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{3}$/, "currency must be an ISO-4217 alphabetic code")
  .transform((value) => value.toUpperCase());

export const financialIdSchema = z.string().trim().min(1).max(128);

export const financialMetadataValueSchema = z.union([
  z.string().max(2_000),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const financialMetadataSchema = z.record(financialMetadataValueSchema).default({});
export type FinancialMetadata = z.infer<typeof financialMetadataSchema>;

export const financialTimestampSchema = z.string().datetime({ offset: true });

export const financialActorTypes = ["system", "user", "merchant", "admin", "provider"] as const;
export const financialActorTypeSchema = z.enum(financialActorTypes);
export type FinancialActorType = z.infer<typeof financialActorTypeSchema>;

export const financialActorSchema = z.object({
  actorType: financialActorTypeSchema,
  actorId: financialIdSchema.optional(),
});
export type FinancialActor = z.infer<typeof financialActorSchema>;

export const requestCorrelationSchema = z.object({
  correlationId: financialIdSchema,
  idempotencyKey: financialIdSchema.optional(),
  requestId: financialIdSchema.optional(),
});
export type RequestCorrelation = z.infer<typeof requestCorrelationSchema>;

export const auditTrailEntrySchema = z.object({
  id: financialIdSchema,
  action: z.string().trim().min(1).max(128),
  actor: financialActorSchema,
  occurredAt: financialTimestampSchema,
  correlationId: financialIdSchema,
  metadata: financialMetadataSchema,
});
export type AuditTrailEntry = z.infer<typeof auditTrailEntrySchema>;

export function nowIso(): string {
  return new Date().toISOString();
}

export function freezeFinancialRecord<T extends object>(value: T): Readonly<T> {
  return Object.freeze(value);
}
