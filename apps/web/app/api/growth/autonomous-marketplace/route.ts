import { NextResponse } from "next/server";
import { engineFlags, growthPolicyEnforcementFlags } from "@/config/feature-flags";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { buildAutonomousDecisions } from "@/modules/autonomous/autonomous-decision.service";
import type { AutonomousDecisionContext } from "@/modules/autonomous/autonomous-marketplace.types";
import { getAutonomousExecutionLogs } from "@/modules/autonomous/autonomous-execution.service";
import { buildGrowthPolicyEnforcementSnapshot } from "@/modules/growth/growth-policy-enforcement.service";
import { getEnforcementForTarget } from "@/modules/growth/growth-policy-enforcement-query.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

async function gatherContext(): Promise<AutonomousDecisionContext> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [leadCount30d, highScoreLeadCount] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: since } } }),
    prisma.lead.count({ where: { createdAt: { gte: since }, score: { gte: 70 } } }),
  ]);

  const adsPerforming = leadCount30d > 20 || highScoreLeadCount > 5;

  let governanceRestricted = false;
  if (growthPolicyEnforcementFlags.growthPolicyEnforcementV1) {
    const snap = await buildGrowthPolicyEnforcementSnapshot();
    if (snap) {
      const d = getEnforcementForTarget("autopilot_safe_execution", snap);
      governanceRestricted = d.mode === "freeze" || d.mode === "block" || d.mode === "approval_required";
    }
  }

  return { leadCount30d, highScoreLeadCount, adsPerforming, governanceRestricted };
}

export async function GET() {
  if (!engineFlags.autonomousMarketplaceV1) {
    return NextResponse.json({ error: "Autonomous marketplace disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  try {
    const ctx = await gatherContext();
    const state = buildAutonomousDecisions(ctx);
    return NextResponse.json({
      ...state,
      context: ctx,
      logs: getAutonomousExecutionLogs(),
      note: "Draft decisions only — approve records intent in logs; no spend, pricing writes, or messages.",
    });
  } catch (e) {
    console.error("[growth/autonomous-marketplace]", e);
    return NextResponse.json({ error: "Failed to build autonomous state" }, { status: 500 });
  }
}
