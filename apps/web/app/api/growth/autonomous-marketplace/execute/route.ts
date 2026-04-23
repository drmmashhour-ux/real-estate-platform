import { NextResponse } from "next/server";
import { z } from "zod";
import { engineFlags, growthPolicyEnforcementFlags } from "@/config/feature-flags";
import { buildAutonomousDecisions } from "@/modules/autonomous/autonomous-decision.service";
import { executeAutonomousDecision } from "@/modules/autonomous/autonomous-execution.service";
import { buildGrowthPolicyEnforcementSnapshot } from "@/modules/growth/growth-policy-enforcement.service";
import { getEnforcementForTarget } from "@/modules/growth/growth-policy-enforcement-query.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { prisma } from "@repo/db";
import type { AutonomousDecisionContext } from "@/modules/autonomous/autonomous-marketplace.types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  decisionId: z.string().min(1).max(120),
  approved: z.boolean(),
});

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

export async function POST(req: Request) {
  if (!engineFlags.autonomousMarketplaceV1) {
    return NextResponse.json({ error: "Autonomous marketplace disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const ctx = await gatherContext();
  const state = buildAutonomousDecisions(ctx);
  const decision = state.decisions.find((d) => d.id === parsed.data.decisionId);
  if (!decision) {
    return NextResponse.json({ error: "Decision not found" }, { status: 404 });
  }

  let governanceAllowsExecution = true;
  if (growthPolicyEnforcementFlags.growthPolicyEnforcementV1) {
    const snap = await buildGrowthPolicyEnforcementSnapshot();
    if (snap) {
      const d = getEnforcementForTarget("autopilot_safe_execution", snap);
      governanceAllowsExecution = d.mode !== "freeze" && d.mode !== "block";
    }
  }

  const result = executeAutonomousDecision(decision, {
    approved: parsed.data.approved,
    governanceAllowsExecution,
  });

  return NextResponse.json(result);
}
