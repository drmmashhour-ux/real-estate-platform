import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { hostEconomicsFlags } from "@/config/feature-flags";
import { buildRoiComparison, type RoiCalculatorInput } from "@/modules/roi";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { trackFunnelEvent } from "@/lib/funnel/tracker";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  nightlyRate: z.number().optional(),
  bookedNightsPerYear: z.number().optional(),
  occupancyRate: z.number().optional(),
  availableNightsPerYear: z.number().optional(),
  currentGrossRevenue: z.number().optional(),
  currentPlatformFeePercent: z.number().min(0).max(0.5),
  lecipmPlanKey: z.enum(["free", "pro", "growth"]),
  estimatedOptimizationGainPercent: z.number().optional(),
  featuredSpendAnnual: z.number().optional(),
  subscriptionSpendAnnual: z.number().optional(),
  currentPlatformName: z.string().max(120).optional(),
  listingType: z.string().max(64).optional(),
  city: z.string().max(128).optional(),
  scenarioPreset: z.enum(["conservative", "standard", "aggressive"]).optional(),
  leadId: z.string().optional(),
});

/**
 * POST /api/roi/calculate — host economics model (not a guarantee).
 * Amounts in dollars for annual revenue optional fields; response uses cents where noted.
 */
export async function POST(req: Request) {
  if (!hostEconomicsFlags.roiCalculatorV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 403 });
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`roi:calc:${ip}`, { windowMs: 60_000, max: 40 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const b = parsed.data;
  const input: RoiCalculatorInput = {
    nightlyRate: b.nightlyRate,
    bookedNightsPerYear: b.bookedNightsPerYear,
    occupancyRate: b.occupancyRate,
    availableNightsPerYear: b.availableNightsPerYear,
    currentGrossRevenueAnnual: b.currentGrossRevenue,
    currentPlatformFeePercent: b.currentPlatformFeePercent,
    lecipmPlanKey: b.lecipmPlanKey,
    estimatedOptimizationGainPercent: b.estimatedOptimizationGainPercent,
    featuredSpendAnnualCents: b.featuredSpendAnnual != null ? Math.round(b.featuredSpendAnnual * 100) : undefined,
    subscriptionSpendAnnualCents:
      b.subscriptionSpendAnnual != null ? Math.round(b.subscriptionSpendAnnual * 100) : undefined,
    currentPlatformName: b.currentPlatformName,
    listingType: b.listingType,
    city: b.city,
    scenarioPreset: b.scenarioPreset,
  };

  const result = buildRoiComparison(input);
  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  const userId = await getGuestId();
  void prisma.roiCalculation
    .create({
      data: {
        userId: userId ?? null,
        leadId: b.leadId ?? null,
        input: parsed.data as object,
        output: result as unknown as object,
      },
    })
    .catch(() => {});

  void trackFunnelEvent("roi_calculation_completed", { plan: b.lecipmPlanKey });

  return NextResponse.json({ ok: true, result });
}
