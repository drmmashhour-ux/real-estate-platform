import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { marketplaceFlywheelFlags } from "@/config/feature-flags";
import { analyzeMarketplaceGrowth, prioritizeFlywheelInsights } from "@/modules/marketplace/flywheel.service";
import { summarizeFlywheelLearning } from "@/modules/growth/flywheel-learning.service";
import { buildGrowthActionSuccessProfiles } from "@/modules/growth/flywheel-success-profile.service";
import { buildAutoSuggestedGrowthActions } from "@/modules/growth/flywheel-auto-suggest.service";

export const dynamic = "force-dynamic";

/** GET — ranked advisory growth suggestions (never creates flywheel actions). */
export async function GET() {
  if (!marketplaceFlywheelFlags.marketplaceFlywheelAutoSuggestV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [insights, learningRaw, profiles] = await Promise.all([
    analyzeMarketplaceGrowth(),
    summarizeFlywheelLearning().catch(() => null),
    buildGrowthActionSuccessProfiles(),
  ]);

  const learning =
    learningRaw ?? { byInsightType: {}, actionTypeEffectiveness: [] };

  const bundle = buildAutoSuggestedGrowthActions({
    prioritizedInsights: prioritizeFlywheelInsights(insights),
    learning,
    profiles,
  });

  return NextResponse.json({
    bundle,
    disclaimer:
      "Admin-only advisory ranking from current flywheel signals and historically scored outcome tags. Sparse samples stay explicit on each suggestion; does not imply causal proof, automate actions, or change public/live pricing.",
  });
}
