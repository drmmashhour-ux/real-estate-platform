import { NextResponse } from "next/server";
import { approvePortfolioAction } from "@/lib/portfolio-autopilot/approve-portfolio-action";
import { requirePortfolioOwnerOrAdmin } from "@/lib/portfolio-autopilot/portfolio-guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ actionId: string }> }) {
  const { actionId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { ownerUserId?: string };
  const gate = await requirePortfolioOwnerOrAdmin({
    targetOwnerUserId: body.ownerUserId ?? undefined,
  });
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const result = await approvePortfolioAction({
      actionId,
      ownerUserId: gate.effectiveOwnerId,
      performedByUserId: gate.userId,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Approve failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
