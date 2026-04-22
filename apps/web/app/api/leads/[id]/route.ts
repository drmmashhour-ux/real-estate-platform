import { NextRequest } from "next/server";
import { LeadContactOrigin } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import {
  getDmAutomationSuggestions,
  getRecommendedAutomationAction,
} from "@/lib/automation/lead-automation-ui";
import { getLeadRevenueSnapshot } from "@/src/modules/revenue/revenueEngine";
import { canBrokerOrAdminAccessLead } from "@/lib/leads/can-access-lead";
import { getDealLegalTimeline } from "@/lib/deals/legal-timeline";
import { trackRevenueEvent } from "@/modules/revenue/revenue-events.service";
import {
  inferLeadIntentLabel,
  isLeadMonetizationV1Enabled,
  maskLeadDisplayName,
  redactLeadMessagePreview,
} from "@/modules/leads/lead-monetization.service";
import { recordLeadMonetizationView } from "@/modules/leads/lead-monetization-monitoring.service";
import { buildLeadQualitySummary } from "@/modules/leads/lead-quality.service";
import {
  dynamicPricingFlags,
  leadMonetizationControlFlags,
  leadPricingExperimentsFlags,
  leadPricingOverrideFlags,
  leadPricingResultsFlags,
  leadQualityFlags,
} from "@/config/feature-flags";
import { buildLeadMonetizationControlSummary } from "@/modules/leads/lead-monetization-control.service";
import { normalizeCrmLeadType } from "@/lib/leads/crm-constants";
import { extractEvaluationSnapshot } from "@/lib/leads/timeline-helpers";
import { computeLeadValueAndPrice } from "@/modules/revenue/lead-pricing.service";
import { getRevenueControlSettings } from "@/modules/revenue/revenue-control-settings";
import { computeLeadDemandLevel, computeLeadDemandScore } from "@/modules/leads/lead-demand.service";
import { computeBrokerInterestLevel, computeDynamicLeadPrice } from "@/modules/leads/dynamic-pricing.service";
import { buildLeadRoutingSummary } from "@/modules/broker/routing/broker-routing.service";
import type { DynamicPricingSuggestion } from "@/modules/leads/dynamic-pricing.types";
import {
  buildLeadPricingComparisonSummary,
  buildLeadPricingExperiments,
} from "@/modules/leads/lead-pricing-experiments.service";
import { resolveInternalLeadPricingDisplay } from "@/modules/leads/lead-pricing-display.service";
import { getActiveLeadPricingOverride } from "@/modules/leads/lead-pricing-override.service";
import { getLeadPricingResultsForAdmin } from "@/modules/leads/lead-pricing-results.service";
import { assertBrokerLeadPaidAccess } from "@/modules/monetization/broker-lead-access.service";

export const dynamic = "force-dynamic";

function enforceBrokerLeadPaywall(): boolean {
  return process.env.LECIPM_ENFORCE_BROKER_LEAD_PAYWALL?.trim() === "true";
}

/** GET: single lead (broker/admin) with CRM notes. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (id.startsWith("mem-")) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  const viewerId = await getGuestId();
  if (!viewerId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  if (viewer?.role !== "ADMIN" && viewer?.role !== "BROKER") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        introducedByBroker: { select: { id: true, name: true, email: true } },
        lastFollowUpByBroker: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, status: true, leadContactOrigin: true, commissionEligible: true } },
        ...(viewer.role === "ADMIN"
          ? { contactAuditEvents: { orderBy: { createdAt: "desc" as const }, take: 40 } }
          : {}),
        followUps: {
          orderBy: { createdAt: "desc" },
          take: 30,
          include: { broker: { select: { id: true, name: true, email: true } } },
        },
        crmInteractions: {
          orderBy: { createdAt: "desc" },
          take: 80,
          include: { broker: { select: { id: true, name: true, email: true } } },
        },
        automationTasks: {
          orderBy: [{ status: "asc" }, { dueAt: "asc" }],
          take: 40,
        },
        leadTasks: {
          orderBy: [{ status: "asc" }, { dueAt: "asc" }],
          take: 60,
        },
        _count: { select: { crmInteractions: true, leadTimelineEvents: true } },
      },
    });
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    if (!canBrokerOrAdminAccessLead(viewer.role, viewerId, lead)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const isAssignedBroker =
      viewer.role === "BROKER" && lead.introducedByBrokerId === viewerId;
    let brokerAssignedLeadPreview = false;
    let brokerLeadPurchase: {
      billingStatus: string | null;
      priceCad: number | null;
      brokerLeadId: string | null;
    } | null = null;

    if (isAssignedBroker) {
      const blRow = await prisma.brokerLead.findFirst({
        where: { leadId: id, brokerId: viewerId },
        select: { id: true, billingStatus: true, price: true },
      });
      brokerLeadPurchase = blRow
        ? {
            billingStatus: blRow.billingStatus,
            priceCad: blRow.price,
            brokerLeadId: blRow.id,
          }
        : null;

      const billing = await assertBrokerLeadPaidAccess(prisma, viewerId, id);
      if (!billing.ok && enforceBrokerLeadPaywall()) {
        return Response.json(
          {
            error: "Payment required for this assigned lead",
            code: "BROKER_LEAD_UNPAID",
            reason: billing.reason,
            brokerLeadPurchase,
          },
          { status: 402 },
        );
      }
      brokerAssignedLeadPreview = !billing.ok && !enforceBrokerLeadPaywall();
    }

    trackRevenueEvent({
      type: "lead_viewed",
      userId: viewerId,
      leadId: id,
      metadata: { source: "leads", context: "lead_detail_get" },
    });
    if (isLeadMonetizationV1Enabled()) {
      recordLeadMonetizationView();
    }
    if (lead.contactUnlockedAt) {
      trackRevenueEvent({
        type: "contact_revealed",
        userId: viewerId,
        leadId: id,
        metadata: { source: "leads", context: "lead_detail_get" },
      });
    }

    const revenueSnapshot = await getLeadRevenueSnapshot(id);
    const legalTimeline = lead.deal?.id ? await getDealLegalTimeline(lead.deal.id).catch(() => null) : null;

    const snapDeal = extractEvaluationSnapshot(lead.aiExplanation);
    const dealValueForQuality = lead.dealValue ?? snapDeal?.estimate ?? null;
    const leadQualityV1 = leadQualityFlags.leadQualityV1
      ? buildLeadQualitySummary(
          {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            message: lead.message,
            score: lead.score,
            engagementScore: lead.engagementScore,
            leadSource: lead.leadSource,
            leadType: lead.leadType ?? normalizeCrmLeadType(lead.leadSource),
            aiExplanation: lead.aiExplanation,
            purchaseRegion: lead.purchaseRegion,
            highIntent: lead.highIntent,
            dealValue: dealValueForQuality,
          },
          { recordMonitoring: true },
        )
      : undefined;

    const revenueSettings = await getRevenueControlSettings();
    const interactionTotal =
      (lead._count?.crmInteractions ?? 0) + (lead._count?.leadTimelineEvents ?? 0);

    let regionPeerLeadCount = 0;
    if (lead.purchaseRegion?.trim()) {
      const since = new Date(Date.now() - 30 * 86400000);
      regionPeerLeadCount = await prisma.lead.count({
        where: {
          purchaseRegion: lead.purchaseRegion,
          createdAt: { gte: since },
          NOT: { id: lead.id },
        },
      });
    }

    const needRoutingSignals =
      dynamicPricingFlags.dynamicPricingV1 ||
      (viewer.role === "ADMIN" && leadMonetizationControlFlags.monetizationControlV1);
    let routingFitCandidateCount: number | undefined;
    if (needRoutingSignals) {
      const routing = await buildLeadRoutingSummary(id).catch(() => null);
      if (routing) {
        routingFitCandidateCount = routing.topCandidates.filter(
          (c) => c.fitBand === "good" || c.fitBand === "strong",
        ).length;
      }
    }

    const leadPricing = computeLeadValueAndPrice(
      {
        message: lead.message,
        leadSource: lead.leadSource,
        leadType: lead.leadType,
        score: lead.score,
        engagementScore: lead.engagementScore,
        interactionCount: interactionTotal,
        hasCompleteContact: Boolean(lead.email?.trim() && lead.phone?.trim()),
      },
      {
        basePriceCents: lead.dynamicLeadPriceCents ?? undefined,
        minCents: revenueSettings.leadUnlockMinCents,
        maxCents: revenueSettings.leadUnlockMaxCents,
        defaultLeadPriceCents: revenueSettings.leadDefaultPriceCents,
      },
    );

    const demandSignals = {
      interactionCount: interactionTotal,
      engagementScore: lead.engagementScore,
      highIntent: lead.highIntent,
      conversionProbability: lead.conversionProbability,
      regionPeerLeadCount,
      routingFitCandidateCount,
    };
    const demandLevel = computeLeadDemandLevel(demandSignals);
    const demandScore = computeLeadDemandScore(demandSignals);

    const brokerInterestLevel = computeBrokerInterestLevel({
      routingStrongOrGoodCount: routingFitCandidateCount,
      engagementScore: lead.engagementScore,
      highIntent: lead.highIntent,
      score: lead.score,
    });

    const qualityScoreForDynamic = leadQualityV1?.score ?? lead.score;
    const dynamicPricingV1 = dynamicPricingFlags.dynamicPricingV1
      ? computeDynamicLeadPrice({
          leadId: lead.id,
          basePrice: leadPricing.leadPrice,
          qualityScore: qualityScoreForDynamic,
          demandLevel,
          brokerInterestLevel,
          historicalConversion:
            lead.conversionProbability != null && Number.isFinite(lead.conversionProbability)
              ? lead.conversionProbability
              : undefined,
        })
      : undefined;

    const adminMonetizationBundle =
      viewer.role === "ADMIN" &&
      (leadMonetizationControlFlags.monetizationControlV1 ||
        leadPricingExperimentsFlags.leadPricingExperimentsV1 ||
        leadPricingOverrideFlags.leadPricingOverrideV1);

    const leadMonetizationControlV1 = adminMonetizationBundle
      ? buildLeadMonetizationControlSummary({
          leadId: lead.id,
          leadPricing,
          leadQuality: leadQualityV1,
          dynamicPricing: dynamicPricingV1,
          demandLevel,
          demandScore,
          brokerInterestLevel,
          interactionCount: interactionTotal,
          regionPeerLeadCount,
          conversionProbability: lead.conversionProbability,
        })
      : undefined;

    let activeLeadPricingOverride = null as Awaited<ReturnType<typeof getActiveLeadPricingOverride>>;
    if (
      viewer.role === "ADMIN" &&
      (leadPricingOverrideFlags.leadPricingOverrideV1 ||
        leadPricingExperimentsFlags.leadPricingExperimentsV1)
    ) {
      activeLeadPricingOverride = await getActiveLeadPricingOverride(lead.id);
    }

    const leadPricingComparisonV1 =
      viewer.role === "ADMIN" &&
      leadPricingExperimentsFlags.leadPricingExperimentsV1 &&
      leadMonetizationControlV1
        ? buildLeadPricingComparisonSummary({
            leadId: lead.id,
            monetization: leadMonetizationControlV1,
            experimentResults: buildLeadPricingExperiments({
              leadId: lead.id,
              basePrice: leadMonetizationControlV1.basePrice,
              monetization: leadMonetizationControlV1,
              quality: leadQualityV1,
              dynamic: dynamicPricingV1,
              historicalConversion: lead.conversionProbability,
            }),
            activeOverride: activeLeadPricingOverride,
          })
        : undefined;

    const leadPricingActiveOverrideV1 =
      viewer.role === "ADMIN" && leadPricingOverrideFlags.leadPricingOverrideV1
        ? activeLeadPricingOverride
        : undefined;

    const leadPricingInternalDisplayV1 =
      viewer.role === "ADMIN" && leadMonetizationControlV1
        ? resolveInternalLeadPricingDisplay({
            basePrice: leadMonetizationControlV1.basePrice,
            monetizationSuggestedPrice: leadMonetizationControlV1.suggestedPrice,
            activeOverride: activeLeadPricingOverride ?? undefined,
          })
        : undefined;

    const monetizationV1 = isLeadMonetizationV1Enabled();
    const locked = !lead.contactUnlockedAt;
    const previewContact = brokerAssignedLeadPreview || (monetizationV1 && locked);
    const displayName = previewContact ? maskLeadDisplayName(lead.name) : lead.name;
    const displayMessage = previewContact ? redactLeadMessagePreview(lead.message) : lead.message;

    const response = {
      ...lead,
      followUps: brokerAssignedLeadPreview ? [] : lead.followUps,
      crmInteractions: brokerAssignedLeadPreview ? [] : lead.crmInteractions,
      name: displayName,
      message: displayMessage,
      contactOriginLabel:
        lead.contactOrigin === LeadContactOrigin.IMMO_CONTACT
          ? "ImmoContact"
          : lead.contactOrigin === LeadContactOrigin.PLATFORM_BROKER
            ? "Platform broker"
            : lead.contactOrigin === LeadContactOrigin.DIRECT
              ? "Direct"
              : null,
      email: previewContact ? "[Locked]" : lead.email ?? null,
      phone: previewContact ? "[Locked]" : lead.phone ?? null,
      isLocked: previewContact || !lead.contactUnlockedAt,
      leadMonetizationV1: monetizationV1,
      accessLevel: brokerAssignedLeadPreview
        ? "broker_assigned_preview"
        : locked
          ? "preview"
          : "full",
      brokerAssignedLeadPreview,
      brokerLeadPurchase,
      intentLabel: inferLeadIntentLabel(lead),
      status: lead.pipelineStatus || lead.status,
      automation: {
        dmSuggestions: getDmAutomationSuggestions({
          dmStatus: lead.dmStatus,
          lastDmAt: lead.lastDmAt,
          pipelineStatus: lead.pipelineStatus,
        }),
        recommendedAction: getRecommendedAutomationAction({
          pipelineStatus: lead.pipelineStatus,
          highIntent: lead.highIntent,
          score: lead.score,
          meetingAt: lead.meetingAt,
          leadSource: lead.leadSource,
          lastContactedAt: lead.lastContactedAt,
        }),
      },
      revenuePotential: revenueSnapshot.openOpportunityValue,
      revenuePushActions: revenueSnapshot.pushActions,
      dealLegalTimeline: legalTimeline
        ? {
            dealId: legalTimeline.dealId,
            currentStage: legalTimeline.currentStage,
            stages: legalTimeline.stages,
            events: legalTimeline.events.map((event) => ({
              id: event.id,
              createdAt: event.createdAt.toISOString(),
              note: event.note,
              stage: event.stage,
            })),
          }
        : null,
      leadQualityV1,
      leadPricing,
      dynamicPricingV1,
      leadMonetizationControlV1,
      ...(viewer.role === "ADMIN"
        ? {
            leadPricingComparisonV1,
            leadPricingActiveOverrideV1,
            leadPricingInternalDisplayV1,
            leadPricingResultsV1,
          }
        : {}),
    };
    return Response.json(response);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch lead" }, { status: 500 });
  }
}
