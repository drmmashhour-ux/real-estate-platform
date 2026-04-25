import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { analyzeContentOptimizationSignals } from "@/lib/content-machine/optimization";
import { runContentOptimizationLoop } from "@/lib/content-machine/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Inspect top-percentile styles and hooks (no generation). */
export async function GET(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const url = new URL(req.url);
  const p = url.searchParams.get("percentile");
  const percentile = p != null ? Number.parseFloat(p) : 0.1;
  const signals = await analyzeContentOptimizationSignals(Number.isFinite(percentile) ? percentile : 0.1);
  return NextResponse.json({ signals });
}

/**
 * Run the self-improving loop: analyze top ~10% → regenerate batches for a listing set using those signals.
 */
export async function POST(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const body = (await req.json().catch(() => ({}))) as {
    percentile?: unknown;
    listingLimit?: unknown;
    listingIds?: unknown;
    skipSchedule?: unknown;
  };

  const rawP = body.percentile;
  const percentileFraction =
    typeof rawP === "number" && Number.isFinite(rawP) ? rawP : typeof rawP === "string" ? Number.parseFloat(rawP) : 0.1;

  const rawL = body.listingLimit;
  const listingLimit =
    typeof rawL === "number" && Number.isFinite(rawL)
      ? Math.floor(rawL)
      : typeof rawL === "string"
        ? Number.parseInt(rawL, 10)
        : 12;

  const listingIds = Array.isArray(body.listingIds)
    ? body.listingIds.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim())
    : undefined;

  const skipSchedule = body.skipSchedule === true;

  const { signals, results } = await runContentOptimizationLoop({
    percentileFraction: Number.isFinite(percentileFraction) ? percentileFraction : 0.1,
    listingLimit: Number.isFinite(listingLimit) ? listingLimit : 12,
    listingIds,
    skipSchedule,
  });

  return NextResponse.json({ ok: true, signals, results });
}
