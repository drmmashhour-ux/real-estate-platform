/**
 * Counters + logs for content draft assist (drafts only — no publish / no ads APIs).
 */

import { logInfo } from "@/lib/logger";

const counts = {
  draftsGenerated: 0,
  draftsCopied: 0,
  draftsRegenerated: 0,
  failures: 0,
};

export function resetContentAssistMonitoringForTests(): void {
  counts.draftsGenerated = 0;
  counts.draftsCopied = 0;
  counts.draftsRegenerated = 0;
  counts.failures = 0;
}

export function getContentAssistMonitoringSnapshot(): Readonly<typeof counts> {
  return { ...counts };
}

export function recordContentDraftsGenerated(n: number): void {
  counts.draftsGenerated += n;
}

export function recordContentDraftCopied(draftId: string, type: string): void {
  counts.draftsCopied += 1;
  logInfo("[autopilot:content]", {
    event: "draft_copied",
    draftId,
    type,
  });
}

export function recordContentDraftRegenerated(): void {
  counts.draftsRegenerated += 1;
  logInfo("[autopilot:content]", { event: "draft_regenerated" });
}

export function recordContentAssistFailure(reason: string): void {
  counts.failures += 1;
  logInfo("[autopilot:content]", { event: "failure", reason });
}
