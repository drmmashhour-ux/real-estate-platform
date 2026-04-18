/**
 * In-memory execution lifecycle for autopilot (per instance). No schema migration.
 */

import type { AiAutopilotExecutionStatus } from "./ai-autopilot.types";

export type AutopilotExecutionRecord = {
  executionStatus: AiAutopilotExecutionStatus;
  executionNotes?: string;
  /** LeadTimelineEvent ids created for rollback */
  timelineEventIds?: string[];
  /** Previous values for `lead_launch_sales_contacted` rollback */
  leadRollback?: {
    leadId: string;
    launchSalesContacted: boolean;
    launchLastContactDate: Date | null;
  };
};

const byActionId = new Map<string, AutopilotExecutionRecord>();

export function getAutopilotExecutionRecord(actionId: string): AutopilotExecutionRecord | null {
  return byActionId.get(actionId) ?? null;
}

export function setAutopilotExecutionRecord(actionId: string, rec: AutopilotExecutionRecord): void {
  byActionId.set(actionId, rec);
}

export function isAutopilotActionAlreadyExecuted(actionId: string): boolean {
  const r = byActionId.get(actionId);
  return r?.executionStatus === "executed";
}

export function resetAutopilotExecutionStateForTests(): void {
  byActionId.clear();
}
