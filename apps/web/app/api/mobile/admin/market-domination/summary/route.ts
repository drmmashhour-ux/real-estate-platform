import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { buildMarketDominationMobileSummary } from "@/modules/market-domination/market-domination-mobile.service";

export const dynamic = "force-dynamic";

/** GET — executive snapshot for mobile admin (priority markets, gaps, readiness, competitor heat). */
export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const summary = buildMarketDominationMobileSummary();
    return Response.json(summary);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "market_domination_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
