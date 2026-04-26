import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getRegionMarketTrendSummary } from "@/modules/market-trends/infrastructure/marketTrendService";
import { slugRegionCity } from "@/modules/market-trends/infrastructure/regionSlug";

export const dynamic = "force-dynamic";

const WINDOWS = new Set([30, 90, 180]);

/** GET /api/market-trends/regions/[region] — conservative trend summary (signed-in users). */
export async function GET(request: NextRequest, context: { params: Promise<{ region: string }> }) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { region } = await context.params;
  const regionSlug = slugRegionCity(decodeURIComponent(region));
  const sp = request.nextUrl.searchParams;
  const propertyType = (sp.get("propertyType") || "unknown").toLowerCase();
  const mode = (sp.get("mode") || "investor").trim() || "investor";
  const windowRaw = Number(sp.get("windowDays")) || 90;
  if (!WINDOWS.has(windowRaw)) {
    return NextResponse.json({ error: "windowDays must be 30, 90, or 180" }, { status: 400 });
  }

  const result = await getRegionMarketTrendSummary(prisma, {
    regionSlug,
    propertyType,
    mode,
    windowDays: windowRaw,
  });

  return NextResponse.json({
    regionSlug,
    propertyType,
    mode,
    windowDays: windowRaw,
    summary: result.summary,
    newerSnapshot: result.newerSnapshot,
    olderSnapshot: result.olderSnapshot,
    disclaimer: "Trend signals are not appraisals and do not guarantee future prices or returns.",
  });
}
