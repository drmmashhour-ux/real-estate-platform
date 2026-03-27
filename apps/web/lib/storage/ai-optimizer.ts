/**
 * AI storage optimization: recommendations for compression, archive,
 * duplicates, tiering, and near-limit warnings.
 */
import { prisma } from "@/lib/db";
import { getStorageAnalytics } from "./analytics";
import { getStorageStatus } from "./check";

export type OptimizationRecommendation = {
  id: string;
  type: "compress_large_images" | "archive_inactive_listing" | "duplicate_files" | "storage_tier" | "near_limit";
  title: string;
  description: string;
  impactBytes?: number;
  impactPercent?: number;
  priority: "low" | "medium" | "high" | "critical";
  entityId?: string;
  entityType?: string;
};

const LARGE_IMAGE_THRESHOLD_BYTES = 500 * 1024; // 500KB
const DUPLICATE_HASH_FIELD = "contentHash"; // optional: add to StorageFileRecord for duplicate detection

export async function getOptimizationRecommendations(userId?: string): Promise<OptimizationRecommendation[]> {
  const recommendations: OptimizationRecommendation[] = [];
  const analytics = await getStorageAnalytics({ userId });

  // 1. Compress large images
  const largeImages = await prisma.storageFileRecord.findMany({
    where: {
      deletedAt: null,
      ...(userId && { userId }),
      fileType: "image",
      optimizationStatus: { in: ["pending", "skipped", "failed"] },
      originalSize: { gt: LARGE_IMAGE_THRESHOLD_BYTES },
    },
    take: 50,
  });
  if (largeImages.length > 0) {
    const totalSavings = largeImages.reduce((s, r) => s + Math.round(r.originalSize * 0.4), 0);
    recommendations.push({
      id: "rec-compress",
      type: "compress_large_images",
      title: "Compress large images",
      description: `${largeImages.length} image(s) over 500KB can be compressed to save space.`,
      impactBytes: totalSavings,
      impactPercent: analytics.totalUsedBytes > 0 ? Math.round((totalSavings / analytics.totalUsedBytes) * 100) : 0,
      priority: "medium",
      entityType: "storage_file_record",
    });
  }

  // 2. Archive inactive listing media (listings not updated in 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const inactiveListingRecords = await prisma.storageFileRecord.groupBy({
    by: ["listingId"],
    where: {
      deletedAt: null,
      listingId: { not: null },
      ...(userId && { userId }),
    },
    _sum: { originalSize: true },
    _count: true,
  });
  let archiveSavings = 0;
  for (const g of inactiveListingRecords) {
    if (!g.listingId) continue;
    const listing = await prisma.shortTermListing.findUnique({
      where: { id: g.listingId },
      select: { updatedAt: true },
    });
    if (listing && listing.updatedAt < ninetyDaysAgo) {
      archiveSavings += Number(g._sum.originalSize ?? 0);
    }
  }
  if (archiveSavings > 0) {
    recommendations.push({
      id: "rec-archive",
      type: "archive_inactive_listing",
      title: "Archive inactive listing media",
      description: "Some listing media hasn't been updated in 90+ days. Consider archiving to a cheaper tier.",
      impactBytes: archiveSavings,
      priority: "low",
      entityType: "listing",
    });
  }

  // 3. Duplicate files (placeholder: would need contentHash on records)
  const duplicateCandidates = await prisma.storageFileRecord.findMany({
    where: { deletedAt: null, ...(userId && { userId }) },
    select: { fileUrl: true, originalSize: true },
    take: 500,
  });
  const bySize = new Map<number, number>();
  for (const r of duplicateCandidates) {
    const count = bySize.get(r.originalSize) ?? 0;
    bySize.set(r.originalSize, count + 1);
  }
  const duplicateCount = Array.from(bySize.values()).filter((c) => c > 1).reduce((a, b) => a + b, 0);
  if (duplicateCount > 1) {
    recommendations.push({
      id: "rec-duplicates",
      type: "duplicate_files",
      title: "Possible duplicate files",
      description: `${duplicateCount} files have the same size and may be duplicates. Review to free space.`,
      priority: "low",
      entityType: "storage_file_record",
    });
  }

  // 4. Cheaper storage tier suggestion
  if (analytics.totalUsedBytes > 2 * 1024 * 1024 * 1024) {
    recommendations.push({
      id: "rec-tier",
      type: "storage_tier",
      title: "Consider cheaper storage tier",
      description: "You have over 2GB stored. Moving cold data to a lower-cost tier could reduce costs.",
      priority: "low",
    });
  }

  // 5. Near storage limit warning
  if (userId) {
    const storage = await prisma.userStorage.findUnique({ where: { userId } });
    if (storage) {
      const status = getStorageStatus(storage.usedBytes, storage.limitBytes);
      if (status === "critical" || status === "full") {
        recommendations.push({
          id: "rec-near-limit",
          type: "near_limit",
          title: "Storage limit almost reached",
          description:
            status === "full"
              ? "Storage is full. Uploads are blocked. Upgrade your plan or free up space."
              : "You're over 90% of your storage limit. Upgrade or remove files soon.",
          priority: "critical",
          entityType: "user_storage",
          entityId: userId,
        });
      } else if (status === "warning") {
        recommendations.push({
          id: "rec-near-limit",
          type: "near_limit",
          title: "Storage usage high",
          description: "You've used over 70% of your storage. Consider upgrading or cleaning up.",
          priority: "high",
          entityType: "user_storage",
          entityId: userId,
        });
      }
    }
  }

  return recommendations;
}
