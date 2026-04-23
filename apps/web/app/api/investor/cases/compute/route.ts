import { NextResponse } from "next/server";
import { z } from "zod";
import { computeInvestorAnalysis } from "@/lib/investor/service";
import { generateInvestorSummary } from "@/lib/investor/ai-summary";
import { prisma } from "@/lib/db";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const bodySchema = z.object({
  caseId: z.string().min(1),
});

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

  const existing = await prisma.investorAnalysisCase.findFirst({
    where: {
      id: parsed.data.caseId,
      ownerType: ctx.owner.ownerType,
      ownerId: ctx.owner.ownerId,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  try {
    const item = await computeInvestorAnalysis(parsed.data.caseId);

    await recordAuditEvent({
      actorUserId: ctx.userId,
      action: "INVESTOR_ANALYSIS_CASE_COMPUTED",
      payload: { caseId: item.id, title: item.title },
    });

    let updated = item;
    try {
      updated = await generateInvestorSummary(item.id, ctx.userId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI_SUMMARY_FAILED";
      await recordAuditEvent({
        actorUserId: ctx.userId,
        action: "INVESTOR_AI_SUMMARY_SKIPPED",
        payload: { caseId: item.id, reason: msg },
      });
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "COMPUTE_FAILED";
    const status = msg === "INVESTMENT_INPUTS_REQUIRED" ? 400 : msg === "INVESTOR_CASE_NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
