import { PlatformRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import { listDisputesForUser } from "@/modules/dispute-room/dispute-case.service";
import { loadDisputeObservabilityMetrics } from "@/modules/disputes/dispute.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let adminId: string;
  try {
    const u = await requireMobileAdmin(request);
    adminId = u.id;
  } catch (e) {
    const status = (e as Error & { status?: number })?.status ?? 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  try {
    const [metrics, disputes] = await Promise.all([
      loadDisputeObservabilityMetrics(),
      listDisputesForUser({
        userId: adminId,
        role: PlatformRole.ADMIN,
      }),
    ]);
    return NextResponse.json({
      metrics,
      disputes: disputes.slice(0, 80),
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[mobile admin disputes summary]", e);
    return NextResponse.json({ error: "summary_failed" }, { status: 500 });
  }
}
