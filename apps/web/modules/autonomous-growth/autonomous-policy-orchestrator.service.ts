import type { AutopilotMode } from "@prisma/client";
import { getEffectiveAutopilotMode, modeAllowsSafeAuto } from "@/modules/ai-autopilot/policies/autopilot-mode.service";
import { evaluateGuardrails } from "@/modules/operator/guardrail-engine.service";
import { isExternallySyncableBudgetAction } from "@/modules/operator/operator-execution.types";
import type { UnifiedAutonomousRow } from "./autonomous-decision-unifier.service";

const HIGH_IMPACT = new Set([
  "SCALE_CAMPAIGN",
  "PAUSE_CAMPAIGN",
  "RECOMMEND_PRICE_CHANGE",
  "BOOST_LISTING",
  "DOWNRANK_LISTING",
  "PROMOTE_EXPERIMENT_WINNER",
  "UPDATE_CTA_PRIORITY",
  "UPDATE_RETARGETING_MESSAGE_PRIORITY",
]);

export type AutonomousPolicyBuckets = {
  executableNow: UnifiedAutonomousRow[];
  approvalRequired: UnifiedAutonomousRow[];
  blocked: UnifiedAutonomousRow[];
  simulationRequired: UnifiedAutonomousRow[];
  monitorOnly: UnifiedAutonomousRow[];
};

function runtimeEnv(): "development" | "staging" | "production" {
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") return "production";
  if (process.env.VERCEL_ENV === "preview") return "staging";
  return "development";
}

function cloneRow(row: UnifiedAutonomousRow, patch: Partial<AutonomousExecutionCandidate>): UnifiedAutonomousRow {
  return {
    assistant: row.assistant,
    candidate: {
      ...row.candidate,
      ...patch,
      warnings: [...row.candidate.warnings],
      blockers: [...row.candidate.blockers],
    },
  };
}

/**
 * Buckets candidates by autonomy mode and existing operator guardrails — no bypass of safety constraints.
 */
export async function evaluateCandidatesAgainstAutonomyPolicies(
  rows: UnifiedAutonomousRow[],
  opts?: { mode?: AutopilotMode },
): Promise<{ buckets: AutonomousPolicyBuckets; mode: AutopilotMode }> {
  const env = runtimeEnv();
  const mode = opts?.mode ?? (await getEffectiveAutopilotMode("platform", "global"));

  const buckets: AutonomousPolicyBuckets = {
    executableNow: [],
    approvalRequired: [],
    blocked: [],
    simulationRequired: [],
    monitorOnly: [],
  };

  for (const row of rows) {
    const g = evaluateGuardrails({ recommendation: row.assistant, environment: env });
    const base = cloneRow(row, { autonomyMode: mode });

    if (!row.candidate.policyAllowed || !g.allowed) {
      buckets.blocked.push(
        cloneRow(base, {
          policyAllowed: false,
          requiresApproval: true,
          blockers: [...new Set([...base.candidate.blockers, ...g.blockingReasons, ...row.candidate.blockers])],
          warnings: [...new Set([...base.candidate.warnings, ...g.warnings])],
        }),
      );
      continue;
    }

    const merged = cloneRow(base, {
      warnings: [...new Set([...base.candidate.warnings, ...g.warnings])],
      blockers: [...base.candidate.blockers],
    });

    const isMonitor = merged.assistant.actionType === "MONITOR" || merged.assistant.actionType === "NO_ACTION";
    if (isMonitor) {
      buckets.monitorOnly.push(
        cloneRow(merged, {
          requiresSimulation: false,
          requiresApproval: false,
        }),
      );
      continue;
    }

    if (mode === "OFF" || mode === "ASSIST") {
      buckets.monitorOnly.push(
        cloneRow(merged, {
          requiresApproval: false,
          requiresSimulation: false,
          warnings: [
            ...merged.candidate.warnings,
            mode === "ASSIST" ?
              "ASSIST mode — suggestions only; no autonomous execution bucket."
            : "Autopilot OFF — observation only.",
          ],
        }),
      );
      continue;
    }

    if (isExternallySyncableBudgetAction(merged.assistant.actionType)) {
      buckets.approvalRequired.push(
        cloneRow(merged, {
          requiresApproval: true,
          requiresSimulation: true,
          policyAllowed: true,
          warnings: [
            ...merged.candidate.warnings,
            "Budget-impacting action — external sync requires explicit approval (Operator).",
          ],
        }),
      );
      continue;
    }

    const high = HIGH_IMPACT.has(merged.assistant.actionType);
    const wantsSim = high || merged.assistant.confidenceLabel === "LOW";

    if (mode === "FULL_AUTOPILOT_APPROVAL") {
      buckets.approvalRequired.push(
        cloneRow(merged, {
          requiresApproval: true,
          requiresSimulation: wantsSim,
          policyAllowed: true,
          warnings: [
            ...merged.candidate.warnings,
            "FULL_AUTOPILOT_APPROVAL — human approval required before any execution.",
          ],
        }),
      );
      if (wantsSim) {
        buckets.simulationRequired.push(
          cloneRow(merged, {
            requiresSimulation: true,
            requiresApproval: true,
          }),
        );
      }
      continue;
    }

    if (mode === "SAFE_AUTOPILOT" && modeAllowsSafeAuto(mode)) {
      if (high || merged.assistant.confidenceLabel === "LOW") {
        buckets.approvalRequired.push(
          cloneRow(merged, {
            requiresApproval: true,
            requiresSimulation: wantsSim,
            policyAllowed: true,
          }),
        );
        if (wantsSim) {
          buckets.simulationRequired.push(cloneRow(merged, { requiresSimulation: true, requiresApproval: true }));
        }
        continue;
      }

      buckets.executableNow.push(
        cloneRow(merged, {
          requiresApproval: false,
          requiresSimulation: false,
          policyAllowed: true,
          warnings: [
            ...merged.candidate.warnings,
            "SAFE_AUTOPILOT — eligible for low-risk internal execution only when execution flag is on.",
          ],
        }),
      );
      continue;
    }

    buckets.monitorOnly.push(
      cloneRow(merged, {
        warnings: [...merged.candidate.warnings, "No autonomous execution bucket for current mode."],
      }),
    );
  }

  return { buckets, mode };
}
