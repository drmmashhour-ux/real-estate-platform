import { NextRequest } from "next/server";
import { getSupplyGrowthMetrics, recordSupplyGrowthMetric } from "@/lib/bnhub/supply-growth";

/** GET: supply growth metrics for dashboard (e.g. ?days=30). */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get("days");
    const metrics = await getSupplyGrowthMetrics({
      days: days ? parseInt(days, 10) : undefined,
    });
    return Response.json(metrics);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch supply growth metrics" }, { status: 500 });
  }
}

/** POST: record or update daily metrics (cron or admin). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const date = body?.date ? new Date(body.date) : new Date();
    await recordSupplyGrowthMetric({
      date,
      newListings: body.newListings,
      newHosts: body.newHosts,
      referralSignups: body.referralSignups,
      totalListings: body.totalListings,
      totalHosts: body.totalHosts,
    });
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to record metrics" }, { status: 500 });
  }
}
