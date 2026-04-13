import { NextResponse } from "next/server";
import { runContentOptimizationLoop } from "@/lib/content-machine/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Weekly (recommended): analyze top-performing content and regenerate optimized batches.
 * `GET /api/cron/content-optimization?secret=CRON_SECRET&listingLimit=10&percentile=0.1`
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const url = new URL(req.url);
  const q = url.searchParams.get("secret")?.trim();
  if (!secret || q !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listingLimitRaw = url.searchParams.get("listingLimit");
  const listingLimit = listingLimitRaw ? Number.parseInt(listingLimitRaw, 10) : 12;
  const percentileRaw = url.searchParams.get("percentile");
  const percentileFraction = percentileRaw ? Number.parseFloat(percentileRaw) : 0.1;

  const { signals, results } = await runContentOptimizationLoop({
    listingLimit: Number.isFinite(listingLimit) ? listingLimit : 12,
    percentileFraction: Number.isFinite(percentileFraction) ? percentileFraction : 0.1,
  });

  return NextResponse.json({
    ok: true,
    signals,
    listingCount: results.length,
    results: results.map((r) => ({
      listingId: r.listingId,
      pieceCount: r.contentIds.length,
      errorCount: r.errors.length,
    })),
  });
}
