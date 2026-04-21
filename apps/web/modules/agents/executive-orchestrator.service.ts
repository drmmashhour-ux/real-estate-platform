import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AgentContext, AgentOutput, ExecutiveTrigger, OrchestrationResult, OrchestrationRunMode } from "./executive.types";
import {
  EXECUTIVE_AGENT_SCHEMA_VERSION,
  EXECUTIVE_ORCHESTRATOR_VERSION,
  EXECUTIVE_POLICY_VERSION,
} from "./executive-versions";
import { filterAgentsForEntity, resolveAgentsForTrigger, type AgentKey } from "./executive-router";
import { getOrCreateExecutivePolicy } from "./executive-policy.engine";
import { persistTasksFromAgentOutputs } from "./executive-task.service";
import { resolveCrossAgentConflicts } from "./executive-conflict-resolver";
import { appendMemoryNote } from "./executive-memory.service";
import { executiveLog } from "./executive-log";
import { runAcquisitionAgent } from "./domains/acquisition-agent.service";
import { runEsgAgent } from "./domains/esg-agent.service";
import { runLegalComplianceAgent } from "./domains/legal-compliance-agent.service";
import { runFinancingAgent } from "./domains/financing-agent.service";
import { runCommitteeAgent } from "./domains/committee-agent.service";
import { runClosingAgent } from "./domains/closing-agent.service";
import { runAssetOperationsAgent } from "./domains/asset-operations-agent.service";
import { runPortfolioAgent } from "./domains/portfolio-agent.service";
import { runInvestorReportingAgent } from "./domains/investor-reporting-agent.service";
import { runGrowthAgent } from "./domains/growth-agent.service";

const runners: Record<AgentKey, (ctx: AgentContext) => Promise<AgentOutput>> = {
  ACQUISITION: runAcquisitionAgent,
  ESG: runEsgAgent,
  LEGAL_COMPLIANCE: runLegalComplianceAgent,
  FINANCING: runFinancingAgent,
  COMMITTEE: runCommitteeAgent,
  CLOSING: runClosingAgent,
  ASSET_OPERATIONS: runAssetOperationsAgent,
  PORTFOLIO: runPortfolioAgent,
  INVESTOR_REPORTING: runInvestorReportingAgent,
  GROWTH: runGrowthAgent,
};

export async function executeExecutiveOrchestration(input: {
  userId: string;
  role: PlatformRole;
  entityType: string;
  entityId: string;
  trigger: ExecutiveTrigger;
  runMode: OrchestrationRunMode;
}): Promise<OrchestrationResult> {
  executiveLog.orchestrator("execute_start", {
    entityType: input.entityType,
    entityId: input.entityId,
    trigger: input.trigger,
  });

  const policy = await getOrCreateExecutivePolicy(input.userId);
  if (policy.autonomyMode === "OFF" && input.runMode === "AUTOMATED") {
    executiveLog.orchestrator("skip_automated_off", {});
    return {
      entityType: input.entityType,
      entityId: input.entityId,
      orchestratorVersion: EXECUTIVE_ORCHESTRATOR_VERSION,
      agentsRun: [],
      tasksCreated: [],
      escalations: [],
      conflicts: [],
      executiveSummary: "Executive agents are OFF for this user — no automated run.",
      agentOutputs: [],
    };
  }

  const wanted = filterAgentsForEntity(input.entityType, resolveAgentsForTrigger(input.trigger));
  const ctx: AgentContext = { userId: input.userId, role: input.role, entityType: input.entityType, entityId: input.entityId };

  const agentOutputs: AgentOutput[] = [];
  const agentsRun: OrchestrationResult["agentsRun"] = [];

  for (const key of wanted) {
    const run = await prisma.agentRun.create({
      data: {
        agentName: key,
        entityType: input.entityType,
        entityId: input.entityId,
        runMode: input.runMode,
        status: "SUCCESS",
        inputSnapshotJson: { trigger: input.trigger, ...ctx } as object,
        outputSnapshotJson: {} as object,
        orchestratorVersion: EXECUTIVE_ORCHESTRATOR_VERSION,
        agentSchemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION,
        policyVersion: policy.policyVersion ?? EXECUTIVE_POLICY_VERSION,
        triggeredByUserId: input.userId,
      },
    });

    try {
      const out = await runners[key](ctx);
      agentOutputs.push(out);
      await prisma.agentRun.update({
        where: { id: run.id },
        data: { outputSnapshotJson: out as unknown as object, status: "SUCCESS" },
      });
      agentsRun.push({ agentName: key, runId: run.id, status: "SUCCESS" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "agent_error";
      await prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: "ERROR",
          outputSnapshotJson: { error: msg } as object,
        },
      });
      agentsRun.push({ agentName: key, runId: run.id, status: "ERROR" });
      executiveLog.orchestrator("agent_error", { agent: key, message: msg });
    }
  }

  const { conflictIds, resolutions } = await resolveCrossAgentConflicts({
    entityType: input.entityType,
    entityId: input.entityId,
    outputs: agentOutputs,
  });

  const tasksCreated = await persistTasksFromAgentOutputs({
    entityType: input.entityType,
    entityId: input.entityId,
    outputs: agentOutputs,
    ownerUserId: input.userId,
  });

  if (agentOutputs.length) {
    await appendMemoryNote({
      agentName: "ORCHESTRATOR",
      entityType: input.entityType,
      entityId: input.entityId,
      noteType: "OUTCOME",
      summary: `Run ${input.trigger}: ${agentOutputs.length} agent(s) — ${tasksCreated.length} new task(s).`,
      payloadJson: { runMode: input.runMode, agentNames: agentsRun.map((a) => a.agentName) },
      confidenceLevel: "MEDIUM",
    });
  }

  const executiveSummary = [
    `Trigger: ${input.trigger} · agents: ${agentsRun.length} · tasks: ${tasksCreated.length}.`,
    ...resolutions.map((r) => r.rationale),
  ].join(" ");

  return {
    entityType: input.entityType,
    entityId: input.entityId,
    orchestratorVersion: EXECUTIVE_ORCHESTRATOR_VERSION,
    agentsRun,
    tasksCreated,
    escalations: agentOutputs.filter((o) => o.requiresEscalation).map((o) => o.headline),
    conflicts: conflictIds.map((id, i) => ({
      conflictId: id,
      summary: resolutions[i]?.rationale ?? "Conflict recorded",
    })),
    executiveSummary,
    agentOutputs,
  };
}

export async function runPortfolioExecutive(input: { userId: string; role: PlatformRole; runMode: OrchestrationRunMode }) {
  return executeExecutiveOrchestration({
    userId: input.userId,
    role: input.role,
    entityType: "PORTFOLIO",
    entityId: input.userId,
    trigger: "PORTFOLIO_RUN_REQUESTED",
    runMode: input.runMode,
  });
}

export async function runAssetExecutive(input: {
  userId: string;
  role: PlatformRole;
  assetId: string;
  runMode: OrchestrationRunMode;
}) {
  return executeExecutiveOrchestration({
    userId: input.userId,
    role: input.role,
    entityType: "ASSET",
    entityId: input.assetId,
    trigger: "ASSET_HEALTH_DECLINED",
    runMode: input.runMode,
  });
}

export async function runDealExecutive(input: {
  userId: string;
  role: PlatformRole;
  dealId: string;
  runMode: OrchestrationRunMode;
}) {
  return executeExecutiveOrchestration({
    userId: input.userId,
    role: input.role,
    entityType: "DEAL",
    entityId: input.dealId,
    trigger: "CLOSING_READINESS_CHANGED",
    runMode: input.runMode,
  });
}
