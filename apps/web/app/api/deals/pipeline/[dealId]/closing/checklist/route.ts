import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { updateChecklistItemStatus } from "@/modules/closing/closing-checklist.service";
import { canManageClosing } from "@/modules/closing/closing-policy";
import { prisma } from "@repo/db";
import { canAccessPipelineDeal, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { getDealById } from "@/modules/deals/deal.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { dealId } = await context.params;

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal) || !canManageClosing(auth.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const itemId = typeof body.itemId === "string" ? body.itemId : "";
    const status = typeof body.status === "string" ? body.status : "";
    if (!itemId || !status) {
      return NextResponse.json({ error: "itemId and status required" }, { status: 400 });
    }

    const closing = await prisma.lecipmPipelineDealClosing.findUnique({
      where: { dealId },
      select: { transactionId: true },
    });

    const item = await updateChecklistItemStatus(itemId, status, dealId, auth.userId, closing?.transactionId ?? null);

    return NextResponse.json({ item });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    logError("[api.deals.closing.checklist]", { error: e });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
