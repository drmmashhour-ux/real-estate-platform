import { NextResponse } from "next/server";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { listAlerts } from "@/lib/monitoring/alerts";

export async function POST() {
  const ctx = await requireMonitoringContext();
  if (!ctx.ok) return ctx.response;

  const items = await listAlerts(ctx.owner.ownerType, ctx.owner.ownerId);
  return NextResponse.json({ success: true, items });
}
