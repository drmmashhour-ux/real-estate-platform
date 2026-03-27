import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/ai/logs – list AI decision logs with optional filters. Mock-safe: returns empty arrays on error. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") ?? undefined;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0);

    const where = action ? { action } : {};
    const [logs, count, evalCount, flaggedCount, trustScores] = await Promise.all([
      prisma.aiLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.aiLog.count({ where }),
      prisma.aiLog.count({ where: { action: "evaluate" } }),
      prisma.aiLog.count({ where: { riskScore: { gte: 40 } } }),
      prisma.aiLog.aggregate({
        where: { action: "trust_score", trustScore: { not: null } },
        _avg: { trustScore: true },
        _count: true,
      }),
    ]);

    const summary = {
      totalEvaluations: evalCount,
      flaggedRisks: flaggedCount,
      avgTrustScore:
        trustScores._count > 0 && trustScores._avg.trustScore != null
          ? Math.round(trustScores._avg.trustScore * 10) / 10
          : null,
      totalLogs: count,
    };

    return Response.json({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        riskScore: l.riskScore,
        trustLevel: l.trustLevel,
        trustScore: l.trustScore,
        recommendedPriceCents: l.recommendedPriceCents,
        details: l.details,
        createdAt: l.createdAt,
      })),
      summary,
    });
  } catch (_e) {
    return Response.json({
      logs: [],
      summary: {
        totalEvaluations: 0,
        flaggedRisks: 0,
        avgTrustScore: null,
        totalLogs: 0,
      },
    });
  }
}
