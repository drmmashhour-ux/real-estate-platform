import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { buildFollowUpActions } from "@/modules/growth/followup-actions.service";
import { buildFunnelSummary, getLeadsByStage } from "@/modules/growth/funnel.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;
  if (!engineFlags.funnelSystemV1) {
    return NextResponse.json({ error: "Funnel system is disabled" }, { status: 403 });
  }

  try {
    const { summary, lostCount, excludedCount } = await buildFunnelSummary(prisma);
    const sampleNew = await getLeadsByStage(prisma, "new", 5);
    const suggested = sampleNew.map((lead) => ({
      leadId: lead.id,
      pipelineStatus: lead.pipelineStatus,
      actions: buildFollowUpActions(lead),
    }));

    return NextResponse.json({
      summary,
      lostCount,
      excludedCount,
      suggested,
      note:
        "Read-only CRM snapshot. Suggested actions are drafts for humans — no automated sends.",
    });
  } catch (e) {
    console.error("[growth/funnel-system/summary]", e);
    return NextResponse.json({ error: "Failed to build funnel summary" }, { status: 500 });
  }
}
