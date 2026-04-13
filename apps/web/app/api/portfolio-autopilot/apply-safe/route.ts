import { NextResponse } from "next/server";
import { applySafePortfolioActions } from "@/lib/portfolio-autopilot/apply-safe-portfolio-actions";
import { requirePortfolioOwnerOrAdmin } from "@/lib/portfolio-autopilot/portfolio-guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { ownerUserId?: string };
  const gate = await requirePortfolioOwnerOrAdmin({
    targetOwnerUserId: body.ownerUserId ?? undefined,
  });
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const result = await applySafePortfolioActions({
      ownerUserId: gate.effectiveOwnerId,
      performedByUserId: gate.userId,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Apply failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
