import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { generatePortfolioAutopilotReview } from "@/lib/autopilot/generator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      portfolioId?: string;
      reviewType?: string;
    };

    const item = await generatePortfolioAutopilotReview(
      auth.id,
      body.portfolioId,
      body.reviewType ?? "manual"
    );

    return NextResponse.json({ success: true, item });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: msg }, { status: 403 });
    }
    if (msg === "PORTFOLIO_NOT_FOUND") {
      return NextResponse.json({ success: false, error: msg }, { status: 404 });
    }
    if (msg === "GUARANTEED_PERFORMANCE_LANGUAGE_FORBIDDEN" || msg === "AUTONOMOUS_TRANSACTION_FORBIDDEN") {
      return NextResponse.json({ success: false, error: msg }, { status: 422 });
    }
    console.error("[autopilot/portfolio/generate]", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
