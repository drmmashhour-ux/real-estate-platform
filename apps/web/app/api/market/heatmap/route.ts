import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getHeatmapData } from "@/lib/market-intelligence";

const METRICS = ["demand", "price", "rent", "bnhub_revenue", "investment"] as const;

/**
 * GET /api/market/heatmap
 * Query: metric (demand|price|rent|bnhub_revenue|investment), regionType (city|municipality|neighborhood|postal_area), period (optional)
 */
export async function GET(request: NextRequest) {
  try {
    await getGuestId();
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get("metric") ?? "demand";
    const regionType = searchParams.get("regionType") ?? "municipality";
    const period = searchParams.get("period") ?? undefined;
    if (!METRICS.includes(metric as (typeof METRICS)[number])) {
      return Response.json({ error: "metric must be one of: " + METRICS.join(", ") }, { status: 400 });
    }
    const zones = await getHeatmapData(regionType, metric as (typeof METRICS)[number], period);
    return Response.json({ heatmap: zones });
  } catch (e) {
    return Response.json({ error: "Failed to build heatmap" }, { status: 500 });
  }
}
