import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const item = await prisma.portfolioAutopilotRecommendation.update({
      where: { id: body.recommendationId },
      data: { dismissed: true },
    });

    // Audit: Recommendation dismissed
    await prisma.auditLog.create({
      data: {
        action: "PORTFOLIO_RECOMMENDATION_DISMISSED",
        entityType: "PortfolioAutopilotRecommendation",
        entityId: item.id,
        metadata: { reviewId: item.portfolioAutopilotReviewId },
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error("[Autopilot Recommendation Dismiss Error]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
