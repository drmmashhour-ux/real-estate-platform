/**
 * Executive Command Center outputs are advisory — no autonomous regulated execution.
 */

import {
  assertNoAutonomousExecutionLanguage,
  assertNoGuaranteedPerformanceLanguage,
} from "@/lib/autopilot/safety";

const REGULATED_AUTO_EXEC =
  /\b(wire\s+funds|transfer\s+funds|file\s+(?:the\s+)?(?:tax|t1|return)|sign\s+(?:on\s+your\s+behalf|for\s+you)|notarize\s+automatically|open\s+account\s+for\s+you)\b/i;

export function assertExecutiveAiNarrativeSafe(text: string, context: string): void {
  assertNoGuaranteedPerformanceLanguage(text, context);
  assertNoAutonomousExecutionLanguage(text, context);
  if (text && REGULATED_AUTO_EXEC.test(text)) {
    const err = new Error("EXECUTIVE_AUTO_EXECUTION_FORBIDDEN");
    (err as Error & { context?: string }).context = context;
    throw err;
  }
}

export type ExecutiveSummaryPayload = {
  summary: string;
  topPriorities: string[];
  risks: string[];
  opportunities: string[];
  executiveActions: string[];
  dataScopeLabels: string[];
};

export const EXECUTIVE_DATA_SCOPE_LABELS = [
  "Platform data",
  "Imported market data",
  "Estimated AI insight",
] as const;

/** Ensures partial snapshots still carry explicit scope labels (product + compliance). */
export function assertExecutiveScopeLabels(
  partialCoverage: boolean,
  labels: string[] | undefined | null
): void {
  if (!partialCoverage) return;
  if (!labels || labels.length === 0) {
    throw new Error("EXECUTIVE_DATA_SCOPE_LABEL_REQUIRED");
  }
}

export function assertExecutiveSummaryPayload(payload: ExecutiveSummaryPayload): void {
  assertExecutiveAiNarrativeSafe(payload.summary, "executive.summary");
  for (let i = 0; i < (payload.topPriorities ?? []).length; i++) {
    assertExecutiveAiNarrativeSafe(payload.topPriorities[i] ?? "", `executive.topPriorities[${i}]`);
  }
  for (let i = 0; i < (payload.risks ?? []).length; i++) {
    assertExecutiveAiNarrativeSafe(payload.risks[i] ?? "", `executive.risks[${i}]`);
  }
  for (let i = 0; i < (payload.opportunities ?? []).length; i++) {
    assertExecutiveAiNarrativeSafe(payload.opportunities[i] ?? "", `executive.opportunities[${i}]`);
  }
  for (let i = 0; i < (payload.executiveActions ?? []).length; i++) {
    assertExecutiveAiNarrativeSafe(payload.executiveActions[i] ?? "", `executive.executiveActions[${i}]`);
  }
}
