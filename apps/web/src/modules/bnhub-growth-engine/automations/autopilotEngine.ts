import { ListingStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { evaluateLaunchPolicy } from "../policies/growthPolicyService";
import {
  createGrowthCampaignDraft,
  generateAssetsForCampaign,
  launchCampaign,
} from "../services/growthCampaignService";
import { appendGrowthAuditLog } from "../services/growthAuditService";
import { ingestLeadFromConnector, type NormalizedLeadInput } from "../services/leadEngineService";
import { getGrowthConnectorAdapter } from "../connectors/registry";
import { assertAutonomyAllowedForHost, assertHostDailyBudgetHeadroom } from "../services/growthSafetyService";
import { listingEligibleForGrowthAutopilot } from "../services/listingReadinessService";
import {
  applySafeOptimizationActions,
  generateOptimizationActions,
  syncPublishedDistributionMetrics,
} from "../services/optimizationService";

/** @deprecated use listingEligibleForGrowthAutopilot */
export async function listingEligibleForAutopilot(listingId: string): Promise<boolean> {
  return listingEligibleForGrowthAutopilot(listingId);
}

export async function autoLaunchJob(listingId: string, hostUserId: string, autonomy: "SUPERVISED_AUTOPILOT" | "FULL_AUTOPILOT") {
  const ok = await listingEligibleForGrowthAutopilot(listingId);
  if (!ok) {
    await appendGrowthAuditLog({
      actorType: "AI",
      entityType: "bnhub_listing",
      entityId: listingId,
      actionType: "autolaunch_skipped",
      actionSummary: "Readiness / status threshold not met",
    });
    return null;
  }
  const policy = await evaluateLaunchPolicy(listingId);
  if (!policy.allowed) {
    await appendGrowthAuditLog({
      actorType: "AI",
      entityType: "bnhub_listing",
      entityId: listingId,
      actionType: "autolaunch_policy_block",
      actionSummary: policy.reasons.join("; "),
    });
    return null;
  }

  const existing = await prisma.bnhubGrowthCampaign.findFirst({
    where: { listingId, status: { in: ["ACTIVE", "SCHEDULED", "READY"] } },
  });
  if (existing) return existing;

  await assertAutonomyAllowedForHost(hostUserId, autonomy);

  const camp = await createGrowthCampaignDraft({
    listingId,
    hostUserId,
    createdBy: hostUserId,
    campaignName: `Autopilot — ${listingId.slice(0, 8)}`,
    campaignType: "LISTING_PROMO",
    objective: "BOOKING_CONVERSION",
    autonomyLevel: autonomy,
  });
  await generateAssetsForCampaign(camp.id);
  await assertHostDailyBudgetHeadroom({
    hostUserId,
    activatingCampaignId: camp.id,
    campaignBudgetDailyCents: camp.budgetDailyCents,
    wasAlreadyActive: false,
  });
  await launchCampaign(camp.id, {
    adminApprovedExternal: autonomy === "FULL_AUTOPILOT",
    confirmIrreversibleExternal: autonomy === "FULL_AUTOPILOT",
    skipLaunchCooldown: true,
  });
  return prisma.bnhubGrowthCampaign.findUnique({ where: { id: camp.id } });
}

export async function dailyOptimizationJob() {
  const { paused } = await applySafeOptimizationActions();
  await generateOptimizationActions();
  const { synced } = await syncPublishedDistributionMetrics(30);
  return { paused, metricsSynced: synced };
}

export async function leadResponseJob(leadId: string) {
  const lead = await prisma.bnhubLead.findUnique({
    where: { id: leadId },
    include: { listing: true },
  });
  if (!lead) return;
  if (lead.status === "SPAM" || lead.spamScore >= 60) return;
  if (!lead.listingId && !lead.campaignId) return;
  const hot = lead.leadTemperature === "HOT" && lead.spamScore < 40;
  const due = lead.responseDueAt ? ` SLA target: ${lead.responseDueAt.toISOString()}` : "";
  await prisma.bnhubGrowthEngineRecommendation.create({
    data: {
      listingId: lead.listingId,
      campaignId: lead.campaignId,
      recommendationType: "WHATSAPP_FOLLOWUP",
      priority: hot ? "CRITICAL" : "MEDIUM",
      title: hot ? "Hot lead — respond now" : "Follow up with new lead",
      description: `Lead score ${lead.leadScore}.${due} WhatsApp templates pending connector.`,
      actionPayloadJson: { leadId },
    },
  });
  await appendGrowthAuditLog({
    actorType: "AI",
    entityType: "bnhub_lead",
    entityId: leadId,
    actionType: "lead_response_job",
    actionSummary: "Recommendation created for follow-up",
  });
}

export async function recoveryJob() {
  const conns = await prisma.bnhubGrowthConnector.findMany();
  for (const c of conns) {
    const adapter = getGrowthConnectorAdapter(c.connectorCode);
    if (!adapter) continue;
    await adapter.healthCheck();
    await prisma.bnhubGrowthConnector.update({
      where: { id: c.id },
      data: { lastHealthcheckAt: new Date() },
    });
  }
}

export async function dormantListingRevivalJob() {
  const listings = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: ListingStatus.PUBLISHED,
      verificationStatus: VerificationStatus.VERIFIED,
    },
    select: { id: true, ownerId: true },
    take: 20,
  });
  let drafts = 0;
  for (const l of listings) {
    const has = await prisma.bnhubGrowthCampaign.findFirst({
      where: {
        listingId: l.id,
        createdAt: { gte: new Date(Date.now() - 90 * 86400000) },
      },
    });
    if (has) continue;
    await prisma.bnhubGrowthEngineRecommendation.create({
      data: {
        listingId: l.id,
        recommendationType: "LAUNCH",
        priority: "LOW",
        title: "Relaunch opportunity",
        description: "No growth campaign in 90d — consider assisted launch.",
        actionPayloadJson: { listingId: l.id },
      },
    });
    drafts++;
  }
  return { suggestions: drafts };
}

export async function runConnectorHealthChecks() {
  await recoveryJob();
}

/** Webhook-normalized lead ingestion entry point. */
export async function ingestWebhookLead(payload: NormalizedLeadInput) {
  const lead = await ingestLeadFromConnector(payload, { skipDedup: false });
  await leadResponseJob(lead.id);
  return lead;
}

/** Idempotent scan: OPEN LAUNCH recommendations for eligible listings without active campaigns. */
export async function campaignLaunchScanJob(limit = 25): Promise<{ scanned: number; recommendations: number }> {
  const listings = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: ListingStatus.PUBLISHED,
      verificationStatus: VerificationStatus.VERIFIED,
    },
    select: { id: true },
    take: limit,
  });
  let recommendations = 0;
  for (const l of listings) {
    const eligible = await listingEligibleForGrowthAutopilot(l.id);
    if (!eligible) continue;
    const hasActive = await prisma.bnhubGrowthCampaign.findFirst({
      where: { listingId: l.id, status: { in: ["ACTIVE", "READY", "SCHEDULED", "AWAITING_APPROVAL"] } },
    });
    if (hasActive) continue;
    const exists = await prisma.bnhubGrowthEngineRecommendation.findFirst({
      where: {
        listingId: l.id,
        recommendationType: "LAUNCH",
        status: "OPEN",
      },
    });
    if (exists) continue;
    await prisma.bnhubGrowthEngineRecommendation.create({
      data: {
        listingId: l.id,
        recommendationType: "LAUNCH",
        priority: "LOW",
        title: "Eligible for growth launch",
        description: "Listing meets autopilot eligibility — host or admin can launch a campaign.",
        actionPayloadJson: { listingId: l.id },
      },
    });
    recommendations++;
    await appendGrowthAuditLog({
      actorType: "SYSTEM",
      entityType: "bnhub_listing",
      entityId: l.id,
      actionType: "launch_scan_recommendation",
      actionSummary: "Launch recommendation created",
    });
  }
  return { scanned: listings.length, recommendations };
}

export async function whatsappFollowupEngineJob(leadId: string) {
  const adapter = getGrowthConnectorAdapter("whatsapp_business");
  if (!adapter) {
    return { ok: false as const, summary: "WhatsApp adapter not registered" };
  }
  const r = await adapter.sendFollowup({ leadId });
  await appendGrowthAuditLog({
    actorType: "SYSTEM",
    entityType: "bnhub_lead",
    entityId: leadId,
    actionType: "whatsapp_followup_attempt",
    actionSummary: r.summary,
    afterJson: { ok: r.ok, setupRequired: r.setupRequired ?? false },
  });
  return r;
}
