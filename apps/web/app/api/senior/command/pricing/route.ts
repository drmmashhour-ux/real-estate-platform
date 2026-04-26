import { NextResponse } from "next/server";
import { logSeniorCommand } from "@/lib/senior-command/log";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { canPricing, seniorCommandAuth } from "@/lib/senior-command/api-auth";
import {
  getPricingRules,
  getSeniorCommandKpis,
} from "@/modules/senior-living/command/senior-command.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;
  const rules = await getPricingRules();
  const kpis = await getSeniorCommandKpis();
  const avgLead = kpis.avgLeadPriceCad ?? 49;
  return NextResponse.json({
    rules,
    avgLeadValueCad: avgLead,
    promoNote: "Adjust multipliers gradually — impacts are logged for governance.",
  });
}

export async function PATCH(req: Request) {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;
  if (!canPricing(auth.ctx)) {
    return NextResponse.json({ error: "Pricing edits require admin" }, { status: 403 });
  }

  let body: {
    id?: string;
    demandFactor?: number;
    qualityFactor?: number;
    minPrice?: number;
    maxPrice?: number;
    leadBasePrice?: number;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const prev = await prisma.seniorPricingRule.findUnique({ where: { id } });
  if (!prev) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

  const nextDemand = body.demandFactor ?? prev.demandFactor;
  const nextQuality = body.qualityFactor ?? prev.qualityFactor;
  const impliedDeltaPct =
    Math.round(((nextDemand * nextQuality) / (prev.demandFactor * prev.qualityFactor) - 1) * 1000) / 10;

  const updated = await prisma.seniorPricingRule.update({
    where: { id },
    data: {
      demandFactor: nextDemand,
      qualityFactor: nextQuality,
      minPrice: body.minPrice ?? prev.minPrice,
      maxPrice: body.maxPrice ?? prev.maxPrice,
      leadBasePrice: body.leadBasePrice ?? prev.leadBasePrice,
    },
  });

  logSeniorCommand("[senior-optimization]", "pricing_rule_patch", {
    ruleId: id.slice(0, 8),
    impliedDeltaPct,
  });

  return NextResponse.json({
    ok: true,
    rule: {
      id: updated.id,
      city: updated.city,
      leadBasePrice: updated.leadBasePrice,
      minPrice: updated.minPrice,
      maxPrice: updated.maxPrice,
      demandFactor: updated.demandFactor,
      qualityFactor: updated.qualityFactor,
    },
    impactPreviewPercent: impliedDeltaPct,
    message:
      impliedDeltaPct >= 0 ?
        `Estimated revenue change ~+${impliedDeltaPct}% vs prior multipliers (rule of thumb).`
      : `Estimated revenue change ~${impliedDeltaPct}% vs prior multipliers (rule of thumb).`,
  });
}
