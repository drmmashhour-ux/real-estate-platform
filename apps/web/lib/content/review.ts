import { prisma } from "@/lib/db";
import type { ContentStatus } from "./types";
import { isValidStatus } from "./policies";
import { mapRowToGeneratedContentRecord } from "./db-map";
import { logGeneratedContentAudit } from "./audit-log";

export type ReviewTransition =
  | { type: "submit"; from: "draft"; to: "pending_review" }
  | { type: "approve"; from: "pending_review"; to: "approved" }
  | { type: "reject"; from: "pending_review"; to: "rejected" }
  | { type: "back_to_draft"; from: "rejected"; to: "draft" };

const ALLOWED: Record<string, ContentStatus[]> = {
  draft: ["pending_review"],
  pending_review: ["approved", "rejected"],
  approved: [],
  rejected: ["draft"],
  published: [],
};

export function canTransition(from: ContentStatus, to: ContentStatus): boolean {
  return (ALLOWED[from] ?? []).includes(to);
}

export async function transitionContentStatus(input: {
  contentId: string;
  next: ContentStatus;
  actorUserId: string | null;
  reviewNote?: string | null;
}): Promise<{ ok: true; record: ReturnType<typeof mapRowToGeneratedContentRecord> } | { ok: false; error: string }> {
  const { contentId, next, actorUserId, reviewNote } = input;
  if (!isValidStatus(next)) return { ok: false, error: "invalid_status" };

  const row = await prisma.lecipmGeneratedContent.findUnique({ where: { id: contentId } });
  if (!row) return { ok: false, error: "not_found" };

  const from = row.status as ContentStatus;
  if (!isValidStatus(from)) return { ok: false, error: "invalid_current" };

  if (!canTransition(from, next) && !(from === "approved" && next === "published")) {
    return { ok: false, error: "transition_not_allowed" };
  }

  const data: {
    status: string;
    reviewedByUserId?: string | null;
    reviewedAt?: Date | null;
    reviewNote?: string | null;
  } = { status: next };

  if (next === "approved" || next === "rejected") {
    data.reviewedByUserId = actorUserId;
    data.reviewedAt = new Date();
    data.reviewNote = reviewNote ?? null;
  }

  if (next === "draft") {
    data.reviewedByUserId = null;
    data.reviewedAt = null;
  }

  const updated = await prisma.lecipmGeneratedContent.update({
    where: { id: contentId },
    data,
  });

  await logGeneratedContentAudit({
    contentId,
    action: "status_change",
    fromStatus: from,
    toStatus: next,
    actorUserId,
    snapshot: {
      title: updated.title,
      body: updated.body,
      seoTitle: updated.seoTitle,
      seoDescription: updated.seoDescription,
    },
    payload: reviewNote ? { reviewNote } : undefined,
  });

  return { ok: true, record: mapRowToGeneratedContentRecord(updated) };
}
