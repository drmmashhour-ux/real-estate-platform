import {
  RolloutExecutionStatus,
  RolloutPolicyDomain,
  RolloutPolicyStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { isEntityInRollout } from "./rollout-cohort.service";
import { ROLLOUT_STRATEGY } from "./rollout.constants";

const ACTIVE_POLICY: RolloutPolicyStatus[] = [
  RolloutPolicyStatus.APPROVED,
  RolloutPolicyStatus.LIVE,
];

async function findActiveExecution(domain: RolloutPolicyDomain, strategyKey: string) {
  return prisma.rolloutExecution.findFirst({
    where: {
      status: RolloutExecutionStatus.RUNNING,
      policy: {
        domain,
        strategyKey,
        status: { in: ACTIVE_POLICY },
      },
    },
    include: { policy: true },
    orderBy: { startedAt: "desc" },
  });
}

/**
 * Relative delta for LEAD/FEATURED base price when entity is in rollout cohort.
 */
export async function getPricingRolloutRelativeDelta(
  cohortEntityId: string | null | undefined,
  strategyKey: string,
): Promise<number | null> {
  if (!cohortEntityId?.trim()) return null;
  const ex = await findActiveExecution(RolloutPolicyDomain.PRICING, strategyKey);
  if (!ex) return null;
  if (!isEntityInRollout(cohortEntityId.trim(), ex.rolloutPercent, ex.cohortKey)) return null;
  const p = ex.policy.payloadJson as { relativeDelta?: unknown };
  return typeof p.relativeDelta === "number" && Number.isFinite(p.relativeDelta) ? p.relativeDelta : null;
}

/** Convenience for lead pricing quotes. */
export async function getLeadPricingRolloutRelativeDelta(cohortEntityId: string | null | undefined) {
  return getPricingRolloutRelativeDelta(cohortEntityId, ROLLOUT_STRATEGY.LEAD_BASE_PRICE_RELATIVE);
}

/** Single DB read + in-memory residence checks (use inside matching loops). */
export async function getActiveRankingRolloutTreatments(viewerUserId: string | null | undefined): Promise<{
  deltaPoints: number;
  residenceIdSet: Set<string>;
} | null> {
  if (!viewerUserId?.trim()) return null;
  const ex = await findActiveExecution(RolloutPolicyDomain.RANKING, ROLLOUT_STRATEGY.RESIDENCE_RANK_BOOST);
  if (!ex) return null;
  if (!isEntityInRollout(viewerUserId.trim(), ex.rolloutPercent, ex.cohortKey)) return null;
  const payload = ex.policy.payloadJson as { residenceIds?: unknown; deltaPoints?: unknown };
  const ids = payload.residenceIds;
  if (!Array.isArray(ids)) return null;
  const d = payload.deltaPoints;
  const deltaPoints =
    typeof d === "number" && Number.isFinite(d) ? Math.max(-5, Math.min(5, d)) : 0;
  return { deltaPoints, residenceIdSet: new Set(ids.filter((x) => typeof x === "string")) };
}

/** Extra rank bias points when viewer is in rollout cohort and residence is targeted. */
export async function getRankingRolloutBoostForMatch(
  viewerUserId: string | null | undefined,
  residenceId: string,
): Promise<number> {
  const ctx = await getActiveRankingRolloutTreatments(viewerUserId);
  if (!ctx || !ctx.residenceIdSet.has(residenceId)) return 0;
  return ctx.deltaPoints;
}

/** Placeholder hooks for future MESSAGING / DEAL domain wiring. */
export async function isMessagingRolloutTreatment(
  cohortEntityId: string | null | undefined,
  strategyKey: string,
): Promise<boolean> {
  if (!cohortEntityId?.trim()) return false;
  const ex = await findActiveExecution(RolloutPolicyDomain.MESSAGING, strategyKey);
  if (!ex) return false;
  return isEntityInRollout(cohortEntityId.trim(), ex.rolloutPercent, ex.cohortKey);
}

export async function isDealRolloutTreatment(
  cohortEntityId: string | null | undefined,
  strategyKey: string,
): Promise<boolean> {
  if (!cohortEntityId?.trim()) return false;
  const ex = await findActiveExecution(RolloutPolicyDomain.DEAL, strategyKey);
  if (!ex) return false;
  return isEntityInRollout(cohortEntityId.trim(), ex.rolloutPercent, ex.cohortKey);
}
