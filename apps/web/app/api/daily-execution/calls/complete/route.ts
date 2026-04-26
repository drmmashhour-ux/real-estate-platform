import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { markCallCompleted } from "@/src/modules/daily-execution/application/dailyTaskService";

export const dynamic = "force-dynamic";

/** POST { linkedLeadId? } — marks call completed (metadata only; you placed the call). */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { linkedLeadId?: string | null };
  const linkedLeadId =
    typeof body.linkedLeadId === "string" && body.linkedLeadId.trim() ? body.linkedLeadId.trim() : null;

  const result = await markCallCompleted(prisma, userId, { linkedLeadId });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, metadata: result.task.metadata });
}
