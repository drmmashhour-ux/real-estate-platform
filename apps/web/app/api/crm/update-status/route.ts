import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { CRM_ELITE_STAGES, isCrmEliteStage } from "@/modules/crm/domain/eliteLead";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

function legacyPipelineFromElite(stage: string): { pipelineStage: string; pipelineStatus: string } {
  switch (stage) {
    case "new_lead":
      return { pipelineStage: "new", pipelineStatus: "new" };
    case "contacted":
      return { pipelineStage: "contacted", pipelineStatus: "contacted" };
    case "qualified":
      return { pipelineStage: "qualified", pipelineStatus: "qualified" };
    case "visit_scheduled":
      return { pipelineStage: "visit_scheduled", pipelineStatus: "active" };
    case "offer_made":
      return { pipelineStage: "offer_made", pipelineStatus: "active" };
    case "closed":
      return { pipelineStage: "closed", pipelineStatus: "closed" };
    default:
      return { pipelineStage: "new", pipelineStatus: "new" };
  }
}

/**
 * POST /api/crm/update-status — update elite CRM stage (broker-owned lead).
 */
export async function POST(request: Request) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;

  let body: { leadId?: string; stage?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.leadId?.trim() || !body.stage?.trim()) {
    return NextResponse.json({ error: "leadId and stage are required" }, { status: 400 });
  }

  if (!isCrmEliteStage(body.stage)) {
    return NextResponse.json(
      { error: "Invalid stage", allowed: CRM_ELITE_STAGES },
      { status: 400 },
    );
  }

  const lead = await prisma.lead.findUnique({ where: { id: body.leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (gate.session.role !== "ADMIN") {
    const ok =
      lead.introducedByBrokerId === gate.session.id || lead.lastFollowUpByBrokerId === gate.session.id;
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const legacy = legacyPipelineFromElite(body.stage);

  await prisma.lead.update({
    where: { id: body.leadId },
    data: {
      lecipmCrmStage: body.stage,
      pipelineStage: legacy.pipelineStage,
      pipelineStatus: legacy.pipelineStatus,
    },
  });

  return NextResponse.json({ ok: true, stage: body.stage });
}
