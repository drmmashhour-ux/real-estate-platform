import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@repo/db";
import { refreshMarketSnapshotsFromMarketData } from "@/modules/market-trends/application/refreshMarketSnapshotsFromMarketData";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** POST /api/market-trends/refresh — rebuild snapshots from `MarketDataPoint` (admin only). */
export async function POST() {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const result = await refreshMarketSnapshotsFromMarketData(prisma);
  return NextResponse.json(result);
}
