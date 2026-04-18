import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getPricingPlans, getPricingModelExplanation } from "@/modules/business";

export const dynamic = "force-dynamic";

/** GET — refresh server-side view of pricing config (env-based; no hot reload). */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  return NextResponse.json({
    ok: true,
    plans: getPricingPlans(),
    explainer: getPricingModelExplanation(),
    note: "Values come from env + code constants; restart or redeploy to apply env changes.",
  });
}
