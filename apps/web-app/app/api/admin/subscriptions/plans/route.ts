import { NextRequest } from "next/server";
import { getSubscriptionPlans } from "@/lib/subscription-billing";
import { prisma } from "@/lib/db";
import type { SubscriptionPlanModule, BillingCycle } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const module = searchParams.get("module") as SubscriptionPlanModule | undefined;
    const plans = await getSubscriptionPlans({ module });
    return Response.json(plans);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, module, billingCycle, amountCents, trialDays, features } = body;
    if (!name || !slug || !module || !billingCycle || amountCents == null) {
      return Response.json(
        { error: "name, slug, module, billingCycle, amountCents required" },
        { status: 400 }
      );
    }
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        slug,
        module: module as SubscriptionPlanModule,
        billingCycle: billingCycle as BillingCycle,
        amountCents: Number(amountCents),
        trialDays: trialDays ?? 0,
        features: features ?? undefined,
      },
    });
    return Response.json(plan);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to create plan" }, { status: 500 });
  }
}
