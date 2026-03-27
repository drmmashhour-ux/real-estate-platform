import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFinanceActor } from "@/lib/admin/finance-request";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ entryId: string }> }
) {
  const actor = await getFinanceActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { entryId } = await ctx.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const status = String(body.status ?? "");
  if (!["unreconciled", "matched", "flagged"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const notes = body.notes != null ? String(body.notes) : undefined;

  const rec = await prisma.reconciliationRecord.updateMany({
    where: { accountingEntryId: entryId },
    data: { status, ...(notes !== undefined ? { notes } : {}) },
  });

  if (rec.count === 0) {
    return NextResponse.json({ error: "Reconciliation row not found" }, { status: 404 });
  }

  const updated = await prisma.reconciliationRecord.findUnique({
    where: { accountingEntryId: entryId },
  });

  return NextResponse.json({ reconciliation: updated });
}
