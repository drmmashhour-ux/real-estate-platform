/**
 * End-to-end marketplace autonomy run — Syria-local; deterministic ordering; never throws from helpers.
 */

import type { MarketplaceActionProposal } from "./darlink-marketplace-autonomy.types";
import { buildMarketplaceActionProposals } from "./darlink-action-proposal.service";
import { executeDarlinkMarketplaceAction } from "./darlink-action-handlers.service";
import { evaluateMarketplacePolicy } from "./darlink-autonomy-policy.service";
import { resolveMarketplaceGovernance } from "./darlink-autonomy-governance.service";
import { DarlinkAutonomyAuditEvent } from "./darlink-autonomy-audit.types";
import {
  createAutonomyRunRecord,
  finalizeAutonomyRunRecord,
  persistAutonomyAuditEvent,
  recordAutonomyActionOutcome,
} from "./darlink-autonomy-persistence.service";
import { requestMarketplaceApproval } from "./darlink-approval.service";
import { buildMarketplaceSnapshot } from "./darlink-marketplace-snapshot.service";
import { buildMarketplaceOpportunities } from "./darlink-opportunity-builder.service";
import { buildMarketplaceSignals } from "./darlink-signal-builder.service";
import { evaluateMarketplaceExecutionGate } from "./darlink-safe-execution-gate.service";
import { verifyMarketplaceActionOutcome } from "./darlink-verification.service";
import { getDarlinkAutonomyFlags } from "@/lib/platform-flags";
import { buildMarketplaceOutcomeFeedback } from "./darlink-outcome-feedback.service";

export type RunMarketplaceAutonomyParams = {
  listingId?: string | null;
  portfolio?: boolean;
  dryRun?: boolean;
  actorUserId?: string | null;
  /** When set, treats approval as granted for gate re-check paths (admin approve flow). */
  approvalOverrides?: Record<string, boolean>;
};

export type RunMarketplaceAutonomyResult = {
  ok: boolean;
  runId: string | null;
  snapshotBuiltAt: string;
  signalsCount: number;
  opportunitiesCount: number;
  proposalsCount: number;
  executedCount: number;
  blockedCount: number;
  pendingApprovalCount: number;
  dryRun: boolean;
  governanceMode: string;
  summaryNotes: readonly string[];
};

export async function runMarketplaceAutonomy(params: RunMarketplaceAutonomyParams): Promise<RunMarketplaceAutonomyResult> {
  const summaryNotes: string[] = [];
  const dryRun = params.dryRun !== false;

  try {
    const snapshot = await buildMarketplaceSnapshot({
      listingId: params.listingId ?? undefined,
      portfolio: params.portfolio !== false,
    });
    const signals = buildMarketplaceSignals(snapshot);
    const opportunities = buildMarketplaceOpportunities(signals, snapshot);
    const policy = evaluateMarketplacePolicy({ snapshot, signals, opportunities });
    const governance = resolveMarketplaceGovernance();
    const proposals = buildMarketplaceActionProposals(opportunities, policy, governance);

    let runId: string | null = null;
    if (getDarlinkAutonomyFlags().AUTONOMY_ENABLED) {
      runId = await createAutonomyRunRecord({
        dryRun,
        autonomyModeLabel: "darlink_marketplace_v1",
        governanceModeLabel: governance.mode,
        entityScope: snapshot.scope.mode,
        entityId: snapshot.scope.listingId ?? undefined,
      });
    }

    let executedCount = 0;
    let blockedCount = 0;
    let pendingApprovalCount = 0;

    const approvalOverrides = params.approvalOverrides ?? {};

    for (const sig of signals.slice(0, 80)) {
      await persistAutonomyAuditEvent({
        runId,
        eventType: DarlinkAutonomyAuditEvent.SIGNAL_DETECTED,
        payload: { signalId: sig.id, type: sig.type },
      });
    }

    for (const opp of opportunities.slice(0, 80)) {
      await persistAutonomyAuditEvent({
        runId,
        eventType: DarlinkAutonomyAuditEvent.OPPORTUNITY_CREATED,
        payload: { opportunityId: opp.id, title: opp.title },
      });
    }

    for (const proposal of proposals) {
      const gate = evaluateMarketplaceExecutionGate({
        policy,
        governanceMode: governance.mode,
        dryRun,
        proposal,
        approvalGranted: approvalOverrides[proposal.id] === true,
      });

      if (dryRun) {
        await recordAutonomyActionOutcome({
          runId,
          actionType: proposal.actionType,
          targetEntityId: proposal.entityId,
          dryRun: true,
          outcome: "DRY_RUN",
          detail: { gate: gate.executableStatus },
        });
        continue;
      }

      if (!gate.allowed && gate.executableStatus === "blocked") {
        blockedCount += 1;
        await persistAutonomyAuditEvent({
          runId,
          eventType: DarlinkAutonomyAuditEvent.ACTION_BLOCKED,
          payload: { proposalId: proposal.id, reasons: gate.blockedReasons },
        });
        await recordAutonomyActionOutcome({
          runId,
          actionType: proposal.actionType,
          targetEntityId: proposal.entityId,
          dryRun,
          outcome: "BLOCKED",
          detail: { reasons: [...gate.blockedReasons] },
        });
        continue;
      }

      if (gate.requiresApproval && !approvalOverrides[proposal.id]) {
        pendingApprovalCount += 1;
        await requestMarketplaceApproval({
          proposal,
          policySnapshot: policy,
          requestedByUserId: params.actorUserId ?? null,
        });
        await persistAutonomyAuditEvent({
          runId,
          eventType: DarlinkAutonomyAuditEvent.ACTION_PENDING_APPROVAL,
          payload: { proposalId: proposal.id },
        });
        await recordAutonomyActionOutcome({
          runId,
          actionType: proposal.actionType,
          targetEntityId: proposal.entityId,
          dryRun: false,
          outcome: "SKIPPED_APPROVAL_PENDING",
        });
        continue;
      }

      const execRes = await executeDarlinkMarketplaceAction({
        proposal,
        actorUserId: params.actorUserId ?? null,
        dryRun: false,
      });

      if (execRes.ok) {
        executedCount += 1;
        await persistAutonomyAuditEvent({
          runId,
          eventType: DarlinkAutonomyAuditEvent.ACTION_EXECUTED,
          payload: { proposalId: proposal.id, code: execRes.code },
          actorUserId: params.actorUserId,
        });
        await recordAutonomyActionOutcome({
          runId,
          actionType: proposal.actionType,
          targetEntityId: proposal.entityId,
          dryRun: false,
          outcome: "EXECUTED",
          detail: execRes.detail,
        });
        await verifyMarketplaceActionOutcome({
          proposal,
          expectedCode: execRes.code,
        });
      } else {
        blockedCount += 1;
        await persistAutonomyAuditEvent({
          runId,
          eventType: DarlinkAutonomyAuditEvent.ACTION_FAILED,
          payload: { proposalId: proposal.id, code: execRes.code },
        });
        await recordAutonomyActionOutcome({
          runId,
          actionType: proposal.actionType,
          targetEntityId: proposal.entityId,
          dryRun: false,
          outcome: "FAILED",
          detail: { code: execRes.code },
        });
      }
    }

    try {
      await buildMarketplaceOutcomeFeedback({
        snapshot,
        signals,
        proposalsExecuted: executedCount,
        proposalsBlocked: blockedCount,
        persist: true,
      });
    } catch {
      /* feedback optional */
    }

    if (runId) {
      await finalizeAutonomyRunRecord({
        runId,
        status: "COMPLETED",
        signalsCount: signals.length,
        opportunitiesCount: opportunities.length,
        proposalsCount: proposals.length,
        executedCount,
        blockedCount,
        summary: {
          governanceMode: governance.mode,
          dryRun,
          pendingApprovalCount,
        },
      });
    }

    return {
      ok: true,
      runId,
      snapshotBuiltAt: snapshot.builtAt,
      signalsCount: signals.length,
      opportunitiesCount: opportunities.length,
      proposalsCount: proposals.length,
      executedCount,
      blockedCount,
      pendingApprovalCount,
      dryRun,
      governanceMode: governance.mode,
      summaryNotes,
    };
  } catch {
    return {
      ok: false,
      runId: null,
      snapshotBuiltAt: new Date().toISOString(),
      signalsCount: 0,
      opportunitiesCount: 0,
      proposalsCount: 0,
      executedCount: 0,
      blockedCount: 0,
      pendingApprovalCount: 0,
      dryRun,
      governanceMode: "OFF",
      summaryNotes: ["orchestrator_failed_safe_return"],
    };
  }
}
