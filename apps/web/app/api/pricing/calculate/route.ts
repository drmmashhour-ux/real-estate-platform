import { NextResponse } from "next/server";
import { z } from "zod";
import { revenueV4Flags, hostEconomicsFlags, lecipmMonetizationSystemV1 } from "@/config/feature-flags";
import { calculateBnhubLodgingFeeEducation } from "@/modules/pricing-model/fee-calculator.service";
import { compareHostNetVersusDeclaredCompetitor } from "@/modules/pricing-model/pricing-comparator.service";
import { calculateHostPlanBookingFeeCents } from "@/modules/pricing-model/fee-calculator.service";
import { calculateBNHubPricing, calculateBrokerPricing } from "@/modules/pricing/pricing-engine.service";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";
import { getGuestId } from "@/lib/auth/session";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { trackMonetizationEngineCalculate } from "@/lib/analytics/monetization-analytics";

export const dynamic = "force-dynamic";

const BodyZ = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("bnhub_lodging"),
    lodgingSubtotalAfterDiscountCents: z.number().int().nonnegative(),
    cleaningFeeCents: z.number().int().nonnegative(),
    taxCents: z.number().int().nonnegative(),
    currency: z.string().max(8).optional(),
  }),
  z.object({
    mode: z.literal("compare"),
    grossBookingCents: z.number().int().positive(),
    competitorFeePercent: z.number().min(0).max(0.5),
    lecipmPlanKey: z.enum(["free", "pro", "growth"]),
  }),
  z.object({
    mode: z.literal("host_plan_fee"),
    grossRevenueCents: z.number().int().positive(),
    planKey: z.enum(["free", "pro", "growth"]),
  }),
  z.object({
    mode: z.literal("engine_bnhub_lodging"),
    nightlyPrice: z.number().nonnegative(),
    nights: z.number().int().nonnegative(),
    hostFeePercent: z.number().min(0).max(100),
    guestFeePercent: z.number().min(0).max(100),
    currency: z.string().max(8).optional(),
  }),
  z.object({
    mode: z.literal("engine_broker_deal"),
    dealValue: z.number().nonnegative(),
    leadFee: z.number().nonnegative(),
    successFeePercent: z.number().min(0).max(100),
    currency: z.string().max(8).optional(),
  }),
]);

export async function POST(req: Request) {
  const on =
    revenueV4Flags.pricingEngineV1 ||
    hostEconomicsFlags.pricingModelV1 ||
    lecipmMonetizationSystemV1.pricingV1;
  if (!on) {
    return NextResponse.json({ error: "Pricing calculate disabled" }, { status: 403 });
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`pricing:calc:${ip}`, { windowMs: 60_000, max: 60 });
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
  const uid = await getGuestId();

  if (b.mode === "engine_bnhub_lodging") {
    const result = calculateBNHubPricing({
      nightlyPrice: b.nightlyPrice,
      nights: b.nights,
      hostFeePercent: b.hostFeePercent,
      guestFeePercent: b.guestFeePercent,
      currency: b.currency,
    });
    await logGrowthEngineAudit({
      actorUserId: uid,
      action: "pricing_calculate_engine_bnhub_lodging",
      payload: { mode: b.mode },
    });
    trackMonetizationEngineCalculate({ mode: b.mode });
    return NextResponse.json({ ok: true, result });
  }

  if (b.mode === "engine_broker_deal") {
    const result = calculateBrokerPricing({
      dealValue: b.dealValue,
      leadFee: b.leadFee,
      successFeePercent: b.successFeePercent,
      currency: b.currency,
    });
    await logGrowthEngineAudit({
      actorUserId: uid,
      action: "pricing_calculate_engine_broker_deal",
      payload: { mode: b.mode },
    });
    trackMonetizationEngineCalculate({ mode: b.mode });
    return NextResponse.json({ ok: true, result });
  }

  if (b.mode === "bnhub_lodging") {
    const result = calculateBnhubLodgingFeeEducation({
      lodgingSubtotalAfterDiscountCents: b.lodgingSubtotalAfterDiscountCents,
      cleaningFeeCents: b.cleaningFeeCents,
      taxCents: b.taxCents,
      currency: b.currency,
    });
    await logGrowthEngineAudit({
      actorUserId: uid,
      action: "pricing_calculate_bnhub_lodging",
      payload: { mode: b.mode },
    });
    return NextResponse.json({ ok: true, result });
  }

  if (b.mode === "compare") {
    const result = compareHostNetVersusDeclaredCompetitor({
      grossBookingCents: b.grossBookingCents,
      competitorFeePercent: b.competitorFeePercent,
      lecipmPlanKey: b.lecipmPlanKey,
    });
    if ("error" in result) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    await logGrowthEngineAudit({
      actorUserId: uid,
      action: "pricing_calculate_compare",
      payload: { mode: b.mode },
    });
    return NextResponse.json({ ok: true, result });
  }

  const fees = calculateHostPlanBookingFeeCents(b.planKey, b.grossRevenueCents);
  await logGrowthEngineAudit({
    actorUserId: uid,
    action: "pricing_calculate_host_plan_fee",
    payload: { mode: b.mode, planKey: b.planKey },
  });
  return NextResponse.json({
    ok: true,
    result: {
      grossRevenueCents: b.grossRevenueCents,
      planKey: b.planKey,
      hostPlanBookingFeesCents: fees,
      netAfterHostPlanFeeCents: b.grossRevenueCents - fees,
    },
  });
}
