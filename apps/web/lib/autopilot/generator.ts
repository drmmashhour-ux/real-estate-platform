import { prisma } from "@/lib/db";
import { buildPortfolioAutopilotPrompt } from "@/lib/ai/autopilot-portfolio";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { computePortfolioHealth } from "@/lib/autopilot/portfolio-health";
import {
  loadAutopilotPropertiesForInvestorUser,
  resolveInvestorUserIdFromPortfolioKey,
} from "@/lib/autopilot/portfolio-data";
import { generatePortfolioRecommendations } from "@/lib/autopilot/recommendations";
import { assertAdvisoryPortfolioAiPayload } from "@/lib/autopilot/safety";

const MODEL = process.env.PORTFOLIO_AUTOPILOT_AI_MODEL?.trim() || "gpt-4o-mini";

export type PortfolioAutopilotAiShape = {
  summary: string;
  recommendations: Array<{ title: string; aiSummary: string; priority: string }>;
};

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseAutopilotJson(raw: string): PortfolioAutopilotAiShape {
  const cleaned = stripJsonFences(raw);
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  const recsRaw = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    recommendations: recsRaw.map((x) => {
      const o = x as Record<string, unknown>;
      return {
        title: typeof o.title === "string" ? o.title : "",
        aiSummary: typeof o.aiSummary === "string" ? o.aiSummary : "",
        priority: typeof o.priority === "string" ? o.priority : "medium",
      };
    }),
  };
}

function buildFallbackAi(input: {
  health: ReturnType<typeof computePortfolioHealth>;
  thinData: boolean;
}): PortfolioAutopilotAiShape {
  const conf = input.thinData
    ? " Some inputs are incomplete (holdings or saved deal analyses missing); treat scores as directional only."
    : "";
  return {
    summary: `Portfolio health score ${input.health.overallHealthScore}/100. Concentration risk ${input.health.concentrationRisk}, cashflow strength ${input.health.cashflowStrength}, growth ${input.health.growthStrength}, risk ${input.health.riskScore}.${conf} Recommendations below are rule-based drafts — review with a licensed professional before acting.`,
    recommendations: [],
  };
}

async function runPortfolioAutopilotModel(prompt: string): Promise<PortfolioAutopilotAiShape> {
  const client = openai;
  if (!isOpenAiConfigured() || !client) {
    throw new Error("OPENAI_NOT_CONFIGURED");
  }

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.35,
    max_tokens: 1600,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You output only valid JSON per the user schema. Advisory guidance only — never instruct autonomous trades, listings, or financing execution. Never promise guaranteed returns.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  if (!raw) throw new Error("EMPTY_PORTFOLIO_AUTOPILOT_AI");
  return parseAutopilotJson(raw);
}

/**
 * Resolve canonical investor user id for this review. `portfolioId` may be any `InvestorPortfolio` row id,
 * a `User` id, or omitted (uses `sessionUserId`).
 */
export async function resolveCanonicalInvestorUserId(
  portfolioId: string | null | undefined,
  sessionUserId: string
): Promise<{ userId: string } | { error: "NOT_FOUND" | "FORBIDDEN" }> {
  if (!portfolioId || portfolioId === "demo") {
    return { userId: sessionUserId };
  }

  const fromHolding = await resolveInvestorUserIdFromPortfolioKey(portfolioId);
  if (fromHolding) {
    if (fromHolding !== sessionUserId) return { error: "FORBIDDEN" };
    return { userId: fromHolding };
  }

  const asUser = await prisma.user.findUnique({
    where: { id: portfolioId },
    select: { id: true },
  });
  if (asUser) {
    if (asUser.id !== sessionUserId) return { error: "FORBIDDEN" };
    return { userId: asUser.id };
  }

  return { error: "NOT_FOUND" };
}

export async function generatePortfolioAutopilotReview(
  sessionUserId: string,
  portfolioId: string | null | undefined,
  reviewType = "manual"
) {
  const resolved = await resolveCanonicalInvestorUserId(portfolioId, sessionUserId);
  if ("error" in resolved) {
    throw new Error(resolved.error === "FORBIDDEN" ? "FORBIDDEN" : "PORTFOLIO_NOT_FOUND");
  }

  const { userId } = resolved;
  const { properties, thinData, holdingCount, dealCount } = await loadAutopilotPropertiesForInvestorUser(userId);

  const health = computePortfolioHealth({ properties });

  const ruleRecommendations = generatePortfolioRecommendations({
    properties,
    health,
  });

  const prompt = buildPortfolioAutopilotPrompt({
    health: { ...health, thinData, holdingCount, dealCount },
    properties,
    recommendations: ruleRecommendations,
  });

  let ai: PortfolioAutopilotAiShape;
  try {
    ai = await runPortfolioAutopilotModel(prompt);
  } catch (e) {
    if ((e as Error)?.message === "OPENAI_NOT_CONFIGURED") {
      ai = buildFallbackAi({ health, thinData });
    } else {
      throw e;
    }
  }

  assertAdvisoryPortfolioAiPayload(ai);

  const canonicalPortfolioKey = userId;

  const review = await prisma.portfolioAutopilotReview.create({
    data: {
      portfolioId: canonicalPortfolioKey,
      reviewType,
      status: "generated",
      overallHealthScore: health.overallHealthScore,
      concentrationRisk: health.concentrationRisk,
      cashflowStrength: health.cashflowStrength,
      growthStrength: health.growthStrength,
      riskScore: health.riskScore,
      summary: ai.summary ?? null,
    },
  });

  const totalValueCents = properties.reduce((s, p) => s + (p.currentValueCents ?? 0), 0);
  const totalCashflowCents = properties.reduce((s, p) => s + (p.monthlyCashflowCents ?? 0), 0);
  const capRates = properties.map((p) => p.capRate).filter((x): x is number => x != null && Number.isFinite(x));
  const rois = properties.map((p) => p.roiPercent).filter((x): x is number => x != null && Number.isFinite(x));
  const dscrs = properties.map((p) => p.dscr).filter((x): x is number => x != null && Number.isFinite(x));

  await prisma.portfolioPerformanceSnapshot.create({
    data: {
      portfolioId: canonicalPortfolioKey,
      date: new Date(),
      totalValueCents: totalValueCents || null,
      totalCashflowCents: totalCashflowCents || null,
      avgCapRate: capRates.length ? capRates.reduce((a, b) => a + b, 0) / capRates.length : null,
      avgROI: rois.length ? rois.reduce((a, b) => a + b, 0) / rois.length : null,
      avgDSCR: dscrs.length ? dscrs.reduce((a, b) => a + b, 0) / dscrs.length : null,
      metadata: {
        thinData,
        holdingCount,
        dealCount,
        reviewId: review.id,
      } as object,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "PORTFOLIO_AUTOPILOT_REVIEW_GENERATED",
      entityType: "PortfolioAutopilotReview",
      entityId: review.id,
      metadata: { portfolioId: canonicalPortfolioKey, reviewType, thinData } as object,
    },
  });

  for (const r of ruleRecommendations) {
    const aiMatch = ai.recommendations.find((x) => x.title && r.title && x.title === r.title);

    const rec = await prisma.portfolioAutopilotRecommendation.create({
      data: {
        portfolioAutopilotReviewId: review.id,
        recommendationType: r.recommendationType,
        priority: normalizePriority(aiMatch?.priority ?? r.priority),
        title: r.title,
        description: r.description ?? null,
        propertyId: r.propertyId ?? null,
        neighborhoodKey: r.neighborhoodKey ?? null,
        rationale: {
          ...(typeof r.rationale === "object" && r.rationale ? r.rationale : {}),
          thinData,
        } as object,
        aiSummary: aiMatch?.aiSummary ?? null,
        requiresApproval: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: "PORTFOLIO_AUTOPILOT_RECOMMENDATION_CREATED",
        entityType: "PortfolioAutopilotRecommendation",
        entityId: rec.id,
        metadata: { reviewId: review.id, recommendationType: r.recommendationType } as object,
      },
    });
  }

  return review;
}

function normalizePriority(p: string): string {
  const x = p.toLowerCase();
  if (x === "high" || x === "medium" || x === "low") return x;
  return "medium";
}
