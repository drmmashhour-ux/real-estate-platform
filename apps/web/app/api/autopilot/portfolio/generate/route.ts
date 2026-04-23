import { NextResponse } from "next/server";
import { generatePortfolioAutopilotReview } from "@/lib/autopilot/generator";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const item = await generatePortfolioAutopilotReview(
      body.portfolioId,
      body.reviewType ?? "manual"
    );

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error("[Autopilot Generate Error]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
