import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await req.json().catch(() => ({}))) as { recommendationId?: string };
    if (!body.recommendationId) {
      return NextResponse.json({ success: false, error: "recommendationId required" }, { status: 400 });
    }

    const rec = await prisma.portfolioAutopilotRecommendation.findUnique({
      where: { id: body.recommendationId },
    });
    if (!rec) {
      return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const review = await prisma.portfolioAutopilotReview.findFirst({
      where: { id: rec.portfolioAutopilotReviewId, portfolioId: auth.id },
    });
    if (!review) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const item = await prisma.portfolioAutopilotRecommendation.update({
      where: { id: body.recommendationId },
      data: { dismissed: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.id,
        action: "PORTFOLIO_AUTOPILOT_RECOMMENDATION_DISMISSED",
        entityType: "PortfolioAutopilotRecommendation",
        entityId: item.id,
        metadata: { reviewId: item.portfolioAutopilotReviewId } as object,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[autopilot/portfolio/recommendations/dismiss]", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
