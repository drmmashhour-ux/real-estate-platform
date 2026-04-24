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
    const listings = await loadOperationalTrustLatestForTargetType(prisma, "LISTING");
    return NextResponse.json({ listings, generatedAt: new Date().toISOString() });
  } catch (e) {
    console.error("[mobile/admin/trust-score/listings]", e);
    return NextResponse.json({ error: "listings_failed" }, { status: 500 });
  }
}
