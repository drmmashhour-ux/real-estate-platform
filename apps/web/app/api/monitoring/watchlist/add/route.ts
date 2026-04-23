import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { addWatchlistItem } from "@/lib/monitoring/watchlist";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const bodySchema = z.object({
  watchType: z.enum(["listing", "deal_candidate", "buy_box_match", "neighborhood"]),
  referenceId: z.string().min(1),
  title: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  currentScore: z.number().nullable().optional(),
  lastPriceCents: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
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

  const b = parsed.data;
  const item = await addWatchlistItem({
    ownerType: ctx.owner.ownerType,
    ownerId: ctx.owner.ownerId,
    watchType: b.watchType,
    referenceId: b.referenceId,
    title: b.title ?? undefined,
    city: b.city ?? undefined,
    currentScore: b.currentScore ?? undefined,
    lastPriceCents: b.lastPriceCents ?? undefined,
    notes: b.notes ?? undefined,
  });

  await recordAuditEvent({
    actorUserId: ctx.userId,
    action: "MONITORING_WATCHLIST_ITEM_ADDED",
    payload: { itemId: item.id, watchType: item.watchType, referenceId: item.referenceId },
  });

  return NextResponse.json({ success: true, item });
}
