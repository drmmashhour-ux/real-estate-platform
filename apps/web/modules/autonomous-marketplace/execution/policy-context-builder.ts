import { prisma } from "@/lib/db";
import {
  complianceFlags,
  eventTimelineFlags,
  growthIntelligenceFlags,
  legalHubFlags,
  legalIntelligenceFlags,
  trustFlags,
} from "@/config/feature-flags";
import { getEventsByActor } from "@/modules/events/event.service";
import { deriveDocumentOutcomeRatio01 } from "@/modules/events/event-timeline.service";
import { computeTrustBadges } from "@/modules/trust/trust-badge.service";
import { computeTrustScore } from "@/modules/trust/trust-score.service";
import { computeLegalRecordComplianceGap01 } from "@/modules/legal/records/legal-record-preview.service";
import { legalRecordToImportedRow } from "@/modules/legal/records/legal-record-snapshot.helpers";
import { computeVisibilityImpact } from "@/modules/trust/trust-visibility.service";
import type { AutonomyMode } from "../types/domain.types";
import type { ObservationSnapshot } from "../types/domain.types";
import type { ProposedAction } from "../types/domain.types";
import type { GrowthSignal } from "@/modules/growth-intelligence/growth.types";
import type { PolicyContext } from "../policy/policy-context";

function filterGrowthTimelineSignals(signals: GrowthSignal[]): GrowthSignal[] {
  return signals.filter(
    (s) =>
      s.metadata?.timelineDerived === true ||
      s.signalType === "trend_reversal" ||
      s.signalType === "stalled_funnel" ||
      s.signalType === "repeat_dropoff_pattern",
  );
}

export async function buildPolicyContext(input: {
  action: ProposedAction;
  observation: ObservationSnapshot;
  autonomyMode: AutonomyMode;
  /** From autonomous engine — subject user for Legal Hub when not inferrable from target */
  createdByUserId?: string | null;
  /** Explicit Legal Hub bootstrap (HTTP routes) */
  legalHub?: {
    userId: string | null;
    locale: string;
    country: string;
    actorHint?: string | null;
    jurisdictionHint?: string | null;
  };
  /** When true, attach Growth Intelligence snapshot to policy context (feature-flagged). */
  attachGrowthIntelligenceContext?: boolean;
}): Promise<PolicyContext> {
  const { action, observation, autonomyMode } = input;

  let targetActive = true;
  let activePromotionCount = 0;
  let priceDeltaTodayPct = 0;
  let lastOutreachHours: number | undefined;
  let followUpAttempts: number | undefined;

  let legalIntelligenceSummary: PolicyContext["legalIntelligenceSummary"];
  let topLegalIntelligenceSignals: PolicyContext["topLegalIntelligenceSignals"];
  let legalReviewPriorityScore: PolicyContext["legalReviewPriorityScore"];

  let legalSummary: PolicyContext["legalSummary"];
  let legalReadinessScore: PolicyContext["legalReadinessScore"];

  let trustScore: PolicyContext["trustScore"];
  let trustBadges: PolicyContext["trustBadges"];
  let visibilityImpact: PolicyContext["visibilityImpact"];

  let growthSnapshot: PolicyContext["growthSnapshot"];
  let growthTimelineSignals: PolicyContext["growthTimelineSignals"];
  let growthSignals: PolicyContext["growthSignals"];
  let growthOpportunities: PolicyContext["growthOpportunities"];
  let topGrowthPrioritySummary: PolicyContext["topGrowthPrioritySummary"];

  let quebecCompliance: PolicyContext["quebecCompliance"];
  let propertyLegalRisk: PolicyContext["propertyLegalRisk"];

  let listingOwnerId: string | undefined;
  let listingCountryLower = "ca";

  if (action.target.type === "fsbo_listing" && action.target.id) {
    const listing = await prisma.fsboListing.findUnique({
      where: { id: action.target.id },
      select: {
        status: true,
        moderationStatus: true,
        featuredUntil: true,
        ownerId: true,
        country: true,
      },
    });
    listingOwnerId = listing?.ownerId;
    listingCountryLower = (listing?.country ?? "CA").toLowerCase();
    targetActive = listing?.status === "ACTIVE" && listing?.moderationStatus === "APPROVED";
    activePromotionCount =
      listing?.featuredUntil != null && listing.featuredUntil > new Date() ? 1 : 0;
  }

  if (action.target.type === "lead" && action.target.id) {
    const lead = await prisma.lead.findUnique({
      where: { id: action.target.id },
      select: { lastFollowUpAt: true, createdAt: true },
    });
    if (lead?.lastFollowUpAt) {
      lastOutreachHours = (Date.now() - lead.lastFollowUpAt.getTime()) / 3600000;
    }
    followUpAttempts = lead?.lastFollowUpAt ? 1 : 0;
  }

  if (
    legalIntelligenceFlags.legalIntelligenceV1 &&
    action.target.type === "fsbo_listing" &&
    action.target.id
  ) {
    try {
      const { getLegalIntelligenceBundle } = await import("@/modules/legal/legal-intelligence.service");
      const { computeLegalReviewPriorityScore } = await import("@/modules/legal/legal-review-priority.service");
      const bundle = await getLegalIntelligenceBundle({
        entityType: "fsbo_listing",
        entityId: action.target.id,
        actorType: "seller",
        workflowType: "fsbo_seller_documents",
      });
      legalIntelligenceSummary = bundle.summary;
      topLegalIntelligenceSignals = bundle.signals.slice(0, 8);
      if (legalIntelligenceFlags.legalReviewPriorityV1) {
        legalReviewPriorityScore = computeLegalReviewPriorityScore({
          criticalSignalCount: bundle.summary.countsBySeverity.critical,
          warningSignalCount: bundle.summary.countsBySeverity.warning,
          missingCriticalRequirements: 0,
          priorRejections: 0,
          submissionAgeHours: 0,
          workflowSensitivity: "medium",
          readinessScore: undefined,
          enforcementBlocking: false,
          downstreamBlocked: !targetActive,
        });
      }
    } catch {
      legalIntelligenceSummary = null;
      topLegalIntelligenceSignals = undefined;
      legalReviewPriorityScore = null;
    }
  }

  const resolvedLegalUserId =
    input.legalHub?.userId ?? input.createdByUserId ?? listingOwnerId ?? null;

  if (
    complianceFlags.quebecComplianceV1 &&
    action.target.type === "fsbo_listing" &&
    action.target.id
  ) {
    try {
      const { evaluateListingPublishComplianceDecision } = await import(
        "@/modules/legal/compliance/listing-publish-compliance.service"
      );
      const qc = await evaluateListingPublishComplianceDecision(action.target.id);
      if (qc.apply) {
        quebecCompliance = {
          readinessScore: qc.decision.readinessScore,
          allowed: qc.decision.allowed,
          blockingIssueIds: qc.decision.blockingIssues,
          reasonsPreview: qc.decision.reasons.slice(0, 14),
        };
      }
    } catch {
      quebecCompliance = null;
    }
  }

  if (
    complianceFlags.quebecListingComplianceV1 &&
    complianceFlags.propertyLegalRiskScoreV1 &&
    complianceFlags.quebecComplianceV1 &&
    action.target.type === "fsbo_listing" &&
    action.target.id
  ) {
    try {
      const { loadQuebecComplianceEvaluatorInput } = await import(
        "@/modules/legal/compliance/listing-publish-compliance.service"
      );
      const { evaluateQuebecListingCompliance } = await import(
        "@/modules/legal/compliance/quebec-listing-compliance-evaluator.service"
      );
      const { computePropertyLegalRiskScore } = await import("@/modules/legal/scoring/property-legal-risk-score.service");
      const inp = await loadQuebecComplianceEvaluatorInput(action.target.id);
      if (inp) {
        const ce = evaluateQuebecListingCompliance({ evaluatorInput: inp });
        const lr = computePropertyLegalRiskScore({
          listingId: action.target.id,
          complianceEvaluation: ce,
          manualReviewCompleted: false,
          identityVerifiedStrong:
            inp.listing.verificationIdentityStage === "VERIFIED" ||
            inp.listing.verificationIdentityStage === "APPROVED",
          ownershipRecordValidated: (inp.legalRecords ?? []).some(
            (r) => r.recordType === "proof_of_ownership" && r.status === "validated",
          ),
          rejectionCycles: inp.documentRejectionLoop ? 3 : 0,
        });
        propertyLegalRisk = { score: lr.score, level: lr.level, blocking: lr.blocking };
      }
    } catch {
      propertyLegalRisk = null;
    }
  }

  if (legalHubFlags.legalHubV1 && resolvedLegalUserId) {
    try {
      const { buildLegalHubContextFromDb } = await import("@/modules/legal/legal-context.service");
      const { buildLegalHubSummary } = await import("@/modules/legal/legal-state.service");
      const { computeLegalReadinessScore } = await import("@/modules/legal/legal-readiness.service");

      const locale = input.legalHub?.locale ?? "en";
      const country = input.legalHub?.country ?? listingCountryLower;
      const jurisdictionHint =
        input.legalHub?.jurisdictionHint ??
        (country.toLowerCase() === "ca" ? "QC" : null);

      const legalCtx = await buildLegalHubContextFromDb({
        userId: resolvedLegalUserId,
        locale,
        country,
        actorHint: input.legalHub?.actorHint ?? undefined,
        jurisdictionHint,
      });
      const summary = buildLegalHubSummary(legalCtx);
      legalSummary = summary;
      legalReadinessScore = legalHubFlags.legalReadinessV1 ? computeLegalReadinessScore(summary) : null;
    } catch {
      legalSummary = null;
      legalReadinessScore = null;
    }
  }

  if ((trustFlags.trustScoringV1 || trustFlags.trustBadgesV1) && resolvedLegalUserId) {
    try {
      const u = await prisma.user.findUnique({
        where: { id: resolvedLegalUserId },
        select: {
          createdAt: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          stripeOnboardingComplete: true,
          brokerVerifications: {
            orderBy: { updatedAt: "desc" },
            take: 1,
            select: { verificationStatus: true },
          },
        },
      });
      const ageDays =
        u != null ? Math.max(0, (Date.now() - u.createdAt.getTime()) / 86400000) : undefined;
      let timelineDocumentOutcome01: number | null = null;
      if (eventTimelineFlags.eventTimelineV1 && resolvedLegalUserId) {
        try {
          const ev = await getEventsByActor(resolvedLegalUserId);
          timelineDocumentOutcome01 = deriveDocumentOutcomeRatio01(ev);
        } catch {
          timelineDocumentOutcome01 = null;
        }
      }

      let legalRecordComplianceGap01: number | null = null;
      if (legalHubFlags.legalRecordImportV1 && action.target.type === "fsbo_listing" && action.target.id) {
        try {
          const lrRows = await prisma.legalRecord.findMany({
            where: { entityType: "fsbo_listing", entityId: action.target.id },
            select: { id: true, recordType: true, status: true, parsedData: true, validation: true },
            take: 120,
          });
          const imported = lrRows.map(legalRecordToImportedRow);
          let missingTotal = 0;
          let inconsistentTotal = 0;
          let criticalRulesTotal = 0;
          for (const row of imported) {
            missingTotal += row.missingFieldCount;
            inconsistentTotal += row.inconsistentFieldCount;
            criticalRulesTotal += row.criticalRuleCount;
          }
          legalRecordComplianceGap01 =
            imported.length === 0 ?
              null
            : computeLegalRecordComplianceGap01({
                missingTotal,
                inconsistentTotal,
                criticalRulesTotal,
                recordCount: imported.length,
              });
        } catch {
          legalRecordComplianceGap01 = null;
        }
      }

      trustScore = computeTrustScore({
        legalReadinessScore: legalReadinessScore ?? undefined,
        legalIntelligenceSummary: legalIntelligenceSummary ?? undefined,
        accountAgeDays: ageDays,
        timelineDocumentOutcome01,
        legalRecordComplianceGap01,
        quebecComplianceReadinessScore: quebecCompliance?.readinessScore ?? null,
        propertyLegalRiskScore: propertyLegalRisk?.score ?? null,
        verificationFlags: u
          ? {
              emailVerified: u.emailVerifiedAt != null,
              phoneVerified: u.phoneVerifiedAt != null,
              stripeOnboardingComplete: u.stripeOnboardingComplete === true,
              brokerLicenseVerified: u.brokerVerifications[0]?.verificationStatus === "VERIFIED",
            }
          : undefined,
      });
      visibilityImpact = computeVisibilityImpact(trustScore);
      if (trustFlags.trustBadgesV1 && legalSummary) {
        const persona =
          legalSummary.actorType === "buyer"
            ? "buyer"
            : legalSummary.actorType === "broker"
              ? "broker"
              : legalSummary.actorType === "host"
                ? "host"
                : "seller";
        trustBadges = computeTrustBadges(trustScore, legalSummary, legalIntelligenceSummary, {
          persona,
          legalReadiness: legalReadinessScore?.score ?? null,
          emailVerified: u?.emailVerifiedAt != null,
          phoneVerified: u?.phoneVerifiedAt != null,
          stripeOnboardingComplete: u?.stripeOnboardingComplete === true,
          brokerLicenseVerified: u?.brokerVerifications[0]?.verificationStatus === "VERIFIED",
        });
      }
    } catch {
      trustScore = null;
      trustBadges = null;
      visibilityImpact = null;
    }
  }

  if (
    growthIntelligenceFlags.growthIntelligenceV1 &&
    input.attachGrowthIntelligenceContext === true
  ) {
    try {
      const { buildGrowthSnapshot } = await import("@/modules/growth-intelligence/growth-snapshot-builder.service");
      const { runAllGrowthDetectors } = await import(
        "@/modules/growth-intelligence/detectors/growth-detector-registry"
      );
      const { summarizeGrowthSignals, buildGrowthOpportunities } = await import(
        "@/modules/growth-intelligence/growth-opportunity.service"
      );
      const { prioritizeGrowthOpportunities } = await import("@/modules/growth-intelligence/growth-priority.service");
      const loc = input.legalHub?.locale ?? "en";
      const snap = await buildGrowthSnapshot({
        locale: loc,
        country: listingCountryLower,
      });
      const rawSignals = runAllGrowthDetectors(snap);
      const summarized = summarizeGrowthSignals({ snapshot: snap, signals: rawSignals });
      const opps = buildGrowthOpportunities({ snapshot: snap, signals: summarized.signals });
      const prioritized = prioritizeGrowthOpportunities(opps);
      const { buildGrowthPrioritySummary } = await import("@/modules/growth-intelligence/growth-priority.service");
      growthSnapshot = snap;
      growthSignals = summarized.signals;
      growthTimelineSignals = filterGrowthTimelineSignals(summarized.signals);
      growthOpportunities = prioritized;
      topGrowthPrioritySummary = buildGrowthPrioritySummary(prioritized);
    } catch {
      growthSnapshot = null;
      growthTimelineSignals = null;
      growthSignals = null;
      growthOpportunities = null;
      topGrowthPrioritySummary = null;
    }
  }

  return {
    action,
    observation,
    autonomyMode,
    targetActive,
    activePromotionCount,
    priceDeltaTodayPct,
    lastOutreachHours,
    followUpAttempts,
    legalIntelligenceSummary,
    topLegalIntelligenceSignals,
    legalReviewPriorityScore,
    legalSummary,
    legalReadinessScore,
    trustScore,
    trustBadges,
    visibilityImpact,
    growthSnapshot,
    growthTimelineSignals,
    growthSignals,
    growthOpportunities,
    topGrowthPrioritySummary,
    quebecCompliance,
    propertyLegalRisk,
  };
}
