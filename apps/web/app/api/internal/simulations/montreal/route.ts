import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { hostEconomicsFlags } from "@/config/feature-flags";
import {
  simulateHostEconomicsBatch,
  buildMontrealLaunchScenario,
  MONTREAL_PRESETS,
  type MontrealSimulationInput,
} from "@/modules/simulations";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  hostCount: z.number().int().min(0).max(1_000_000),
  avgAnnualHostRevenue: z.number().min(0),
  competitorFeePercent: z.number().min(0).max(0.5),
  lecipmPlanMix: z
    .object({
      free: z.number().min(0).max(1).optional(),
      pro: z.number().min(0).max(1).optional(),
      growth: z.number().min(0).max(1).optional(),
    })
    .optional(),
  estimatedOptimizationGainPercent: z.number().min(0).max(1),
  avgFeaturedSpendPerHostAnnual: z.number().min(0).optional(),
  avgSubscriptionSpendPerHostAnnual: z.number().min(0).optional(),
  scenarioName: z.string().max(128).optional(),
});

function dollarsToCents(n: number) {
  return Math.round(n * 100);
}

/** POST — run Montreal-style scenario (admin). Dollars in request → cents internally. */
export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!hostEconomicsFlags.montrealSimulationV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = parsed.data;
  const input: MontrealSimulationInput = {
    hostCount: b.hostCount,
    avgAnnualHostRevenueCents: dollarsToCents(b.avgAnnualHostRevenue),
    competitorFeePercent: b.competitorFeePercent,
    lecipmPlanMix: b.lecipmPlanMix ?? {},
    estimatedOptimizationGainPercent: b.estimatedOptimizationGainPercent,
    avgFeaturedSpendPerHostAnnualCents: dollarsToCents(b.avgFeaturedSpendPerHostAnnual ?? 0),
    avgSubscriptionSpendPerHostAnnualCents: dollarsToCents(b.avgSubscriptionSpendPerHostAnnual ?? 0),
  };

  const out = simulateHostEconomicsBatch(input);

  void prisma.launchSimulation
    .create({
      data: {
        marketKey: "montreal",
        scenarioName: b.scenarioName ?? `custom_${b.hostCount}_hosts`,
        input: input as object,
        output: out as unknown as object,
        createdById: auth.userId,
      },
    })
    .catch(() => {});

  return NextResponse.json({ ok: true, result: out });
}

/** GET — preset scenarios (admin). */
export async function GET(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!hostEconomicsFlags.montrealSimulationV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 403 });
  }

  const preset = new URL(req.url).searchParams.get("preset");
  if (preset) {
    const n = Number(preset) as (typeof MONTREAL_PRESETS)[number];
    if (!MONTREAL_PRESETS.includes(n)) {
      return NextResponse.json({ error: "Invalid preset" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, result: buildMontrealLaunchScenario(n) });
  }

  const results = MONTREAL_PRESETS.map((p) => ({
    hosts: p,
    result: buildMontrealLaunchScenario(p),
  }));

  return NextResponse.json({ ok: true, presets: results });
}
