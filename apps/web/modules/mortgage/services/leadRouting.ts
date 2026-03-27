import { prisma } from "@/lib/db";
import { trustContributionForMortgageBrokerUsers } from "@/lib/trustgraph/infrastructure/services/mortgageLeadRoutingTrust";
import { ensureDefaultMortgageBrokers } from "@/modules/mortgage/services/ensure-default-brokers";

/** Penalize brokers who received a lead within this window (fairness). */
export const RECENT_ASSIGNMENT_WINDOW_MS = 48 * 60 * 60 * 1000;

/**
 * Optional future: +1 for premium / boosted brokers — keep 0 so it is not dominant vs rating/response.
 * Set to 1 and optionally gate on `plan` or env when you add a premium tier.
 */
export const PREMIUM_PRIORITY_BOOST = 0;

export type DistributionReason = "smart_routing" | "primary_fallback" | "emergency_pool";

export type AssignMortgageBrokerResult = {
  brokerId: string;
  reason: DistributionReason;
  /** Final routing score used for ordering / logging */
  score: number;
  /** Human-readable routing reason for logs */
  routingReason: string;
};

type BrokerRow = {
  id: string;
  userId: string | null;
  plan: string;
  isVerified: boolean;
  isPrimary: boolean;
  lastAssignedLeadAt: Date | null;
  rating: number;
  responseTimeAvg: number | null;
  priorityScore: number;
};

/**
 * `responseTimeAvg` is hours (rolling). Spec uses `(rating * 2) * (responseTimeAvg / 10)` which would
 * reward *slow* response; we use `(rating * 2) * (10 / max(hours, 0.5))` so faster brokers score higher.
 *
 * Fairness: single −2 when `lastAssignedLeadAt` is within the window (recent assignment / recent activity).
 * Optional: +`PREMIUM_PRIORITY_BOOST` when `priorityScore > 0` (non-dominant nudge; future premium tier).
 */
export function computeLeadRoutingScore(
  b: BrokerRow,
  now: Date,
  opts?: { recentAssignmentWindowMs?: number }
): { score: number; recentFairnessPenalty: number; premiumBoost: number } {
  const recentAssignmentWindowMs = opts?.recentAssignmentWindowMs ?? RECENT_ASSIGNMENT_WINDOW_MS;

  const hours = b.responseTimeAvg ?? 10;
  const responseFactor = 10 / Math.max(hours, 0.5);
  let score = b.rating * 2 * responseFactor;

  const last = b.lastAssignedLeadAt?.getTime();
  const recentFairnessPenalty =
    last != null && now.getTime() - last < recentAssignmentWindowMs ? 2 : 0;
  score -= recentFairnessPenalty;

  const premiumBoost =
    PREMIUM_PRIORITY_BOOST > 0 && b.priorityScore > 0 ? PREMIUM_PRIORITY_BOOST : 0;
  score += premiumBoost;

  return { score, recentFairnessPenalty, premiumBoost };
}

function sortByScoreDescending(
  brokers: { row: BrokerRow; score: number; routingReason: string }[]
): { row: BrokerRow; score: number; routingReason: string }[] {
  return [...brokers].sort((a, b) => b.score - a.score);
}

/**
 * Smart routing: prefer `plan === "pro"` and `isVerified`, score by rating/response/fairness,
 * then fall back to `isPrimary` if no eligible pool.
 */
export async function assignMortgageBrokerForLead(now = new Date()): Promise<AssignMortgageBrokerResult> {
  await ensureDefaultMortgageBrokers();

  const all = await prisma.mortgageBroker.findMany({
    select: {
      id: true,
      userId: true,
      plan: true,
      isVerified: true,
      isPrimary: true,
      lastAssignedLeadAt: true,
      rating: true,
      responseTimeAvg: true,
      priorityScore: true,
    },
  });

  const trustBoostByUser = await trustContributionForMortgageBrokerUsers(all.map((b) => b.userId));

  const eligible: BrokerRow[] = all
    .filter((b) => b.isVerified && b.plan === "pro")
    .map((b) => ({
      id: b.id,
      userId: b.userId,
      plan: b.plan,
      isVerified: b.isVerified,
      isPrimary: b.isPrimary,
      lastAssignedLeadAt: b.lastAssignedLeadAt,
      rating: b.rating,
      responseTimeAvg: b.responseTimeAvg,
      priorityScore: b.priorityScore,
    }));

  if (eligible.length > 0) {
    const scored = eligible.map((row) => {
      const { score, recentFairnessPenalty, premiumBoost } = computeLeadRoutingScore(row, now);
      const trustBoost = row.userId ? trustBoostByUser.get(row.userId) ?? 0 : 0;
      const finalScore = score + trustBoost;
      const routingReason = [
        `smart_routing:pro`,
        `rating=${row.rating.toFixed(2)}`,
        `response_h=${(row.responseTimeAvg ?? 10).toFixed(2)}`,
        `pen_recent=${recentFairnessPenalty}`,
        `boost_priority=${premiumBoost}`,
        `trustgraph_boost=${trustBoost.toFixed(2)}`,
      ].join(";");
      return { row, score: finalScore, routingReason };
    });
    const sorted = sortByScoreDescending(scored);
    const top = sorted[0]!;
    return {
      brokerId: top.row.id,
      reason: "smart_routing",
      score: top.score,
      routingReason: top.routingReason,
    };
  }

  const primaryOnly = all.filter((b) => b.isPrimary);
  if (primaryOnly.length > 0) {
    const rows: BrokerRow[] = primaryOnly.map((b) => ({
      id: b.id,
      userId: b.userId,
      plan: b.plan,
      isVerified: b.isVerified,
      isPrimary: b.isPrimary,
      lastAssignedLeadAt: b.lastAssignedLeadAt,
      rating: b.rating,
      responseTimeAvg: b.responseTimeAvg,
      priorityScore: b.priorityScore,
    }));
    const scored = rows.map((row) => {
      const { score, recentFairnessPenalty, premiumBoost } = computeLeadRoutingScore(row, now);
      const trustBoost = row.userId ? trustBoostByUser.get(row.userId) ?? 0 : 0;
      const finalScore = score + trustBoost;
      const routingReason = [
        `primary_fallback`,
        `rating=${row.rating.toFixed(2)}`,
        `pen_recent=${recentFairnessPenalty}`,
        `boost_priority=${premiumBoost}`,
        `trustgraph_boost=${trustBoost.toFixed(2)}`,
      ].join(";");
      return { row, score: finalScore, routingReason };
    });
    const sorted = sortByScoreDescending(scored);
    const top = sorted[0]!;
    return {
      brokerId: top.row.id,
      reason: "primary_fallback",
      score: top.score,
      routingReason: top.routingReason,
    };
  }

  if (all.length > 0) {
    const rows: BrokerRow[] = all.map((b) => ({
      id: b.id,
      userId: b.userId,
      plan: b.plan,
      isVerified: b.isVerified,
      isPrimary: b.isPrimary,
      lastAssignedLeadAt: b.lastAssignedLeadAt,
      rating: b.rating,
      responseTimeAvg: b.responseTimeAvg,
      priorityScore: b.priorityScore,
    }));
    const scored = rows.map((row) => {
      const { score, recentFairnessPenalty, premiumBoost } = computeLeadRoutingScore(row, now);
      const trustBoost = row.userId ? trustBoostByUser.get(row.userId) ?? 0 : 0;
      const finalScore = score + trustBoost;
      const routingReason = [
        `emergency_pool:no_pro_no_primary`,
        `pen_recent=${recentFairnessPenalty}`,
        `boost_priority=${premiumBoost}`,
        `trustgraph_boost=${trustBoost.toFixed(2)}`,
      ].join(";");
      return { row, score: finalScore, routingReason };
    });
    const sorted = sortByScoreDescending(scored);
    const top = sorted[0]!;
    return {
      brokerId: top.row.id,
      reason: "emergency_pool",
      score: top.score,
      routingReason: top.routingReason,
    };
  }

  throw new Error("No mortgage brokers available for assignment");
}
