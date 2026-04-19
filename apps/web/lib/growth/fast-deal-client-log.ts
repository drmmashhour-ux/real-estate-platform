/**
 * Client-only calls to log operator actions for the Fast Deal results loop.
 * No side effects except JSON POST; always best-effort.
 */

import type { FastDealSourceType } from "@/modules/growth/fast-deal-results.types";

export async function postFastDealSourceEventLog(input: {
  sourceType: FastDealSourceType;
  sourceSubType: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await fetch("/api/admin/growth/fast-deal/log", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "source", ...input }),
    });
  } catch {
    /* best-effort */
  }
}

export async function postFastDealOutcomeLog(input: {
  outcomeType: string;
  sourceEventId?: string;
  leadId?: string;
  brokerId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await fetch("/api/admin/growth/fast-deal/log", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "outcome", ...input }),
    });
  } catch {
    /* best-effort */
  }
}
