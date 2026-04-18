import { NextRequest, NextResponse } from "next/server";
import {
  cronNotConfigured,
  cronUnauthorized,
  verifyCronBearer,
} from "@/lib/server/internal-cron-auth";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

/** Placeholder scan hook — extend with price-drop watchers + save alerts. */
export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();
  if (!engineFlags.growthLoopsV1) {
    return NextResponse.json({ ok: false, error: "FEATURE_GROWTH_LOOPS_V1 disabled" }, { status: 403 });
  }
  return NextResponse.json({ ok: true, scanned: 0, message: "noop — wire alert pipelines here" });
}
