import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { ensureDefaultPromotionPlans } from "@/lib/bnhub/promotion-plans";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureDefaultPromotionPlans();
  const plans = await prisma.bnhubPromotionPlan.findMany({
    where: { active: true },
    orderBy: [{ placement: "asc" }, { billingPeriod: "asc" }],
  });

  return NextResponse.json({ plans });
}
