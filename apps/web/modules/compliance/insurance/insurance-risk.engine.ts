import { ReputationEntityType } from "@prisma/client";

import { prisma } from "@/lib/db";

import type { InsuranceRiskEngineResult, RiskSeverity } from "./insurance.types";
import { logCompliance } from "./insurance-log";

type EngineInput = { brokerId: string };

const MS_DAY = 86400000;

/** Claim intake status drives severity weighting (no separate DB column — backward compatible). */
function claimStatusWeight(status: string): number {
  const s = status.toUpperCase();
  if (s === "UNDER_REVIEW") return 1.35;
  if (s === "SUBMITTED") return 1.15;
  if (s === "CLOSED") return 0.72;
  if (s === "DRAFT") return 0.48;
  return 1;
}

function applyClaimSignalsToScore(input: {
  claims: { status: string; createdAt: Date }[];
  now: Date;
  score: number;
  flags: string[];
}): number {
  let score = input.score;
  const { claims, now, flags } = input;
  const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_DAY);

  let weightedTotal = 0;
  let hasRecentClaim = false;
  for (const c of claims) {
    weightedTotal += claimStatusWeight(c.status);
    if (c.createdAt >= thirtyDaysAgo) hasRecentClaim = true;
  }

  const n = claims.length;
  if (n >= 3) {
    score += Math.min(55, 45 + Math.round(Math.max(0, weightedTotal - n) * 5));
    flags.push("high_claim_frequency: multiple weighted claims in 12 months — critical risk profile.");
  } else if (n >= 1) {
    score += 20 + Math.min(14, Math.round(Math.max(0, weightedTotal - n) * 8));
    flags.push("recent_claim_penalty: at least one claim in the last year.");
  }

  if (hasRecentClaim && n >= 1) {
    score += 12;
    flags.push("recent_claim_window: claim filing or update within the last 30 days.");
  }

  return score;
}

function finalizeScore(score: number, flags: string[]): InsuranceRiskEngineResult {
  score = Math.min(100, Math.max(0, Math.round(score)));

  let severity: RiskSeverity = "LOW";
  if (score >= 70) severity = "HIGH";
  else if (score >= 45) severity = "MEDIUM";

  return { riskScore: score, flags, severity };
}

/**
 * Deterministic, auditable risk heuristics for broker operations (FARCIQ compliance layer).
 * Not ML; not legal or insurance advice.
 */
export async function evaluateBrokerInsuranceRisk(input: EngineInput): Promise<InsuranceRiskEngineResult> {
  const flags: string[] = [];
  let score = 20;

  try {
    const now = new Date();
    const yearAgo = new Date(now.getTime() - 365 * MS_DAY);

    const [dualSideDeals, complaintsLast90, transactions90d, disclosures, claimsLast12m] = await Promise.all([
      prisma.realEstateTransaction.count({
        where: {
          brokerId: input.brokerId,
          createdAt: { gte: new Date(now.getTime() - 180 * MS_DAY) },
        },
      }).catch(() => 0),
      prisma.reputationComplaint.count({
        where: {
          entityType: ReputationEntityType.broker,
          entityId: input.brokerId,
          createdAt: { gte: new Date(now.getTime() - 90 * MS_DAY) },
        },
      }).catch(() => 0),
      prisma.brokerTransactionRecord.count({
        where: {
          brokerId: input.brokerId,
          createdAt: { gte: new Date(now.getTime() - 90 * MS_DAY) },
        },
      }).catch(() => 0),
      prisma.fsboListing.count({
        where: {
          ownerId: input.brokerId,
          listingOwnerType: "BROKER",
          sellerDeclarationCompletedAt: null,
          status: "ACTIVE",
        },
      }).catch(() => 0),
      prisma.insuranceClaim.findMany({
        where: {
          brokerId: input.brokerId,
          createdAt: { gte: yearAgo },
        },
        select: { status: true, createdAt: true },
      }).catch(() => [] as { status: string; createdAt: Date }[]),
    ]);

    score = applyClaimSignalsToScore({ claims: claimsLast12m, now, score, flags });

    if (dualSideDeals >= 8) {
      score += 22;
      flags.push("conflict_of_interest_review: elevated concurrent transaction volume — verify dual-agency disclosures.");
    } else if (dualSideDeals >= 4) {
      score += 12;
      flags.push("conflict_of_interest_review: monitor concurrent deals for disclosure completeness.");
    }

    if (disclosures > 0) {
      score += Math.min(25, disclosures * 5);
      flags.push("missing_disclosure_signal: active listings missing seller declaration completion.");
    }

    if (transactions90d > 40) {
      score += 18;
      flags.push("suspicious_activity_pattern: transaction volume spike — review for anomalies.");
    } else if (transactions90d > 25) {
      score += 10;
      flags.push("transaction_velocity_elevated: validate records against brokerage policy.");
    }

    if (complaintsLast90 >= 3) {
      score += 28;
      flags.push("complaint_frequency_high: multiple complaints in 90 days — supervisory review.");
    } else if (complaintsLast90 >= 1) {
      score += 12;
      flags.push("complaint_frequency_elevated: at least one complaint in 90 days.");
    }

    const result = finalizeScore(score, flags);
    logCompliance("audit_risk_engine_result", {
      brokerId: input.brokerId,
      score: result.riskScore,
      severity: result.severity,
      flagCount: flags.length,
      claims12m: claimsLast12m.length,
    });

    return result;
  } catch (e) {
    logCompliance("risk_engine_fallback", {
      brokerId: input.brokerId,
      err: e instanceof Error ? e.message : "unknown",
    });
    return { riskScore: 35, flags: ["risk_engine_unavailable_used_safe_default"], severity: "LOW" };
  }
}

/** Batched risk scores for marketplace ranking — shared queries per metric. */
export async function evaluateBrokerInsuranceRiskBatch(
  brokerIds: string[],
): Promise<Map<string, InsuranceRiskEngineResult>> {
  const out = new Map<string, InsuranceRiskEngineResult>();
  const uniq = [...new Set(brokerIds.filter(Boolean))];
  if (uniq.length === 0) return out;

  try {
    const now = new Date();
    const yearAgo = new Date(now.getTime() - 365 * MS_DAY);
    const sixMonthsAgo = new Date(now.getTime() - 180 * MS_DAY);
    const ninetyAgo = new Date(now.getTime() - 90 * MS_DAY);

    const [
      dualRows,
      complaintRows,
      txnRows,
      disclosureRows,
      claimRows,
    ] = await Promise.all([
      prisma.realEstateTransaction
        .groupBy({
          by: ["brokerId"],
          where: { brokerId: { in: uniq }, createdAt: { gte: sixMonthsAgo } },
          _count: { _all: true },
        })
        .catch(() => [] as { brokerId: string; _count: { _all: number } }[]),
      prisma.reputationComplaint
        .groupBy({
          by: ["entityId"],
          where: {
            entityType: ReputationEntityType.broker,
            entityId: { in: uniq },
            createdAt: { gte: ninetyAgo },
          },
          _count: { _all: true },
        })
        .catch(() => [] as { entityId: string; _count: { _all: number } }[]),
      prisma.brokerTransactionRecord
        .groupBy({
          by: ["brokerId"],
          where: { brokerId: { in: uniq }, createdAt: { gte: ninetyAgo } },
          _count: { _all: true },
        })
        .catch(() => [] as { brokerId: string; _count: { _all: number } }[]),
      prisma.fsboListing
        .groupBy({
          by: ["ownerId"],
          where: {
            ownerId: { in: uniq },
            listingOwnerType: "BROKER",
            sellerDeclarationCompletedAt: null,
            status: "ACTIVE",
          },
          _count: { _all: true },
        })
        .catch(() => [] as { ownerId: string; _count: { _all: number } }[]),
      prisma.insuranceClaim
        .findMany({
          where: { brokerId: { in: uniq }, createdAt: { gte: yearAgo } },
          select: { brokerId: true, status: true, createdAt: true },
        })
        .catch(() => [] as { brokerId: string; status: string; createdAt: Date }[]),
    ]);

    const dualMap = new Map(dualRows.map((r) => [r.brokerId, r._count._all]));
    const complaintMap = new Map(complaintRows.map((r) => [r.entityId, r._count._all]));
    const txnMap = new Map(txnRows.map((r) => [r.brokerId, r._count._all]));
    const disclosureMap = new Map(disclosureRows.map((r) => [r.ownerId, r._count._all]));

    const claimsByBroker = new Map<string, { status: string; createdAt: Date }[]>();
    for (const c of claimRows) {
      const arr = claimsByBroker.get(c.brokerId) ?? [];
      arr.push({ status: c.status, createdAt: c.createdAt });
      claimsByBroker.set(c.brokerId, arr);
    }

    for (const id of uniq) {
      const flags: string[] = [];
      let score = 20;

      score = applyClaimSignalsToScore({
        claims: claimsByBroker.get(id) ?? [],
        now,
        score,
        flags,
      });

      const dualSideDeals = dualMap.get(id) ?? 0;
      const complaintsLast90 = complaintMap.get(id) ?? 0;
      const transactions90d = txnMap.get(id) ?? 0;
      const disclosures = disclosureMap.get(id) ?? 0;

      if (dualSideDeals >= 8) {
        score += 22;
        flags.push("conflict_of_interest_review: elevated concurrent transaction volume — verify dual-agency disclosures.");
      } else if (dualSideDeals >= 4) {
        score += 12;
        flags.push("conflict_of_interest_review: monitor concurrent deals for disclosure completeness.");
      }

      if (disclosures > 0) {
        score += Math.min(25, disclosures * 5);
        flags.push("missing_disclosure_signal: active listings missing seller declaration completion.");
      }

      if (transactions90d > 40) {
        score += 18;
        flags.push("suspicious_activity_pattern: transaction volume spike — review for anomalies.");
      } else if (transactions90d > 25) {
        score += 10;
        flags.push("transaction_velocity_elevated: validate records against brokerage policy.");
      }

      if (complaintsLast90 >= 3) {
        score += 28;
        flags.push("complaint_frequency_high: multiple complaints in 90 days — supervisory review.");
      } else if (complaintsLast90 >= 1) {
        score += 12;
        flags.push("complaint_frequency_elevated: at least one complaint in 90 days.");
      }

      out.set(id, finalizeScore(score, flags));
    }

    return out;
  } catch {
    for (const id of uniq) {
      out.set(id, { riskScore: 35, flags: ["risk_engine_unavailable_used_safe_default"], severity: "LOW" });
    }
    return out;
  }
}
