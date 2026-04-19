import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { leadPricingResultsFlags } from "@/config/feature-flags";
import { buildLeadPricingModePerformance } from "@/modules/leads/lead-pricing-results.service";

export const dynamic = "force-dynamic";

/** GET — aggregate outcome bands by pricing advisory mode (evaluated observations only). */
export async function GET() {
  if (!leadPricingResultsFlags.leadPricingResultsV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const modes = await buildLeadPricingModePerformance();
  return NextResponse.json({ modes });
}
