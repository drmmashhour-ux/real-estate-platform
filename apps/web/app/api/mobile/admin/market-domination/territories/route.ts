import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { buildMarketDominationSnapshot } from "@/modules/market-domination/market-domination.service";

export const dynamic = "force-dynamic";

/** GET — territory list with domination and readiness bands. */
export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const snap = buildMarketDominationSnapshot();
    const territories = snap.territories.map((t) => ({
      id: t.id,
      name: t.name,
      scope: t.scope,
      regionLabel: t.regionLabel,
      domination: snap.dominationByTerritory[t.id],
      readiness: snap.readinessByTerritory[t.id],
      competitorPressure: snap.competitorByTerritory[t.id]?.pressureScore ?? 0,
    }));
    return Response.json({ generatedAtIso: snap.generatedAtIso, territories });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "market_domination_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
