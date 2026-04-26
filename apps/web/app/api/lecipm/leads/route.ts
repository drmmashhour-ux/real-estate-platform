import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { scoreLead } from "@/lib/ai/lead-scoring";
import { mergeFormAndBehaviorScore } from "@/lib/ai/behavior-scoring";
import { tierFromScore } from "@/lib/ai/lead-tier";
import { enrichLeadForBrokerDashboard } from "@/lib/ai/merge-lead-display";
import {
  recordHotLeadAlert,
  recordWarmFollowUpIntent,
  recordColdNurtureIntent,
} from "@/lib/ai/automation-triggers";
import { scheduleRetentionTouchpointsForLead } from "@/lib/ai/lifecycle/retention-schedule";
import { logAiEvent } from "@/lib/ai/log";
import { resolveShortTermListingRef } from "@/lib/listing-code";
import { snapshotBnhubListingForLead } from "@/lib/leads/bnhub-listing-context";
import { bnhubListingPublicUrl } from "@/lib/email/notifications";
import {
  sendLeadNotificationToBroker,
  sendClientConfirmationEmail,
  sendLeadMeetingConfirmationToClient,
  sendBrokerDealWonNotification,
} from "@/lib/email/notifications";
import { runClosingAutomationById } from "@/lib/automation/closing-engine";
import { sendGrowthLeadFollowUpEmail } from "@/lib/growth/lead-nurture";
import { triggerAiFollowUpForLead } from "@/lib/ai/follow-up/orchestrator";
import { headers } from "next/headers";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import type { Prisma } from "@prisma/client";
import { LeadContactOrigin } from "@prisma/client";
import { normalizeCrmLeadType } from "@/lib/leads/crm-constants";
import { trackEvent } from "@/src/services/analytics";
import { onMessagingTriggerInquiry } from "@/src/modules/messaging/triggers";
import {
  appendLeadTimelineEvent,
  extractEvaluationSnapshot,
  extractLeadCity,
} from "@/lib/leads/timeline-helpers";
import { refreshLeadExecutionLayer } from "@/src/modules/crm/leadExecutionRefresh";
import { assertBrokerCanReceiveNewLead } from "@/modules/billing/brokerLeadBilling";
import { estimateBrokerCommissionDollars } from "@/lib/leads/commission";
import {
  defaultNextTouchForStage,
  normalizePipelineStage,
  toStoredPipelineStatus,
} from "@/lib/leads/pipeline-stage";
import { tierEmoji, recommendedActionsForLead } from "@/lib/ai/lead-tier";
import { getLeadAttributionFromRequest } from "@/lib/attribution/lead-attribution";
import { persistLaunchEvent } from "@/src/modules/launch/persistLaunchEvent";
import { playbookMemoryWriteService } from "@/modules/playbook-memory/services/playbook-memory-write.service";
import { assertImmoContactLegalForSession } from "@/lib/immo/immo-contact-legal-gate";
import {
  brokerDemoLeadStage,
  brokerDemoLeadStageLabel,
} from "@/lib/leads/broker-demo-lead-status";
import {
  automationOnDmReplied,
  automationOnMeetingScheduled,
  automationOnPipelineStageChange,
  dispatchAutomation,
} from "@/lib/automation/engine";
import { computeLeadValueAndPrice } from "@/modules/revenue/lead-pricing.service";
import { getRevenueControlSettings } from "@/modules/revenue/revenue-control-settings";
import {
  inferLeadIntentLabel,
  isLeadMonetizationV1Enabled,
  maskLeadDisplayName,
  redactLeadMessagePreview,
} from "@/modules/leads/lead-monetization.service";
import { buildLeadQualitySummary } from "@/modules/leads/lead-quality.service";
import { dynamicPricingFlags, leadQualityFlags } from "@/config/feature-flags";
import { computeLeadDemandLevel } from "@/modules/leads/lead-demand.service";
import { computeBrokerInterestLevel, computeDynamicLeadPrice } from "@/modules/leads/dynamic-pricing.service";
import { metricsLog } from "@/lib/metrics-log";
import { logLeadTagged } from "@/lib/server/launch-logger";
import { recordOutcome, predictedTierFromLeadScore } from "@/modules/outcomes/outcome.service";

export const dynamic = "force-dynamic";

type InMemoryLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  listingId: string | null;
  listingCode: string | null;
  projectId: string | null;
  status: string;
  score: number;
  temperature: "hot" | "warm" | "cold";
  explanation: string;
  createdAt: Date;
};

const leads: InMemoryLead[] = [];

export async function GET(req: Request) {
  try {
    const viewerId = await getGuestId();
    if (!viewerId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }
    const viewer = await prisma.user.findUnique({
      where: { id: viewerId },
      select: { role: true },
    });
    if (viewer?.role !== "ADMIN" && viewer?.role !== "BROKER") {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const statusFilter = searchParams.get("status")?.trim() ?? "";
    const band = searchParams.get("band")?.trim() ?? "";
    const cityFilter = searchParams.get("city")?.trim() ?? "";
    const leadType = searchParams.get("leadType")?.trim() ?? "";
    const from = searchParams.get("from")?.trim() ?? "";
    const to = searchParams.get("to")?.trim() ?? "";
    const minDealValueRaw = searchParams.get("minDealValue")?.trim() ?? "";
    const cityRegion = searchParams.get("cityRegion")?.trim() ?? "";
    const hotHighValue =
      searchParams.get("priority") === "hot_high_value" ||
      searchParams.get("filter") === "hot_high_value";

    const VALID_STATUS = new Set([
      "new",
      "contacted",
      "qualified",
      "follow_up",
      "meeting",
      "meeting_scheduled",
      "negotiation",
      "closing",
      "won",
      "lost",
    ]);

    const brokerOrAdminWhere: Prisma.LeadWhereInput =
      viewer?.role === "ADMIN"
        ? {}
        : {
            OR: [
              { introducedByBrokerId: viewerId },
              { lastFollowUpByBrokerId: viewerId },
              { leadSource: "evaluation_lead" },
              { leadSource: "broker_consultation" },
            ],
          };

    const andParts: Prisma.LeadWhereInput[] = [brokerOrAdminWhere];

    if (statusFilter && VALID_STATUS.has(statusFilter)) {
      if (statusFilter === "follow_up" || statusFilter === "contacted") {
        andParts.push({
          OR: [{ pipelineStatus: "follow_up" }, { pipelineStatus: "contacted" }],
        });
      } else if (statusFilter === "meeting" || statusFilter === "meeting_scheduled") {
        andParts.push({
          OR: [{ pipelineStatus: "meeting" }, { pipelineStatus: "meeting_scheduled" }],
        });
      } else {
        andParts.push({ pipelineStatus: toStoredPipelineStatus(statusFilter) });
      }
    }

    if (leadType === "evaluation_lead") {
      andParts.push({ leadSource: "evaluation_lead" });
    } else if (leadType === "broker_consultation") {
      andParts.push({ leadSource: "broker_consultation" });
    } else if (leadType === "fsbo_lead") {
      andParts.push({ leadSource: { contains: "fsbo", mode: "insensitive" } });
    } else if (leadType === "booking_lead") {
      andParts.push({
        OR: [
          { leadSource: { contains: "booking", mode: "insensitive" } },
          { leadSource: { contains: "bnhub", mode: "insensitive" } },
          { leadSource: { contains: "stay", mode: "insensitive" } },
        ],
      });
    } else if (leadType === "immo_contact") {
      andParts.push({ contactOrigin: LeadContactOrigin.IMMO_CONTACT });
    }

    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) andParts.push({ createdAt: { gte: d } });
    }
    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) andParts.push({ createdAt: { lte: d } });
    }

    if (q.length >= 2) {
      andParts.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { message: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    const where: Prisma.LeadWhereInput =
      andParts.length === 1 ? andParts[0]! : { AND: andParts };

    const revenueSettings = await getRevenueControlSettings();

    const dbLeads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        introducedByBroker: { select: { id: true, name: true, email: true } },
        lastFollowUpByBroker: { select: { id: true, name: true, email: true } },
        user: { select: { userCode: true } },
        fsboListing: { select: { id: true, listingCode: true, title: true } },
        deal: { select: { id: true, status: true } },
        crmConversation: { select: { id: true, updatedAt: true } },
        _count: { select: { crmInteractions: true, leadTimelineEvents: true } },
      },
    });

    let filtered = dbLeads;
    if (band === "hot") filtered = filtered.filter((l) => l.score >= 80);
    else if (band === "warm") filtered = filtered.filter((l) => l.score >= 50 && l.score < 80);
    else if (band === "cold") filtered = filtered.filter((l) => l.score < 50);

    if (hotHighValue) {
      filtered = filtered.filter((l) => {
        const snap = extractEvaluationSnapshot(l.aiExplanation);
        const v = l.dealValue ?? snap?.estimate ?? 0;
        return l.score >= 80 && v >= 500_000;
      });
    }

    const minDealParsed = parseInt(minDealValueRaw, 10);
    if (!Number.isNaN(minDealParsed) && minDealParsed > 0) {
      filtered = filtered.filter((l) => {
        const snap = extractEvaluationSnapshot(l.aiExplanation);
        const v = l.dealValue ?? snap?.estimate ?? 0;
        return v >= minDealParsed;
      });
    }

    if (cityRegion === "mtl_laval") {
      filtered = filtered.filter((l) => {
        const c = extractLeadCity({ aiExplanation: l.aiExplanation, message: l.message }).toLowerCase();
        return (
          c.includes("montreal") ||
          c.includes("montréal") ||
          c.includes("laval")
        );
      });
    }

    if (cityFilter.length > 0) {
      const lc = cityFilter.toLowerCase();
      filtered = filtered.filter((l) =>
        extractLeadCity({ aiExplanation: l.aiExplanation, message: l.message })
          .toLowerCase()
          .includes(lc)
      );
    }

    const cityKeyForLead = (l: (typeof filtered)[number]) =>
      extractLeadCity({ aiExplanation: l.aiExplanation, message: l.message }).toLowerCase().trim() || "unknown";
    const cityCounts = new Map<string, number>();
    for (const l of filtered) {
      const k = cityKeyForLead(l);
      cityCounts.set(k, (cityCounts.get(k) ?? 0) + 1);
    }

    const fromDb = await Promise.all(
      filtered.map(async (l) => {
        const snap = extractEvaluationSnapshot(l.aiExplanation);
        const tier = tierFromScore(l.score);
        const daysSinceCreated = (Date.now() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const ai =
          l.leadSource === "evaluation_lead"
            ? {
                score: l.score,
                temperature: tier,
                temperatureEmoji: tierEmoji(tier),
                explanation:
                  "Evaluation funnel — CRM score from market + property signals (+ engagement when tracked).",
                recommendedActions: recommendedActionsForLead({
                  tier,
                  daysSinceCreated,
                  lastFollowUpAt: l.lastFollowUpAt,
                }),
                aiMeta: { funnel: "evaluation" } as Record<string, unknown>,
              }
            : await enrichLeadForBrokerDashboard({
                id: l.id,
                email: l.email,
                score: l.score,
                createdAt: l.createdAt,
                lastFollowUpAt: l.lastFollowUpAt,
                userId: l.userId,
              });
        const snapEst = snap?.estimate ?? null;
        const dealValue = l.dealValue ?? snapEst;
        const commissionEstimate =
          l.commissionEstimate ?? estimateBrokerCommissionDollars(dealValue ?? null);
        const demoStage = brokerDemoLeadStage(l.pipelineStatus ?? l.status);
        const demoStageLabel = brokerDemoLeadStageLabel(demoStage);
        const messagesHref = l.platformConversationId
          ? `/dashboard/messages?conversationId=${encodeURIComponent(l.platformConversationId)}`
          : null;
        const leadPricing = computeLeadValueAndPrice(
          {
            message: l.message,
            leadSource: l.leadSource,
            leadType: l.leadType,
            score: l.score,
            engagementScore: l.engagementScore,
            interactionCount: l._count.crmInteractions + l._count.leadTimelineEvents,
            hasCompleteContact: Boolean(l.email?.trim() && l.phone?.trim()),
          },
          {
            basePriceCents: l.dynamicLeadPriceCents ?? undefined,
            minCents: revenueSettings.leadUnlockMinCents,
            maxCents: revenueSettings.leadUnlockMaxCents,
            defaultLeadPriceCents: revenueSettings.leadDefaultPriceCents,
          },
        );
        const monetizationV1 = isLeadMonetizationV1Enabled();
        const locked = !l.contactUnlockedAt;
        const displayName = monetizationV1 && locked ? maskLeadDisplayName(l.name) : l.name;
        const displayMessage = monetizationV1 && locked ? redactLeadMessagePreview(l.message) : l.message;
        const leadQualityV1 = leadQualityFlags.leadQualityV1
          ? buildLeadQualitySummary({
              id: l.id,
              name: l.name,
              email: l.email,
              phone: l.phone,
              message: l.message,
              score: l.score,
              engagementScore: l.engagementScore,
              leadSource: l.leadSource,
              leadType: l.leadType ?? normalizeCrmLeadType(l.leadSource),
              aiExplanation: l.aiExplanation,
              purchaseRegion: l.purchaseRegion,
              highIntent: l.highIntent,
              dealValue,
            })
          : undefined;

        const cityK = cityKeyForLead(l);
        const regionPeerLeadCount = Math.max(0, (cityCounts.get(cityK) ?? 1) - 1);
        const interactionTotal = l._count.crmInteractions + l._count.leadTimelineEvents;
        const demandLevel = computeLeadDemandLevel({
          interactionCount: interactionTotal,
          engagementScore: l.engagementScore,
          highIntent: l.highIntent,
          conversionProbability: l.conversionProbability,
          regionPeerLeadCount,
        });
        const brokerInterestLevel = computeBrokerInterestLevel({
          engagementScore: l.engagementScore,
          highIntent: l.highIntent,
          score: l.score,
        });
        const qualityScoreForDynamic = leadQualityV1?.score ?? l.score;
        const dynamicPricingV1 = dynamicPricingFlags.dynamicPricingV1
          ? computeDynamicLeadPrice({
              leadId: l.id,
              basePrice: leadPricing.leadPrice,
              qualityScore: qualityScoreForDynamic,
              demandLevel,
              brokerInterestLevel,
              historicalConversion:
                l.conversionProbability != null && Number.isFinite(l.conversionProbability)
                  ? l.conversionProbability
                  : undefined,
            })
          : undefined;

        return {
          id: l.id,
          name: displayName,
          email: l.contactUnlockedAt ? l.email : "[Locked]",
          phone: l.contactUnlockedAt ? l.phone : "[Locked]",
          message: displayMessage,
          listingId: l.listingId,
          listingCode: l.fsboListing?.listingCode ?? l.listingCode,
          projectId: l.projectId,
          contactOrigin: l.contactOrigin,
          fsboListingId: l.fsboListingId,
          buyerUserCode: l.user?.userCode ?? null,
          dealId: l.deal?.id ?? null,
          crmConversationId: l.crmConversation?.id ?? null,
          platformConversationId: l.platformConversationId,
          messagesHref,
          demoLeadStage: demoStage,
          demoLeadStageLabel: demoStageLabel,
          createdAtFormatted: l.createdAt.toISOString(),
          status: l.pipelineStatus || l.status,
          pipelineStatus: l.pipelineStatus,
          pipelineStage: normalizePipelineStage(l.pipelineStage ?? l.pipelineStatus),
          dealValue,
          commissionEstimate,
          commissionNote:
            "Estimated broker-side value from lead signals — finalize in deal / commission terms.",
          nextActionAt: l.nextActionAt,
          lastContactedAt: l.lastContactedAt,
          meetingAt: l.meetingAt,
          meetingCompleted: l.meetingCompleted,
          finalSalePrice: l.finalSalePrice,
          finalCommission: l.finalCommission,
          dealClosedAt: l.dealClosedAt,
          score: ai.score,
          temperature: ai.temperature,
          temperatureEmoji: ai.temperatureEmoji,
          explanation: ai.explanation,
          recommendedActions: ai.recommendedActions,
          aiMeta: ai.aiMeta,
          createdAt: l.createdAt,
          isLocked: !l.contactUnlockedAt,
          leadMonetizationV1: monetizationV1,
          accessLevel: locked ? ("preview" as const) : ("full" as const),
          intentLabel: inferLeadIntentLabel(l),
          leadPricing,
          revenueMonetizationEnabled: revenueSettings.monetizationEnabled,
          introducedByBroker: l.introducedByBroker ?? undefined,
          lastFollowUpByBroker: l.lastFollowUpByBroker ?? undefined,
          leadSource: l.leadSource,
          leadType: normalizeCrmLeadType(l.leadSource),
          city: snap?.city ?? extractLeadCity({ aiExplanation: l.aiExplanation, message: l.message }),
          propertyType: snap?.propertyType ?? null,
          estimatedValue: snap?.estimate ?? null,
          rangeMin: snap?.minValue ?? null,
          rangeMax: snap?.maxValue ?? null,
          nextFollowUpAt: l.nextFollowUpAt,
          reminderStatus: l.reminderStatus,
          launchSalesContacted: l.launchSalesContacted,
          launchLastContactDate: l.launchLastContactDate,
          launchNotes: l.launchNotes,
          leadQualityV1,
          dynamicPricingV1,
        };
      })
    );

    const mem = leads.map((l) => ({
      ...l,
      temperature: tierFromScore(l.score),
      isLocked: false,
      pipelineStatus: "new",
      pipelineStage: "new",
      dealValue: null,
      commissionEstimate: null,
      nextActionAt: null,
      lastContactedAt: null,
      meetingAt: null,
      meetingCompleted: false,
      finalSalePrice: null,
      finalCommission: null,
      dealClosedAt: null,
      leadType: "broker_consultation" as const,
      city: "",
      propertyType: null,
      estimatedValue: null,
      rangeMin: null,
      rangeMax: null,
      nextFollowUpAt: null,
      reminderStatus: null,
      launchSalesContacted: false,
      launchLastContactDate: null,
      launchNotes: null,
      leadSource: "legacy_memory",
    }));
    const merged = [...fromDb, ...mem].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return NextResponse.json(merged);
  } catch (e) {
    logLeadTagged.error("GET /api/lecipm/leads failed", {
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "anonymous";
  const limit = checkRateLimit(`public:leads:${ip}`, { windowMs: 60_000, max: 20 });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429, headers: getRateLimitHeaders(limit) });
  }
  const body = await req.json().catch(() => ({}));

  if (body && typeof body === "object" && (body as Record<string, unknown>).source === "launch_lead_capture") {
    const emailRaw = (body as Record<string, unknown>).email;
    const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    const phoneRaw = (body as Record<string, unknown>).phone;
    const phone =
      typeof phoneRaw === "string" ? phoneRaw.replace(/\s+/g, " ").trim().slice(0, 32) : "";
    const sessionUserId = await getGuestId();
    await persistLaunchEvent("CONTACT_BROKER", {
      email,
      source: "launch_capture",
      ...(phone ? { phone } : {}),
      ...(sessionUserId ? { userId: sessionUserId } : {}),
    });
    try {
      const b = body as Record<string, unknown>;
      // TODO: Downstream steps may pass `memoryRecordId` in internal request metadata to tie outcomes
      // (e.g. POST /api/playbook-memory/outcome) without exposing it on the public response body.
      const _launchPlaybookMemoryRecord = await playbookMemoryWriteService.recordDecision({
        source: "HUMAN",
        triggerEvent: "launch_lead_capture",
        actionType: "lead_capture_form_submit",
        context: {
          domain: "LEADS",
          entityType: "lead",
          market: {
            country: typeof b.country === "string" ? b.country : "ca",
          },
          segment: {
            source: "landing",
            leadType: "unknown",
          },
          signals: {
            hasPhone: Boolean(phone),
            locale: typeof b.locale === "string" ? b.locale : "en",
          },
        },
        actionPayload: {
          email,
          hasPhone: Boolean(phone),
        },
        objectiveSnapshot: {
          goal: "lead_conversion",
        },
        initialConfidence: 0.5,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[playbook]", "leads_integration_failed", e);
    }
    await prisma.waitlistUser
      .upsert({
        where: { email },
        create: { email, tags: ["launch_capture"] as Prisma.InputJsonValue },
        update: {},
      })
      .catch(() => {});
    return NextResponse.json({ ok: true });
  }

  const projectId = body.projectId != null ? String(body.projectId) : null;
  const listingId = body.listingId != null ? String(body.listingId) : null;

  try {
    const { score, temperature, explanation } = scoreLead({
      name: body.name,
      email: body.email,
      phone: body.phone,
      message: body.message,
    });

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { subscription: true },
      });
      const plan = project?.subscription?.plan ?? "free";
      const isPayPerLead = plan === "pay_per_lead";
      const contactUnlockedAt = isPayPerLead ? null : new Date();

      const introducedByBrokerId = body.introducedByBrokerId ?? (await getGuestId()) ?? undefined;
      let resolvedListingId: string | null | undefined = listingId ?? undefined;
      let resolvedListingCode: string | null = null;
      if (listingId) {
        const resolved = await resolveShortTermListingRef(listingId);
        if (resolved) {
          resolvedListingId = resolved.id;
          resolvedListingCode = resolved.listingCode;
        }
      }
      const listingNotifyUrl = bnhubListingPublicUrl(resolvedListingCode ?? resolvedListingId ?? null);
      const sessionUserId = await getGuestId();
      let linkedUserId: string | undefined;
      if (sessionUserId && body.email) {
        const self = await prisma.user.findUnique({
          where: { id: sessionUserId },
          select: { email: true },
        });
        if (self?.email?.toLowerCase() === String(body.email).toLowerCase()) {
          linkedUserId = sessionUserId;
        }
      }

      let finalScore = score;
      const formBreakdown = { score, temperature, explanation };
      let aiExplanation: Record<string, unknown> = { form: formBreakdown };
      if (linkedUserId) {
        const prof = await prisma.userAiProfile.findUnique({ where: { userId: linkedUserId } });
        if (prof && prof.behaviorLeadScore > 0) {
          const merged = mergeFormAndBehaviorScore(score, prof.behaviorLeadScore);
          finalScore = merged.merged;
          aiExplanation = {
            ...aiExplanation,
            behaviorLeadScore: prof.behaviorLeadScore,
            merged,
            weights: merged.weights,
          };
        }
      }

      const tierLabel = tierFromScore(finalScore);
      const leadSource =
        typeof body.leadSource === "string" ? body.leadSource.slice(0, 64) : "form";

      const dbLead = await prisma.lead.create({
        data: {
          name: body.name ?? "",
          email: body.email ?? "",
          phone: body.phone ?? "",
          message: body.message ?? "",
          projectId,
          listingId: resolvedListingId ?? listingId ?? undefined,
          listingCode: resolvedListingCode ?? undefined,
          status: "new",
          score: finalScore,
          userId: linkedUserId,
          aiExplanation: aiExplanation as object,
          contactUnlockedAt,
          introducedByBrokerId,
          leadSource,
          aiTier: tierLabel,
        },
      });

      metricsLog.funnel("lead_created", { leadSource, variant: "project_form" });
      logLeadTagged.info("lead created", {
        leadId: dbLead.id,
        leadSource,
        variant: "project_form",
        listingId: dbLead.listingId ?? null,
        outcomeHint: (() => {
          const p = predictedTierFromLeadScore(finalScore);
          return {
            capture: true,
            entityType: "lead" as const,
            entityId: dbLead.id,
            actionTaken: "lead_created",
            predictedOutcome: { tier: p.label, pConvert: p.pConvert },
            source: "log_hook" as const,
          };
        })(),
      });

      void trackEvent(
        "inquiry_sent",
        { leadId: dbLead.id, listingId: dbLead.listingId, leadSource },
        { userId: linkedUserId }
      ).catch(() => {});
      if (linkedUserId) void onMessagingTriggerInquiry(linkedUserId).catch(() => {});

      if (introducedByBrokerId && tierLabel === "hot") {
        await recordHotLeadAlert({
          brokerId: introducedByBrokerId,
          leadId: dbLead.id,
          mergedScore: finalScore,
        }).catch(() => {});
      }
      if (introducedByBrokerId && tierLabel === "warm") {
        await recordWarmFollowUpIntent({
          brokerId: introducedByBrokerId,
          leadId: dbLead.id,
        }).catch(() => {});
      }
      if (introducedByBrokerId && tierLabel === "cold") {
        await recordColdNurtureIntent({
          brokerId: introducedByBrokerId,
          leadId: dbLead.id,
        }).catch(() => {});
      }
      if (introducedByBrokerId) {
        await prisma.leadFollowUp.create({
          data: {
            leadId: dbLead.id,
            brokerId: introducedByBrokerId,
            activityType: "introduced",
            note: "Lead introduced by broker",
          },
        });
      }

      void refreshLeadExecutionLayer(dbLead.id).catch(() => {});

      const leadResponse = {
        id: dbLead.id,
        name: dbLead.name,
        email: dbLead.contactUnlockedAt ? dbLead.email : "[Locked]",
        phone: dbLead.contactUnlockedAt ? dbLead.phone : "[Locked]",
        message: dbLead.message,
        listingId: dbLead.listingId,
        listingCode: dbLead.listingCode,
        projectId: dbLead.projectId,
        status: dbLead.status,
        score: dbLead.score,
        temperature: tierFromScore(dbLead.score),
        explanation,
        createdAt: dbLead.createdAt,
        isLocked: isPayPerLead,
      };

      logAiEvent("lead_scored", { leadId: dbLead.id, score, temperature, projectId });

      await sendLeadNotificationToBroker({
        name: dbLead.name,
        email: dbLead.email,
        phone: dbLead.phone,
        message: dbLead.message,
        listingCode: dbLead.listingCode,
        listingUrl: listingNotifyUrl,
      });
      await sendClientConfirmationEmail(dbLead.email, dbLead.name);
      void sendGrowthLeadFollowUpEmail(dbLead.email, dbLead.name).catch(() => {});

      void dispatchAutomation("lead_created", { leadId: dbLead.id }).catch(() => {});

      void persistLaunchEvent("CONTACT_BROKER", {
        leadId: dbLead.id,
        projectId,
        listingId: dbLead.listingId,
        source: "lead_form_project",
        ...(linkedUserId ? { userId: linkedUserId } : {}),
      });

      return NextResponse.json(leadResponse);
    }

    let memoryListingId = listingId || null;
    let memoryListingCode: string | null = null;
    if (memoryListingId) {
      const snap = await snapshotBnhubListingForLead(memoryListingId);
      if (snap) {
        memoryListingId = snap.listingId;
        memoryListingCode = snap.listingCode;
      }
    }
    const memListingUrl = bnhubListingPublicUrl(memoryListingCode ?? memoryListingId ?? null);

    const introducedByBrokerId = body.introducedByBrokerId ?? (await getGuestId()) ?? undefined;
    const sessionUserId = await getGuestId();
    let linkedUserId: string | undefined;
    if (sessionUserId && body.email) {
      const self = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { email: true },
      });
      if (self?.email?.toLowerCase() === String(body.email).toLowerCase()) {
        linkedUserId = sessionUserId;
      }
    }

    let finalScore = score;
    const formBreakdown = { score, temperature, explanation };
    let aiExplanation: Record<string, unknown> = { form: formBreakdown };
    if (linkedUserId) {
      const prof = await prisma.userAiProfile.findUnique({ where: { userId: linkedUserId } });
      if (prof && prof.behaviorLeadScore > 0) {
        const merged = mergeFormAndBehaviorScore(score, prof.behaviorLeadScore);
        finalScore = merged.merged;
        aiExplanation = {
          ...aiExplanation,
          behaviorLeadScore: prof.behaviorLeadScore,
          merged,
          weights: merged.weights,
        };
      }
    }

    const tierLabel = tierFromScore(finalScore);
    const leadSource =
      typeof body.leadSource === "string" ? body.leadSource.slice(0, 64) : "listing_contact";
    const traffic = getLeadAttributionFromRequest(h.get("cookie"), body);

    if (introducedByBrokerId) {
      const gate = await assertBrokerCanReceiveNewLead(prisma, introducedByBrokerId);
      if (!gate.ok) {
        return NextResponse.json({ error: `broker_billing:${gate.reason}` }, { status: 403 });
      }
    }

    const dbLead = await prisma.lead.create({
      data: {
        name: body.name ?? "",
        email: body.email ?? "",
        phone: body.phone ?? "",
        message: body.message ?? "",
        projectId: null,
        listingId: memoryListingId ?? undefined,
        listingCode: memoryListingCode ?? undefined,
        status: "new",
        score: finalScore,
        userId: linkedUserId,
        aiExplanation: aiExplanation as object,
        contactUnlockedAt: new Date(),
        introducedByBrokerId,
        leadSource,
        aiTier: tierLabel,
        source: traffic.source,
        campaign: traffic.campaign,
        medium: traffic.medium,
      },
    });

    metricsLog.funnel("lead_created", {
      leadSource,
      variant: "listing_contact",
      trafficSource: traffic.source,
    });
    logLeadTagged.info("lead created", {
      leadId: dbLead.id,
      leadSource,
      variant: "listing_contact",
      listingId: dbLead.listingId ?? null,
    });

    void trackEvent(
      "inquiry_sent",
      { leadId: dbLead.id, listingId: dbLead.listingId, leadSource },
      { userId: linkedUserId }
    ).catch(() => {});
    if (linkedUserId) void onMessagingTriggerInquiry(linkedUserId).catch(() => {});

    if (introducedByBrokerId && tierLabel === "hot") {
      await recordHotLeadAlert({
        brokerId: introducedByBrokerId,
        leadId: dbLead.id,
        mergedScore: finalScore,
      }).catch(() => {});
    }
    if (introducedByBrokerId && tierLabel === "warm") {
      await recordWarmFollowUpIntent({
        brokerId: introducedByBrokerId,
        leadId: dbLead.id,
      }).catch(() => {});
    }
    if (introducedByBrokerId && tierLabel === "cold") {
      await recordColdNurtureIntent({
        brokerId: introducedByBrokerId,
        leadId: dbLead.id,
      }).catch(() => {});
    }
    if (introducedByBrokerId) {
      await prisma.leadFollowUp.create({
        data: {
          leadId: dbLead.id,
          brokerId: introducedByBrokerId,
          activityType: "introduced",
          note: "Lead introduced by broker",
        },
      });
    }

    void refreshLeadExecutionLayer(dbLead.id).catch(() => {});

    const leadResponse = {
      id: dbLead.id,
      name: dbLead.name,
      email: dbLead.email,
      phone: dbLead.phone,
      message: dbLead.message,
      listingId: dbLead.listingId,
      listingCode: dbLead.listingCode,
      projectId: dbLead.projectId,
      status: dbLead.status,
      score: dbLead.score,
      temperature: tierFromScore(dbLead.score),
      explanation,
      createdAt: dbLead.createdAt,
      isLocked: false,
    };

    logAiEvent("lead_scored", { leadId: dbLead.id, score, temperature, listingId: memoryListingId });

    await sendLeadNotificationToBroker({
      name: dbLead.name,
      email: dbLead.email,
      phone: dbLead.phone,
      message: dbLead.message,
      listingCode: memoryListingCode,
      listingUrl: memListingUrl,
    });
    await sendClientConfirmationEmail(dbLead.email, dbLead.name);
    void sendGrowthLeadFollowUpEmail(dbLead.email, dbLead.name).catch(() => {});

    void dispatchAutomation("lead_created", { leadId: dbLead.id }).catch(() => {});
    void runClosingAutomationById(dbLead.id).catch(() => {});

    void persistLaunchEvent("CONTACT_BROKER", {
      leadId: dbLead.id,
      listingId: dbLead.listingId,
      listingCode: dbLead.listingCode,
      source: "lead_form_listing",
      ...(linkedUserId ? { userId: linkedUserId } : {}),
    });

    return NextResponse.json(leadResponse);
  } catch (e) {
    console.error(e);
    if (projectId) {
      return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
    }
    let fallbackListingId = listingId || null;
    let fallbackCode: string | null = null;
    if (fallbackListingId) {
      const snap = await snapshotBnhubListingForLead(fallbackListingId).catch(() => null);
      if (snap) {
        fallbackListingId = snap.listingId;
        fallbackCode = snap.listingCode;
      }
    }
    const lead: InMemoryLead = {
      id: `mem-${Date.now()}`,
      name: body.name ?? "",
      email: body.email ?? "",
      phone: body.phone ?? "",
      message: body.message ?? "",
      listingId: fallbackListingId,
      listingCode: fallbackCode,
      projectId: projectId || null,
      status: "new",
      score: 50,
      temperature: "warm",
      explanation: "Lead saved; AI scoring was temporarily unavailable.",
      createdAt: new Date(),
    };
    leads.push(lead);
    return NextResponse.json({ ...lead, isLocked: false });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      id,
      status,
      pipelineStatus: pipelineBody,
      recordFollowUp,
      note,
      nextFollowUpAt,
      nextActionAt,
      reminderStatus,
      meetingAt,
      meetingCompleted,
      finalSalePrice,
      finalCommission,
      markDmSent,
      markDmReplied,
      dmTemplateKey,
      dmStatus: dmStatusBody,
      boostHighIntent,
      completeAutomationTaskId,
      launchSalesContacted,
      launchLastContactDate: launchLastContactDateBody,
      launchNotes: launchNotesBody,
      lostReason: lostReasonBody,
      postMeetingOutcome: postMeetingOutcomeBody,
      dealOutcomeNotes: dealOutcomeNotesBody,
      finalDealValue: finalDealValueBody,
      completeLeadTaskId,
    } = body;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    if (id.startsWith("mem-")) {
      const index = leads.findIndex((l) => l.id === id);
      if (index === -1) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }
      if (status) leads[index] = { ...leads[index], status };
      return NextResponse.json({ success: true });
    }
    const brokerId = await getGuestId();
    if (!brokerId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const prevPipeline = lead.pipelineStatus;
    const prevMeetingAt = lead.meetingAt ? lead.meetingAt.getTime() : null;

    const viewer = await prisma.user.findUnique({
      where: { id: brokerId },
      select: { role: true },
    });
    const isSharedPlatformLead =
      lead.leadSource === "evaluation_lead" || lead.leadSource === "broker_consultation";
    const canEdit =
      viewer?.role === "ADMIN" ||
      lead.introducedByBrokerId === brokerId ||
      lead.lastFollowUpByBrokerId === brokerId ||
      (viewer?.role === "BROKER" && isSharedPlatformLead);
    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (viewer?.role === "BROKER") {
      const collab = await assertImmoContactLegalForSession({
        brokerId,
        buyerUserId: null,
        requireBuyerAck: false,
      });
      if (!collab.ok) {
        return NextResponse.json(
          { error: collab.message, code: collab.code },
          { status: 403 }
        );
      }
    }

    const VALID_PIPELINE = new Set([
      "new",
      "contacted",
      "qualified",
      "follow_up",
      "meeting",
      "meeting_scheduled",
      "negotiation",
      "in_progress",
      "closing",
      "won",
      "lost",
      "closed",
    ]);
    const VALID_LOST_REASON = new Set(["price", "timing", "no_response", "competitor", "other"]);
    const VALID_POST_MEETING = new Set(["interested", "needs_follow_up", "ready_to_close"]);
    const pipelineInputRaw =
      typeof pipelineBody === "string" && pipelineBody.trim()
        ? pipelineBody.trim().toLowerCase()
        : typeof status === "string" && status.trim()
          ? status.trim().toLowerCase()
          : "";

    const updateData: Prisma.LeadUncheckedUpdateInput = {};
    let pipelineChangedTo: string | undefined;

    const VALID_DM = new Set(["none", "sent", "replied"]);
    const tpl =
      typeof dmTemplateKey === "string" ? dmTemplateKey.trim().slice(0, 32) : undefined;

    if (typeof launchSalesContacted === "boolean" && launchSalesContacted !== lead.launchSalesContacted) {
      updateData.launchSalesContacted = launchSalesContacted;
      if (launchSalesContacted) {
        updateData.launchLastContactDate = new Date();
        await appendLeadTimelineEvent(id, "launch_sales_contacted", { by: brokerId });
      }
    }
    if (launchLastContactDateBody !== undefined) {
      if (launchLastContactDateBody === null || launchLastContactDateBody === "") {
        updateData.launchLastContactDate = null;
      } else {
        const d = new Date(launchLastContactDateBody);
        if (!Number.isNaN(d.getTime())) updateData.launchLastContactDate = d;
      }
    }
    if (typeof launchNotesBody === "string") {
      const trimmed = launchNotesBody.trim().slice(0, 8000);
      updateData.launchNotes = trimmed.length > 0 ? trimmed : null;
      if (trimmed.length > 0) {
        await appendLeadTimelineEvent(id, "launch_notes_updated", { preview: trimmed.slice(0, 80) });
      }
    }

    if (boostHighIntent === true) {
      updateData.highIntent = true;
      await appendLeadTimelineEvent(id, "crm_high_intent_touch", { channel: "manual" });
    }

    if (markDmReplied === true) {
      updateData.dmStatus = "replied";
      updateData.highIntent = true;
      await appendLeadTimelineEvent(id, "dm_replied", {});
    } else if (markDmSent === true) {
      updateData.dmStatus = "sent";
      updateData.lastDmAt = new Date();
      await appendLeadTimelineEvent(id, "dm_sent", { template: tpl ?? "unknown" });
    } else if (typeof dmStatusBody === "string") {
      const d = dmStatusBody.toLowerCase().trim();
      if (VALID_DM.has(d)) {
        updateData.dmStatus = d;
        if (d === "sent") {
          updateData.lastDmAt = new Date();
        }
        if (d === "replied") {
          updateData.highIntent = true;
        }
      }
    }

    if (pipelineInputRaw) {
      const p = pipelineInputRaw === "closed" ? "won" : pipelineInputRaw;
      if (VALID_PIPELINE.has(p)) {
        const stored = toStoredPipelineStatus(p);
        updateData.pipelineStatus = stored;
        updateData.pipelineStage = normalizePipelineStage(stored);
        updateData.status = stored;
        if (stored !== lead.pipelineStatus) {
          pipelineChangedTo = stored;
          await appendLeadTimelineEvent(id, "status_changed", {
            to: stored,
            from: lead.pipelineStatus,
          });
          const now = new Date();
          const norm = normalizePipelineStage(stored);
          if (norm === "contacted") {
            updateData.lastContactAt = now;
            updateData.lastContactedAt = now;
            if (!lead.firstContactAt) {
              updateData.firstContactAt = now;
            }
          }
          if (norm === "qualified") {
            updateData.qualifiedAt = now;
          }
          if (norm === "meeting_scheduled") {
            updateData.meetingScheduledAt = now;
          }
          if (norm === "closing") {
            updateData.closingAt = now;
          }
          if (norm === "won") {
            updateData.wonAt = now;
          }
          if (norm === "lost") {
            updateData.lostAt = now;
          }
          const autoNext = defaultNextTouchForStage(stored);
          if (autoNext) {
            updateData.nextFollowUpAt = autoNext;
            updateData.nextActionAt = autoNext;
            updateData.reminderStatus = "pending";
          }
        }
      } else if (typeof status === "string" && status.trim()) {
        updateData.status = status;
      }
    }

    if (finalSalePrice != null && finalSalePrice !== "") {
      const n =
        typeof finalSalePrice === "number"
          ? finalSalePrice
          : parseInt(String(finalSalePrice).replace(/\D/g, ""), 10);
      if (Number.isFinite(n) && n > 0) {
        updateData.finalSalePrice = Math.round(n);
      }
    }
    if (finalCommission != null && finalCommission !== "") {
      const n =
        typeof finalCommission === "number"
          ? finalCommission
          : parseInt(String(finalCommission).replace(/\D/g, ""), 10);
      if (Number.isFinite(n) && n >= 0) {
        updateData.finalCommission = Math.round(n);
      }
    }
    if (typeof finalDealValueBody === "number" && Number.isFinite(finalDealValueBody) && finalDealValueBody > 0) {
      updateData.finalDealValue = Math.round(finalDealValueBody);
    }
    if (typeof lostReasonBody === "string" && VALID_LOST_REASON.has(lostReasonBody.trim().toLowerCase())) {
      updateData.lostReason = lostReasonBody.trim().toLowerCase();
    }
    if (
      typeof postMeetingOutcomeBody === "string" &&
      VALID_POST_MEETING.has(postMeetingOutcomeBody.trim().toLowerCase())
    ) {
      updateData.postMeetingOutcome = postMeetingOutcomeBody.trim().toLowerCase();
    }
    if (typeof dealOutcomeNotesBody === "string") {
      const n = dealOutcomeNotesBody.trim().slice(0, 8000);
      updateData.dealOutcomeNotes = n.length > 0 ? n : null;
    }

    if (recordFollowUp && brokerId) {
      updateData.lastFollowUpByBrokerId = brokerId;
      updateData.lastFollowUpAt = new Date();
      updateData.lastContactedAt = new Date();
      const touch = new Date();
      updateData.lastContactAt = touch;
      if (!lead.firstContactAt) {
        updateData.firstContactAt = touch;
      }
      await prisma.leadFollowUp.create({
        data: {
          leadId: id,
          brokerId,
          activityType: "follow_up",
          note: typeof note === "string" ? note : undefined,
        },
      });
    }

    if (nextFollowUpAt !== undefined) {
      if (nextFollowUpAt === null || nextFollowUpAt === "") {
        updateData.nextFollowUpAt = null;
        updateData.reminderStatus = null;
      } else {
        const d = new Date(nextFollowUpAt);
        if (!Number.isNaN(d.getTime())) {
          updateData.nextFollowUpAt = d;
          updateData.reminderStatus =
            typeof reminderStatus === "string" && reminderStatus.trim()
              ? reminderStatus.trim()
              : "pending";
          await appendLeadTimelineEvent(id, "follow_up_scheduled", { at: d.toISOString() });
        }
      }
    } else if (typeof reminderStatus === "string" && reminderStatus.trim()) {
      updateData.reminderStatus = reminderStatus.trim();
    }

    if (typeof note === "string" && note.trim() && brokerId && !recordFollowUp) {
      const trimmed = note.trim().slice(0, 8000);
      await prisma.crmInteraction.create({
        data: {
          leadId: id,
          brokerId,
          type: "note",
          body: trimmed,
        },
      });
      await appendLeadTimelineEvent(id, "note_added", { preview: trimmed.slice(0, 120) });
      void import("@/modules/user-intelligence/integrations/crm-user-intelligence").then((m) =>
        m.recordMarketplaceLeadNoteSignal(brokerId, { leadId: id }).catch(() => {}),
      );
    }

    if (meetingAt !== undefined) {
      if (meetingAt === null || meetingAt === "") {
        updateData.meetingAt = null;
      } else {
        const d = new Date(meetingAt);
        if (!Number.isNaN(d.getTime())) {
          updateData.meetingAt = d;
          if (prevMeetingAt == null) {
            updateData.meetingScheduledAt = new Date();
          }
        }
      }
    }
    if (typeof meetingCompleted === "boolean") {
      updateData.meetingCompleted = meetingCompleted;
    }

    if (typeof nextActionAt !== "undefined") {
      if (nextActionAt === null || nextActionAt === "") {
        updateData.nextActionAt = null;
      } else {
        const d = new Date(nextActionAt);
        if (!Number.isNaN(d.getTime())) {
          updateData.nextActionAt = d;
        }
      }
    }

    if (pipelineChangedTo === "won") {
      updateData.dealClosedAt = new Date();
      const snap = extractEvaluationSnapshot(lead.aiExplanation);
      const price =
        (typeof updateData.finalSalePrice === "number" ? updateData.finalSalePrice : null) ??
        lead.finalSalePrice ??
        lead.dealValue ??
        snap?.estimate ??
        null;
      if (price != null && price > 0 && updateData.finalCommission == null) {
        updateData.finalCommission = estimateBrokerCommissionDollars(price);
      }
      if (price != null && price > 0 && updateData.finalDealValue == null) {
        updateData.finalDealValue = price;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.lead.update({
        where: { id },
        data: updateData,
      });
    }

    if (pipelineChangedTo === "won" || pipelineChangedTo === "lost") {
      const pred = predictedTierFromLeadScore(lead.score);
      const conv = pipelineChangedTo === "won";
      const gap = Math.abs((conv ? 1 : 0) - pred.pConvert);
      const comparisonLabel = gap < 0.2 ? "match" : gap < 0.45 ? "partial" : "miss";
      void recordOutcome({
        entityType: "lead",
        entityId: id,
        actionTaken: pipelineChangedTo === "won" ? "pipeline_won" : "pipeline_lost",
        predictedOutcome: { tier: pred.label, pConvert: pred.pConvert },
        actualOutcome: { converted: conv, pipeline: pipelineChangedTo },
        source: "deal_intelligence",
        contextUserId: brokerId,
        comparisonLabel: comparisonLabel as "match" | "partial" | "miss",
      }).then((r) => {
        if (!r.ok) console.error("[lecipm][outcome] pipeline record failed", r);
      });
    }

    const tid =
      typeof completeAutomationTaskId === "string" ? completeAutomationTaskId.trim() : "";
    if (tid) {
      await prisma.leadAutomationTask
        .updateMany({
          where: { id: tid, leadId: id },
          data: { status: "done", completedAt: new Date() },
        })
        .catch(() => {});
    }

    const ltid = typeof completeLeadTaskId === "string" ? completeLeadTaskId.trim() : "";
    if (ltid) {
      await prisma.leadTask
        .updateMany({
          where: { id: ltid, leadId: id },
          data: { status: "done" },
        })
        .catch(() => {});
    }

    if (pipelineChangedTo != null && pipelineChangedTo !== prevPipeline) {
      void automationOnPipelineStageChange(id, pipelineChangedTo, prevPipeline).catch(() => {});
      if (brokerId) {
        void import("@/modules/user-intelligence/integrations/crm-user-intelligence").then((m) =>
          m
            .recordMarketplaceLeadPipelineSignal(brokerId, {
              leadId: id,
              fromStage: String(prevPipeline),
              toStage: String(pipelineChangedTo),
            })
            .catch(() => {}),
        );
      }
    }

    if (markDmReplied === true || updateData.dmStatus === "replied") {
      void automationOnDmReplied(id).catch(() => {});
    }

    const meetingAtResolved =
      updateData.meetingAt instanceof Date
        ? updateData.meetingAt
        : typeof updateData.meetingAt === "string"
          ? new Date(updateData.meetingAt)
          : undefined;
    const newMeetingTs =
      meetingAtResolved && !Number.isNaN(meetingAtResolved.getTime())
        ? meetingAtResolved.getTime()
        : null;
    if (
      newMeetingTs &&
      newMeetingTs !== prevMeetingAt &&
      !Number.isNaN(newMeetingTs)
    ) {
      void automationOnMeetingScheduled(id).catch(() => {});
    }

    const meetingForEmail =
      meetingAtResolved && !Number.isNaN(meetingAtResolved.getTime())
        ? meetingAtResolved
        : lead.meetingAt;
    if (
      newMeetingTs &&
      newMeetingTs !== prevMeetingAt &&
      meetingForEmail &&
      !Number.isNaN(meetingForEmail.getTime()) &&
      lead.contactUnlockedAt &&
      lead.email?.includes("@")
    ) {
      void sendLeadMeetingConfirmationToClient({
        clientEmail: lead.email,
        clientName: lead.name,
        meetingAt: meetingForEmail,
      }).catch(() => {});
    }

    void dispatchAutomation("lead_updated", { leadId: id }).catch(() => {});

    if (
      updateData.pipelineStatus === "won" &&
      prevPipeline !== "won"
    ) {
      const sale =
        (typeof updateData.finalSalePrice === "number" ? updateData.finalSalePrice : null) ??
        lead.finalSalePrice;
      const comm =
        (typeof updateData.finalCommission === "number" ? updateData.finalCommission : null) ??
        lead.finalCommission;
      void sendBrokerDealWonNotification({
        leadName: lead.name,
        finalSalePrice: sale,
        finalCommission: comm,
      }).catch(() => {});
    }

    if (pipelineChangedTo === "won" || status === "closed") {
      const ownerBroker = lead.introducedByBrokerId ?? lead.lastFollowUpByBrokerId ?? brokerId;
      const created = await scheduleRetentionTouchpointsForLead({
        leadId: id,
        brokerId: ownerBroker,
        closedAt: new Date(),
      });
      if (created > 0) {
        await prisma.crmInteraction.create({
          data: {
            leadId: id,
            brokerId,
            type: "ai_suggestion",
            body: `Scheduled ${created} post-close retention touchpoints (1w–12m). Review templates in CRM lifecycle dashboard.`,
            metadata: { automation: "retention_schedule_v1" },
          },
        });
      }
    }

    void runClosingAutomationById(id).catch(() => {});

    void refreshLeadExecutionLayer(id).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (e) {
    logLeadTagged.error("PATCH /api/lecipm/leads failed", {
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
