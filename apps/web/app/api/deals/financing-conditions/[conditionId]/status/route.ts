import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { updateFinancingConditionStatus } from "@/modules/capital/financing-conditions.service";
import { canAccessPipelineDeal, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";

export const dynamic = "force-dynamic";

/** Financing conditions (Phase 5), distinct from pipeline `/api/deals/conditions/*`. */
export async function POST(req: Request, context: { params: Promise<{ conditionId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { conditionId } = await context.params;

  try {
    const cond = await prisma.lecipmPipelineDealFinancingCondition.findUnique({
      where: { id: conditionId },
      select: { dealId: true },
    });
    if (!cond) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const deal = await prisma.lecipmPipelineDeal.findUnique({ where: { id: cond.dealId } });
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const status = typeof body.status === "string" ? body.status : "";
    if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });

    const note = typeof body.note === "string" ? body.note : undefined;

    const row = await updateFinancingConditionStatus(conditionId, {
      status,
      note,
      actorUserId: auth.userId,
      actorRole: auth.role,
    });

    return NextResponse.json({ condition: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    logError("[api.deals.financing-conditions.status.post]", { error: e });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
