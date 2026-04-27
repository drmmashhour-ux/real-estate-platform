import "server-only";

import { getAcquisitionInsights } from "@/lib/growth/acquisitionInsights";
import { buildEarlyUserSignalsFromCount, getEarlyUserSignals } from "@/lib/growth/earlyUserSignals";
import { runUIAudit } from "@/lib/ui/auditHeuristics";

export type LaunchReadinessResult = {
  ready: boolean;
  /** Human-readable blockers. */
  reasons: string[];
  details: {
    uiScore: number;
    earlyUserCount: number;
    hasAcquisitionData: boolean;
    nonVisitorSignups: number;
  };
};

/**
 * One-click launch gate (Order 52.1) — all must be true:
 * - UI audit score ≥ 80
 * - Early-user cohort &gt; 10
 * - At least one non-visitor user with acquisition path (signup / attribution)
 */
export async function isLaunchReady(): Promise<LaunchReadinessResult> {
  let uiScore = 0;
  let earlyUserCount = 0;
  let hasAcquisitionData = false;
  let nonVisitorSignups = 0;

  try {
    const [audit, early, acq] = await Promise.all([
      runUIAudit().catch((e) => {
        console.error("[isLaunchReady] runUIAudit", e);
        return { score: 0, passed: [], failed: [] };
      }),
      getEarlyUserSignals().catch((e) => {
        console.error("[isLaunchReady] early users", e);
        return buildEarlyUserSignalsFromCount(0);
      }),
      getAcquisitionInsights().catch((e) => {
        console.error("[isLaunchReady] acquisition", e);
        return { totalUsers: 0, attributedUsers: 0, channels: [], topChannel: null, notes: [] as string[] };
      }),
    ]);
    uiScore = audit.score;
    earlyUserCount = early.count;
    nonVisitorSignups = acq.totalUsers;
    hasAcquisitionData = acq.totalUsers > 0;
  } catch (e) {
    console.error("[isLaunchReady] unexpected", e);
  }

  const reasons: string[] = [];
  if (uiScore < 80) {
    reasons.push(`UI quality score is ${uiScore} (need ≥ 80). Review /dashboard/admin/ui-check.`);
  }
  if (earlyUserCount <= 10) {
    reasons.push(`Early users are ${earlyUserCount} (need > 10).`);
  }
  if (!hasAcquisitionData) {
    reasons.push("No acquisition / signup data yet (need at least one tracked user).");
  }

  const ready = reasons.length === 0;
  return {
    ready,
    reasons,
    details: { uiScore, earlyUserCount, hasAcquisitionData, nonVisitorSignups },
  };
}
