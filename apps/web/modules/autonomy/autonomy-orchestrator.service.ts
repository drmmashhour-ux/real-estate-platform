import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateAutonomyActions } from "@/modules/autonomy/decision-engine.service";
import { evaluatePolicies } from "@/modules/autonomy/policy-engine.service";
import { executeAutonomyAction } from "@/modules/autonomy/execution-engine.service";
import { buildAutonomySignals } from "@/modules/autonomy/signal-aggregator.service";
import { captureBaselineMetrics } from "@/modules/autonomy/learning/baseline-capture.service";
import { incrementSelection } from "@/modules/autonomy/bandit/bandit-update.service";
import { buildContextualPolicyNote } from "@/modules/autonomy/contextual/contextual-policy-notes";
import { gateAutonomyExperimentExecution } from "@/modules/autonomy/experiment/experiment-gate.service";

/**
 * Single autonomy pass: signals → deterministic candidates → contextual ranking → policy → execution (mode-gated) → persisted rows.
 */
export async function runAutonomyCycle(scopeType: string, scopeId: string) {
  const config = await prisma.autonomyConfig.findUnique({
    where: {
      scopeType_scopeId: {
        scopeType,
        scopeId,
      },
    },
  });

  await prisma.autonomyEventLog.create({
    data: {
      scopeType,
      scopeId,
      eventType: "scan",
      message: config ? "Autonomy cycle started" : "No AutonomyConfig — cycle skipped",
      meta: {
        mode: config?.mode ?? null,
        isEnabled: config?.isEnabled ?? null,
      },
    },
  });

  if (!config) {
    return [];
  }

  const signals = await buildAutonomySignals(scopeType, scopeId);
  const decisions = await generateAutonomyActions(config, scopeType, scopeId, signals);

  if (decisions.length > 0) {
    await prisma.autonomyEventLog.create({
      data: {
        scopeType,
        scopeId,
        eventType: "contextual_selection",
        message:
          "Contextual Bandit — deterministic feature buckets + observed bucket rewards + exploration bonus (not unrestricted ML). Policy validates each action before execution.",
        meta: {
          algorithm: "deterministic_contextual_linear",
          selected: decisions.map((d) => ({
            domain: d.domain,
            signalKey: d.signalKey,
            actionType: d.actionType,
            contextualScore: d.contextualScore,
            selectionScore: d.selectionScore,
            contextFeatures: d.contextFeatures,
            policyNote: buildContextualPolicyNote({
              domain: d.domain,
              actionType: d.actionType,
              signalKey: d.signalKey ?? "—",
              contextFeatures: d.contextFeatures as Record<string, string>,
            }),
          })),
        },
      },
    });
  }

  const results = [];

  for (const d of decisions) {
    /** Snapshot KPIs before any execution so outcomes compare pre-action vs later observation. */
    const baselineMetrics = await captureBaselineMetrics(scopeType, scopeId);

    const policy = evaluatePolicies(config, d);

    let status = "rejected";
    let reason = policy.reason ?? d.reason;
    let executedAt: Date | null = null;

    if (policy.allowed) {
      const expGate = await gateAutonomyExperimentExecution({
        scopeType,
        scopeId,
        domain: d.domain,
        signalKey: d.signalKey,
        actionType: d.actionType,
      });

      if (!expGate.execute) {
        status = "skipped";
        reason = expGate.reason;
        await prisma.autonomyEventLog.create({
          data: {
            scopeType,
            scopeId,
            eventType: "experiment_holdout",
            message: expGate.reason,
            meta: {
              experimentId: expGate.experimentId,
              entityId: expGate.entityId,
              domain: d.domain,
              signalKey: d.signalKey,
              actionType: d.actionType,
            },
          },
        });
      } else {
        if (d.ruleWeightId) {
          await incrementSelection(d.ruleWeightId);
        }

        const exec = await executeAutonomyAction(config, d, scopeType, scopeId);
        status = exec.status;
        executedAt = exec.executedAt ?? null;
        if (exec.detail) {
          reason = exec.detail;
        }
      }
    }

    const row = await prisma.autonomyAction.create({
      data: {
        scopeType,
        scopeId,
        domain: d.domain,
        actionType: d.actionType,
        signalKey: d.signalKey ?? null,
        baselineMetricsJson: baselineMetrics as unknown as Prisma.InputJsonValue,
        contextFeaturesJson: d.contextFeatures
          ? (d.contextFeatures as unknown as Prisma.InputJsonValue)
          : undefined,
        learningEligible: true,
        payloadJson: { ...d.payload } as Prisma.InputJsonValue,
        status,
        reason,
        confidence: d.selectionScore ?? d.confidence,
        executedAt,
      },
    });

    results.push(row);
  }

  await prisma.autonomyEventLog.create({
    data: {
      scopeType,
      scopeId,
      eventType: "decision",
      message: "Autonomy cycle completed",
      meta: {
        candidates: decisions.length,
        persisted: results.length,
      },
    },
  });

  return results;
}

/** Batch runner: all enabled `AutonomyConfig` rows (caps concurrency server-side via `take`). */
export async function runAutonomyDueBatch(opts?: { take?: number }) {
  const take = opts?.take ?? 50;
  const configs = await prisma.autonomyConfig.findMany({
    where: { isEnabled: true },
    take,
  });

  const results: Array<
    | { scopeType: string; scopeId: string; actions: Awaited<ReturnType<typeof runAutonomyCycle>> }
    | { scopeType: string; scopeId: string; error: string }
  > = [];

  for (const c of configs) {
    try {
      const actions = await runAutonomyCycle(c.scopeType, c.scopeId);
      results.push({ scopeType: c.scopeType, scopeId: c.scopeId, actions });
    } catch (e) {
      results.push({
        scopeType: c.scopeType,
        scopeId: c.scopeId,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { processed: configs.length, results };
}
