import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import { prisma } from "@/lib/db";
import { loadOperationalTrustMobileSummary } from "@/modules/trust-score/trust-score-admin.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request) {
  try {
    await requireMobileAdmin(request);
  } catch (e) {
    const status = (e as Error & { status?: number })?.status ?? 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  try {
    const summary = await loadOperationalTrustMobileSummary(prisma);
    return NextResponse.json({ summary, generatedAt: new Date().toISOString() });
  } catch (e) {
    console.error("[mobile/admin/trust-score/summary]", e);
    return NextResponse.json({ error: "summary_failed" }, { status: 500 });
  }
}
