import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import { prisma } from "@/lib/db";
import { loadOperationalTrustLatestForTargetType } from "@/modules/trust-score/trust-score-admin.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request) {
  try {
    await requireMobileAdmin(request);
  } catch (e) {
    const status = (e as Error & { status?: number })?.status ?? 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  try {
    const brokers = await loadOperationalTrustLatestForTargetType(prisma, "BROKER");
    return NextResponse.json({ brokers, generatedAt: new Date().toISOString() });
  } catch (e) {
    console.error("[mobile/admin/trust-score/brokers]", e);
    return NextResponse.json({ error: "brokers_failed" }, { status: 500 });
  }
}
