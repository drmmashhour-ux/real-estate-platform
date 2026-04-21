import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { lifecycleStageToLeadCrmStage, type LifecycleStage } from "@/modules/deal-lifecycle/lifecycle.stages";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

const TAG = "[deal]";
const TAG_LC = "[lifecycle]";

const STAGES: Set<LifecycleStage> = new Set([
  "NEW_LEAD",
  "CONTACTED",
  "QUALIFIED",
  "VISIT_SCHEDULED",
  "OFFER_SENT",
  "NEGOTIATION",
  "CLOSED",
]);

type Params = { params: Promise<{ leadId: string }> };

/** PATCH — move lead to a lifecycle column (updates `lecipmCrmStage` + `pipelineStage` coarsely) */
export async function PATCH(request: NextRequest, context: Params) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    return NextResponse.json({ error: "Brokers only" }, { status: 403 });
  }

  const { leadId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { stage?: string };

  if (!body.stage || !STAGES.has(body.stage as LifecycleStage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }
  const stage = body.stage as LifecycleStage;
  const crm = lifecycleStageToLeadCrmStage(stage);

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, introducedByBrokerId: userId },
    select: { id: true },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: {
      lecipmCrmStage: crm,
      pipelineStage: crm,
    },
    select: { id: true, lecipmCrmStage: true, pipelineStage: true },
  });

  logInfo(`${TAG_LC} pipeline.move`, { leadId, stage });
  logInfo(`${TAG} pipeline.move`, { leadId, stage });
  if (stage === "CLOSED") {
    logInfo("[conversion] lead.moved_to_closed", { leadId });
  }

  return NextResponse.json({ ok: true, lead: updated, stage });
}
