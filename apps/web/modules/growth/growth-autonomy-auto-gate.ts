/**
 * Who may receive server-side low-risk auto-execution — independent of base autonomy snapshot delivery.
 */

import type { PlatformRole } from "@prisma/client";

import type {
  GrowthAutonomyAutoCohortBucket,
  GrowthAutonomyAutoLowRiskRolloutStage,
} from "./growth-autonomy-auto.types";
import { computeAutoLowRiskCohortBucket } from "./growth-autonomy-auto-cohort";
import type { GrowthAutonomyRolloutStage } from "./growth-autonomy.types";
import { viewerReceivesGrowthAutonomySnapshotInternal } from "./growth-autonomy-internal-access";

export function computeLowRiskAutoViewerGate(args: {
  autoRolloutStage: GrowthAutonomyAutoLowRiskRolloutStage;
  autonomyRolloutStage: GrowthAutonomyRolloutStage;
  userId: string | null | undefined;
  role: PlatformRole;
  debugRequest: boolean;
}): { cohortBucket: GrowthAutonomyAutoCohortBucket | null; mayReceiveAutoExecution: boolean } {
  if (!args.userId || args.autoRolloutStage === "off" || args.autonomyRolloutStage === "off") {
    return {
      cohortBucket: args.userId ? computeAutoLowRiskCohortBucket(args.userId) : null,
      mayReceiveAutoExecution: false,
    };
  }

  const cohortBucket = computeAutoLowRiskCohortBucket(args.userId);
  if (cohortBucket !== "auto_low_risk") {
    return { cohortBucket, mayReceiveAutoExecution: false };
  }

  if (args.autoRolloutStage === "internal") {
    const pilot = viewerReceivesGrowthAutonomySnapshotInternal({
      role: args.role,
      userId: args.userId,
      debugRequest: args.debugRequest,
    });
    return { cohortBucket, mayReceiveAutoExecution: pilot };
  }

  if (args.autoRolloutStage === "partial") {
    const pilot = viewerReceivesGrowthAutonomySnapshotInternal({
      role: args.role,
      userId: args.userId,
      debugRequest: args.debugRequest,
    });
    return { cohortBucket, mayReceiveAutoExecution: pilot };
  }

  /** full — still require pilot in production unless debug/staging norms apply elsewhere */
  const pilotFull = viewerReceivesGrowthAutonomySnapshotInternal({
    role: args.role,
    userId: args.userId,
    debugRequest: args.debugRequest,
  });
  return { cohortBucket, mayReceiveAutoExecution: pilotFull };
}
