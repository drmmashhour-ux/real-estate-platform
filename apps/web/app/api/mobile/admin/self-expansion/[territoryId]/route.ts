import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { prisma } from "@/lib/db";
import {
  buildTerritoryRecommendationDraft,
  generateExpansionRecommendations,
} from "@/modules/self-expansion/self-expansion-recommendation.service";
import { buildExpansionContext, playbookCompletionMap } from "@/modules/self-expansion/self-expansion.engine";
import { loadLearningWeights } from "@/modules/self-expansion/self-expansion-learning.service";
import { getTerritoryDetail } from "@/modules/market-domination/market-domination.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, ctx: { params: Promise<{ territoryId: string }> }) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { territoryId } = await ctx.params;

  try {
    const context = await buildExpansionContext();
    const profile = context.territories.find((t) => t.territoryId === territoryId);
    if (!profile) {
      return Response.json({ error: "territory_not_found" }, { status: 404 });
    }

    const [learningWeights, playbook, domDetail, history] = await Promise.all([
      loadLearningWeights(),
      playbookCompletionMap(),
      Promise.resolve(getTerritoryDetail(territoryId)),
      prisma.lecipmSelfExpansionRecommendation.findMany({
        where: { territoryId },
        orderBy: { lastRefreshedAt: "desc" },
        take: 24,
      }),
    ]);

    const draft = buildTerritoryRecommendationDraft(
      profile,
      context,
      learningWeights,
      playbook[territoryId] ?? null
    );

    return Response.json({
      territoryId,
      profile,
      dominationDetail: domDetail,
      recommendation: draft,
      recommendationHistory: history,
      allRanked: generateExpansionRecommendations(context, learningWeights, playbook).find(
        (r) => r.territoryId === territoryId
      ),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "territory_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
