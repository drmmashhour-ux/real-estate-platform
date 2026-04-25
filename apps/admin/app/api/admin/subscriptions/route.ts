import { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { createSubscription } from "@/lib/subscription-billing";
import type { PlanSubscriptionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_STATUSES: PlanSubscriptionStatus[] = ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED", "EXPIRED"];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const statusParam = searchParams.get("status");
    const status = statusParam && VALID_STATUSES.includes(statusParam as PlanSubscriptionStatus)
      ? (statusParam as PlanSubscriptionStatus)
      : undefined;
    const where: { userId?: string; status?: PlanSubscriptionStatus } = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    const list = await prisma.planSubscription.findMany({
      where,
      include: { plan: true },
      orderBy: { currentPeriodEnd: "desc" },
      take: 100,
    });
    return Response.json(list);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planId, trialDays } = body;
    if (!userId || !planId) {
      return Response.json({ error: "userId, planId required" }, { status: 400 });
    }
    const sub = await createSubscription({
      userId,
      planId,
      trialDays: trialDays != null ? Number(trialDays) : undefined,
    });
    return Response.json(sub);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
