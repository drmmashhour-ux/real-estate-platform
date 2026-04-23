import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getUsage } from "@/lib/storage-quota";
import { getStorageAnalytics } from "@/lib/storage/analytics";
import { getOptimizationRecommendations } from "@/lib/storage/ai-optimizer";
import { analyzeStorage, predictDaysLeft } from "@/lib/storage/ai";

export const dynamic = "force-dynamic";

const LARGE_FILE_THRESHOLD_BYTES = 500 * 1024;

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + "GB";
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(0) + "MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + "KB";
  return bytes + "B";
}

/**
 * GET /api/storage/ai
 * Returns AI insights: recommendations, predictedDaysLeft, savingsPotential, predictedFullDate.
 */
export async function GET() {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({
        recommendations: [],
        warnings: [],
        predictedDaysLeft: null,
        savingsPotential: "0B",
        predictedFullDate: null,
        recommendation: null,
        suggestedPlan: null,
      });
    }

    const [usage, analytics, recs, largeImages, duplicateRecords] = await Promise.all([
      getUsage(userId),
      getStorageAnalytics({ userId }),
      getOptimizationRecommendations(userId),
      prisma.storageFileRecord.count({
        where: {
          userId,
          deletedAt: null,
          fileType: "image",
          originalSize: { gt: LARGE_FILE_THRESHOLD_BYTES },
        },
      }),
      prisma.storageFileRecord.findMany({
        where: { userId, deletedAt: null },
        select: { originalSize: true },
        take: 500,
      }),
    ]);

    const bySize = new Map<number, number>();
    for (const r of duplicateRecords) {
      bySize.set(r.originalSize, (bySize.get(r.originalSize) ?? 0) + 1);
    }
    const duplicateCount = Array.from(bySize.values()).filter((c) => c > 1).reduce((a, b) => a + b, 0);

    const savingsBytes = recs.reduce((s, r) => s + (r.impactBytes ?? 0), 0);

    const { recommendations, warnings } = analyzeStorage({
      percent: usage.percent,
      largeFiles: largeImages,
      duplicates: duplicateCount,
      usedBytes: usage.usedBytes,
      limitBytes: usage.limitBytes,
      savingsPotentialBytes: savingsBytes,
    });

    const dailyUsageBytes =
      analytics.monthlyGrowthBytes > 0 ? analytics.monthlyGrowthBytes / 30 : 1024 * 100;
    const predictedDaysLeft = predictDaysLeft(
      usage.usedBytes,
      usage.limitBytes,
      dailyUsageBytes
    );

    const predictedFullDate =
      predictedDaysLeft != null && predictedDaysLeft < 365
        ? new Date(Date.now() + predictedDaysLeft * 24 * 60 * 60 * 1000)
        : null;

    const suggestUpgrade = usage.percent > 90 || (predictedDaysLeft != null && predictedDaysLeft < 3);
    const suggestedPlan = "basic";

    return Response.json({
      recommendations,
      warnings,
      predictedDaysLeft,
      savingsPotential: formatBytes(savingsBytes),
      savingsPotentialBytes: savingsBytes,
      predictedFullDate: predictedFullDate?.toISOString().slice(0, 10) ?? null,
      ...(suggestUpgrade && {
        recommendation: "Upgrade plan",
        suggestedPlan,
      }),
    });
  } catch (e) {
    console.error(e);
    return Response.json({
      recommendations: [],
      warnings: [],
      predictedDaysLeft: null,
      savingsPotential: "0B",
      predictedFullDate: null,
      recommendation: null,
      suggestedPlan: null,
    });
  }
}
