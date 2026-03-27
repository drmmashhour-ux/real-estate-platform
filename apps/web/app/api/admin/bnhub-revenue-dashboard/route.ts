import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { ensureDefaultPromotionPlans } from "@/lib/bnhub/promotion-plans";
import { computeBnhubRevenueDashboard } from "@/lib/bnhub/revenue-dashboard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days = Math.min(365, Math.max(1, Number(searchParams.get("days") || 30)));

  await ensureDefaultPromotionPlans();
  const snapshot = await computeBnhubRevenueDashboard(days);

  return NextResponse.json({
    snapshot,
    readiness: {
      revenueTracking: true,
      promotionCatalogSeeded: true,
      automationHooks: ["signup_suggest_listings", "booking_confirmed_upsell", "stay_completed_review_prompt", "no_booking_reminder"],
      stripePromotionOrders: "platformPaymentId on BnhubPromotionOrder — wire Stripe when going live",
    },
  });
}
