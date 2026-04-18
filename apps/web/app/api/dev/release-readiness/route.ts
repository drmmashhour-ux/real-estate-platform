import { NextRequest, NextResponse } from "next/server";
import { assertDeployToolAuthorized } from "@/lib/dev/deploy-tool-gate";
import { evaluateRemoteReleaseReadiness } from "@/modules/deployment/release-blocker.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/dev/release-readiness?origin=https://your-app.vercel.app
 *
 * Runs remote health/ready checks. Requires `PR_REVIEW_SECRET` + `x-pr-review-secret` when deployed.
 */
export async function GET(req: NextRequest) {
  const denied = assertDeployToolAuthorized(req);
  if (denied) return denied;

  const origin = req.nextUrl.searchParams.get("origin")?.trim();
  if (!origin || !/^https?:\/\//i.test(origin)) {
    return NextResponse.json(
      { error: "Query `origin` must be an absolute URL (https://...)" },
      { status: 400 },
    );
  }

  const result = await evaluateRemoteReleaseReadiness(origin);
  return NextResponse.json(result, { status: result.go ? 200 : 503 });
}
