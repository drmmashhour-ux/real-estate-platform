import { NextResponse } from "next/server";
import { engineFlags, growthPolicyEnforcementFlags } from "@/config/feature-flags";
import { prisma } from "@repo/db";
import { buildAiExecutionSuggestions } from "@/modules/growth/ai-assisted-execution.service";
import { buildGrowthPolicyEnforcementSnapshot } from "@/modules/growth/growth-policy-enforcement.service";
import { getEnforcementForTarget } from "@/modules/growth/growth-policy-enforcement-query.service";
import { getBrokerPerformanceSummaries } from "@/modules/growth/broker-performance.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!engineFlags.aiAssistExecutionV1) {
    return NextResponse.json({ error: "AI assist execution disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  try {
    let governanceFreeze = false;
    if (growthPolicyEnforcementFlags.growthPolicyEnforcementV1) {
      const snap = await buildGrowthPolicyEnforcementSnapshot();
      if (snap) {
        const d = getEnforcementForTarget("autopilot_safe_execution", snap);
        governanceFreeze = d.mode === "freeze" || d.mode === "block";
      }
    }

    const topLead = await prisma.lead.findFirst({
      orderBy: { score: "desc" },
      select: {
        score: true,
        pipelineStatus: true,
        aiTier: true,
      },
    });

    const topBrokers = await getBrokerPerformanceSummaries(1);
    const top = topBrokers[0];

    const suggestions = buildAiExecutionSuggestions({
      governanceFreeze,
      topLeadScore: topLead?.score ?? null,
      leadPipelineStatus: topLead?.pipelineStatus ?? null,
      leadAiTier: topLead?.aiTier ?? null,
      topBrokerId: top?.userId ?? null,
      topBrokerLabel: top?.email ?? top?.userId ?? null,
    });

    return NextResponse.json({
      suggestions,
      governanceNote:
        governanceFreeze
          ? "Policy enforcement requires approval or blocks autonomous execution — suggestions remain draft-only."
          : null,
    });
  } catch (e) {
    console.error("[growth/ai-assist-execution]", e);
    return NextResponse.json({ error: "Failed to build suggestions" }, { status: 500 });
  }
}
