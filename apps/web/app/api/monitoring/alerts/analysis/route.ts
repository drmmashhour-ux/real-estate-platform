import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const alertId = req.nextUrl.searchParams.get("alertId") ?? "";
  if (!alertId) return NextResponse.json({ error: "alertId required" }, { status: 400 });

  const owned = await prisma.watchlistAlert.findFirst({
    where: { id: alertId, userId },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const item = await prisma.alertAIAnalysis.findUnique({
    where: { alertId },
  });

  if (item) {
    await recordAuditEvent({
      actorUserId: userId,
      action: "AI_ALERT_EXPLANATION_VIEWED",
      payload: { alertId, analysisId: item.id },
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, item });
}
