import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { logError } from "@/lib/monitoring/errorLogger";
import { executePricingRecommendations } from "@/lib/market/pricingExecutor";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

/**
 * POST /api/market/pricing-execute
 * Body: `{ "dryRun"?: boolean }` — default **true** (no writes). Manual admin trigger; future CRON can call with `Authorization: Bearer CRON_SECRET` + dryRun.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  // Future: if (request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET?.trim()}`) allow without session for safe CRON.
  let dryRun = true;
  try {
    const body = (await request.json().catch(() => ({}))) as { dryRun?: boolean };
    if (typeof body.dryRun === "boolean") {
      dryRun = body.dryRun;
    }
  } catch {
    /* empty body */
  }
  try {
    const result = await executePricingRecommendations({ dryRun });
    return NextResponse.json({
      executed: result.executed,
      skipped: result.skipped,
      changes: result.changes,
      dryRun,
      disabledReason: result.disabledReason,
    });
  } catch (e) {
    logError(e, { route: "/api/market/pricing-execute" });
    return NextResponse.json({ error: "Failed to run pricing execution" }, { status: 500 });
  }
}
