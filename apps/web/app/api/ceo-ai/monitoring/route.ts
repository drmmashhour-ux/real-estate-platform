import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { PlatformRole } from "@prisma/client";
import { listRecentExecutions, mergeMonitoringSummary } from "@/modules/ceo-ai/ceo-ai-monitoring.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (me?.role !== PlatformRole.BROKER && me?.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const items = await listRecentExecutions(60);
  return NextResponse.json({ ok: true, items, summary: mergeMonitoringSummary(items) });
}
