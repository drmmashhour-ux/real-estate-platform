import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { setDiligenceTaskStatus } from "@/modules/deals/deal-diligence.service";
import { userCanMutatePipelineDeal } from "@/modules/deals/deal-access";
import type { DiligenceStatus } from "@/modules/deals/deal.types";

export const dynamic = "force-dynamic";

const TAG = "[deal-diligence]";

export async function POST(request: NextRequest, context: { params: Promise<{ dealId: string; taskId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId, taskId } = await context.params;
  if (!(await userCanMutatePipelineDeal(userId, dealId))) {
    logInfo(`${TAG}`, { forbidden: true });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { status?: DiligenceStatus };
    if (!body.status) return NextResponse.json({ error: "status required" }, { status: 400 });

    await setDiligenceTaskStatus({
      dealId,
      taskId,
      status: body.status,
      actorUserId: userId,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    logInfo(`${TAG}`, { msg });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
