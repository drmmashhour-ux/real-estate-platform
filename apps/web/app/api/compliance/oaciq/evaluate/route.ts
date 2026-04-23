import { NextResponse } from "next/server";
import { z } from "zod";
import { runOaciqSectionEvaluation } from "@/lib/compliance/oaciq/evaluation-service";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";

const bodySchema = z.object({
  sectionKey: z.string().min(1),
  context: z.record(z.string(), z.unknown()),
  dealId: z.string().optional(),
  listingId: z.string().optional(),
});

/**
 * Broker-scoped deterministic OACIQ rule evaluation (persists inspection log + audit).
 */
export async function POST(req: Request) {
  const ctx = await requireMonitoringContext();
  if (!ctx.ok) return ctx.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { section, result } = await runOaciqSectionEvaluation({
      sectionKey: parsed.data.sectionKey,
      brokerUserId: ctx.userId,
      context: parsed.data.context,
      dealId: parsed.data.dealId,
      listingId: parsed.data.listingId,
    });

    return NextResponse.json({
      success: true,
      sectionKey: parsed.data.sectionKey,
      outcome: result.outcome,
      complianceRiskScore: result.complianceRiskScore,
      blockedReasons: result.blockedReasons,
      warnings: result.warnings,
      triggeredConditionalRules: result.triggeredConditionalRules,
      clauseFr: section.clauseFr,
      clauseEn: section.clauseEn,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OACIQ_EVALUATION_FAILED";
    const status = msg === "OACIQ_SECTION_NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
