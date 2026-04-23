import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@repo/db";
import { canAccessPipelineDeal, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { getDealById } from "@/modules/deals/deal.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { dealId } = await context.params;

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ deal });
  } catch (e) {
    logError("[api.deals.id.get]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { dealId } = await context.params;

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const summary = typeof body.latestSummary === "string" ? body.latestSummary.slice(0, 8000) : undefined;
    const memoRef = typeof body.latestMemoRef === "string" ? body.latestMemoRef.slice(0, 512) : undefined;

    const updated = await prisma.lecipmPipelineDeal.update({
      where: { id: dealId },
      data: {
        ...(summary !== undefined ? { latestSummary: summary } : {}),
        ...(memoRef !== undefined ? { latestMemoRef: memoRef } : {}),
      },
    });

    return NextResponse.json({ deal: updated });
  } catch (e) {
    logError("[api.deals.id.patch]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
