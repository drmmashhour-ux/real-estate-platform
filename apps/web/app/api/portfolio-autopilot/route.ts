import { NextResponse } from "next/server";
import { getPortfolioOverview } from "@/lib/portfolio-autopilot/get-portfolio-overview";
import { requirePortfolioOwnerOrAdmin } from "@/lib/portfolio-autopilot/portfolio-guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get("ownerUserId");
  const gate = await requirePortfolioOwnerOrAdmin({ targetOwnerUserId: target });
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const overview = await getPortfolioOverview(gate.effectiveOwnerId);
  return NextResponse.json({
    ...overview,
    effectiveOwnerId: gate.effectiveOwnerId,
    isAdmin: gate.isAdmin,
  });
}
