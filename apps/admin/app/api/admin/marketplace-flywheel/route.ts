import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { marketplaceFlywheelFlags } from "@/config/feature-flags";
import {
  analyzeMarketplaceGrowth,
  buildFlywheelActions,
  prioritizeFlywheelInsights,
} from "@/modules/marketplace/flywheel.service";

export const dynamic = "force-dynamic";

/** GET — advisory flywheel snapshot (admin only). */
export async function GET() {
  if (!marketplaceFlywheelFlags.marketplaceFlywheelV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const insights = await analyzeMarketplaceGrowth();
  const priorities = prioritizeFlywheelInsights(insights);
  const actions = buildFlywheelActions(insights);

  return NextResponse.json({
    insights,
    priorities,
    actions,
    disclaimer: "Advisory only — does not execute campaigns or change pricing automatically.",
  });
}
