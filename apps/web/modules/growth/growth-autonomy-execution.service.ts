/**
 * Bounded low-risk execution — allowlisted internal records only; no external I/O.
 */

import { growthAutonomyFlags } from "@/config/feature-flags";
import { getAllowlistedAutoAction } from "./growth-autonomy-auto-allowlist";
import { parseGrowthAutonomyAutoDedupeHours } from "./growth-autonomy-auto-config";
import { explainSafeAutoExecutionAllowed, explainUndoForAction } from "./growth-autonomy-execution-explainer.service";
import {
  createGrowthAutonomyLowRiskExecutionRow,
  findRecentExecutionForDedupe,
  reverseGrowthAutonomyLowRiskExecution,
} from "./growth-autonomy-execution.repository";
import {
  recordExecutionAttempt,
  recordExecutionBlocked,
  recordExecutionExecuted,
  recordExecutionUndo,
  recordKillSwitchPreventedExecution,
} from "./growth-autonomy-execution-monitoring.service";
import type {
  GrowthAutonomyExecutionResult,
  GrowthAutonomyLowRiskActionKey,
} from "./growth-autonomy-auto.types";
import type { GrowthAutonomySuggestion } from "./growth-autonomy.types";

function operatorResultLine(key: GrowthAutonomyLowRiskActionKey): string {
  switch (key) {
    case "create_internal_review_task":
      return "Auto-created internal review task (Growth autonomy — internal only).";
    case "create_internal_followup_task":
      return "Auto-created internal follow-up task stub (Growth autonomy — internal only).";
    case "create_internal_content_draft":
      return "Auto-prepared internal content draft placeholder for operator editing.";
    case "queue_internal_followup_reminder":
      return "Queued internal follow-up reminder record (operator inbox — internal only).";
    case "add_internal_priority_tag":
      return "Applied internal priority tag for operator queue review.";
    case "prefill_simulation_context":
      return "Saved internal simulation context prefill bundle for this session.";
    default:
      return "Recorded internal-only automation artifact for operator review.";
  }
}

export async function executeGrowthAutonomyLowRiskAuto(args: {
  suggestion: GrowthAutonomySuggestion;
  operatorUserId: string;
  growthDashboardPath: string;
  rolloutStageLabel: string;
  killSwitchActive: boolean;
}): Promise<GrowthAutonomyExecutionResult> {
  try {
    recordExecutionAttempt();
  } catch {
    /* noop */
  }

  if (
    args.killSwitchActive ||
    growthAutonomyFlags.growthAutonomyKillSwitch ||
    !growthAutonomyFlags.growthAutonomyAutoLowRiskV1
  ) {
    try {
      recordKillSwitchPreventedExecution();
    } catch {
      /* noop */
    }
    try {
      recordExecutionBlocked();
    } catch {
      /* noop */
    }
    return { status: "blocked", reason: "Kill switch or auto-low-risk flag prevented execution." };
  }

  const exec = args.suggestion.execution;
  if (!exec || exec.resolvedExecutionClass !== "auto_low_risk") {
    try {
      recordExecutionBlocked();
    } catch {
      /* noop */
    }
    return {
      status: "blocked",
      reason: "Suggestion is not eligible for low-risk auto-execution.",
      catalogEntryId: args.suggestion.id,
    };
  }

  const allow = getAllowlistedAutoAction(args.suggestion.id);
  if (!allow) {
    recordExecutionBlocked();
    return {
      status: "blocked",
      reason: "Not allowlisted.",
      catalogEntryId: args.suggestion.id,
    };
  }

  const since = new Date(Date.now() - parseGrowthAutonomyAutoDedupeHours() * 60 * 60 * 1000);
  const dup = await findRecentExecutionForDedupe({
    operatorUserId: args.operatorUserId,
    catalogEntryId: args.suggestion.id,
    since,
  });
  if (dup) {
    return {
      status: "skipped_duplicate",
      reason: `Already recorded within dedupe window (${parseGrowthAutonomyAutoDedupeHours()}h).`,
      catalogEntryId: args.suggestion.id,
    };
  }

  const explanation = explainSafeAutoExecutionAllowed({
    catalogLabel: args.suggestion.label,
    lowRiskActionKey: allow.lowRiskActionKey,
    rolloutStageLabel: args.rolloutStageLabel,
  });
  const visible = operatorResultLine(allow.lowRiskActionKey);

  const payload = {
    kind: allow.lowRiskActionKey,
    growthDashboardPath: args.growthDashboardPath,
    suggestionId: args.suggestion.id,
    actionType: args.suggestion.actionType,
    targetKey: args.suggestion.targetKey,
    createdVia: "growth_autonomy_auto_low_risk_v1",
  };

  const id = await createGrowthAutonomyLowRiskExecutionRow({
    operatorUserId: args.operatorUserId,
    catalogEntryId: args.suggestion.id,
    lowRiskActionKey: allow.lowRiskActionKey,
    dispositionLabel: exec.resolvedExecutionClass,
    explanation,
    operatorVisibleResult: visible,
    undoAvailable: allow.reversibility === "reversible_internal",
    payload,
  });

  if (!id) {
    recordExecutionBlocked();
    return {
      status: "blocked",
      reason: "Persistence unavailable — execution was not recorded.",
      catalogEntryId: args.suggestion.id,
    };
  }

  recordExecutionExecuted();

  return {
    status: "executed",
    auditId: id,
    catalogEntryId: args.suggestion.id,
    lowRiskActionKey: allow.lowRiskActionKey,
    operatorVisibleResult: `${visible} ${explainUndoForAction(allow.lowRiskActionKey)}`,
    undoAvailable: allow.reversibility === "reversible_internal",
    explanation,
  };
}

export async function undoGrowthAutonomyLowRiskExecution(args: {
  auditId: string;
  operatorUserId: string;
}): Promise<boolean> {
  const ok = await reverseGrowthAutonomyLowRiskExecution(args);
  if (ok) {
    recordExecutionUndo();
  }
  return ok;
}
