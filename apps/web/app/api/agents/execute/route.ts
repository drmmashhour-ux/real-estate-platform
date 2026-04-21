import { NextResponse } from "next/server";
import type { ExecutiveTrigger } from "@/modules/agents/executive.types";
import { executeExecutiveOrchestration } from "@/modules/agents/executive-orchestrator.service";
import { requireAgentsSession } from "../_auth";
import { executiveOrchestrationWhenRolloutDisabled, isLecipmPhaseEnabled, logRolloutGate } from "@/lib/lecipm/rollout";

export const dynamic = "force-dynamic";

const TRIGGERS = [
  "DEAL_CREATED",
  "DEAL_STAGE_CHANGED",
  "MEMO_GENERATED",
  "IC_PACK_GENERATED",
  "COMMITTEE_DECISION_RECORDED",
  "ESG_SCORE_CHANGED",
  "EVIDENCE_UPLOADED",
  "ACQUISITION_STATUS_CHANGED",
  "LENDER_CONDITION_CHANGED",
  "COVENANT_RISK_CHANGED",
  "CLOSING_READINESS_CHANGED",
  "ASSET_HEALTH_DECLINED",
  "PORTFOLIO_RUN_REQUESTED",
  "MANUAL_EXECUTE",
] as const satisfies readonly ExecutiveTrigger[];

export async function POST(req: Request) {
  const auth = await requireAgentsSession();
  if (!auth.ok) return auth.response;

  if (!isLecipmPhaseEnabled(7)) {
    logRolloutGate(7, "/api/agents/execute");
    return NextResponse.json(executiveOrchestrationWhenRolloutDisabled());
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const entityType = typeof body.entityType === "string" ? body.entityType : "";
  const entityId = typeof body.entityId === "string" ? body.entityId : "";
  const triggerRaw = typeof body.triggerType === "string" ? body.triggerType : "MANUAL_EXECUTE";
  const runMode =
    body.runMode === "AUTOMATED" || body.runMode === "SCHEDULED" ? body.runMode : "MANUAL";

  if (!entityType || !entityId) {
    return NextResponse.json({ error: "entityType and entityId required" }, { status: 400 });
  }

  const trigger = TRIGGERS.includes(triggerRaw as ExecutiveTrigger) ?
      (triggerRaw as ExecutiveTrigger)
    : "MANUAL_EXECUTE";

  try {
    const result = await executeExecutiveOrchestration({
      userId: auth.userId,
      role: auth.role as import("@prisma/client").PlatformRole,
      entityType,
      entityId,
      trigger,
      runMode,
    });

    return NextResponse.json({
      agentsRun: result.agentsRun,
      tasksCreated: result.tasksCreated,
      conflicts: result.conflicts,
      executiveSummary: result.executiveSummary,
      orchestratorVersion: result.orchestratorVersion,
      agentOutputs: result.agentOutputs,
    });
  } catch {
    return NextResponse.json({ error: "Orchestration failed" }, { status: 500 });
  }
}
