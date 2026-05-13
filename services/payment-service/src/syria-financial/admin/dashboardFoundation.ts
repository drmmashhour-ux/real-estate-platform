import { SyriaFinancialError } from "../errors.js";
import { anySyriaFinancialFeatureEnabled, getSyriaFinancialFeatureFlags } from "../featureFlags.js";
import {
  adminDashboardSnapshotSchema,
  type AdminDashboardSnapshotInput,
  type SyriaAdminFinancialDashboardSnapshot,
} from "./types.js";

export function createSyriaAdminFinancialDashboardSnapshot(
  input: AdminDashboardSnapshotInput,
  generatedAt: Date = new Date(),
): SyriaAdminFinancialDashboardSnapshot {
  if (!anySyriaFinancialFeatureEnabled(getSyriaFinancialFeatureFlags())) {
    throw new SyriaFinancialError(
      "ADMIN_ACCESS_REQUIRED",
      "Syria financial dashboard data is internal-only and feature-flag protected.",
      { statusCode: 403 },
    );
  }

  const parsed = adminDashboardSnapshotSchema.parse(input);
  return {
    ...parsed,
    internalOnly: true,
    featureFlagProtected: true,
    generatedAt,
  };
}
