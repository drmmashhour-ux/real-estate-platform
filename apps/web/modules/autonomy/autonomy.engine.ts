import type { AutonomyRunSummary, RunAutonomousOperationsInput } from "@/modules/autonomy/autonomy.types";
import { buildAutonomousActionCandidates } from "@/modules/autonomy/action-candidate-builder.service";
import { routeAutonomousAction } from "@/modules/autonomy/action-router.service";
import {
  evaluateCandidateAgainstPolicy,
  getApplicableAutonomyPolicy,
} from "@/modules/autonomy/autonomy-policy.service";
import { autonomyLog } from "@/modules/autonomy/autonomy-log";
import { mergePortfolioIntelligenceForAutonomy } from "@/modules/autonomy/portfolio-autonomy.bridge";

/** End-to-end autonomy run — never throws; returns summary for dashboards. */
export async function runAutonomousOperations(input: RunAutonomousOperationsInput): Promise<AutonomyRunSummary> {
  const queuedActions: string[] = [];
  const executedActions: string[] = [];
  const blockedActions: string[] = [];
  const approvalRequiredActions: string[] = [];

  try {
    const merged = mergePortfolioIntelligenceForAutonomy(input);
    const candidates = buildAutonomousActionCandidates(merged);
    const policy = await getApplicableAutonomyPolicy({ brokerId: input.brokerId ?? null });

    for (const c of candidates) {
      if (input.dryRun) {
        const ev = evaluateCandidateAgainstPolicy(c, policy);
        if (ev.blocked) blockedActions.push(c.id);
        else if (ev.requiresApproval) approvalRequiredActions.push(c.id);
        else executedActions.push(c.id);
        continue;
      }

      const r = await routeAutonomousAction(c, {
        brokerId: input.brokerId,
        policy,
        dryRun: false,
      });
      if (r.status === "QUEUED") {
        queuedActions.push(c.id);
        approvalRequiredActions.push(c.id);
      } else if (r.status === "EXECUTED") {
        executedActions.push(c.id);
      } else if (r.status === "BLOCKED") {
        blockedActions.push(c.id);
        queuedActions.push(c.id);
      }
    }

    const rationale = `processed=${candidates.length} dryRun=${Boolean(input.dryRun)} mode=${policy.mode}`;
    autonomyLog.runCompleted({
      candidates: candidates.length,
      dryRun: Boolean(input.dryRun),
    });
    return {
      queuedActions,
      executedActions,
      blockedActions,
      approvalRequiredActions,
      rationale,
    };
  } catch {
    return {
      queuedActions: [],
      executedActions: [],
      blockedActions: [],
      approvalRequiredActions: [],
      rationale: "autonomy_run_failed_safe",
    };
  }
}
