/**
 * Internal / pilot cohort access for autonomy snapshot delivery — mirrors GET /api/growth/autonomy gating.
 * Does not grant new capabilities; controls who receives the snapshot under FEATURE_GROWTH_AUTONOMY_ROLLOUT=internal.
 */

import { PlatformRole } from "@prisma/client";

/** Comma-separated Prisma user IDs allowed to receive snapshots in production when rollout is `internal`. */
export function parseGrowthAutonomyInternalOperatorUserIds(): Set<string> {
  const raw = process.env.GROWTH_AUTONOMY_INTERNAL_OPERATOR_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/**
 * Whether this viewer may receive an autonomy snapshot when rollout stage is `internal` in production.
 */
export function viewerReceivesGrowthAutonomySnapshotInternal(args: {
  role: PlatformRole;
  userId: string;
  debugRequest: boolean;
}): boolean {
  if (args.role === PlatformRole.ADMIN) return true;
  if (process.env.NODE_ENV !== "production") return true;
  if (args.debugRequest) return true;
  if (process.env.NEXT_PUBLIC_GROWTH_AUTONOMY_INTERNAL_UI === "1") return true;
  return parseGrowthAutonomyInternalOperatorUserIds().has(args.userId);
}

/**
 * Server component helper — same rules as API (for UI hints / validation surfaces).
 */
export function computeGrowthAutonomyViewerPilotAccess(args: {
  role: PlatformRole | null | undefined;
  userId: string;
}): boolean {
  return viewerReceivesGrowthAutonomySnapshotInternal({
    role: args.role ?? PlatformRole.USER,
    userId: args.userId,
    debugRequest: false,
  });
}
