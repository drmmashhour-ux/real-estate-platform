import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { removeWatchlistItem } from "@/lib/monitoring/watchlist";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const bodySchema = z.object({
  id: z.string().min(1),
});

export async function POST(req: Request) {
  const ctx = await requireMonitoringContext();
  if (!ctx.ok) return ctx.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const r = await removeWatchlistItem(parsed.data.id, ctx.owner.ownerType, ctx.owner.ownerId);
  if (r.count === 0) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await recordAuditEvent({
    actorUserId: ctx.userId,
    action: "MONITORING_WATCHLIST_ITEM_REMOVED",
    payload: { itemId: parsed.data.id },
  });

  return NextResponse.json({ success: true });
}
