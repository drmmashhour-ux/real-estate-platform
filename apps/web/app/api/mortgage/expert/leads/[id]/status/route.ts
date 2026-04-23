import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";
import { toStoredPipelineStatus, normalizePipelineStage } from "@/lib/leads/pipeline-stage";
import { requireMortgageExpertWithTerms } from "@/modules/mortgage/services/expert-guard";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["new", "contacted", "in_progress", "lost"]);

/**
 * PATCH pipeline for mortgage lead (expert only). Use POST .../close-deal to close with amount.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireMortgageExpertWithTerms();
  if ("error" in session) return session.error;

  const { id: leadId } = await params;
  const body = await req.json().catch(() => ({}));
  const raw = typeof body.pipelineStatus === "string" ? body.pipelineStatus.trim().toLowerCase() : "";
  if (!ALLOWED.has(raw)) {
    return NextResponse.json(
      { error: "Invalid status. Use new, contacted, in_progress, or lost." },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, assignedExpertId: true, leadType: true, pipelineStatus: true },
  });
  if (!lead || lead.assignedExpertId !== session.expert.id || lead.leadType !== "mortgage") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stored = toStoredPipelineStatus(raw);
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      pipelineStatus: stored,
      pipelineStage: normalizePipelineStage(stored),
      status: stored,
    },
  });

  await appendLeadTimelineEvent(leadId, "mortgage_expert_status_updated", {
    from: lead.pipelineStatus,
    to: stored,
    expertId: session.expert.id,
  });

  return NextResponse.json({ ok: true, pipelineStatus: stored });
}
