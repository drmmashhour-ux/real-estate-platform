import { NextResponse } from "next/server";
import { z } from "zod";
import { generateDeals } from "@/lib/deal/generator";
import { assertDealFinderDataLayerEnabled, assertNoAutonomousPurchaseDeal } from "@/lib/deal/safety";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";

const bodySchema = z.object({
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  const ctx = await requireMonitoringContext();
  if (!ctx.ok) return ctx.response;

  let json: unknown = {};
  try {
    json = await req.json();
  } catch {
    json = {};
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  assertNoAutonomousPurchaseDeal(parsed.data.metadata ?? null);

  try {
    assertDealFinderDataLayerEnabled();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "DATA_SOURCE_REQUIRED";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const result = await generateDeals(ctx.owner, ctx.userId);
  return NextResponse.json({ success: true, ...result });
}
