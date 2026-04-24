import type {
  LecipmDisputeCaseEntityType,
  LecipmTrustEngineTargetType,
  PrismaClient,
  VerificationStatus,
} from "@prisma/client";

import type { OperationalTrustInputs, TrustFactorInput } from "./trust-score.types";

/** Stable ids for audit logs, tests, and weight tuning references. */
export const TRUST_FACTOR_IDS = {
  complianceGate: "compliance_gate_complete",
  documentationCompleteness: "documentation_completeness",
  listingQualityNumeric: "listing_quality_numeric",
  disputePredictionFriction: "dispute_prediction_friction",
  disputeCaseExposure: "dispute_case_exposure",
  brokerLicenceSignal: "broker_licence_signal",
  brokerVerificationGate: "broker_verification_gate",
  bookingConfirmationHygiene: "booking_confirmation_hygiene",
  bookingIssueFriction: "booking_issue_friction",
  hostResponsivenessProxy: "host_responsiveness_proxy",
  dealDocumentDepth: "deal_document_depth",
  dealStageClarity: "deal_stage_clarity",
  insuranceCoverageProxy: "insurance_coverage_proxy",
  territoryThinAggregate: "territory_thin_aggregate",
} as const;

function normFromScore100(score: number): number {
  return clamp((score - 50) / 50, -1, 1);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function verificationRatio(statuses: VerificationStatus[]): number {
  if (!statuses.length) return 0;
  const ok = statuses.filter((s) => s === "VERIFIED").length;
  return ok / statuses.length;
}

async function latestDisputePrediction(
  db: PrismaClient,
  entityType: LecipmDisputeCaseEntityType,
  entityId: string,
) {
  return db.lecipmDisputePredictionSnapshot.findFirst({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Aggregate operational inputs from platform signals — transparently heuristic where warehouse joins are incomplete.
 */
export async function aggregateOperationalTrustInputs(
  db: PrismaClient,
  targetType: LecipmTrustEngineTargetType,
  targetId: string,
): Promise<OperationalTrustInputs> {
  const factors: TrustFactorInput[] = [];
  const warnings: string[] = [];
  const thinDataNotes: string[] = [];

  switch (targetType) {
    case "LISTING":
      await appendListingFactors(db, targetId, factors, warnings, thinDataNotes);
      break;
    case "BOOKING":
      await appendBookingFactors(db, targetId, factors, warnings, thinDataNotes);
      break;
    case "DEAL":
      await appendDealFactors(db, targetId, factors, warnings, thinDataNotes);
      break;
    case "BROKER":
      await appendBrokerFactors(db, targetId, factors, warnings, thinDataNotes);
      break;
    case "TERRITORY":
      appendTerritoryStubFactors(targetId, factors, thinDataNotes);
      break;
    default:
      thinDataNotes.push("Unknown target type — thin operational view.");
  }

  return {
    targetType,
    targetId,
    factors,
    warnings,
    thinDataNotes,
  };
}

async function appendListingFactors(
  db: PrismaClient,
  listingId: string,
  factors: TrustFactorInput[],
  warnings: string[],
  thinDataNotes: string[],
) {
  const listing = await db.fsboListing.findUnique({
    where: { id: listingId },
    include: { verification: true },
  });
  if (!listing) {
    thinDataNotes.push("Listing record not found — score reflects missing inventory only.");
    return;
  }

  const docCount = await db.fsboListingDocument.count({ where: { fsboListingId: listingId } }).catch(() => 0);

  const gateStatuses = listing.verification
    ? [
        listing.verification.identityStatus,
        listing.verification.cadasterStatus,
        listing.verification.addressStatus,
        listing.verification.sellerDeclarationStatus,
        listing.verification.disclosuresStatus,
      ]
    : [];
  const gateRatio = verificationRatio(gateStatuses);
  factors.push({
    id: TRUST_FACTOR_IDS.complianceGate,
    group: "COMPLIANCE_DOCUMENTATION",
    normalized: clamp(gateRatio * 2 - 1, -1, 1),
    rawNote: `Compliance checkpoints approximated from verification gates (${Math.round(gateRatio * 100)}% verified).`,
  });

  factors.push({
    id: TRUST_FACTOR_IDS.documentationCompleteness,
    group: "COMPLIANCE_DOCUMENTATION",
    normalized: normFromScore100(Math.min(100, docCount * 14 + (listing.trustScore ?? 40) * 0.25)),
    rawNote: `Documentation depth proxy (${docCount} docs on file; blends listing quality signals).`,
  });

  const tq = listing.trustScore ?? null;
  if (tq != null) {
    factors.push({
      id: TRUST_FACTOR_IDS.listingQualityNumeric,
      group: "LISTING_DEAL_QUALITY",
      normalized: normFromScore100(tq),
      rawNote: `Listing quality / numeric trust table blended into operational context (${tq}/100).`,
    });
  } else {
    thinDataNotes.push("Listing numeric trust score absent — weight on assistant outputs reduced.");
  }

  const disputeCases = await db.lecipmDisputeCase.count({
    where: { relatedEntityType: "LISTING", relatedEntityId: listingId },
  });
  factors.push({
    id: TRUST_FACTOR_IDS.disputeCaseExposure,
    group: "DISPUTE_FRICTION",
    normalized: clamp(-disputeCases / 4, -1, 0),
    rawNote: `Structured dispute cases referencing this listing (${disputeCases}) — counts are operational, not fault findings.`,
  });

  const pred = await latestDisputePrediction(db, "LISTING", listingId);
  if (pred) {
    factors.push({
      id: TRUST_FACTOR_IDS.disputePredictionFriction,
      group: "DISPUTE_FRICTION",
      normalized: normFromScore100(100 - pred.disputeRiskScore),
      rawNote: `Dispute prediction snapshot (${pred.disputeRiskScore}/100 friction; band ${pred.riskBand}).`,
    });
  } else {
    thinDataNotes.push("No recent dispute-prediction snapshot — friction blend uses disputes table only.");
  }

  if (listing.moderationStatus === "PENDING") {
    warnings.push("Listing moderation still pending — visibility controls may apply separately.");
  }
}

async function appendBookingFactors(
  db: PrismaClient,
  bookingId: string,
  factors: TrustFactorInput[],
  warnings: string[],
  thinDataNotes: string[],
) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      confirmationCode: true,
      guestConfirmationEmailSentAt: true,
      bnhubHostAvgBookingResponseMs: true,
      canceledAt: true,
    },
  });
  if (!booking) {
    thinDataNotes.push("Booking record not found.");
    return;
  }

  const confirmationOk = Boolean(booking.confirmationCode && booking.guestConfirmationEmailSentAt);
  factors.push({
    id: TRUST_FACTOR_IDS.bookingConfirmationHygiene,
    group: "BOOKING_NOSHOW",
    normalized: confirmationOk ? 0.55 : -0.35,
    rawNote: confirmationOk
      ? "Confirmation artifacts present — operational hygiene signal."
      : "Confirmation artifacts incomplete — tighten templates and reminders.",
  });

  const issueCount = await db.bookingIssue.count({ where: { bookingId } }).catch(() => 0);
  factors.push({
    id: TRUST_FACTOR_IDS.bookingIssueFriction,
    group: "DISPUTE_FRICTION",
    normalized: clamp(-issueCount / 5, -1, 0),
    rawNote: `Recorded booking issues (${issueCount}) — informational workload signal.`,
  });

  const ms = booking.bnhubHostAvgBookingResponseMs;
  if (ms != null && ms > 0) {
    const slow = ms > 36 * 60 * 1000;
    factors.push({
      id: TRUST_FACTOR_IDS.hostResponsivenessProxy,
      group: "RESPONSIVENESS_RELIABILITY",
      normalized: slow ? -0.55 : 0.35,
      rawNote: `Observed host response latency (~${Math.round(ms / 60000)} min median) — coaching-friendly signal.`,
    });
  } else {
    thinDataNotes.push("Host response latency samples sparse — responsiveness factor muted.");
  }

  const pred = await latestDisputePrediction(db, "BOOKING", bookingId);
  if (pred) {
    factors.push({
      id: TRUST_FACTOR_IDS.disputePredictionFriction,
      group: "DISPUTE_FRICTION",
      normalized: normFromScore100(100 - pred.disputeRiskScore),
      rawNote: `Dispute prediction risk (${pred.disputeRiskScore}/100).`,
    });
  }

  if (booking.status === "CANCELLED" && booking.canceledAt) {
    warnings.push("Booking cancelled — interpret operational signals with lifecycle context.");
  }
}

async function appendDealFactors(
  db: PrismaClient,
  dealId: string,
  factors: TrustFactorInput[],
  warnings: string[],
  thinDataNotes: string[],
) {
  const deal = await db.deal.findUnique({
    where: { id: dealId },
    include: { documents: true },
  });
  if (!deal) {
    thinDataNotes.push("Deal record not found.");
    return;
  }

  const docScore = Math.min(100, deal.documents.length * 12 + 20);
  factors.push({
    id: TRUST_FACTOR_IDS.dealDocumentDepth,
    group: "COMPLIANCE_DOCUMENTATION",
    normalized: normFromScore100(docScore),
    rawNote: `Deal documentation footprint (${deal.documents.length} documents on file).`,
  });

  const stage = (deal.crmStage ?? deal.status ?? "").toLowerCase();
  const clarity = stage.includes("cancel") ? -0.6 : stage.includes("close") ? 0.55 : 0.1;
  factors.push({
    id: TRUST_FACTOR_IDS.dealStageClarity,
    group: "LISTING_DEAL_QUALITY",
    normalized: clamp(clarity, -1, 1),
    rawNote: `Pipeline posture proxy (${deal.crmStage ?? deal.status}).`,
  });

  const pred = await latestDisputePrediction(db, "DEAL", dealId);
  if (pred) {
    factors.push({
      id: TRUST_FACTOR_IDS.disputePredictionFriction,
      group: "DISPUTE_FRICTION",
      normalized: normFromScore100(100 - pred.disputeRiskScore),
      rawNote: `Deal-centric dispute prediction (${pred.disputeRiskScore}/100).`,
    });
  }

  const disputes = await db.lecipmDisputeCase.count({
    where: { relatedEntityType: "DEAL", relatedEntityId: dealId },
  });
  factors.push({
    id: TRUST_FACTOR_IDS.disputeCaseExposure,
    group: "DISPUTE_FRICTION",
    normalized: clamp(-disputes / 3, -1, 0),
    rawNote: `Structured disputes referencing deal (${disputes}).`,
  });

  if (deal.possibleBypassFlag) {
    warnings.push("Deal flagged for possible intake bypass — compliance review queue may apply.");
  }
}

async function appendBrokerFactors(
  db: PrismaClient,
  brokerUserId: string,
  factors: TrustFactorInput[],
  warnings: string[],
  thinDataNotes: string[],
) {
  const [verification, licence, listings, deals, disputesAgainst] = await Promise.all([
    db.brokerVerification.findUnique({ where: { userId: brokerUserId } }),
    db.lecipmBrokerLicenceProfile.findUnique({ where: { userId: brokerUserId } }),
    db.fsboListing.count({
      where: { ownerId: brokerUserId, listingOwnerType: "BROKER" },
    }),
    db.deal.count({ where: { brokerId: brokerUserId } }),
    db.lecipmDisputeCase.count({ where: { againstUserId: brokerUserId } }),
  ]);

  const verified = verification?.verificationStatus === "VERIFIED";
  factors.push({
    id: TRUST_FACTOR_IDS.brokerVerificationGate,
    group: "COMPLIANCE_DOCUMENTATION",
    normalized: verified ? 0.65 : -0.25,
    rawNote: verified
      ? "Broker verification gate satisfied on file."
      : "Broker verification still pending — operational follow-up recommended.",
  });

  const licenceOk = licence?.licenceStatus === "active";
  factors.push({
    id: TRUST_FACTOR_IDS.brokerLicenceSignal,
    group: "COMPLIANCE_DOCUMENTATION",
    normalized: licenceOk ? 0.45 : licence?.licenceStatus === "inactive" ? -0.55 : 0,
    rawNote: licence
      ? `Licence capsule status ${licence.licenceStatus} — regulatory truth remains broker responsibility.`
      : "Licence capsule missing — operational reminder only.",
  });

  const activityMix = Math.min(100, listings * 4 + deals * 6);
  factors.push({
    id: TRUST_FACTOR_IDS.listingQualityNumeric,
    group: "LISTING_DEAL_QUALITY",
    normalized: normFromScore100(activityMix),
    rawNote: `Inventory / deal activity footprint (${listings} broker listings, ${deals} deals).`,
  });

  factors.push({
    id: TRUST_FACTOR_IDS.disputeCaseExposure,
    group: "DISPUTE_FRICTION",
    normalized: clamp(-disputesAgainst / 5, -1, 0),
    rawNote: `Structured disputes where broker is named (${disputesAgainst}) — not a fault determination.`,
  });

  const lastCheck = await db.lecipmLicenceCheck.findFirst({
    where: { brokerId: brokerUserId },
    orderBy: { checkedAt: "desc" },
  });
  if (lastCheck) {
    factors.push({
      id: TRUST_FACTOR_IDS.insuranceCoverageProxy,
      group: "INSURANCE_COVERAGE",
      normalized: lastCheck.isValid && lastCheck.scopeValid ? 0.4 : -0.25,
      rawNote: `Latest licence scope check valid=${lastCheck.isValid}, scope=${lastCheck.scopeValid}.`,
    });
  } else {
    thinDataNotes.push("No licence scope checks on file — insurance coverage proxy muted.");
  }

  if (!listings && !deals) {
    thinDataNotes.push("Low observable broker workload — band may be variance-heavy.");
  }
}

function appendTerritoryStubFactors(territoryKey: string, factors: TrustFactorInput[], thinDataNotes: string[]) {
  void territoryKey;
  thinDataNotes.push("Territory summaries aggregate child entities — v1 uses lightweight stub inputs.");
  factors.push({
    id: TRUST_FACTOR_IDS.territoryThinAggregate,
    group: "LISTING_DEAL_QUALITY",
    normalized: 0,
    rawNote: "Territory aggregate pending richer child rollups — neutral placeholder.",
  });
}
