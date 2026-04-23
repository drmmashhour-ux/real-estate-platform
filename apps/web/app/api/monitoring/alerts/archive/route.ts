import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { archiveAlert } from "@/lib/monitoring/alerts";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const bodySchema = z.object({
  alertId: z.string().min(1),
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

  const r = await archiveAlert(parsed.data.alertId, ctx.owner.ownerType, ctx.owner.ownerId);
  if (r.count === 0) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await recordAuditEvent({
    actorUserId: ctx.userId,
    action: "ALERT_CENTER_ALERT_ARCHIVED",
    payload: { alertId: parsed.data.alertId },
  });

  return NextResponse.json({ success: true });
}
