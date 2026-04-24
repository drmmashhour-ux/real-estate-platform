import crypto from "crypto";
import {
  RolloutDecisionAction,
  RolloutExecutionStatus,
  RolloutPolicyDomain,
  RolloutPolicySource,
  RolloutPolicyStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { logRolloutTagged } from "@/lib/server/launch-logger";
import {
  ROLLOUT_INITIAL_PERCENT,
  ROLLOUT_STRATEGY,
  ROLLOUT_PERCENT_LADDER,
} from "./rollout.constants";
import type { CeoDecisionPayload } from "@/modules/ceo-ai/ceo-ai.types";
import type { DecisionPayload } from "@/modules/autonomy/autonomy-types";
import type { EvolutionSafeExperiment } from "@prisma/client";
import { mapEvolutionDomainToRolloutDomain } from "./rollout-domain-map";
import { persistRolloutMetricSnapshot } from "./rollout-metrics.service";

function cohortSaltForPolicy(policyId: string): string {
  return crypto.createHash("sha256").update(`rollout:${policyId}`, "utf8").digest("hex").slice(0, 32);
}

export async function createRolloutDraftForCeoPricing(args: {
  ceoDecisionId: string;
  payload: Extract<CeoDecisionPayload, { kind: "pricing_lead_adjust" | "pricing_featured_adjust" }>;
  createdByUserId: string;
}) {
  const strategyKey =
    args.payload.kind === "pricing_lead_adjust" ?
      ROLLOUT_STRATEGY.LEAD_BASE_PRICE_RELATIVE
    : ROLLOUT_STRATEGY.FEATURED_BASE_PRICE_RELATIVE;

  const row = await prisma.rolloutPolicy.create({
    data: {
      domain: RolloutPolicyDomain.PRICING,
      strategyKey,
      source: RolloutPolicySource.MANUAL,
      status: RolloutPolicyStatus.DRAFT,
      createdByUserId: args.createdByUserId,
      payloadJson: {
        ceoDecisionId: args.ceoDecisionId,
        relativeDelta: args.payload.relativeDelta,
        pricingKind: args.payload.kind,
      },
    },
  });

  logRolloutTagged.info("policy_created", {
    policyId: row.id,
    domain: row.domain,
    strategyKey: row.strategyKey,
    source: row.source,
  });
  return row;
}

export async function createRolloutDraftFromAutonomy(args: {
  autonomyDecisionId: string;
  payload: Extract<DecisionPayload, { kind: "adjust_lead_base_price" | "boost_residence_rank" }>;
  createdByUserId: string | null;
}) {
  if (args.payload.kind === "adjust_lead_base_price") {
    const row = await prisma.rolloutPolicy.create({
      data: {
        domain: RolloutPolicyDomain.PRICING,
        strategyKey: ROLLOUT_STRATEGY.LEAD_BASE_PRICE_RELATIVE,
        source: RolloutPolicySource.AGENT,
        status: RolloutPolicyStatus.DRAFT,
        createdByUserId: args.createdByUserId ?? undefined,
        payloadJson: {
          autonomyDecisionId: args.autonomyDecisionId,
          relativeDelta: args.payload.relativeDelta,
        },
      },
    });
    logRolloutTagged.info("policy_created", { policyId: row.id, domain: row.domain, source: row.source });
    return row;
  }

  const row = await prisma.rolloutPolicy.create({
    data: {
      domain: RolloutPolicyDomain.RANKING,
      strategyKey: ROLLOUT_STRATEGY.RESIDENCE_RANK_BOOST,
      source: RolloutPolicySource.AGENT,
      status: RolloutPolicyStatus.DRAFT,
      createdByUserId: args.createdByUserId ?? undefined,
      payloadJson: {
        autonomyDecisionId: args.autonomyDecisionId,
        residenceIds: args.payload.residenceIds,
        deltaPoints: args.payload.deltaPoints,
      },
    },
  });
  logRolloutTagged.info("policy_created", { policyId: row.id, domain: row.domain, source: row.source });
  return row;
}

export async function createRolloutDraftFromEvolutionExperiment(
  experiment: EvolutionSafeExperiment,
  createdByUserId: string | null,
) {
  const domain = mapEvolutionDomainToRolloutDomain(experiment.domain as string);
  const row = await prisma.rolloutPolicy.create({
    data: {
      domain,
      strategyKey: `${ROLLOUT_STRATEGY.EVOLUTION_ARMS}:${experiment.experimentKey}`.slice(0, 128),
      source: RolloutPolicySource.EVOLUTION,
      status: RolloutPolicyStatus.DRAFT,
      createdByUserId: createdByUserId ?? undefined,
      payloadJson: {
        experimentId: experiment.id,
        experimentKey: experiment.experimentKey,
        armsJson: experiment.armsJson,
        trafficCapPercent: experiment.trafficCapPercent,
      },
    },
  });
  logRolloutTagged.info("policy_created", {
    policyId: row.id,
    domain: row.domain,
    source: row.source,
    experimentKey: experiment.experimentKey,
  });
  return row;
}

/**
 * Human approval: policy becomes APPROVED/LIVE and a RUNNING execution starts at {@link ROLLOUT_INITIAL_PERCENT} only.
 */
export async function approveRolloutPolicy(policyId: string, approvedByUserId: string) {
  const policy = await prisma.rolloutPolicy.findUnique({ where: { id: policyId } });
  if (!policy || policy.status !== RolloutPolicyStatus.DRAFT) {
    throw new Error("invalid_policy_state");
  }

  const cohortKey = cohortSaltForPolicy(policyId);
  const now = new Date();

  const [updated, execution] = await prisma.$transaction([
    prisma.rolloutPolicy.update({
      where: { id: policyId },
      data: {
        status: RolloutPolicyStatus.APPROVED,
        approvedByUserId,
        approvedAt: now,
      },
    }),
    prisma.rolloutExecution.create({
      data: {
        policyId,
        rolloutPercent: ROLLOUT_INITIAL_PERCENT,
        cohortKey,
        status: RolloutExecutionStatus.RUNNING,
        startedAt: now,
      },
    }),
  ]);

  logRolloutTagged.info("policy_approved", { policyId, approvedByUserId });
  logRolloutTagged.info("rollout_started", {
    executionId: execution.id,
    policyId,
    rolloutPercent: execution.rolloutPercent,
  });

  void persistRolloutMetricSnapshot(execution.id).catch(() => {});

  return { policy: updated, execution };
}

export function getNextLadderPercent(current: number): number {
  for (const step of ROLLOUT_PERCENT_LADDER) {
    if (step > current) return step;
  }
  return current;
}

export async function appendDecisionLog(
  executionId: string,
  action: RolloutDecisionAction,
  reason: string,
): Promise<void> {
  await prisma.rolloutDecisionLog.create({
    data: { executionId, action, reason },
  });
}

export async function increaseRolloutPercent(executionId: string, reason: string): Promise<number | null> {
  const ex = await prisma.rolloutExecution.findUnique({ where: { id: executionId } });
  if (!ex || ex.status !== RolloutExecutionStatus.RUNNING) return null;

  if (ex.rolloutPercent >= 100) {
    await prisma.rolloutExecution.update({
      where: { id: executionId },
      data: { status: RolloutExecutionStatus.COMPLETED, lastEvaluatedAt: new Date() },
    });
    logRolloutTagged.info("rollout_completed", { executionId, policyId: ex.policyId });
    return 100;
  }

  const next = getNextLadderPercent(ex.rolloutPercent);
  if (next <= ex.rolloutPercent) {
    await prisma.rolloutExecution.update({
      where: { id: executionId },
      data: { status: RolloutExecutionStatus.COMPLETED, lastEvaluatedAt: new Date() },
    });
    await appendDecisionLog(executionId, RolloutDecisionAction.INCREASE, "ladder_complete_100");
    logRolloutTagged.info("rollout_completed", { executionId, policyId: ex.policyId });
    return ex.rolloutPercent;
  }

  await prisma.rolloutExecution.update({
    where: { id: executionId },
    data: { rolloutPercent: next, lastEvaluatedAt: new Date() },
  });
  await appendDecisionLog(executionId, RolloutDecisionAction.INCREASE, reason);
  logRolloutTagged.info("rollout_increased", { executionId, policyId: ex.policyId, rolloutPercent: next });
  return next;
}

export async function pauseRolloutExecution(executionId: string, reason: string): Promise<void> {
  await prisma.rolloutExecution.update({
    where: { id: executionId },
    data: { status: RolloutExecutionStatus.PAUSED, lastEvaluatedAt: new Date() },
  });
  await appendDecisionLog(executionId, RolloutDecisionAction.PAUSE, reason);
  logRolloutTagged.info("rollout_paused", { executionId, reason });
}

export async function rollbackRolloutExecution(executionId: string, reason: string): Promise<void> {
  const ex = await prisma.rolloutExecution.findUnique({ where: { id: executionId } });
  if (!ex) return;

  await prisma.$transaction([
    prisma.rolloutExecution.update({
      where: { id: executionId },
      data: { status: RolloutExecutionStatus.ROLLED_BACK, lastEvaluatedAt: new Date() },
    }),
    prisma.rolloutPolicy.update({
      where: { id: ex.policyId },
      data: { status: RolloutPolicyStatus.ROLLED_BACK },
    }),
    prisma.rolloutDecisionLog.create({
      data: { executionId, action: RolloutDecisionAction.ROLLBACK, reason },
    }),
  ]);

  logRolloutTagged.info("rollout_rolled_back", { executionId, policyId: ex.policyId, reason });
}

export async function rollbackRolloutByPolicyId(policyId: string, reason: string): Promise<void> {
  const running = await prisma.rolloutExecution.findFirst({
    where: {
      policyId,
      status: { in: [RolloutExecutionStatus.RUNNING, RolloutExecutionStatus.PAUSED] },
    },
    orderBy: { startedAt: "desc" },
  });
  if (running) await rollbackRolloutExecution(running.id, reason);
  else {
    await prisma.rolloutPolicy.updateMany({
      where: { id: policyId, status: { not: RolloutPolicyStatus.ROLLED_BACK } },
      data: { status: RolloutPolicyStatus.ROLLED_BACK },
    });
  }
}
