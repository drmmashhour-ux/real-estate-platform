import type {
  BnhubMarketingRecommendationPriority,
  BnhubMarketingRecommendationType,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { refreshListingReadiness } from "./marketingProfileService";

export async function generateRecommendationsForListing(listingId: string, campaignId?: string | null) {
  const profile = await refreshListingReadiness(listingId);
  const missing = (profile.missingItemsJson as string[] | null) ?? [];
  const toCreate: {
    type: BnhubMarketingRecommendationType;
    priority: BnhubMarketingRecommendationPriority;
    title: string;
    description: string;
    actionLabel: string;
    payload: object;
  }[] = [];

  if (missing.some((m) => m.includes("photo"))) {
    toCreate.push({
      type: "PHOTO_UPGRADE",
      priority: "HIGH",
      title: "Upgrade listing photos",
      description: "Strong photography lifts conversion on BNHUB and external previews.",
      actionLabel: "Open listing editor",
      payload: { href: `/bnhub/host/listings/${listingId}/edit` },
    });
  }
  if (missing.some((m) => m.includes("description"))) {
    toCreate.push({
      type: "DESCRIPTION_UPGRADE",
      priority: "MEDIUM",
      title: "Expand description",
      description: "AI packs perform better with a rich, accurate description.",
      actionLabel: "Edit description",
      payload: { href: `/bnhub/host/listings/${listingId}/edit` },
    });
  }
  if (profile.readinessScore >= 72 && profile.trustScore >= 80) {
    toCreate.push({
      type: "HOMEPAGE_BOOST",
      priority: "MEDIUM",
      title: "Eligible for homepage feature",
      description: "High readiness + trust — request internal homepage slot (admin approval).",
      actionLabel: "Request boost",
      payload: { channelCode: "internal_homepage" },
    });
  }
  toCreate.push({
    type: "CHANNEL",
    priority: "LOW",
    title: "Start with internal channels",
    description: "Use BNHUB homepage, search boost, and email card before external adapters.",
    actionLabel: "Open marketing",
    payload: { href: "/bnhub/host/marketing" },
  });

  const existing = await prisma.bnhubMarketingRecommendation.findMany({
    where: {
      listingId,
      status: "OPEN",
      ...(campaignId != null ? { campaignId } : { campaignId: null }),
    },
    select: { recommendationType: true },
  });
  const have = new Set(existing.map((e) => e.recommendationType));

  const created = [];
  for (const r of toCreate) {
    if (have.has(r.type)) continue;
    created.push(
      await prisma.bnhubMarketingRecommendation.create({
        data: {
          listingId,
          campaignId: campaignId ?? undefined,
          recommendationType: r.type,
          priority: r.priority,
          title: r.title,
          description: r.description,
          actionLabel: r.actionLabel,
          actionPayloadJson: r.payload,
        },
      })
    );
  }
  return created;
}

export async function applyRecommendation(id: string, userId: string) {
  const rec = await prisma.bnhubMarketingRecommendation.update({
    where: { id },
    data: { status: "APPLIED" },
  });
  await prisma.bnhubMarketingEvent.create({
    data: {
      campaignId: rec.campaignId,
      eventType: "RECOMMENDATION_APPLIED",
      eventSource: "HOST",
      eventDataJson: { recommendationId: id, userId },
    },
  });
  return rec;
}

export async function dismissRecommendation(id: string) {
  return prisma.bnhubMarketingRecommendation.update({
    where: { id },
    data: { status: "DISMISSED" },
  });
}
