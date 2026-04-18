import { NextRequest, NextResponse } from "next/server";
import {
  cronNotConfigured,
  cronUnauthorized,
  verifyCronBearer,
} from "@/lib/server/internal-cron-auth";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

/** Reserved for materialized recommendation caches — currently noop. */
export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();
  if (!engineFlags.recommendationsV1) {
    return NextResponse.json({ ok: false, error: "FEATURE_RECOMMENDATIONS_V1 disabled" }, { status: 403 });
  }
  return NextResponse.json({ ok: true, rebuilt: 0 });
}
