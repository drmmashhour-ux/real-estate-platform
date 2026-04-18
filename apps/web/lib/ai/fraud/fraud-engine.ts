import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logManagerAction } from "@/lib/ai/logger";
import { recordAiHealthEvent } from "@/lib/ai/observability/health";
import type { FraudAssessment, FraudEntityType, FraudRiskLevel, FraudSignalHit } from "./fraud-types";
import { FRAUD_AUTOPILOT_SUPPRESSION_LEVELS } from "./fraud-types";
import { collectShortTermListingFraudSignals, type ShortTermListingFraudRawSignals } from "./fraud-signals";

export { FRAUD_AUTOPILOT_SUPPRESSION_LEVELS };
export type { FraudAssessment, FraudRiskLevel, FraudEntityType } from "./fraud-types";

/** Documented in docs/ai/FRAUD-DETECTION.md — deterministic weights (sum capped at 100). */
export const FRAUD_WEIGHTS = {
  sparseListing: 12,
  fewPhotos: 10,
  duplicateTitle: 18,
  perOpenFraudFlag: 15,
  openFraudFlagCap: 30,
  perOpenSafetyFlag: 10,
  openSafetyFlagCap: 20,
  perFailedVerification: 8,
  failedVerificationCap: 16,
  editWhileFlagged: 12,
  perHostOverride: 4,
  hostOverrideCap: 12,
  perTrustSafetyIncident: 10,
  trustSafetyCap: 20,
  duplicatePhone: 20,
  perFailedPayment: 8,
  failedPaymentCap: 24,
  repeatGuestBookings: 14,
  manyCancellations: 12,
  reviewBurst7d: 10,
  duplicateReviewBodies: 16,
} as const;

export const FRAUD_SCORE_THRESHOLDS = {
  /** Raised to reduce borderline MEDIUM noise (still logged; see health event policy below). */
  mediumMin: 42,
  highMin: 70,
} as const;

const FRAUD_SIGNAL_LABELS: Record<string, string> = {
  sparse_listing_copy: "Short title or description",
  few_photos: "Few photos",
  duplicate_title_other_accounts: "Duplicate title (other accounts)",
  open_bnhub_fraud_flags: "Open BNHUB fraud flags",
  open_bnhub_safety_flags: "Open BNHUB safety flags",
  failed_verification_steps_90d: "Failed verification steps (90d)",
  listing_edit_while_fraud_flag_open: "Edited listing while fraud flag open",
  host_manager_overrides_90d: "Host/manager overrides (90d)",
  trust_safety_incidents_90d: "Trust & safety incidents (90d)",
  duplicate_phone_other_users: "Phone number shared with other users",
  failed_payments_on_listing: "Failed payments on listing",
  high_repeat_guest_bookings_same_listing_90d: "High repeat guest bookings (same listing, 90d)",
  elevated_cancellations_90d: "Elevated cancellations (90d)",
  review_burst_7d: "Review burst (7d)",
  duplicate_review_bodies_on_listing: "Duplicate review text on listing",
};

/** Explicit: this module never performs bans, refunds, or listing removal. */
export const FRAUD_NO_AUTO_ENFORCEMENT = true as const;

function cap(n: number, max: number): number {
  return Math.min(n, max);
}

function levelFromScore(score: number): FraudRiskLevel {
  if (score >= FRAUD_SCORE_THRESHOLDS.highMin) return "HIGH";
  if (score >= FRAUD_SCORE_THRESHOLDS.mediumMin) return "MEDIUM";
  return "LOW";
}

/**
 * Deterministic score from raw platform signals (no external data).
 */
export function scoreShortTermListingFraud(raw: ShortTermListingFraudRawSignals): FraudAssessment {
  const hits: FraudSignalHit[] = [];

  if (raw.titleLen < 8 || raw.descLen < 40) {
    hits.push({ key: "sparse_listing_copy", weight: FRAUD_WEIGHTS.sparseListing });
  }
  if (raw.photoCount < 2) {
    hits.push({ key: "few_photos", weight: FRAUD_WEIGHTS.fewPhotos, detail: String(raw.photoCount) });
  }
  if (raw.duplicateTitleOtherOwners > 0) {
    hits.push({
      key: "duplicate_title_other_accounts",
      weight: FRAUD_WEIGHTS.duplicateTitle,
      detail: String(raw.duplicateTitleOtherOwners),
    });
  }
  if (raw.openBnhubFraudFlags > 0) {
    const w = cap(raw.openBnhubFraudFlags * FRAUD_WEIGHTS.perOpenFraudFlag, FRAUD_WEIGHTS.openFraudFlagCap);
    hits.push({ key: "open_bnhub_fraud_flags", weight: w, detail: String(raw.openBnhubFraudFlags) });
  }
  if (raw.openBnhubSafetyFlags > 0) {
    const w = cap(raw.openBnhubSafetyFlags * FRAUD_WEIGHTS.perOpenSafetyFlag, FRAUD_WEIGHTS.openSafetyFlagCap);
    hits.push({ key: "open_bnhub_safety_flags", weight: w, detail: String(raw.openBnhubSafetyFlags) });
  }
  if (raw.failedVerificationLogs90d > 0) {
    const w = cap(
      raw.failedVerificationLogs90d * FRAUD_WEIGHTS.perFailedVerification,
      FRAUD_WEIGHTS.failedVerificationCap,
    );
    hits.push({ key: "failed_verification_steps_90d", weight: w, detail: String(raw.failedVerificationLogs90d) });
  }
  if (raw.listingUpdatedAfterOpenFraudFlag) {
    hits.push({ key: "listing_edit_while_fraud_flag_open", weight: FRAUD_WEIGHTS.editWhileFlagged });
  }
  if (raw.hostManagerOverrides90d > 0) {
    const w = cap(raw.hostManagerOverrides90d * FRAUD_WEIGHTS.perHostOverride, FRAUD_WEIGHTS.hostOverrideCap);
    hits.push({ key: "host_manager_overrides_90d", weight: w, detail: String(raw.hostManagerOverrides90d) });
  }
  if (raw.hostTrustSafetyIncidents90d > 0) {
    const w = cap(
      raw.hostTrustSafetyIncidents90d * FRAUD_WEIGHTS.perTrustSafetyIncident,
      FRAUD_WEIGHTS.trustSafetyCap,
    );
    hits.push({ key: "trust_safety_incidents_90d", weight: w, detail: String(raw.hostTrustSafetyIncidents90d) });
  }
  if (raw.duplicatePhoneOtherUsers > 0) {
    hits.push({
      key: "duplicate_phone_other_users",
      weight: FRAUD_WEIGHTS.duplicatePhone,
      detail: String(raw.duplicatePhoneOtherUsers),
    });
  }
  if (raw.failedPaymentsOnListing > 0) {
    const w = cap(
      raw.failedPaymentsOnListing * FRAUD_WEIGHTS.perFailedPayment,
      FRAUD_WEIGHTS.failedPaymentCap,
    );
    hits.push({ key: "failed_payments_on_listing", weight: w, detail: String(raw.failedPaymentsOnListing) });
  }
  if (raw.maxGuestRepeatBookings90dSameListing >= 4) {
    hits.push({
      key: "high_repeat_guest_bookings_same_listing_90d",
      weight: FRAUD_WEIGHTS.repeatGuestBookings,
      detail: String(raw.maxGuestRepeatBookings90dSameListing),
    });
  }
  if (raw.cancelledBookings90dOnListing >= 4) {
    hits.push({
      key: "elevated_cancellations_90d",
      weight: FRAUD_WEIGHTS.manyCancellations,
      detail: String(raw.cancelledBookings90dOnListing),
    });
  }
  if (raw.reviewsOnListingLast7d >= 5) {
    hits.push({
      key: "review_burst_7d",
      weight: FRAUD_WEIGHTS.reviewBurst7d,
      detail: String(raw.reviewsOnListingLast7d),
    });
  }
  if (raw.duplicateReviewCommentBodiesOnListing) {
    hits.push({ key: "duplicate_review_bodies_on_listing", weight: FRAUD_WEIGHTS.duplicateReviewBodies });
  }

  const riskScore = Math.min(100, hits.reduce((s, h) => s + h.weight, 0));
  const riskLevel = levelFromScore(riskScore);
  const reasons = hits.map((h) => {
    const label = FRAUD_SIGNAL_LABELS[h.key] ?? h.key.replace(/_/g, " ");
    return h.detail ? `${label} (${h.detail})` : `${label} (+${h.weight})`;
  });

  return {
    entityType: "short_term_listing",
    entityId: raw.listingId,
    riskLevel,
    riskScore,
    reasons,
    signalHits: hits,
  };
}

export function planFraudSafeActions(riskLevel: FraudRiskLevel): {
  appendRiskLog: boolean;
  emitAdminHealthEvent: boolean;
  emitOverrideRequired: boolean;
  /** When true, host autopilot skips aggressive optimization for the entity. */
  reduceAutopilotAggression: boolean;
} {
  return {
    appendRiskLog: true,
    /** HIGH only — MEDIUM remains in DB + manager logs; reduces alert fatigue. */
    emitAdminHealthEvent: riskLevel === "HIGH",
    emitOverrideRequired: riskLevel === "HIGH",
    reduceAutopilotAggression: FRAUD_AUTOPILOT_SUPPRESSION_LEVELS.includes(riskLevel),
  };
}

async function recentHealthAlertForEntity(entityId: string, hours = 24): Promise<boolean> {
  const since = new Date(Date.now() - hours * 3600000);
  const hit = await prisma.managerAiHealthEvent.findFirst({
    where: {
      source: "bnhub_fraud_detection",
      createdAt: { gte: since },
      payload: { path: ["entityId"], equals: entityId },
    },
    select: { id: true },
  });
  return Boolean(hit);
}

async function recentOverrideForListing(listingId: string, hours = 48): Promise<boolean> {
  const since = new Date(Date.now() - hours * 3600000);
  const rows = await prisma.managerAiOverrideEvent.findMany({
    where: {
      scope: "bnhub_fraud_review_required",
      createdAt: { gte: since },
    },
    select: { targetJson: true },
    take: 40,
  });
  return rows.some((r) => {
    const j = r.targetJson as { listingId?: string } | null;
    return j?.listingId === listingId;
  });
}

/**
 * Persists audit log and optional admin signals. Never bans, deletes, or refunds.
 */
export async function persistBnhubListingFraudAssessment(assessment: FraudAssessment): Promise<void> {
  void FRAUD_NO_AUTO_ENFORCEMENT;
  const plan = planFraudSafeActions(assessment.riskLevel);

  const payload = {
    signalHits: assessment.signalHits,
    plan,
  } as Prisma.InputJsonValue;

  await prisma.aiFraudRiskLog.create({
    data: {
      entityType: assessment.entityType,
      entityId: assessment.entityId,
      riskLevel: assessment.riskLevel,
      riskScore: assessment.riskScore,
      reasons: assessment.reasons,
      payload,
      status: "open",
    },
  });

  await logManagerAction({
    userId: null,
    actionKey: "bnhub_fraud_risk_eval",
    targetEntityType: assessment.entityType,
    targetEntityId: assessment.entityId,
    status: "executed",
    payload: {
      riskLevel: assessment.riskLevel,
      riskScore: assessment.riskScore,
      reasons: assessment.reasons,
      fraudEngine: "bnhub_deterministic_v1",
    },
  });

  if (plan.emitAdminHealthEvent && !(await recentHealthAlertForEntity(assessment.entityId))) {
    await recordAiHealthEvent({
      level: assessment.riskLevel === "HIGH" ? "error" : "warn",
      source: "bnhub_fraud_detection",
      message: `BNHUB fraud risk ${assessment.riskLevel} for ${assessment.entityType} ${assessment.entityId} (score ${assessment.riskScore}). Review only — no automatic enforcement.`,
      payload: {
        entityId: assessment.entityId,
        entityType: assessment.entityType,
        riskLevel: assessment.riskLevel,
        riskScore: assessment.riskScore,
        reasons: assessment.reasons.slice(0, 12),
      },
    });
  }

  if (plan.emitOverrideRequired && !(await recentOverrideForListing(assessment.entityId))) {
    const listing = await prisma.shortTermListing.findUnique({
      where: { id: assessment.entityId },
      select: { ownerId: true },
    });
    if (listing) {
      await prisma.managerAiOverrideEvent.create({
        data: {
          actorUserId: listing.ownerId,
          scope: "bnhub_fraud_review_required",
          targetJson: {
            listingId: assessment.entityId,
            hostUserId: listing.ownerId,
            riskLevel: assessment.riskLevel,
            riskScore: assessment.riskScore,
          } as object,
          note: "High fraud risk score — manual review recommended. No automatic ban or listing removal.",
        },
      });
    }
  }
}

/**
 * Latest open fraud log suppresses aggressive autopilot for this listing (MEDIUM/HIGH).
 */
export async function shouldSuppressAggressiveAutopilotForListing(listingId: string): Promise<boolean> {
  const since = new Date(Date.now() - 14 * 86400000);
  const row = await prisma.aiFraudRiskLog.findFirst({
    where: {
      entityType: "short_term_listing",
      entityId: listingId,
      status: "open",
      riskLevel: { in: [...FRAUD_AUTOPILOT_SUPPRESSION_LEVELS] },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return Boolean(row);
}

export async function runBnhubFraudScanForListing(listingId: string): Promise<FraudAssessment | null> {
  const raw = await collectShortTermListingFraudSignals(prisma, listingId);
  if (!raw) return null;
  const assessment = scoreShortTermListingFraud(raw);

  const last = await prisma.aiFraudRiskLog.findFirst({
    where: { entityType: "short_term_listing", entityId: listingId },
    orderBy: { createdAt: "desc" },
  });
  const sixHoursMs = 6 * 3600000;
  if (last && Date.now() - last.createdAt.getTime() < sixHoursMs) {
    if (
      last.riskLevel === assessment.riskLevel &&
      Math.abs(last.riskScore - assessment.riskScore) < 8
    ) {
      return assessment;
    }
  }

  await persistBnhubListingFraudAssessment(assessment);
  return assessment;
}

/**
 * Scheduled host scan — bounded batch of published listings for this host.
 */
export async function runBnhubFraudScheduledScanForHost(hostId: string): Promise<void> {
  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: hostId, listingStatus: "PUBLISHED" },
    select: { id: true },
    take: 25,
  });
  for (const l of listings) {
    await runBnhubFraudScanForListing(l.id);
  }
}

export type { ShortTermListingFraudRawSignals } from "./fraud-signals";
export { collectShortTermListingFraudSignals } from "./fraud-signals";
