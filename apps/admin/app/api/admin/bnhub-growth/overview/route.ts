import { getGuestId } from "@/lib/auth/session";
import { assertGrowthAdmin, GrowthAuthError } from "@/src/modules/bnhub-growth-engine/services/growthAccess";
import { growthGlobalOverview } from "@/src/modules/bnhub-growth-engine/services/growthAnalyticsService";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await assertGrowthAdmin(await getGuestId());
    const overview = await growthGlobalOverview();
    const auditsToday = await prisma.bnhubGrowthAuditLog.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    });
    return Response.json({ ...overview, autopilotActionsToday: auditsToday });
  } catch (e) {
    if (e instanceof GrowthAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
