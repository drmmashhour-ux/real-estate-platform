import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createPlan } from "@/lib/monetization";
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
 * POST /api/admin/monetization/plans – create a pricing plan.
 * In production, restrict to admin role.
 */
export async function POST(request: NextRequest) {
  try {
    await getGuestId();
    const body = await request.json().catch(() => ({}));
    const {
      name,
      slug,
      module: mod,
      billingCycle,
      amountCents,
      currency,
      trialDays,
      features,
      active,
      marketId,
    } = body;
    if (!name || !slug || !mod || !billingCycle || typeof amountCents !== "number") {
      return Response.json(
        { error: "name, slug, module, billingCycle, amountCents required" },
        { status: 400 }
      );
    }
    if (!MODULES.includes(mod)) {
      return Response.json({ error: "Invalid module" }, { status: 400 });
    }
    if (!CYCLES.includes(billingCycle)) {
      return Response.json({ error: "Invalid billingCycle" }, { status: 400 });
    }
    const plan = await createPlan({
      name,
      slug,
      module: mod as SubscriptionPlanModule,
      billingCycle: billingCycle as BillingCycle,
      amountCents: Number(amountCents),
      currency: currency ?? "USD",
      trialDays: trialDays != null ? Number(trialDays) : 0,
      features: features ?? null,
      active: active !== false,
      marketId: marketId ?? null,
    });
    return Response.json(plan);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create plan";
    return Response.json({ error: message }, { status: 400 });
  }
}
