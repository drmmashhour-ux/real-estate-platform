import { NextResponse } from "next/server";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { listWatchlist } from "@/lib/monitoring/watchlist";

export async function POST() {
  const ctx = await requireMonitoringContext();
  if (!ctx.ok) return ctx.response;

  const items = await listWatchlist(ctx.owner.ownerType, ctx.owner.ownerId);
  return NextResponse.json({ success: true, items });
}
