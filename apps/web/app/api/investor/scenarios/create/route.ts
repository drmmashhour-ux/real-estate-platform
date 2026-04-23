import { NextResponse } from "next/server";
import { z } from "zod";
import { createInvestorScenario } from "@/lib/investor/scenarios";
import { prisma } from "@/lib/db";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const bodySchema = z.object({
  investorAnalysisCaseId: z.string().min(1),
  scenarioName: z.string().min(1).max(240),
  monthlyRentCents: z.number().int().nonnegative().optional(),
  annualAppreciationRate: z.number().optional(),
  exitYear: z.number().int().positive().optional(),
  saleCostRate: z.number().min(0).max(1).optional(),
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

  const parent = await prisma.investorAnalysisCase.findFirst({
    where: {
      id: parsed.data.investorAnalysisCaseId,
      ownerType: ctx.owner.ownerType,
      ownerId: ctx.owner.ownerId,
    },
  });

  if (!parent) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  try {
    const item = await createInvestorScenario(parsed.data);

    await recordAuditEvent({
      actorUserId: ctx.userId,
      action: "INVESTOR_SCENARIO_CREATED",
      payload: { scenarioId: item.id, caseId: item.investorAnalysisCaseId, name: item.scenarioName },
    });

    return NextResponse.json({ success: true, item });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "SCENARIO_CREATE_FAILED";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
