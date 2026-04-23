/**
 * Safe autonomy — recommendations / dry-run only. No outbound messaging, pricing, or payouts.
 */

import type { SyriaProperty } from "@/generated/prisma";
import { syriaPlatformConfig, getSyriaAutonomyMode, type SyriaAutonomyMode } from "@/config/syria-platform.config";
import { analyzeListingQuality } from "@/lib/listing-quality";
import { prisma } from "@/lib/db";

export type AutonomyActionType =
  | "FEATURED_UPGRADE_SUGGEST"
  | "CONTENT_REFRESH_SUGGEST"
  | "PHOTO_IMPROVEMENT_SUGGEST"
  | "FOLLOW_UP_TASK_SUGGEST"
  | "PRICE_REVIEW_SUGGEST"
  | "STALE_LISTING_REFRESH_SUGGEST";

export type AutonomyPreviewItem = {
  actionType: AutonomyActionType;
  explanation: string;
  payload: Record<string, unknown>;
};

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

export function buildAutonomyPreviewForProperty(property: SyriaProperty): AutonomyPreviewItem[] {
  const mode = getSyriaAutonomyMode();
  if (mode === "OFF") return [];

  const quality = analyzeListingQuality(property);
  const items: AutonomyPreviewItem[] = [];

  if (!property.isFeatured && property.status === "PUBLISHED") {
    items.push({
      actionType: "FEATURED_UPGRADE_SUGGEST",
      explanation:
        "Featured placement can increase visibility on home and search. Requires manual payment verification — never automatic.",
      payload: { propertyId: property.id, estimatedFee: syriaPlatformConfig.monetization.featuredFeeAmount },
    });
  }

  if (quality.score < syriaPlatformConfig.autonomy.listingQualityAssistThreshold) {
    items.push({
      actionType: "CONTENT_REFRESH_SUGGEST",
      explanation: "Listing quality score is below the assist threshold — improve title/description before promoting.",
      payload: { score: quality.score, issues: quality.issues.map((i) => i.code) },
    });
  }

  const images = Array.isArray(property.images)
    ? (property.images as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  if (images.length < 2) {
    items.push({
      actionType: "PHOTO_IMPROVEMENT_SUGGEST",
      explanation: "Add more clear interior/exterior photos to improve trust and conversion.",
      payload: { imageCount: images.length },
    });
  }

  if (daysSince(property.updatedAt) > syriaPlatformConfig.autonomy.staleListingDays) {
    items.push({
      actionType: "STALE_LISTING_REFRESH_SUGGEST",
      explanation: "Listing has not been updated recently — refresh copy, price, or availability.",
      payload: { daysSinceUpdate: daysSince(property.updatedAt) },
    });
  }

  items.push({
    actionType: "FOLLOW_UP_TASK_SUGGEST",
    explanation: "Review inquiries and booking requests within 24h to protect conversion — manual follow-up only.",
    payload: { propertyId: property.id },
  });

  items.push({
    actionType: "PRICE_REVIEW_SUGGEST",
    explanation:
      "Compare price to similar listings in the same city — suggestion only; never auto-change price.",
    payload: { city: property.city },
  });

  return items;
}

/** Persist recommendations for admin inspection (dry-run friendly). */
export async function persistAutonomyPreview(propertyId: string, ownerUserId: string | null): Promise<number> {
  const property = await prisma.syriaProperty.findUnique({ where: { id: propertyId } });
  if (!property) return 0;

  const mode = getSyriaAutonomyMode();
  const previews = buildAutonomyPreviewForProperty(property);
  if (previews.length === 0) return 0;

  await prisma.$transaction(async (tx) => {
    await tx.syriaAutonomyRecommendation.deleteMany({
      where: { propertyId, status: "PENDING" },
    });
    await tx.syriaAutonomyRecommendation.createMany({
      data: previews.map((p) => ({
        propertyId,
        userId: ownerUserId,
        actionType: p.actionType,
        autonomyMode: mode as SyriaAutonomyMode,
        explanation: p.explanation,
        payload: p.payload as any,
      })),
    });
  });

  return previews.length;
}
