import { NextRequest, NextResponse } from "next/server";
import { requireCompanyAiAdmin } from "@/modules/company-ai/company-ai-api-guard";
import { getCompanyAiOverview } from "@/modules/company-ai/company-ai-overview.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireCompanyAiAdmin();
  if (!auth.ok) return auth.response;

  const propose = req.nextUrl.searchParams.get("propose") === "1";
  const data = await getCompanyAiOverview({ refreshAdaptations: propose });

  return NextResponse.json({
    windows: data.windows,
    patterns: data.patterns,
    proposedAdaptations: data.proposedAdaptations,
    strategyMemoryTop: data.strategyMemoryTop,
    strategyMemoryWeak: data.strategyMemoryWeak,
    recentAdaptationEvents: data.recentAdaptationEvents,
  });
}
