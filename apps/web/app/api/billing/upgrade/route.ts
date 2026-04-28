import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { PAID_STORAGE_PLAN_KEYS, plans, type PlanKey } from "@/lib/billing/plans";
import { requireCheckoutRailsOpen } from "@/lib/payment-readiness/route-guards";

export const dynamic = "force-dynamic";

const VALID_UPGRADE_PLANS: PlanKey[] = PAID_STORAGE_PLAN_KEYS;

/**
 * POST /api/billing/upgrade
 * Body: { plan: "basic" | "pro" }
 * Updates user's storage limit and creates an upgrade invoice. Mock payment → Stripe later.
 */
export async function POST(request: NextRequest) {
  try {
    const railBlock = requireCheckoutRailsOpen();
    if (railBlock) return railBlock;

    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const plan = body?.plan as string | undefined;
    if (!plan || !VALID_UPGRADE_PLANS.includes(plan as PlanKey)) {
      return Response.json(
        { error: "plan must be basic or pro" },
        { status: 400 }
      );
    }

    const planConfig = plans[plan as PlanKey];
    const limitBytes = planConfig.storage;
    const amount = planConfig.price;

    await prisma.userStorage.upsert({
      where: { userId },
      create: {
        userId,
        usedBytes: 0,
        limitBytes,
      },
      update: { limitBytes },
    });

    // Update User.plan when userId is a registered user
    await prisma.user.updateMany({
      where: { id: userId },
      data: { plan },
    });

    await prisma.upgradeInvoice.create({
      data: {
        userId,
        amount,
        plan,
      },
    });

    return Response.json({
      success: true,
      plan,
      limitBytes,
      amount,
      storageLabel: planConfig.storageLabel,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Upgrade failed" }, { status: 500 });
  }
}
