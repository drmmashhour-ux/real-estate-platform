import { z } from "zod";
import { autonomyModeSchema } from "./zod-schemas";

export const adminAutonomyExecuteBodySchema = z.object({
  targetType: z.enum(["fsbo_listing", "lead", "campaign"]),
  targetId: z.string().min(1),
  mode: autonomyModeSchema.optional(),
  dryRun: z.boolean().optional(),
  detectorIds: z.array(z.string()).optional(),
  actionTypes: z.array(z.string()).optional(),
  idempotencyKey: z.string().max(256).optional(),
  /** Optional correlation — Québec web listings default to ca_qc when omitted at engine layer. */
  regionCode: z.string().min(2).max(32).optional(),
  /** Optional listing source hint (e.g. syria) for capability audit trails / clients. */
  source: z.enum(["web", "syria", "external"]).optional(),
});

export const adminAutonomyApprovalIdSchema = z.object({
  approvalId: z.string().min(1),
});

export const adminAutonomyRejectBodySchema = adminAutonomyApprovalIdSchema.extend({
  reason: z.string().max(2000).optional(),
});
