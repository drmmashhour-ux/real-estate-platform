import { launchFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { logGeneratedContentAudit } from "./audit-log";
import { mapRowToGeneratedContentRecord } from "./db-map";

/**
 * Publish only approved rows. Does not write listing fields — callers sync targets explicitly.
 */
export async function publishApprovedContent(input: {
  contentId: string;
  actorUserId: string | null;
}): Promise<
  { ok: true; record: ReturnType<typeof mapRowToGeneratedContentRecord> } | { ok: false; error: string }
> {
  const row = await prisma.lecipmGeneratedContent.findUnique({ where: { id: input.contentId } });
  if (!row) return { ok: false, error: "not_found" };
  if (row.status !== "approved") return { ok: false, error: "not_approved" };
  if (
    !launchFlags.enableAiContentPublish &&
    (row.generationSource === "ai" || row.generationSource === "hybrid")
  ) {
    return { ok: false, error: "ai_publish_disabled" };
  }

  const snapshot = {
    title: row.title,
    body: row.body,
    summary: row.summary,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
  };

  const updated = await prisma.lecipmGeneratedContent.update({
    where: { id: row.id },
    data: {
      status: "published",
      publishedAt: new Date(),
      publishedByUserId: input.actorUserId,
    },
  });

  await logGeneratedContentAudit({
    contentId: row.id,
    action: "publish",
    fromStatus: "approved",
    toStatus: "published",
    actorUserId: input.actorUserId,
    snapshot,
  });

  return { ok: true, record: mapRowToGeneratedContentRecord(updated) };
}

type PublishSnapshot = {
  title?: string | null;
  body?: string;
  summary?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

/**
 * Revert published row to approved and restore fields from last publish audit snapshot.
 */
export async function rollbackLastPublish(input: {
  contentId: string;
  actorUserId: string | null;
}): Promise<
  { ok: true; record: ReturnType<typeof mapRowToGeneratedContentRecord> } | { ok: false; error: string }
> {
  const row = await prisma.lecipmGeneratedContent.findUnique({ where: { id: input.contentId } });
  if (!row) return { ok: false, error: "not_found" };
  if (row.status !== "published") return { ok: false, error: "not_published" };

  const lastPublish = await prisma.lecipmGeneratedContentAuditLog.findFirst({
    where: { contentId: row.id, action: "publish" },
    orderBy: { createdAt: "desc" },
  });

  const snap = (lastPublish?.snapshot ?? null) as PublishSnapshot | null;

  const updated = await prisma.lecipmGeneratedContent.update({
    where: { id: row.id },
    data: {
      status: "approved",
      publishedAt: null,
      publishedByUserId: null,
      ...(snap?.body != null ? { body: snap.body } : {}),
      ...(snap?.title !== undefined ? { title: snap.title } : {}),
      ...(snap?.summary !== undefined ? { summary: snap.summary } : {}),
      ...(snap?.seoTitle !== undefined ? { seoTitle: snap.seoTitle } : {}),
      ...(snap?.seoDescription !== undefined ? { seoDescription: snap.seoDescription } : {}),
    },
  });

  await logGeneratedContentAudit({
    contentId: row.id,
    action: "rollback_publish",
    fromStatus: "published",
    toStatus: "approved",
    actorUserId: input.actorUserId,
    payload: { restoredFromAuditId: lastPublish?.id ?? null },
  });

  return { ok: true, record: mapRowToGeneratedContentRecord(updated) };
}
