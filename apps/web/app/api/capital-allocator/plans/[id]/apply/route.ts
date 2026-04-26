import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { applyCapitalPlan } from "@/modules/capital-allocator/capital-plan-actions.service";

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

export async function POST(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const ok = await canMutatePlan(id);
    if (!ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const row = await applyCapitalPlan(id);
    return NextResponse.json({ success: true, row });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Apply failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
