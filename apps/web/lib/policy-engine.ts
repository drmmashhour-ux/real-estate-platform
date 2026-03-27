/**
 * Policy Engine – configurable business rules for eligibility, visibility,
 * payout release, verification, auto-block, etc. Decisions are logged.
 */
import { prisma } from "@/lib/db";
import type { PolicyEffect, PolicyRuleType, Prisma } from "@prisma/client";
import { canUserWithdraw } from "@/lib/trust-safety/account-restrictions";

export type { PolicyRuleType, PolicyEffect };

export type PolicyContext = {
  entityType: string;
  entityId: string;
  userId?: string;
  region?: string;
  listingId?: string;
  bookingId?: string;
  fraudScore?: number;
  verificationStatus?: string;
  [key: string]: unknown;
};

export type PolicyDecision = {
  allowed: boolean;
  effect: PolicyEffect;
  ruleKey: string;
  reasonCode?: string;
  holdReason?: string;
};

/**
 * Evaluate a single policy rule against context. Returns decision and logs it.
 */
export async function evaluateRule(
  ruleKey: string,
  context: PolicyContext
): Promise<PolicyDecision> {
  const rule = await prisma.policyRule.findUnique({
    where: { key: ruleKey, active: true },
  });
  if (!rule) {
    return { allowed: true, effect: "ALLOW", ruleKey: ruleKey };
  }
  if (rule.scope === "REGION" && rule.scopeValue && context.region && rule.scopeValue !== context.region) {
    return { allowed: true, effect: "ALLOW", ruleKey: ruleKey };
  }
  const conditions = rule.conditions as Record<string, unknown>;
  let passes = true;
  if (conditions.minVerification && context.verificationStatus) {
    const min = conditions.minVerification as string;
    const order = { PENDING: 0, VERIFIED: 1, REJECTED: -1 };
    if ((order[context.verificationStatus as keyof typeof order] ?? 0) < (order[min as keyof typeof order] ?? 0)) {
      passes = false;
    }
  }
  if (conditions.maxFraudScore != null && context.fraudScore != null) {
    if (context.fraudScore > (conditions.maxFraudScore as number)) passes = false;
  }
  if (conditions.requireCompletedStay && context.bookingStatus !== "COMPLETED") {
    passes = false;
  }
  if (conditions.hasMinInfo === true && context.hasMinInfo !== true) {
    passes = false;
  }
  const effect = passes ? "ALLOW" : (rule.effect as PolicyEffect);
  const allowed = effect === "ALLOW";
  const payload = rule.effectPayload && typeof rule.effectPayload === "object" ? (rule.effectPayload as Record<string, unknown>) : {};
  const reasonCode = typeof payload.reasonCode === "string" ? payload.reasonCode : undefined;
  const holdReason = typeof payload.holdReason === "string" ? payload.holdReason : undefined;
  const reasonCodeForLog = allowed ? undefined : (reasonCode ?? rule.key);

  await prisma.policyDecisionLog.create({
    data: {
      ruleKey,
      entityType: context.entityType,
      entityId: context.entityId,
      decision: allowed ? "ALLOWED" : (effect === "HOLD" ? "HELD" : "DENIED"),
      reasonCode: reasonCodeForLog ?? undefined,
      context: context as object,
    },
  });

  return {
    allowed,
    effect,
    ruleKey,
    reasonCode: allowed ? undefined : reasonCode,
    holdReason: effect === "HOLD" ? holdReason : undefined,
  };
}

/**
 * Evaluate multiple rules (e.g. payout release: identity_verified, fraud_ok, no_hold).
 * Returns first DENY or HOLD, or ALLOW if all pass.
 */
export async function evaluatePolicies(
  ruleKeys: string[],
  context: PolicyContext
): Promise<PolicyDecision> {
  for (const key of ruleKeys) {
    const decision = await evaluateRule(key, context);
    if (!decision.allowed) return decision;
  }
  return { allowed: true, effect: "ALLOW", ruleKey: ruleKeys[0] ?? "" };
}

/** Check if user can receive payout (policy: account active, identity verified, fraud below threshold). */
export async function canReleasePayout(context: {
  userId: string;
  bookingId?: string;
  fraudScore?: number;
  verificationStatus?: string;
}): Promise<PolicyDecision> {
  const canWithdraw = await canUserWithdraw(context.userId);
  if (!canWithdraw) {
    return {
      allowed: false,
      effect: "DENY",
      ruleKey: "payout_release_account_status",
      reasonCode: "ACCOUNT_RESTRICTED",
      holdReason: "Account is restricted or banned; payouts are blocked.",
    };
  }
  return evaluatePolicies(
    ["payout_release_identity", "payout_release_fraud"],
    {
      entityType: "PAYOUT",
      entityId: context.bookingId ?? context.userId,
      userId: context.userId,
      fraudScore: context.fraudScore,
      verificationStatus: context.verificationStatus,
    }
  );
}

/** Check if booking can be confirmed (e.g. fraud score, listing not frozen). */
export async function canConfirmBooking(context: {
  bookingId: string;
  listingId: string;
  fraudScore?: number;
  region?: string;
}): Promise<PolicyDecision> {
  return evaluateRule("booking_confirm_fraud", {
    entityType: "BOOKING",
    entityId: context.bookingId,
    listingId: context.listingId,
    fraudScore: context.fraudScore,
    region: context.region,
  });
}

/** Check if user can leave review (stay completed). */
export async function canLeaveReview(context: {
  bookingId: string;
  bookingStatus?: string;
}): Promise<PolicyDecision> {
  return evaluateRule("review_eligibility_completed_stay", {
    entityType: "REVIEW",
    entityId: context.bookingId,
    bookingStatus: context.bookingStatus,
  });
}

/** Check if listing can go live (min info, verification if required). */
export async function canListGoLive(context: {
  listingId: string;
  verificationStatus?: string;
  hasMinInfo?: boolean;
}): Promise<PolicyDecision> {
  return evaluatePolicies(
    ["listing_live_min_info", "listing_live_verification"],
    {
      entityType: "LISTING",
      entityId: context.listingId,
      verificationStatus: context.verificationStatus,
      hasMinInfo: context.hasMinInfo,
    }
  );
}

/** Get or create default policy rules (seed). */
export async function ensureDefaultPolicies() {
  const defaults = [
    {
      key: "payout_release_identity",
      name: "Payout release – identity verified",
      ruleType: "VERIFICATION" as PolicyRuleType,
      conditions: { minVerification: "VERIFIED" },
      effect: "HOLD" as PolicyEffect,
      effectPayload: { reasonCode: "VERIFY_IDENTITY", holdReason: "Complete identity verification before first payout." },
    },
    {
      key: "payout_release_fraud",
      name: "Payout release – fraud score",
      ruleType: "RELEASE_CONDITION" as PolicyRuleType,
      conditions: { maxFraudScore: 0.6 },
      effect: "HOLD" as PolicyEffect,
      effectPayload: { reasonCode: "FRAUD_REVIEW", holdReason: "Payout under review." },
    },
    {
      key: "booking_confirm_fraud",
      name: "Booking confirm – fraud threshold",
      ruleType: "AUTO_BLOCK" as PolicyRuleType,
      conditions: { maxFraudScore: 0.8 },
      effect: "DENY" as PolicyEffect,
      effectPayload: { reasonCode: "FRAUD_BLOCK" },
    },
    {
      key: "review_eligibility_completed_stay",
      name: "Review – completed stay only",
      ruleType: "REVIEW_ELIGIBILITY" as PolicyRuleType,
      conditions: { requireCompletedStay: true },
      effect: "DENY" as PolicyEffect,
      effectPayload: { reasonCode: "STAY_NOT_COMPLETED" },
    },
    {
      key: "listing_live_min_info",
      name: "Listing live – minimum info",
      ruleType: "VISIBILITY" as PolicyRuleType,
      conditions: { hasMinInfo: true },
      effect: "DENY" as PolicyEffect,
      effectPayload: { reasonCode: "MIN_INFO_REQUIRED" },
    },
    {
      key: "listing_live_verification",
      name: "Listing live – verification (optional)",
      ruleType: "VISIBILITY" as PolicyRuleType,
      conditions: {},
      effect: "ALLOW" as PolicyEffect,
      effectPayload: {},
    },
  ];
  for (const r of defaults) {
    await prisma.policyRule.upsert({
      where: { key: r.key },
      create: {
        key: r.key,
        name: r.name,
        ruleType: r.ruleType,
        conditions: r.conditions as object,
        effect: r.effect,
        effectPayload: (r.effectPayload as object) ?? undefined,
      },
      update: {},
    });
  }
}

/** Get all active policy rules. */
export async function getAllPolicyRules() {
  return prisma.policyRule.findMany({
    where: { active: true },
    orderBy: { key: "asc" },
  });
}

/** Create or update a policy rule (admin). */
export async function upsertPolicyRule(data: {
  key: string;
  name: string;
  description?: string;
  ruleType: PolicyRuleType;
  scope?: string;
  scopeValue?: string;
  conditions: object;
  effect: PolicyEffect;
  effectPayload?: object;
  active?: boolean;
  updatedBy?: string;
}) {
  const existing = await prisma.policyRule.findUnique({ where: { key: data.key } });
  const version = (existing?.version ?? 0) + 1;
  return prisma.policyRule.upsert({
    where: { key: data.key },
    create: {
      key: data.key,
      name: data.name,
      description: data.description,
      ruleType: data.ruleType,
      scope: data.scope ?? "GLOBAL",
      scopeValue: data.scopeValue,
      conditions: data.conditions,
      effect: data.effect,
      effectPayload: (data.effectPayload as object) ?? undefined,
      version,
      active: data.active ?? true,
      updatedBy: data.updatedBy,
    },
    update: {
      name: data.name,
      description: data.description,
      ruleType: data.ruleType,
      scope: data.scope,
      scopeValue: data.scopeValue,
      conditions: data.conditions as object,
      effect: data.effect,
      effectPayload: (data.effectPayload as object) ?? undefined,
      version,
      active: data.active ?? existing?.active ?? true,
      updatedBy: data.updatedBy,
    },
  });
}

/** Get policy decision log (for audit/debug). */
export async function getPolicyDecisionLog(params: {
  ruleKey?: string;
  entityType?: string;
  entityId?: string;
  since?: Date;
  limit?: number;
}) {
  const where: Prisma.PolicyDecisionLogWhereInput = {};
  if (params.ruleKey) where.ruleKey = params.ruleKey;
  if (params.entityType) where.entityType = params.entityType;
  if (params.entityId) where.entityId = params.entityId;
  if (params.since) where.evaluatedAt = { gte: params.since };
  return prisma.policyDecisionLog.findMany({
    where,
    orderBy: { evaluatedAt: "desc" },
    take: params.limit ?? 100,
  });
}
