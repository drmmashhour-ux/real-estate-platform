import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { canAccessPipelineDeal, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { canWaiveCriticalCondition } from "@/modules/deals/deal-policy";
import { getDealById } from "@/modules/deals/deal.service";
import { updateConditionStatus } from "@/modules/deals/deal-conditions.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ conditionId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { conditionId } = await context.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const status = typeof body.status === "string" ? body.status : "";
  const note = typeof body.note === "string" ? body.note : null;

  if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });

  try {
    const cond = await prisma.lecipmPipelineDealCondition.findUnique({ where: { id: conditionId } });
    if (!cond) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const deal = await getDealById(cond.dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowWaive = status === "WAIVED" && cond.priority === "CRITICAL" && canWaiveCriticalCondition(auth.role);

    const row = await updateConditionStatus(conditionId, status, {
      note,
      actorUserId: auth.userId,
      allowWaive,
    });

    return NextResponse.json({ condition: row });
  } catch (e) {
    logError("[api.deals.condition.status]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
