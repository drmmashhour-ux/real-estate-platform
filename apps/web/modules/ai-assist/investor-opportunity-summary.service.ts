import { prisma } from "@/lib/db";
import type { AiAssistResult } from "./ai-assist.types";
import type { AiRecommendationItem } from "./ai-assist.types";

/**
 * Summarizes active investment recommendations — **informational only**, no trading execution.
 */
export async function getInvestorOpportunitySummary(opts?: {
  limit?: number;
}): Promise<AiAssistResult<{ items: AiRecommendationItem[] }>> {
  try {
    const limit = Math.min(opts?.limit ?? 15, 50);

    const rows = await prisma.investmentRecommendation.findMany({
      where: { status: "active" },
      orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
      take: limit,
      select: {
        id: true,
        scopeType: true,
        scopeId: true,
        recommendation: true,
        score: true,
        confidenceScore: true,
      },
    });

    const items: AiRecommendationItem[] = rows.map((r) => ({
      id: `inv:${r.id}`,
      hub: "investor",
      actionClass: "recommendation",
      title: `${r.recommendation.toUpperCase()} (${r.scopeType}:${r.scopeId.slice(0, 8)}…)`,
      body: `Score ${r.score.toFixed(2)}; confidence ${r.confidenceScore.toFixed(2)}. Read-only synthesis from stored recommendation rows — not investment advice.`,
      reasonCodes: [
        { code: "SOURCE_DB", message: "investment_recommendations" },
        { code: "DISCLAIMER", message: "Informational summary only; no execution" },
      ],
      refs: { recommendationId: r.id },
    }));

    return { ok: true, value: { items } };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "investor summary failed",
      code: "INVESTOR_SUMMARY",
    };
  }
}
