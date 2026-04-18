import { prisma } from "@/lib/db";
import { legalIntelligenceFlags } from "@/config/feature-flags";
import type { AutonomyMode } from "../types/domain.types";
import type { ObservationSnapshot } from "../types/domain.types";
import type { ProposedAction } from "../types/domain.types";
import type { PolicyContext } from "../policy/policy-context";

export async function buildPolicyContext(input: {
  action: ProposedAction;
  observation: ObservationSnapshot;
  autonomyMode: AutonomyMode;
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

  if (action.target.type === "fsbo_listing" && action.target.id) {
    const listing = await prisma.fsboListing.findUnique({
      where: { id: action.target.id },
      select: {
        status: true,
        moderationStatus: true,
        featuredUntil: true,
      },
    });
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
  };
}
