import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const items = await prisma.portfolioAutopilotRecommendation.findMany({
      where: {
        portfolioAutopilotReviewId: body.reviewId,
        dismissed: false,
      },
      orderBy: [
        { priority: "desc" as any },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error("[Autopilot Recommendations List Error]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
