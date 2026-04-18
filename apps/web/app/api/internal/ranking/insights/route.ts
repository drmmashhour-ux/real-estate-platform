import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const [configs, sample] = await Promise.all([
    prisma.rankingConfig.findMany({ where: { isActive: true }, take: 10 }),
    prisma.fsboListing.findMany({
      where: { status: "ACTIVE", moderationStatus: "APPROVED" },
      orderBy: { rankingTotalScoreCache: "desc" },
      take: 5,
      select: { id: true, city: true, rankingTotalScoreCache: true, rankingPerformanceBand: true },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    rankingV1Enabled: engineFlags.rankingV1,
    rankingV2Enabled: engineFlags.rankingV2,
    activeConfigs: configs.map((c) => ({ configKey: c.configKey, updatedAt: c.updatedAt })),
    topListingsSample: sample,
  });
}
