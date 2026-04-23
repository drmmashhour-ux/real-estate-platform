export class AlertAnalysisSafetyError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "AlertAnalysisSafetyError";
  }
}

const GUARANTEED = /\b(guaranteed|risk-?free|certain return|sure thing|can't lose|can't miss)\b/i;
const AUTO_EXEC = /\"(executeNow|autoExecute|autoRun|autoCommit)\"\s*:\s*true/i;

export function assertAlertAnalysisOutputSafe(raw: string): void {
  if (GUARANTEED.test(raw)) {
    throw new AlertAnalysisSafetyError("GUARANTEED_OUTCOME_LANGUAGE_FORBIDDEN");
  }
  if (AUTO_EXEC.test(raw)) {
    throw new AlertAnalysisSafetyError("AI_SUGGESTION_CANNOT_AUTO_EXECUTE");
  }
}

export function assertAlertContextPresent(alert: { id?: string } | null | undefined): asserts alert is { id: string } {
  if (!alert?.id) {
    throw new AlertAnalysisSafetyError("ALERT_CONTEXT_REQUIRED");
  }
}
