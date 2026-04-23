import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { getTerritoryDetail } from "@/modules/market-domination/market-domination.service";

export const dynamic = "force-dynamic";

/** GET — single territory drill-down for mobile admin. */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const territoryId = decodeURIComponent(id);

  try {
    const detail = getTerritoryDetail(territoryId);
    if (!detail?.territory) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    return Response.json(detail);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "market_domination_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
