import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { prisma } from "@/lib/db";
import { buildExpansionRecommendationSet } from "@/modules/self-expansion/self-expansion.engine";
import { summarizeLearningPatterns } from "@/modules/self-expansion/self-expansion-learning.service";
import { loadLearningWeights } from "@/modules/self-expansion/self-expansion-learning.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const [{ context, recommendations }, weights, pending] = await Promise.all([
      buildExpansionRecommendationSet(),
      loadLearningWeights(),
      prisma.lecipmSelfExpansionRecommendation.findMany({
        where: { decisionStatus: "PROPOSED" },
        orderBy: { expansionScore: "desc" },
        take: 15,
      }),
    ]);

    const urgent = recommendations.filter((r) => r.urgency === "high" || r.urgency === "critical").slice(0, 8);
    const active = await prisma.lecipmSelfExpansionRecommendation.findMany({
      where: { decisionStatus: { in: ["APPROVED", "IN_PROGRESS"] } },
      orderBy: { lastRefreshedAt: "desc" },
      take: 12,
    });

    return Response.json({
      generatedAt: context.generatedAt,
      topFive: recommendations.slice(0, 5),
      highestUrgency: urgent,
      pendingQueue: pending,
      activeLaunches: active,
      learningPatterns: summarizeLearningPatterns(weights),
      disclaimer: context.regulatoryDisclaimer,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "self_expansion_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
