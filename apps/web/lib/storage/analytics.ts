/**
 * Storage analytics: total used per user/listing, file counts by type,
 * monthly growth, top consumers. Used by /api/storage/analytics.
 */
import { prisma } from "@/lib/db";

export type StorageAnalytics = {
  totalUsedBytes: number;
  totalUsedBytesPerUser: { userId: string; usedBytes: number }[];
  totalUsedBytesPerListing: { listingId: string; usedBytes: number }[];
  fileCountsByType: { fileType: string; count: number }[];
  monthlyGrowthBytes: number;
  monthlyGrowthPercent: number;
  topConsumers: { userId: string; usedBytes: number; fileCount: number }[];
  compressionSavingsBytes: number;
  compressionSavingsPercent: number;
};

const LEGAL_RETENTION = ["legal", "invoice", "compliance"];

export async function getStorageAnalytics(params?: {
  userId?: string;
  listingId?: string;
  since?: Date;
}): Promise<StorageAnalytics> {
  const since = params?.since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const whereClause = {
    deletedAt: null,
    ...(params?.userId && { userId: params.userId }),
    ...(params?.listingId && { listingId: params.listingId }),
  };

  const records = await prisma.storageFileRecord.findMany({
    where: whereClause,
    select: {
      userId: true,
      listingId: true,
      fileType: true,
      originalSize: true,
      compressedSize: true,
      createdAt: true,
    },
  });

  const totalUsedBytes = records.reduce(
    (sum, r) => sum + (r.compressedSize ?? r.originalSize),
    0
  );
  const totalOriginalBytes = records.reduce((sum, r) => sum + r.originalSize, 0);
  const compressionSavingsBytes = Math.max(0, totalOriginalBytes - totalUsedBytes);
  const compressionSavingsPercent =
    totalOriginalBytes > 0
      ? Math.round((compressionSavingsBytes / totalOriginalBytes) * 100)
      : 0;

  const userMap = new Map<string, { used: number; count: number }>();
  const listingMap = new Map<string, number>();
  const typeMap = new Map<string, number>();

  for (const r of records) {
    const size = r.compressedSize ?? r.originalSize;
    const u = userMap.get(r.userId) ?? { used: 0, count: 0 };
    u.used += size;
    u.count += 1;
    userMap.set(r.userId, u);

    if (r.listingId) {
      listingMap.set(r.listingId, (listingMap.get(r.listingId) ?? 0) + size);
    }
    typeMap.set(r.fileType, (typeMap.get(r.fileType) ?? 0) + 1);
  }

  const totalUsedBytesPerUser = Array.from(userMap.entries()).map(([userId, v]) => ({
    userId,
    usedBytes: v.used,
  }));

  const totalUsedBytesPerListing = Array.from(listingMap.entries()).map(([listingId, usedBytes]) => ({
    listingId,
    usedBytes,
  }));

  const fileCountsByType = Array.from(typeMap.entries()).map(([fileType, count]) => ({
    fileType,
    count,
  }));

  const recentRecords = records.filter((r) => r.createdAt >= since);
  const previousSince = new Date(since.getTime() - 30 * 24 * 60 * 60 * 1000);
  const previousRecords = await prisma.storageFileRecord.findMany({
    where: {
      ...whereClause,
      createdAt: { gte: previousSince, lt: since },
    },
    select: { originalSize: true, compressedSize: true },
  });
  const currentMonthUsed = recentRecords.reduce(
    (s, r) => s + (r.compressedSize ?? r.originalSize),
    0
  );
  const previousMonthUsed = previousRecords.reduce(
    (s, r) => s + (r.compressedSize ?? r.originalSize),
    0
  );
  const monthlyGrowthBytes = currentMonthUsed - previousMonthUsed;
  const monthlyGrowthPercent =
    previousMonthUsed > 0 ? Math.round((monthlyGrowthBytes / previousMonthUsed) * 100) : 0;

  const topConsumers = Array.from(userMap.entries())
    .map(([userId, v]) => ({ userId, usedBytes: v.used, fileCount: v.count }))
    .sort((a, b) => b.usedBytes - a.usedBytes)
    .slice(0, 20);

  return {
    totalUsedBytes,
    totalUsedBytesPerUser,
    totalUsedBytesPerListing,
    fileCountsByType,
    monthlyGrowthBytes,
    monthlyGrowthPercent,
    topConsumers,
    compressionSavingsBytes,
    compressionSavingsPercent,
  };
}

/** Check if a retention policy is protected (never auto-delete). */
export function isProtectedRetentionPolicy(policy: string): boolean {
  return LEGAL_RETENTION.includes(policy.toLowerCase());
}
