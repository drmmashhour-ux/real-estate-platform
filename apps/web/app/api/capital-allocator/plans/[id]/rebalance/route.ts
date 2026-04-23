import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { rebalanceCapitalPlan } from "@/modules/capital-allocator/capital-rebalance.service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function canMutatePlan(planId: string): Promise<boolean> {
  const userId = await getGuestId();
  if (!userId) return false;
  const plan = await prisma.capitalAllocationPlan.findUnique({
    where: { id: planId },
    select: { scopeId: true },
  });
  if (!plan) return false;
  if (plan.scopeId === userId) return true;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const ok = await canMutatePlan(id);
    if (!ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as { additionalBudget?: number };
    const additionalBudget = typeof body.additionalBudget === "number" ? body.additionalBudget : NaN;
    if (!(additionalBudget > 0)) {
      return NextResponse.json({ error: "additionalBudget must be a positive number" }, { status: 400 });
    }

    const row = await rebalanceCapitalPlan(id, additionalBudget);
    return NextResponse.json({ success: true, row });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rebalance failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
