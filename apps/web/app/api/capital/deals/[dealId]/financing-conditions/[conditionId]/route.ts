import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { userCanMutateCapitalData } from "@/modules/capital/capital-access";
import { updateFinancingCondition } from "@/modules/capital/financing-conditions.service";

export const dynamic = "force-dynamic";

const TAG = "[financing-condition]";

export async function PATCH(request: NextRequest, context: { params: Promise<{ dealId: string; conditionId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId, conditionId } = await context.params;
  if (!(await userCanMutateCapitalData(userId, dealId))) {
    logInfo(`${TAG}`, { denied: true, dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    await updateFinancingCondition({
      pipelineDealId: dealId,
      conditionId,
      actorUserId: userId,
      status: typeof body.status === "string" ? body.status : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      ownerUserId: typeof body.ownerUserId === "string" ? body.ownerUserId : undefined,
      dueDate:
        body.dueDate === null ? null
        : typeof body.dueDate === "string" && body.dueDate ?
          new Date(body.dueDate)
        : undefined,
      waiverNote: typeof body.waiverNote === "string" ? body.waiverNote : undefined,
      waive: body.waive === true,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
