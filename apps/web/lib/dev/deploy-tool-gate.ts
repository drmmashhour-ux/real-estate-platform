import { NextRequest, NextResponse } from "next/server";

/**
 * Protects `/api/dev/*` tooling on deployed environments.
 * In production, set `PR_REVIEW_SECRET` and pass `x-pr-review-secret` (or `x-lecipm-dev-secret`).
 */
export function assertDeployToolAuthorized(req: NextRequest): NextResponse | null {
  const secret = process.env.PR_REVIEW_SECRET?.trim();
  const header =
    req.headers.get("x-pr-review-secret")?.trim() ?? req.headers.get("x-lecipm-dev-secret")?.trim();

  if (secret && header === secret) return null;

  if (process.env.NODE_ENV === "development" && !secret) return null;

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
