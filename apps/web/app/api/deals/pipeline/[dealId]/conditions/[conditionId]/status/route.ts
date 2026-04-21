import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { setConditionStatus } from "@/modules/deals/deal-conditions.service";
import { userCanMutatePipelineDeal, userCanWaiveCriticalCondition } from "@/modules/deals/deal-access";
import type { ConditionStatus } from "@/modules/deals/deal.types";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const TAG = "[deal-condition]";

export async function POST(request: NextRequest, context: { params: Promise<{ dealId: string; conditionId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId, conditionId } = await context.params;
  if (!(await userCanMutatePipelineDeal(userId, dealId))) {
    logInfo(`${TAG}`, { forbidden: true });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { status?: ConditionStatus; waiverNote?: string | null };
    if (!body.status) return NextResponse.json({ error: "status required" }, { status: 400 });

    const existing = await prisma.investmentPipelineCondition.findFirst({
      where: { id: conditionId, dealId },
      select: { priority: true },
    });

    if (existing?.priority === "CRITICAL" && body.status === "WAIVED") {
      if (!(await userCanWaiveCriticalCondition(userId))) {
        return NextResponse.json({ error: "Forbidden to waive critical condition" }, { status: 403 });
      }
    }

    await setConditionStatus({
      dealId,
      conditionId,
      status: body.status,
      actorUserId: userId,
      waiverNote: body.waiverNote ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    logInfo(`${TAG}`, { msg });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
