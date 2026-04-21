import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ensureRetrofitAccess } from "@/modules/esg/esg-retrofit-planner.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId } = await context.params;
  if (!listingId?.trim()) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const ok = await ensureRetrofitAccess(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const strategy = req.nextUrl.searchParams.get("strategy")?.trim() ?? "OPTIMIZED";
  const planId = req.nextUrl.searchParams.get("planId")?.trim();

  try {
    const plan =
      planId ?
        await prisma.esgRetrofitPlan.findFirst({
          where: { id: planId, listingId },
          include: { financingOptions: true },
        })
      : await prisma.esgRetrofitPlan.findFirst({
          where: { listingId, strategyType: strategy },
          include: { financingOptions: true },
          orderBy: { updatedAt: "desc" },
        });

    if (!plan) {
      return NextResponse.json({
        financingOptions: [] as unknown[],
        message: "Generate a retrofit plan first.",
      });
    }

    const options = plan.financingOptions.map((f) => ({
      type: f.financingType,
      name: f.name,
      applicability: f.priority,
      coverageBand: f.costCoverageBand,
      benefit: f.benefitType,
      priority: f.priority,
      reasoning: f.reasoning ?? f.notes,
    }));

    return NextResponse.json({ planId: plan.id, strategyType: plan.strategyType, financingOptions: options });
  } catch {
    return NextResponse.json({ error: "Unable to load financing options" }, { status: 500 });
  }
}
