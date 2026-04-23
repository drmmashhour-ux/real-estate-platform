import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";
import { markAlertRead } from "@/src/modules/watchlist-alerts/application/markAlertRead";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const alertId = typeof body?.alertId === "string" ? body.alertId : "";
  if (!alertId) return NextResponse.json({ error: "alertId required" }, { status: 400 });
  const out = await markAlertRead({ userId, alertId });
  await recordAuditEvent({
    actorUserId: userId,
    action: "ALERT_MARKED_READ",
    payload: { alertId },
  }).catch(() => {});
  return NextResponse.json(out);
}
