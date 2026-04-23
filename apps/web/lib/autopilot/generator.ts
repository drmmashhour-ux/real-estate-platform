import { prisma } from "@repo/db";
import { computePortfolioHealth } from "./portfolio-health";
import { generatePortfolioRecommendations } from "./recommendations";
import { buildPortfolioAutopilotPrompt } from "@/lib/ai/autopilot-portfolio";

export async function generatePortfolioAutopilotReview(portfolioId: string, reviewType = "manual") {
  const portfolio = await prisma.investorPortfolio.findUnique({
    where: { id: portfolioId },
    include: { properties: true },
  });

  if (!portfolio) throw new Error("PORTFOLIO_NOT_FOUND");

  const health = computePortfolioHealth({
    properties: portfolio.properties,
  });

  const ruleRecommendations = generatePortfolioRecommendations({
    properties: portfolio.properties,
    health,
  });

  const prompt = buildPortfolioAutopilotPrompt({
    health,
    properties: portfolio.properties,
    recommendations: ruleRecommendations,
  });

  // Call internal AI endpoint - using shared endpoint for all apps as per previous extraction plan
  const AI_ENDPOINT = process.env.AI_ENDPOINT || "https://api.lecipm.com/api/ai";
  
  const res = await fetch(`${AI_ENDPOINT}/internal-draft`, {
    method: "POST",
    body: JSON.stringify({ prompt }),
    headers: { "Content-Type": "application/json" },
  });

  const ai = await res.json();

  // Safety rule: Autopilot summary must not promise performance
  const summaryText = ai.summary ?? "";
  if (
    /guarantee|promise|will return|guaranteed|certain/i.test(summaryText) &&
    /profit|roi|yield|return/i.test(summaryText)
  ) {
    throw new Error("GUARANTEED_PERFORMANCE_LANGUAGE_FORBIDDEN");
  }

  const review = await prisma.portfolioAutopilotReview.create({
    data: {
      portfolioId,
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

  // Audit: Portfolio review generated
  await prisma.auditLog.create({
    data: {
      action: "PORTFOLIO_REVIEW_GENERATED",
      entityType: "PortfolioAutopilotReview",
      entityId: review.id,
      metadata: { portfolioId, reviewType },
    },
  });

  for (let i = 0; i < ruleRecommendations.length; i++) {
    const r = ruleRecommendations[i];

    // Safety rule: Prevent autonomous transactions
    if (
      ["buy", "sell", "list", "transfer"].includes(r.recommendationType) &&
      !r.requiresApproval
    ) {
      throw new Error("AUTONOMOUS_TRANSACTION_FORBIDDEN");
    }

    const aiMatch = (ai.recommendations ?? []).find((x: any) => x.title === r.title);

    const rec = await prisma.portfolioAutopilotRecommendation.create({
      data: {
        portfolioAutopilotReviewId: review.id,
        recommendationType: r.recommendationType,
        priority: aiMatch?.priority ?? r.priority,
        title: r.title,
        description: r.description,
        propertyId: r.propertyId ?? null,
        neighborhoodKey: r.neighborhoodKey ?? null,
        rationale: r.rationale ?? {},
        aiSummary: aiMatch?.aiSummary ?? null,
        requiresApproval: true,
      },
    });

    // Audit: Recommendation created
    await prisma.auditLog.create({
      data: {
        action: "PORTFOLIO_RECOMMENDATION_CREATED",
        entityType: "PortfolioAutopilotRecommendation",
        entityId: rec.id,
        metadata: { reviewId: review.id, type: r.recommendationType },
      },
    });
  }

  return review;
}
