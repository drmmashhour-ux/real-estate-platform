import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { canManageCapital } from "@/modules/capital/capital-policy";
import { updateLenderStatus } from "@/modules/capital/lender.service";
import { canAccessPipelineDeal, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, context: { params: Promise<{ lenderId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { lenderId } = await context.params;

  try {
    const lender = await prisma.lecipmPipelineDealLender.findUnique({ where: { id: lenderId } });
    if (!lender) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const deal = await prisma.lecipmPipelineDeal.findUnique({ where: { id: lender.dealId } });
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal) || !canManageCapital(auth.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const status = typeof body.status === "string" ? body.status : "";
    if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });

    const notes =
      typeof body.notes === "string" ? body.notes : undefined;

    const updated = await updateLenderStatus(lenderId, status, auth.userId, notes);

    return NextResponse.json({ lender: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    logError("[api.deals.lenders.id.patch]", { error: e });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
