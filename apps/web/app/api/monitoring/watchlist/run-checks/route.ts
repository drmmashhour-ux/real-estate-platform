import { NextResponse } from "next/server";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { runWatchlistChecks } from "@/lib/monitoring/watchlist-checks";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

export async function POST() {
  const ctx = await requireMonitoringContext();
  if (!ctx.ok) return ctx.response;

  await runWatchlistChecks(ctx.owner.ownerType, ctx.owner.ownerId);
  await recordAuditEvent({
    actorUserId: ctx.userId,
    action: "MONITORING_WATCHLIST_CHECKS_RUN",
    payload: {},
  });

  return NextResponse.json({ success: true });
}
