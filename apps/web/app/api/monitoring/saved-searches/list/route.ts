import { NextResponse } from "next/server";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { listSavedSearches } from "@/lib/monitoring/saved-searches";

export async function POST() {
  const ctx = await requireMonitoringContext();
  if (!ctx.ok) return ctx.response;

  const items = await listSavedSearches(ctx.owner.ownerType, ctx.owner.ownerId);
  return NextResponse.json({ success: true, items });
}
