import { NextResponse } from "next/server";
import { runPortfolioAutopilot } from "@/lib/portfolio-autopilot/run-portfolio-autopilot";
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
    const result = await runPortfolioAutopilot({
      ownerUserId: gate.effectiveOwnerId,
      performedByUserId: gate.userId,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Run failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
