import { getGuestId } from "@/lib/auth/session";
import { getOptimizationRecommendations } from "@/lib/storage/ai-optimizer";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/**
 * POST /api/storage/optimize
 * Triggers or queues optimization (compress images, clean unused). Returns plan summary.
 * Actual compression runs async or via background job; this API returns what would be done.
 */
export async function POST() {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const recommendations = await getOptimizationRecommendations(userId);
    const compressRec = recommendations.find((r) => r.type === "compress_large_images");
    const duplicateRec = recommendations.find((r) => r.type === "duplicate_files");
    const archiveRec = recommendations.find((r) => r.type === "archive_inactive_listing");

    const plan: string[] = [];
    if (compressRec) plan.push("Compress large images");
    if (duplicateRec) plan.push("Flag duplicate files for review");
    if (archiveRec) plan.push("Suggest archiving inactive listing media");

    const totalSavingsBytes =
      (compressRec?.impactBytes ?? 0) +
      (duplicateRec?.impactBytes ?? 0) +
      (archiveRec?.impactBytes ?? 0);

    await prisma.storageAuditLog.create({
      data: {
        action: "OPTIMIZE",
        entityType: "user_storage",
        entityId: userId,
        userId,
        details: { plan, totalSavingsBytes, triggeredAt: new Date().toISOString() },
      },
    }).catch(() => {});

    return Response.json({
      success: true,
      plan,
      message: plan.length > 0
        ? `Optimization plan created. ${plan.length} action(s) recommended. Run compression and cleanup from your dashboard.`
        : "No optimization actions needed right now.",
      totalSavingsBytes,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Optimization failed" }, { status: 500 });
  }
}
