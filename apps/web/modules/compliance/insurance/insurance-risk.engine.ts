import { ReputationEntityType } from "@prisma/client";

import { prisma } from "@/lib/db";

import type { InsuranceRiskEngineResult, RiskSeverity } from "./insurance.types";
import { logCompliance } from "./insurance-log";

type EngineInput = { brokerId: string };

/**
 * Deterministic, auditable risk heuristics for broker operations (FARCIQ compliance layer).
 * Not ML; not legal or insurance advice.
 */
export async function evaluateBrokerInsuranceRisk(input: EngineInput): Promise<InsuranceRiskEngineResult> {
  const flags: string[] = [];
  let score = 20;

  try {
    const now = new Date();

    const [dualSideDeals, complaintsLast90, transactions90d, disclosures, recentClaims] = await Promise.all([
      prisma.realEstateTransaction.count({
        where: {
          brokerId: input.brokerId,
          createdAt: { gte: new Date(now.getTime() - 180 * 86400000) },
        },
      }).catch(() => 0),
      prisma.reputationComplaint.count({
        where: {
          entityType: ReputationEntityType.broker,
          entityId: input.brokerId,
          createdAt: { gte: new Date(now.getTime() - 90 * 86400000) },
        },
      }).catch(() => 0),
      prisma.brokerTransactionRecord.count({
        where: {
          brokerId: input.brokerId,
          createdAt: { gte: new Date(now.getTime() - 90 * 86400000) },
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
      prisma.insuranceClaim.count({
        where: {
          brokerId: input.brokerId,
          createdAt: { gte: new Date(now.getTime() - 365 * 86400000) },
        },
      }).catch(() => 0),
    ]);

    /** Claim Impact Heuristic: recent claims indicate elevated liability risk. */
    if (recentClaims >= 3) {
      score += 45;
      flags.push("high_claim_frequency: multiple claims in 12 months — critical risk profile.");
    } else if (recentClaims >= 1) {
      score += 20;
      flags.push("recent_claim_penalty: at least one claim in the last year.");
    }

    /** Conflict-of-interest heuristic: elevated deal volume on both sides without independent review flag in DB — proxy via activity density. */
    if (dualSideDeals >= 8) {
      score += 22;
      flags.push("conflict_of_interest_review: elevated concurrent transaction volume — verify dual-agency disclosures.");
    } else if (dualSideDeals >= 4) {
      score += 12;
      flags.push("conflict_of_interest_review: monitor concurrent deals for disclosure completeness.");
    }

    /** Missing disclosure proxy: active broker listings without completed seller declaration. */
    if (disclosures > 0) {
      score += Math.min(25, disclosures * 5);
      flags.push("missing_disclosure_signal: active listings missing seller declaration completion.");
    }

    /** Suspicious transaction pattern proxy: unusually high recorded broker transactions vs baseline window. */
    if (transactions90d > 40) {
      score += 18;
      flags.push("suspicious_activity_pattern: transaction volume spike — review for anomalies.");
    } else if (transactions90d > 25) {
      score += 10;
      flags.push("transaction_velocity_elevated: validate records against brokerage policy.");
    }

    /** Complaint frequency */
    if (complaintsLast90 >= 3) {
      score += 28;
      flags.push("complaint_frequency_high: multiple complaints in 90 days — supervisory review.");
    } else if (complaintsLast90 >= 1) {
      score += 12;
      flags.push("complaint_frequency_elevated: at least one complaint in 90 days.");
    }

    score = Math.min(100, Math.max(0, Math.round(score)));

    let severity: RiskSeverity = "LOW";
    if (score >= 70) severity = "HIGH";
    else if (score >= 45) severity = "MEDIUM";

    logCompliance("risk_engine_result", { brokerId: input.brokerId, score, severity, flagCount: flags.length });

    return { riskScore: score, flags, severity };
  } catch (e) {
    logCompliance("risk_engine_fallback", {
      brokerId: input.brokerId,
      err: e instanceof Error ? e.message : "unknown",
    });
    return { riskScore: 35, flags: ["risk_engine_unavailable_used_safe_default"], severity: "LOW" };
  }
}
