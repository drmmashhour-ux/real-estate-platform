/**
 * Internal-only review state on `Lead.aiExplanation.aiMessagingAssist` — no send pipeline.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { aiResponseDeskFlags } from "@/config/feature-flags";
import type { AiMessagingAssistDraft } from "./ai-autopilot-messaging.types";
import type { AiMessagingAssistReviewState } from "./ai-response-desk.types";

export function parsePersistedReviewState(aiExplanation: unknown): AiMessagingAssistReviewState | null {
  if (!aiExplanation || typeof aiExplanation !== "object" || Array.isArray(aiExplanation)) return null;
  const am = (aiExplanation as { aiMessagingAssist?: unknown }).aiMessagingAssist;
  if (!am || typeof am !== "object" || Array.isArray(am)) return null;
  const rs = (am as { reviewState?: unknown }).reviewState;
  if (rs === "needs_review" || rs === "reviewed" || rs === "done") return rs;
  return null;
}

/**
 * Merges review fields into `aiExplanation` without touching `Lead.message` or non-assist keys.
 * Returns null if `aiMessagingAssist` block is missing (cannot attach review without draft shell).
 */
export function mergeReviewStateIntoAiExplanation(
  prev: unknown,
  next: AiMessagingAssistReviewState,
): Prisma.InputJsonValue | null {
  if (!prev || typeof prev !== "object" || Array.isArray(prev)) return null;
  const o = prev as Record<string, unknown>;
  const am = o.aiMessagingAssist;
  if (!am || typeof am !== "object" || Array.isArray(am)) return null;
  const draft = am as AiMessagingAssistDraft;
  const reviewUpdatedAt = new Date().toISOString();
  return {
    ...o,
    aiMessagingAssist: {
      ...draft,
      reviewState: next,
      reviewUpdatedAt,
    },
  } as Prisma.InputJsonValue;
}

async function updateLeadReviewState(leadId: string, next: AiMessagingAssistReviewState): Promise<{ ok: boolean; reason?: string }> {
  if (!aiResponseDeskFlags.aiResponseDeskReviewStateV1) {
    return { ok: false, reason: "review_state_disabled" };
  }

  let row: { aiExplanation: unknown } | null = null;
  try {
    row = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { aiExplanation: true },
    });
  } catch {
    return { ok: false, reason: "load_failed" };
  }

  if (!row) return { ok: false, reason: "not_found" };

  const merged = mergeReviewStateIntoAiExplanation(row.aiExplanation, next);
  if (!merged) return { ok: false, reason: "no_messaging_assist_block" };

  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { aiExplanation: merged },
    });
  } catch {
    return { ok: false, reason: "update_failed" };
  }

  return { ok: true };
}

export async function markDraftReviewed(leadId: string): Promise<{ ok: boolean; reason?: string }> {
  return updateLeadReviewState(leadId, "reviewed");
}

export async function markDraftNeedsReview(leadId: string): Promise<{ ok: boolean; reason?: string }> {
  return updateLeadReviewState(leadId, "needs_review");
}

export async function markDraftDone(leadId: string): Promise<{ ok: boolean; reason?: string }> {
  return updateLeadReviewState(leadId, "done");
}
