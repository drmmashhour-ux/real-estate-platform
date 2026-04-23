import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";

export const dynamic = "force-dynamic";

function priorityRank(p: string): number {
  const x = p.toLowerCase();
  if (x === "high") return 3;
  if (x === "medium") return 2;
  return 1;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await req.json().catch(() => ({}))) as { reviewId?: string };
    if (!body.reviewId) {
      return NextResponse.json({ success: false, error: "reviewId required" }, { status: 400 });
    }

    const review = await prisma.portfolioAutopilotReview.findFirst({
      where: { id: body.reviewId, portfolioId: auth.id },
    });
    if (!review) {
      return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const items = await prisma.portfolioAutopilotRecommendation.findMany({
      where: {
        portfolioAutopilotReviewId: body.reviewId,
        dismissed: false,
      },
      orderBy: { createdAt: "desc" },
    });

    items.sort(
      (a, b) =>
        priorityRank(b.priority) - priorityRank(a.priority) ||
        b.createdAt.getTime() - a.createdAt.getTime()
    );

    return NextResponse.json({ success: true, items });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[autopilot/portfolio/recommendations]", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
