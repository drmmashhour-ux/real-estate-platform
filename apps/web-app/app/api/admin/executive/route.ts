import { NextRequest } from "next/server";
import { buildExecutiveSnapshot, getExecutiveSnapshots } from "@/lib/executive-metrics";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action"); // snapshot | list
    const date = searchParams.get("date");
    const marketId = searchParams.get("marketId") ?? undefined;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (action === "snapshot") {
      const d = date ? new Date(date) : new Date();
      const snapshot = await buildExecutiveSnapshot({
        date: d,
        marketId,
        persist: false,
      });
      return Response.json(snapshot);
    }

    const list = await getExecutiveSnapshots({
      marketId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: 90,
    });
    return Response.json(list);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch executive metrics" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, marketId } = body;
    const d = date ? new Date(date) : new Date();
    const snapshot = await buildExecutiveSnapshot({
      date: d,
      marketId,
      persist: true,
    });
    return Response.json(snapshot);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to persist snapshot" }, { status: 500 });
  }
}
