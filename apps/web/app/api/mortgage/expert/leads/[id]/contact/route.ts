import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireMortgageExpertWithTerms } from "@/modules/mortgage/services/expert-guard";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";
import { toStoredPipelineStatus, normalizePipelineStage } from "@/lib/leads/pipeline-stage";

export const dynamic = "force-dynamic";

/**
 * Expert clicked call or WhatsApp from UI — mark lead contacted + timeline.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireMortgageExpertWithTerms();
  if ("error" in session) return session.error;
  const { expert } = session;

  const { id: leadId } = await params;
  const body = await req.json().catch(() => ({}));
  const channel = typeof body.channel === "string" ? body.channel.toLowerCase() : "";
  if (channel !== "call" && channel !== "whatsapp" && channel !== "email") {
    return NextResponse.json({ error: "channel must be call, whatsapp, or email" }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.assignedExpertId !== expert.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contacted = toStoredPipelineStatus("contacted");
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      pipelineStatus: contacted,
      pipelineStage: normalizePipelineStage(contacted),
      status: contacted,
      lastContactedAt: new Date(),
      highIntent: true,
    },
  });

  const ev =
    channel === "call" ? "call_clicked" : channel === "whatsapp" ? "whatsapp_clicked" : "email_clicked";
  await appendLeadTimelineEvent(leadId, ev, {
    source: "mortgage_expert_dashboard",
    expertId: expert.id,
  });

  return NextResponse.json({ ok: true, pipelineStatus: contacted });
}
