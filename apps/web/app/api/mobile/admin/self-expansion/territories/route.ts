import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { buildExpansionContext } from "@/modules/self-expansion/self-expansion.engine";
import { scoreTerritoryExpansion } from "@/modules/self-expansion/self-expansion-territory-scoring.service";
import { loadLearningWeights } from "@/modules/self-expansion/self-expansion-learning.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const ctx = await buildExpansionContext();
    const learning = await loadLearningWeights();
    const ranked = ctx.territories
      .map((t) => ({
        territoryId: t.territoryId,
        city: t.city,
        expansionScore: scoreTerritoryExpansion(t, learning).expansionScore,
        readinessBand: t.readinessBand,
        dominationScore: t.dominationScore,
      }))
      .sort((a, b) => b.expansionScore - a.expansionScore);

    return Response.json({
      generatedAt: ctx.generatedAt,
      territories: ranked,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "territories_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
