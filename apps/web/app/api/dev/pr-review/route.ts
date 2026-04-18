import { NextRequest, NextResponse } from "next/server";
import { assertDeployToolAuthorized } from "@/lib/dev/deploy-tool-gate";
import { runPrReview } from "@/modules/pr-review/pr-review.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/dev/pr-review?base=origin/main&head=HEAD
 *
 * LECIPM PR risk assistant — requires `PR_REVIEW_SECRET` + `x-pr-review-secret` on deployed envs.
 */
export async function GET(req: NextRequest) {
  const denied = assertDeployToolAuthorized(req);
  if (denied) return denied;

  const base = req.nextUrl.searchParams.get("base") ?? undefined;
  const head = req.nextUrl.searchParams.get("head") ?? undefined;

  const result = runPrReview({ base, head });

  return NextResponse.json({
    riskLevel: result.riskLevel,
    criticalChanges: result.criticalChanges,
    warnings: result.warnings,
    recommendation: result.recommendation,
    base: result.base,
    head: result.head,
    gitAvailable: result.gitAvailable,
    notes: result.notes,
    summaryMarkdown: result.summaryMarkdown,
  });
}
