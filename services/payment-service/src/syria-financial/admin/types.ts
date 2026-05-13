import { z } from "zod";

export const adminDashboardSnapshotSchema = z.object({
  pendingTransactionCount: z.number().int().min(0),
  failedPayoutCount: z.number().int().min(0),
  merchantReviewCount: z.number().int().min(0),
  kycReviewCount: z.number().int().min(0),
  unhealthyProviderCount: z.number().int().min(0),
  suspiciousEventCount: z.number().int().min(0),
  generatedByAdminId: z.string().trim().min(1),
  correlationId: z.string().trim().min(1),
});

export type AdminDashboardSnapshotInput = z.infer<typeof adminDashboardSnapshotSchema>;

export interface SyriaAdminFinancialDashboardSnapshot extends AdminDashboardSnapshotInput {
  internalOnly: true;
  featureFlagProtected: true;
  generatedAt: Date;
}
