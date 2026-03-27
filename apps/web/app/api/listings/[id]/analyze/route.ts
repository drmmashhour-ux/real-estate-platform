import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getListingById } from "@/lib/bnhub/listings";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { DemoEvents } from "@/lib/demo-event-types";
import { demoSnapshotToInput, listingToAnalyzerInput } from "@/modules/ai-deal-analyzer/services/map-listing-to-input";
import { mergeInputWithOverrides, runDealAnalysis } from "@/modules/ai-deal-analyzer/services/run-deal-analysis";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

function parseOptionalNumber(v: unknown, field: string, opts: { min?: number; max?: number }): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) throw new Error(`Invalid ${field}`);
  if (opts.min != null && n < opts.min) throw new Error(`${field} out of range`);
  if (opts.max != null && n > opts.max) throw new Error(`${field} out of range`);
  return n;
}

/** POST /api/listings/:id/analyze — illustrative deal metrics (no DB writes). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = clientIp(request);
  const limit = checkRateLimit(`listing:analyze:${ip}`, { windowMs: 60_000, max: 30 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  let id: string;
  try {
    id = (await params).id?.trim() ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!id) {
    return NextResponse.json({ error: "Listing id required" }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    const raw = await request.text();
    if (raw) body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const overrides: Parameters<typeof mergeInputWithOverrides>[1] = {};
  try {
    if ("estimatedRent" in body) {
      overrides.estimatedRent = parseOptionalNumber(body.estimatedRent, "estimatedRent", { min: 0, max: 500_000 });
    }
    if ("condoFeesMonthly" in body) {
      overrides.condoFeesMonthly = parseOptionalNumber(body.condoFeesMonthly, "condoFeesMonthly", {
        min: 0,
        max: 50_000,
      });
    }
    if ("propertyTaxAnnual" in body) {
      overrides.propertyTaxAnnual = parseOptionalNumber(body.propertyTaxAnnual, "propertyTaxAnnual", {
        min: 0,
        max: 500_000,
      });
    }
    if ("downPaymentPercent" in body) {
      overrides.downPaymentPercent = parseOptionalNumber(body.downPaymentPercent, "downPaymentPercent", {
        min: 0,
        max: 95,
      });
    }
    if ("mortgageRate" in body) {
      overrides.mortgageRate = parseOptionalNumber(body.mortgageRate, "mortgageRate", { min: 0, max: 25 });
    }
    if ("amortizationYears" in body) {
      overrides.amortizationYears = parseOptionalNumber(body.amortizationYears, "amortizationYears", {
        min: 5,
        max: 40,
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const listing = await getListingById(id);
  const base = listing
    ? listingToAnalyzerInput(listing)
    : demoSnapshotToInput(id);

  if (!base) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const input = mergeInputWithOverrides(base, overrides);
  const result = runDealAnalysis(input);
  const userId = await getGuestId().catch(() => null);

  if (process.env.NEXT_PUBLIC_ENV === "staging") {
    const dp = input.downPaymentPercent;
    const rate = input.mortgageRate;
    await trackDemoEvent(
      DemoEvents.AI_DEAL_ANALYZER_USED,
      {
        listingId: id,
        hasEstimatedRent: input.estimatedRent != null && input.estimatedRent > 0,
        downPaymentPercent: dp,
        mortgageRate: rate,
      },
      userId
    );
    await trackDemoEvent(
      DemoEvents.AI_DEAL_ANALYZER_COMPLETED,
      {
        listingId: id,
        score: result.score,
        confidence: result.confidence,
      },
      userId
    );
  }

  return NextResponse.json({
    ok: true,
    listingId: id,
    result,
    assumptions: {
      price: input.price,
      priceIsIllustrative: input.priceIsIllustrative,
    },
  });
}
