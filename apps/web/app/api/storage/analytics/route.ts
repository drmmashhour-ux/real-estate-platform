import { getGuestId } from "@/lib/auth/session";
import { getStorageAnalytics } from "@/lib/storage/analytics";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + "GB";
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(0) + "MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + "KB";
  return bytes + "B";
}

/**
 * GET /api/storage/analytics
 * Returns storage analytics for the current user (or admin: all). Query: ?scope=user | admin
 */
export async function GET(request: Request) {
  try {
    const userId = await getGuestId();
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") ?? "user";

    const analytics = await getStorageAnalytics(
      scope === "user" && userId ? { userId } : undefined
    );

    return Response.json({
      totalUsedBytes: analytics.totalUsedBytes,
      totalUsed: formatBytes(analytics.totalUsedBytes),
      totalUsedBytesPerUser: analytics.totalUsedBytesPerUser.map((u) => ({
        userId: u.userId,
        usedBytes: u.usedBytes,
        used: formatBytes(u.usedBytes),
      })),
      totalUsedBytesPerListing: analytics.totalUsedBytesPerListing.map((l) => ({
        listingId: l.listingId,
        usedBytes: l.usedBytes,
        used: formatBytes(l.usedBytes),
      })),
      fileCountsByType: analytics.fileCountsByType,
      monthlyGrowthBytes: analytics.monthlyGrowthBytes,
      monthlyGrowthPercent: analytics.monthlyGrowthPercent,
      monthlyGrowth: formatBytes(analytics.monthlyGrowthBytes),
      topConsumers: analytics.topConsumers.map((c) => ({
        userId: c.userId,
        usedBytes: c.usedBytes,
        fileCount: c.fileCount,
        used: formatBytes(c.usedBytes),
      })),
      compressionSavingsBytes: analytics.compressionSavingsBytes,
      compressionSavingsPercent: analytics.compressionSavingsPercent,
      compressionSavings: formatBytes(analytics.compressionSavingsBytes),
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      {
        totalUsedBytes: 0,
        totalUsed: "0B",
        totalUsedBytesPerUser: [],
        totalUsedBytesPerListing: [],
        fileCountsByType: [],
        monthlyGrowthBytes: 0,
        monthlyGrowthPercent: null,
        monthlyGrowth: "0B",
        topConsumers: [],
        compressionSavingsBytes: 0,
        compressionSavingsPercent: null,
        compressionSavings: "0B",
      },
      { status: 200 }
    );
  }
}
