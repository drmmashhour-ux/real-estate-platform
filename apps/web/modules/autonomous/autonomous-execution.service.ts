import type { AutonomousDecision } from "./autonomous-marketplace.types";

export type AutonomousExecutionLogEntry = {
  at: string;
  decisionId: string;
  outcome: "executed_log_only" | "blocked_governance" | "rejected" | "missing_approval";
  detail: string;
};

const MAX_LOG = 200;
const logs: AutonomousExecutionLogEntry[] = [];

function pushLog(entry: AutonomousExecutionLogEntry): void {
  logs.unshift(entry);
  if (logs.length > MAX_LOG) logs.length = MAX_LOG;
}

export function getAutonomousExecutionLogs(): AutonomousExecutionLogEntry[] {
  return [...logs];
}

export type ExecuteAutonomousOptions = {
  approved: boolean;
  /** When false, no execution path is taken (governance block or freeze). */
  governanceAllowsExecution: boolean;
};

/**
 * No production mutations — log-only “execution” for audit trail.
 * Pricing, sends, and spend never change here.
 */
export function executeAutonomousDecision(
  decision: AutonomousDecision,
  opts: ExecuteAutonomousOptions,
): { ok: boolean; log: AutonomousExecutionLogEntry } {
  const at = new Date().toISOString();

  if (!opts.approved) {
    const log: AutonomousExecutionLogEntry = {
      at,
      decisionId: decision.id,
      outcome: "rejected",
      detail: "Operator rejected — no side effects.",
    };
    pushLog(log);
    return { ok: false, log };
  }

  if (!opts.governanceAllowsExecution) {
    const log: AutonomousExecutionLogEntry = {
      at,
      decisionId: decision.id,
      outcome: "blocked_governance",
      detail: "Governance / policy enforcement blocks autonomous execution for this path.",
    };
    pushLog(log);
    return { ok: false, log };
  }

  const log: AutonomousExecutionLogEntry = {
    at,
    decisionId: decision.id,
    outcome: "executed_log_only",
    detail: `Recorded intent only (${decision.domain}: ${decision.action}). No pricing, spend, or outbound messages were changed.`,
  };
  pushLog(log);
  return { ok: true, log };
}

/** Test helper — not used in production UI. */
export function __resetAutonomousExecutionLogsForTests(): void {
  logs.length = 0;
}
