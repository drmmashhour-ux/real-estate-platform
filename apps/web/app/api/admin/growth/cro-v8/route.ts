import { NextResponse } from "next/server";
import { croOptimizationV8Flags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { runCroV8OptimizationBundle } from "@/services/growth/cro-v8-optimization-bridge";

export const dynamic = "force-dynamic";

/**
 * V8-safe CRO bundle (read-only). Returns 404 when `FEATURE_CRO_V8_ANALYSIS_V1` is off — no change to public UX.
 */
export async function GET(req: Request) {
  if (!croOptimizationV8Flags.croV8AnalysisV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const u = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(u.searchParams.get("days") ?? "14")));
  const offsetDays = Math.min(30, Math.max(0, Number(u.searchParams.get("offsetDays") ?? "0")));

  const bundle = await runCroV8OptimizationBundle({ rangeDays: days, offsetDays });
  if (!bundle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, bundle });
}
