import {
  BnhubGrowthAssetFamily,
  BnhubGrowthAutonomyLevel,
  BnhubGrowthBudgetMode,
  BnhubGrowthCampaignObjective,
  BnhubGrowthCampaignStatus,
  BnhubGrowthCampaignType,
  BnhubGrowthDistributionStatus,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import {
  buildLaunchStrategySummary,
  generateAssetPack,
  type ListingGrowthInput,
  pickPrimaryAngle,
  suggestBudgetTierCents,
  suggestChannels,
} from "../ai/growthAIService";
import { evaluateLaunchPolicy } from "../policies/growthPolicyService";
import { appendGrowthAuditLog } from "./growthAuditService";
import { canLaunchPremiumMarketingCampaign } from "@/src/modules/bnhub-marketing/services/bnhubListingPromotionGates";
import type { ConnectorResult } from "../connectors/types";
import { getGrowthConnectorAdapter } from "../connectors/registry";
import {
  assertAutonomyAllowedForHost,
  assertHostDailyBudgetHeadroom,
  assertListingLaunchCooldown,
  assertNoSiblingActiveCampaign,
  getMaxPublishAttempts,
  getPublishLockBaseSeconds,
} from "./growthSafetyService";

function randomSlugPart() {
  return Math.random().toString(36).slice(2, 8);
}

export async function loadListingGrowthInput(listingId: string): Promise<ListingGrowthInput> {
  const l = await prisma.shortTermListing.findUniqueOrThrow({
    where: { id: listingId },
    select: {
      title: true,
      city: true,
      country: true,
      description: true,
      nightPriceCents: true,
      maxGuests: true,
      amenities: true,
      listingCode: true,
    },
  });
  return {
    title: l.title,
    city: l.city,
    country: l.country,
    description: l.description,
    nightPriceCents: l.nightPriceCents,
    maxGuests: l.maxGuests,
    amenities: l.amenities,
    listingCode: l.listingCode,
  };
}

export async function createGrowthCampaignDraft(params: {
  listingId: string;
  hostUserId: string;
  createdBy?: string | null;
  campaignName: string;
  campaignType: BnhubGrowthCampaignType;
  objective: BnhubGrowthCampaignObjective;
  autonomyLevel: BnhubGrowthAutonomyLevel;
}) {
  await assertAutonomyAllowedForHost(params.hostUserId, params.autonomyLevel);
  const policy = await evaluateLaunchPolicy(params.listingId);
  const input = await loadListingGrowthInput(params.listingId);
  const angle = pickPrimaryAngle(input);
  const { daily, total } = suggestBudgetTierCents(input.nightPriceCents);
  const summary = buildLaunchStrategySummary(
    input,
    params.campaignType,
    params.objective,
    params.autonomyLevel,
    "en"
  );
  const slugBase = input.listingCode.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const promoSlug = `p-${slugBase}-${randomSlugPart()}`;

  const camp = await prisma.bnhubGrowthCampaign.create({
    data: {
      listingId: params.listingId,
      hostUserId: params.hostUserId,
      createdBy: params.createdBy ?? params.hostUserId,
      campaignName: params.campaignName,
      campaignType: params.campaignType,
      objective: params.objective,
      autonomyLevel: params.autonomyLevel,
      status: BnhubGrowthCampaignStatus.DRAFT,
      primaryAngle: angle,
      targetCity: input.city,
      targetCountry: input.country,
      languageSetJson: ["en", "fr"],
      budgetMode: BnhubGrowthBudgetMode.AI_RECOMMENDED,
      budgetDailyCents: daily,
      budgetTotalCents: total,
      aiStrategySummary: summary,
      policyFlagsJson: policy.flags,
      promoSlug,
    },
  });

  await appendGrowthAuditLog({
    actorType: "SYSTEM",
    entityType: "bnhub_growth_campaign",
    entityId: camp.id,
    actionType: "draft_created",
    actionSummary: `Draft campaign ${camp.campaignName}`,
    afterJson: { policy: policy.reasons },
  });

  return camp;
}

export async function generateAssetsForCampaign(campaignId: string) {
  const camp = await prisma.bnhubGrowthCampaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: { listing: true },
  });
  const input = await loadListingGrowthInput(camp.listingId);
  const pack = generateAssetPack(input, ["en", "fr"]);
  const created = [];
  for (const row of pack) {
    created.push(
      await prisma.bnhubGrowthAsset.create({
        data: {
          campaignId,
          listingId: camp.listingId,
          assetFamily: row.family as BnhubGrowthAssetFamily,
          languageCode: row.lang,
          title: row.title,
          content: row.content,
          ctaText: row.ctaText,
          platformHint: row.platformHint,
          aiGenerated: true,
          approvalStatus: "DRAFT",
        },
      })
    );
  }
  await prisma.bnhubGrowthCampaign.update({
    where: { id: campaignId },
    data: { status: "READY" },
  });
  return created;
}

export async function createDistributionPlan(campaignId: string, connectorCodes: string[]) {
  const camp = await prisma.bnhubGrowthCampaign.findUniqueOrThrow({ where: { id: campaignId } });
  const connectors = await prisma.bnhubGrowthConnector.findMany({
    where: { connectorCode: { in: connectorCodes } },
  });
  const rows = [];
  for (const c of connectors) {
    rows.push(
      await prisma.bnhubGrowthDistribution.create({
        data: {
          campaignId,
          connectorId: c.id,
          distributionStatus: "DRAFT",
          payloadJson: { connectorCode: c.connectorCode },
        },
      })
    );
  }
  await appendGrowthAuditLog({
    actorType: "SYSTEM",
    entityType: "bnhub_growth_campaign",
    entityId: campaignId,
    actionType: "distribution_plan",
    actionSummary: `Planned ${rows.length} connectors`,
  });
  return rows;
}

export async function publishDistribution(
  distributionId: string,
  opts: {
    adminApprovedExternal?: boolean;
    actorId?: string | null;
    confirmIrreversibleExternal?: boolean;
  }
) {
  const dist = await prisma.bnhubGrowthDistribution.findUniqueOrThrow({
    where: { id: distributionId },
    include: { connector: true, campaign: true },
  });
  if (dist.publishLockedUntil && dist.publishLockedUntil > new Date()) {
    return {
      ok: false,
      summary: `Publish temporarily locked until ${dist.publishLockedUntil.toISOString()} (retry guard).`,
    };
  }
  const autonomy = dist.campaign.autonomyLevel;
  const code = dist.connector.connectorCode;
  const isInternal = ["internal_homepage", "internal_search_boost", "internal_email"].includes(code);
  const isExternal = !isInternal;

  if (isExternal) {
    if (autonomy === "OFF" || autonomy === "ASSISTED") {
      await prisma.bnhubGrowthDistribution.update({
        where: { id: distributionId },
        data: {
          distributionStatus: "AWAITING_APPROVAL",
          responseSummary: "External publish blocked: autonomy OFF or ASSISTED (manual approval required).",
        },
      });
      return { ok: false, summary: "Awaiting approval" };
    }
    if (autonomy === "SUPERVISED_AUTOPILOT" && !opts.adminApprovedExternal) {
      await prisma.bnhubGrowthDistribution.update({
        where: { id: distributionId },
        data: {
          distributionStatus: "AWAITING_APPROVAL",
          responseSummary: "Supervised autopilot: external channel needs admin approval.",
        },
      });
      return { ok: false, summary: "Awaiting admin approval for external" };
    }
  }

  const adapter = getGrowthConnectorAdapter(code);
  if (!adapter) {
    await prisma.bnhubGrowthDistribution.update({
      where: { id: distributionId },
      data: {
        distributionStatus: "FAILED",
        responseSummary: "Unknown connector adapter",
      },
    });
    return { ok: false, summary: "No adapter" };
  }

  const externalNeedsSpendAck =
    isExternal && (autonomy === "FULL_AUTOPILOT" || opts.adminApprovedExternal === true);
  if (externalNeedsSpendAck && opts.confirmIrreversibleExternal !== true) {
    throw new Error(
      "External publish may incur ad spend. Pass confirmIrreversibleExternal: true (admin UI checkbox)."
    );
  }

  await prisma.bnhubGrowthDistribution.update({
    where: { id: distributionId },
    data: { distributionStatus: "PUBLISHING" },
  });

  let result: ConnectorResult;
  try {
    result = await adapter.publish({
      campaignId: dist.campaignId,
      listingId: dist.campaign.listingId,
      distributionId,
      autonomyLevel: autonomy,
    });
  } catch (err) {
    result = {
      ok: false,
      setupRequired: false,
      summary: adapter.mapErrors(err),
      externalRef: null,
    };
  }

  if (!result.ok) {
    const maxAttempts = getMaxPublishAttempts();
    const baseSec = getPublishLockBaseSeconds();
    if (result.setupRequired) {
      await prisma.bnhubGrowthDistribution.update({
        where: { id: distributionId },
        data: {
          distributionStatus: "AWAITING_APPROVAL",
          responseSummary: result.summary,
          externalRef: result.externalRef,
          lastPublishError: result.summary,
        },
      });
    } else {
      const nextAttempt = dist.publishAttemptCount + 1;
      const lockMs = Math.min(3_600_000, Math.pow(2, nextAttempt) * baseSec * 1000);
      const lockedUntil = new Date(Date.now() + lockMs);
      const terminal = nextAttempt >= maxAttempts;
      await prisma.bnhubGrowthDistribution.update({
        where: { id: distributionId },
        data: {
          distributionStatus: terminal ? "FAILED" : "FAILED",
          responseSummary: terminal
            ? `${result.summary} (max ${maxAttempts} attempts — stopped)`
            : `${result.summary} Retry after cooldown.`,
          externalRef: result.externalRef,
          publishAttemptCount: nextAttempt,
          publishLockedUntil: terminal ? null : lockedUntil,
          lastPublishError: result.summary,
        },
      });
    }
  } else {
    await prisma.bnhubGrowthDistribution.update({
      where: { id: distributionId },
      data: {
        distributionStatus: BnhubGrowthDistributionStatus.PUBLISHED,
        publishedAt: new Date(),
        responseSummary: result.summary,
        externalRef: result.externalRef,
        payloadJson:
          result.raw === undefined ? undefined : (result.raw as Prisma.InputJsonValue),
        publishAttemptCount: 0,
        publishLockedUntil: null,
        lastPublishError: null,
      },
    });
  }

  const actorType =
    opts.actorId && (await isPlatformAdmin(opts.actorId)) ? "ADMIN" : opts.actorId ? "HOST" : "SYSTEM";
  await appendGrowthAuditLog({
    actorType,
    actorId: opts.actorId,
    entityType: "bnhub_growth_distribution",
    entityId: distributionId,
    actionType: "publish",
    actionSummary: result.summary,
    afterJson: { ok: result.ok, externalRef: result.externalRef },
  });

  return { ok: result.ok, summary: result.summary };
}

export async function launchCampaign(
  campaignId: string,
  opts: {
    adminApprovedExternal?: boolean;
    actorId?: string | null;
    confirmIrreversibleExternal?: boolean;
    /** Autopilot internal: skip per-listing launch cooldown when policy already ensured single path. */
    skipLaunchCooldown?: boolean;
  }
) {
  const campRow = await prisma.bnhubGrowthCampaign.findUniqueOrThrow({ where: { id: campaignId } });
  await assertAutonomyAllowedForHost(campRow.hostUserId, campRow.autonomyLevel);
  await assertNoSiblingActiveCampaign(campRow.listingId, campaignId);
  if (!opts.skipLaunchCooldown) {
    await assertListingLaunchCooldown(campRow.listingId);
  }
  const wasAlreadyActive = campRow.status === "ACTIVE";
  await assertHostDailyBudgetHeadroom({
    hostUserId: campRow.hostUserId,
    activatingCampaignId: campaignId,
    campaignBudgetDailyCents: campRow.budgetDailyCents,
    wasAlreadyActive,
  });

  const policy = await evaluateLaunchPolicy(campRow.listingId);
  if (!policy.allowed) {
    await appendGrowthAuditLog({
      actorType: "SYSTEM",
      entityType: "bnhub_growth_campaign",
      entityId: campaignId,
      actionType: "launch_blocked",
      actionSummary: policy.reasons.join("; "),
    });
    throw new Error(`Launch blocked: ${policy.reasons.join("; ")}`);
  }

  const ch = suggestChannels();
  const codes = [...ch.internal, ...(opts.adminApprovedExternal ? ch.externalPending : [])];
  const existing = await prisma.bnhubGrowthDistribution.count({ where: { campaignId } });
  if (existing === 0) {
    await createDistributionPlan(campaignId, codes);
  }

  const dists = await prisma.bnhubGrowthDistribution.findMany({
    where: { campaignId },
    include: { connector: true },
  });

  const internalCodes = ["internal_homepage", "internal_search_boost", "internal_email"] as const;
  const wouldPublishExternal = dists.some(
    (d) =>
      d.distributionStatus !== "PUBLISHED" &&
      !internalCodes.includes(d.connector.connectorCode as (typeof internalCodes)[number])
  );
  const needsSpendAck =
    wouldPublishExternal &&
    (campRow.autonomyLevel === "FULL_AUTOPILOT" || opts.adminApprovedExternal === true);
  if (needsSpendAck && opts.confirmIrreversibleExternal !== true) {
    throw new Error(
      "This launch includes external ad connectors and may incur spend. Confirm with confirmIrreversibleExternal: true (admin UI checkbox)."
    );
  }

  for (const d of dists) {
    if (d.distributionStatus === "PUBLISHED") continue;
    await publishDistribution(d.id, {
      adminApprovedExternal: opts.adminApprovedExternal,
      confirmIrreversibleExternal: opts.confirmIrreversibleExternal,
      actorId: opts.actorId,
    });
  }

  const camp = await prisma.bnhubGrowthCampaign.update({
    where: { id: campaignId },
    data: { status: "ACTIVE", lastOptimizationAt: new Date() },
  });

  await appendGrowthAuditLog({
    actorType: "SYSTEM",
    entityType: "bnhub_listing",
    entityId: camp.listingId,
    actionType: "growth_campaign_launched",
    actionSummary: `Campaign ${campaignId} activated`,
    afterJson: { campaignId },
  });

  return camp;
}

export async function approveCampaignAssets(campaignId: string) {
  await prisma.bnhubGrowthAsset.updateMany({
    where: { campaignId, approvalStatus: "DRAFT" },
    data: { approvalStatus: "APPROVED" },
  });
  return prisma.bnhubGrowthCampaign.update({
    where: { id: campaignId },
    data: { status: "READY" },
  });
}

export async function getGrowthCampaignById(id: string) {
  return prisma.bnhubGrowthCampaign.findUnique({
    where: { id },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          listingCode: true,
          nightPriceCents: true,
          photos: true,
          ownerId: true,
        },
      },
      assets: { orderBy: [{ languageCode: "asc" }, { assetFamily: "asc" }] },
      distributions: { include: { connector: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function listGrowthCampaigns(filters: { hostUserId?: string; take?: number }) {
  const where = filters.hostUserId ? { hostUserId: filters.hostUserId } : {};
  return prisma.bnhubGrowthCampaign.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: filters.take ?? 50,
    include: {
      listing: { select: { id: true, title: true, city: true, listingCode: true } },
    },
  });
}

export async function updateGrowthCampaign(
  campaignId: string,
  data: Partial<{
    campaignName: string;
    autonomyLevel: BnhubGrowthAutonomyLevel;
    budgetDailyCents: number | null;
    budgetTotalCents: number | null;
    status: BnhubGrowthCampaignStatus;
  }>
) {
  return prisma.bnhubGrowthCampaign.update({
    where: { id: campaignId },
    data,
  });
}

export async function changeGrowthCampaignStatus(campaignId: string, status: BnhubGrowthCampaignStatus) {
  if (status === BnhubGrowthCampaignStatus.ACTIVE) {
    const before = await prisma.bnhubGrowthCampaign.findUnique({
      where: { id: campaignId },
      select: { listingId: true },
    });
    if (before) {
      const gate = await canLaunchPremiumMarketingCampaign(before.listingId);
      if (!gate.allowed) {
        throw new Error(`Growth campaign activation blocked: ${gate.reasons.join(" ")}`);
      }
    }
  }
  const row = await prisma.bnhubGrowthCampaign.update({
    where: { id: campaignId },
    data: { status },
  });
  await appendGrowthAuditLog({
    actorType: "SYSTEM",
    entityType: "bnhub_growth_campaign",
    entityId: campaignId,
    actionType: "status_change",
    actionSummary: `Status → ${status}`,
    afterJson: { status },
  });
  return row;
}

export async function markGrowthCampaignAwaitingApproval(campaignId: string) {
  return changeGrowthCampaignStatus(campaignId, BnhubGrowthCampaignStatus.AWAITING_APPROVAL);
}

export async function markGrowthCampaignActive(campaignId: string) {
  return changeGrowthCampaignStatus(campaignId, BnhubGrowthCampaignStatus.ACTIVE);
}

export async function markGrowthCampaignFailed(campaignId: string, reason?: string) {
  const row = await prisma.bnhubGrowthCampaign.update({
    where: { id: campaignId },
    data: { status: BnhubGrowthCampaignStatus.FAILED },
  });
  await appendGrowthAuditLog({
    actorType: "SYSTEM",
    entityType: "bnhub_growth_campaign",
    entityId: campaignId,
    actionType: "failed",
    actionSummary: reason ?? "Campaign marked FAILED",
  });
  return row;
}

export async function archiveGrowthCampaign(campaignId: string) {
  return changeGrowthCampaignStatus(campaignId, BnhubGrowthCampaignStatus.ARCHIVED);
}

/** Shallow duplicate: new draft with same listing/objective/type; new name. */
export async function duplicateGrowthCampaign(campaignId: string, newName: string) {
  const src = await prisma.bnhubGrowthCampaign.findUniqueOrThrow({ where: { id: campaignId } });
  return createGrowthCampaignDraft({
    listingId: src.listingId,
    hostUserId: src.hostUserId,
    createdBy: src.createdBy,
    campaignName: newName,
    campaignType: src.campaignType,
    objective: src.objective,
    autonomyLevel: src.autonomyLevel,
  });
}
