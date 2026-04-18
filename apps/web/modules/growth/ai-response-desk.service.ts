/**
 * Builds ordered response-desk rows — read-only; no DB writes.
 */

import type { AiFollowUpQueueItem } from "./ai-autopilot-followup.types";
import type { AiMessagingAssistResult } from "./ai-autopilot-messaging.types";
import type { AiResponseDeskItem, AiResponseDeskLeadRow, AiResponseDeskStatus } from "./ai-response-desk.types";
import { parsePersistedReviewState } from "./ai-response-desk-state.service";

function tagList(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.filter((t): t is string => typeof t === "string");
  return [];
}

function isHighIntent(lead: AiResponseDeskLeadRow): boolean {
  if (lead.aiPriority === "high") return true;
  return tagList(lead.aiTags).includes("high_intent");
}

function isFollowUrgent(follow: AiFollowUpQueueItem | undefined, lead: AiResponseDeskLeadRow): boolean {
  if (follow?.status === "due_now") return true;
  if (follow?.followUpPriority === "high") return true;
  return tagList(lead.aiTags).includes("needs_followup");
}

function deriveDraftStatus(args: {
  aiExplanation: unknown;
  draft: AiMessagingAssistResult | undefined;
  follow: AiFollowUpQueueItem | undefined;
  lead: AiResponseDeskLeadRow;
}): AiResponseDeskStatus {
  const persisted = parsePersistedReviewState(args.aiExplanation);
  if (persisted === "done") return "done";
  if (persisted === "reviewed") return "reviewed";
  if (persisted === "needs_review") return "needs_review";

  const follow = args.follow;
  if (follow && (follow.status === "due_now" || follow.followUpPriority === "high")) {
    return "followup_recommended";
  }
  if (isFollowUrgent(follow, args.lead) && !args.draft) {
    return "followup_recommended";
  }
  if (args.draft && (isHighIntent(args.lead) || tagList(args.lead.aiTags).includes("needs_followup"))) {
    return "draft_ready";
  }
  if (args.draft) {
    return "draft_ready";
  }
  return "needs_review";
}

function computeSortTier(lead: AiResponseDeskLeadRow, draftStatus: AiResponseDeskStatus, follow?: AiFollowUpQueueItem): number {
  if (isHighIntent(lead)) return 3;
  if (isFollowUrgent(follow, lead)) return 2;
  if (draftStatus === "draft_ready" || draftStatus === "followup_recommended") return 1;
  return 0;
}

export function shouldIncludeLeadOnDesk(args: {
  aiExplanation: unknown;
  draft: AiMessagingAssistResult | undefined;
  follow: AiFollowUpQueueItem | undefined;
}): boolean {
  if (parsePersistedReviewState(args.aiExplanation)) return true;
  if (args.draft) return true;
  if (args.follow && args.follow.status !== "done") return true;
  return false;
}

export function buildResponseDeskItems(args: {
  leads: AiResponseDeskLeadRow[];
  draftsByLeadId: Map<string, AiMessagingAssistResult>;
  followByLeadId: Map<string, AiFollowUpQueueItem>;
}): AiResponseDeskItem[] {
  const items: AiResponseDeskItem[] = [];
  const now = new Date().toISOString();

  for (const lead of args.leads) {
    const draft = args.draftsByLeadId.get(lead.id);
    const follow = args.followByLeadId.get(lead.id);
    if (!shouldIncludeLeadOnDesk({ aiExplanation: lead.aiExplanation, draft, follow })) {
      continue;
    }
    const draftStatus = deriveDraftStatus({ aiExplanation: lead.aiExplanation, draft, follow, lead });
    const ap = lead.aiPriority;
    const aiPriority: "low" | "medium" | "high" | undefined =
      ap === "low" || ap === "medium" || ap === "high" ? ap : undefined;
    const followUpPriority = follow?.followUpPriority;

    const reviewAt =
      typeof lead.aiExplanation === "object" &&
      lead.aiExplanation !== null &&
      !Array.isArray(lead.aiExplanation) &&
      typeof (lead.aiExplanation as { aiMessagingAssist?: { reviewUpdatedAt?: string } }).aiMessagingAssist?.reviewUpdatedAt ===
        "string"
        ? (lead.aiExplanation as { aiMessagingAssist: { reviewUpdatedAt: string } }).aiMessagingAssist.reviewUpdatedAt
        : undefined;

    items.push({
      leadId: lead.id,
      leadName: lead.name?.trim() || "—",
      leadEmail: lead.email?.trim() || "—",
      draftStatus,
      aiPriority,
      followUpPriority,
      suggestedReply: draft?.suggestedReply,
      rationale: draft?.rationale,
      updatedAt: reviewAt ?? draft?.createdAt ?? follow?.updatedAt ?? now,
      sortTier: computeSortTier(lead, draftStatus, follow),
    });
  }

  return sortResponseDeskItems(items);
}

/**
 * Deterministic ordering: higher sortTier first, then leadId.
 */
export function sortResponseDeskItems(items: AiResponseDeskItem[]): AiResponseDeskItem[] {
  return [...items].sort((a, b) => {
    if (b.sortTier !== a.sortTier) return b.sortTier - a.sortTier;
    return a.leadId.localeCompare(b.leadId);
  });
}
