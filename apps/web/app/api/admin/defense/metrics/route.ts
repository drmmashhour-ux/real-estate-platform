import { NextRequest } from "next/server";
import { buildDefenseMetricsSnapshot, getDefenseMetricsSnapshots } from "@/lib/defense/defense-analytics";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const snapshot = searchParams.get("snapshot") === "true";
    const date = searchParams.get("date");
    const marketId = searchParams.get("marketId") ?? undefined;
    if (snapshot) {
      const d = date ? new Date(date) : new Date();
      const s = await buildDefenseMetricsSnapshot({ date: d, marketId, store: false });
      return Response.json(s);
    }
    const list = await getDefenseMetricsSnapshots({
      marketId,
      from: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
      to: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
      limit: 90,
    });
    return Response.json(list);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get defense metrics" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, marketId } = body;
    const d = date ? new Date(date) : new Date();
    const snapshot = await buildDefenseMetricsSnapshot({ date: d, marketId, store: true });
    return Response.json(snapshot);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to store snapshot" }, { status: 500 });
  }
}
