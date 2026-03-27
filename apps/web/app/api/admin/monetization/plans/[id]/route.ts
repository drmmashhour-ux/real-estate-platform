import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPlanById, updatePlan } from "@/lib/monetization";
import type { BillingCycle, SubscriptionPlanModule } from "@prisma/client";

export const dynamic = "force-dynamic";

const MODULES: SubscriptionPlanModule[] = [
  "BROKER_CRM",
  "HOST_PRO",
  "OWNER_ANALYTICS",
  "INVESTOR_ANALYTICS",
  "ENTERPRISE",
];
const CYCLES: BillingCycle[] = ["MONTHLY", "YEARLY"];

/**
 * PUT /api/admin/monetization/plans/:id – update a pricing plan.
 * In production, restrict to admin role.
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id } = await context.params;
    const existing = await getPlanById(id);
    if (!existing) return Response.json({ error: "Plan not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const {
      name,
      module: mod,
      billingCycle,
      amountCents,
      currency,
      trialDays,
      features,
      active,
      marketId,
    } = body;

    const data: Parameters<typeof updatePlan>[1] = {};
    if (name !== undefined) data.name = name;
    if (mod !== undefined) {
      if (!MODULES.includes(mod)) return Response.json({ error: "Invalid module" }, { status: 400 });
      data.module = mod as SubscriptionPlanModule;
    }
    if (billingCycle !== undefined) {
      if (!CYCLES.includes(billingCycle)) return Response.json({ error: "Invalid billingCycle" }, { status: 400 });
      data.billingCycle = billingCycle as BillingCycle;
    }
    if (amountCents !== undefined) data.amountCents = Number(amountCents);
    if (currency !== undefined) data.currency = currency;
    if (trialDays !== undefined) data.trialDays = Number(trialDays);
    if (features !== undefined) data.features = features;
    if (active !== undefined) data.active = !!active;
    if (marketId !== undefined) data.marketId = marketId;

    const plan = await updatePlan(id, data);
    return Response.json(plan);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update plan";
    return Response.json({ error: message }, { status: 400 });
  }
}
