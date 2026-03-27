import { NextRequest } from "next/server";
import { isAiManagerEnabled, callAiManager } from "@/lib/ai-manager-client";
import { getHostInsightsFromDb } from "@/lib/ai-host-insights";

export const dynamic = "force-dynamic";

/** POST /api/ai/host-insights – occupancy trends, revenue trends, improvements, price tips. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hostId, listingIds, periodDays } = body;
    if (!hostId || typeof hostId !== "string") {
      return Response.json({ error: "hostId required" }, { status: 400 });
    }

    if (isAiManagerEnabled()) {
      const result = await callAiManager<{
        occupancyTrend: { date: string; occupancyPct: number }[];
        revenueTrend: { date: string; revenueCents: number }[];
        suggestedImprovements: string[];
        priceOptimizationTips: string[];
        summary: string;
      }>("/v1/ai-manager/host-insights", body);
      return Response.json(result);
    }

    const result = await getHostInsightsFromDb(hostId, {
      listingIds,
      periodDays,
    });
    return Response.json(result);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Failed to get host insights" },
      { status: 500 }
    );
  }
}
