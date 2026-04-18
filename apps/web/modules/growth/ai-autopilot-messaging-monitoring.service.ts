/**
 * In-process counters + structured logs for messaging assist (drafts only — no outbound sends).
 */

import { logInfo } from "@/lib/logger";

const counts = {
  draftsGenerated: 0,
  draftsViewed: 0,
  draftsCopied: 0,
  generationFailures: 0,
  highPriorityDraftsGenerated: 0,
};

export function resetMessagingAssistMonitoringForTests(): void {
  counts.draftsGenerated = 0;
  counts.draftsViewed = 0;
  counts.draftsCopied = 0;
  counts.generationFailures = 0;
  counts.highPriorityDraftsGenerated = 0;
}

export function getMessagingAssistMonitoringSnapshot(): Readonly<typeof counts> {
  return { ...counts };
}

export function recordDraftsGenerated(n: number, opts?: { highPriority?: number }): void {
  counts.draftsGenerated += n;
  if (opts?.highPriority) counts.highPriorityDraftsGenerated += opts.highPriority;
}

export function recordDraftViewed(): void {
  counts.draftsViewed += 1;
}

export function recordDraftCopied(leadId: string, tone: string, priority: string | null): void {
  counts.draftsCopied += 1;
  logInfo("[autopilot:messaging]", {
    event: "draft_copied",
    leadId,
    tone,
    priority,
    copied: true,
  });
}

export function recordGenerationFailure(leadId: string, reason: string): void {
  counts.generationFailures += 1;
  logInfo("[autopilot:messaging]", {
    event: "generation_failed",
    leadId,
    reason,
    success: false,
  });
}

export function logMessagingAssistGeneration(leadId: string, tone: string, priority: string | null, success: boolean): void {
  logInfo("[autopilot:messaging]", {
    event: "draft_generated",
    leadId,
    tone,
    priority,
    success,
    copied: false,
  });
}
