import { NextRequest, NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { isAutonomyOsDynamicPricingEnabled } from "@/modules/autonomy/lib/autonomy-layer-gate";
import { logAutonomy } from "@/modules/autonomy/lib/autonomy-log";
import { persistAutonomyPricingDecision } from "@/modules/autonomy/api/autonomy-os-persist.service";
import { buildDynamicPricingDecision } from "@/modules/autonomy/pricing/dynamic-pricing.service";

export async function POST(req: NextRequest) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  if (!isAutonomyOsDynamicPricingEnabled()) {
    return NextResponse.json(
      { error: "Autonomy OS dynamic pricing is disabled (FEATURE_AUTONOMY_CORE_V1 + FEATURE_DYNAMIC_PRICING_V1)." },
      { status: 503 },
    );
  }

  const body = (await req.json()) as {
    input: Parameters<typeof buildDynamicPricingDecision>[0];
    mode?: Parameters<typeof buildDynamicPricingDecision>[1];
  };

  const decision = buildDynamicPricingDecision(body.input, body.mode ?? "ASSIST");

  logAutonomy("[autonomy:pricing:decision]", { listingId: decision.listingId });

  await persistAutonomyPricingDecision(decision);

  return NextResponse.json({
    success: true,
    decision,
  });
}
