import { z } from "zod";
import { FinancialError } from "../common/errors.js";
import {
  isSyriaFinancialFeatureEnabled,
  type SyriaFinancialFeatureFlags,
} from "../common/featureFlags.js";
import { financialIdSchema, nowIso } from "../common/types.js";

export const adminFinancialDashboardSnapshotSchema = z.object({
  generatedAt: z.string().datetime({ offset: true }),
  pendingTransactions: z.number().int().min(0),
  failedPayouts: z.number().int().min(0),
  merchantReviews: z.number().int().min(0),
  kycReviews: z.number().int().min(0),
  providerHealth: z.array(
    z.object({
      provider: z.string(),
      status: z.string(),
    }),
  ),
  suspiciousEvents: z.number().int().min(0),
});

export type AdminFinancialDashboardSnapshot = z.infer<typeof adminFinancialDashboardSnapshotSchema>;

export function assertInternalFinancialAdminAccess(input: {
  actorId: string;
  isInternal: boolean;
  flags?: SyriaFinancialFeatureFlags;
}): void {
  financialIdSchema.parse(input.actorId);
  if (!input.isInternal) {
    throw new FinancialError("UNAUTHORIZED", "Financial dashboard data is internal only.", 403);
  }
  if (!isSyriaFinancialFeatureEnabled("FEATURE_SYRIA_ADMIN_FINANCIAL_DASHBOARD", input.flags)) {
    throw new FinancialError("FEATURE_DISABLED", "Syria financial admin dashboard is disabled.", 403);
  }
}

export function createAdminFinancialDashboardSnapshot(
  input: Omit<AdminFinancialDashboardSnapshot, "generatedAt">,
): Readonly<AdminFinancialDashboardSnapshot> {
  return Object.freeze(adminFinancialDashboardSnapshotSchema.parse({ ...input, generatedAt: nowIso() }));
}
