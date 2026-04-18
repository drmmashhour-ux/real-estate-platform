import { buildFounderIntelligenceSnapshot } from "../founder-intelligence/founder-intelligence.service";
import type { CompanyMetricsWindow } from "../company-metrics/company-metrics.types";
import type { ExecutiveSession } from "../owner-access/owner-access.types";
import { runFounderCopilotEngine } from "./founder-copilot.engine";
import type { FounderCopilotRunResult } from "./founder-copilot.types";

export async function getFounderCopilotPayload(
  session: ExecutiveSession,
  window: CompanyMetricsWindow,
  custom?: { from: string; to: string },
): Promise<FounderCopilotRunResult> {
  const snapshot = await buildFounderIntelligenceSnapshot(session.scope, window, session.userId, custom);
  return runFounderCopilotEngine(snapshot, undefined);
}

export async function runFounderCopilotWithQuestion(
  session: ExecutiveSession,
  window: CompanyMetricsWindow,
  question: string,
  custom?: { from: string; to: string },
): Promise<FounderCopilotRunResult> {
  const snapshot = await buildFounderIntelligenceSnapshot(session.scope, window, session.userId, custom);
  return runFounderCopilotEngine(snapshot, question);
}
