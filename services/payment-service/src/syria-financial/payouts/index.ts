import { randomUUID } from "node:crypto";
import { z } from "zod";
import { FinancialError } from "../common/errors.js";
import {
  financialCurrencySchema,
  financialIdSchema,
  financialMetadataSchema,
  freezeFinancialRecord,
  nowIso,
  requestCorrelationSchema,
  type RequestCorrelation,
} from "../common/types.js";
import { isSyriaFinancialFeatureEnabled, type SyriaFinancialFeatureFlags } from "../common/featureFlags.js";
import { sanitizeFinancialMetadata } from "../common/security.js";

export const syriaPayoutStatuses = ["pending", "processing", "completed", "failed", "cancelled"] as const;
export const syriaPayoutStatusSchema = z.enum(syriaPayoutStatuses);

export const syriaPayoutSchema = z.object({
  id: financialIdSchema,
  merchantId: financialIdSchema,
  amount: z.number().int().positive(),
  currency: financialCurrencySchema,
  destinationReference: financialIdSchema.optional(),
  status: syriaPayoutStatusSchema,
  idempotencyKey: financialIdSchema,
  correlation: requestCorrelationSchema,
  metadata: financialMetadataSchema,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type SyriaPayout = z.infer<typeof syriaPayoutSchema>;

export interface CreateSyriaPayoutInput {
  merchantId: string;
  amount: number;
  currency: string;
  destinationReference?: string;
  idempotencyKey: string;
  correlation: RequestCorrelation;
  metadata?: Record<string, string | number | boolean | null>;
}

export function createSyriaPayoutPlan(
  input: CreateSyriaPayoutInput,
  flags?: SyriaFinancialFeatureFlags,
): Readonly<SyriaPayout> {
  if (!isSyriaFinancialFeatureEnabled("FEATURE_SYRIA_PAYOUTS", flags)) {
    throw new FinancialError("FEATURE_DISABLED", "Syria payouts are disabled.", 403, input.correlation);
  }

  const timestamp = nowIso();
  return freezeFinancialRecord(
    syriaPayoutSchema.parse({
      id: randomUUID(),
      merchantId: input.merchantId,
      amount: input.amount,
      currency: input.currency,
      destinationReference: input.destinationReference,
      status: "pending",
      idempotencyKey: input.idempotencyKey,
      correlation: input.correlation,
      metadata: sanitizeFinancialMetadata(financialMetadataSchema.parse(input.metadata ?? {})),
      createdAt: timestamp,
      updatedAt: timestamp,
    }),
  );
}
