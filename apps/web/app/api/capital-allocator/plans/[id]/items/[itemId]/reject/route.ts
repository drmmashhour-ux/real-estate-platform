import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { rejectCapitalAllocationItem } from "@/modules/capital-allocator/capital-plan-actions.service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string; itemId: string }>;
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

export async function POST(_: Request, context: RouteContext) {
  try {
    const { id: planId, itemId } = await context.params;
    const ok = await canMutatePlan(planId);
    if (!ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const item = await prisma.capitalAllocationItem.findUnique({
      where: { id: itemId },
      select: { planId: true },
    });
    if (!item || item.planId !== planId) {
      return NextResponse.json({ error: "Item not found for this plan" }, { status: 404 });
    }

    const plan = await rejectCapitalAllocationItem(itemId);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found after update" }, { status: 500 });
    }
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reject failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
