/**
 * Auto delete / retention: rules for temporary files, previews, expired exports,
 * soft-deleted files. Soft delete first; 30-day trash before permanent delete.
 * Never auto-delete legal, invoice, or compliance files.
 */
import { prisma } from "@/lib/db";
import { isProtectedRetentionPolicy } from "./analytics";

const TRASH_RETENTION_DAYS = 30;
const TEMP_RETENTION_DAYS = 30;
const PREVIEW_RETENTION_DAYS = 7;
const EXPORT_RETENTION_DAYS = 30;

export type RetentionRule = "temp_30d" | "preview_7d" | "export_30d" | "standard" | "legal" | "invoice" | "compliance";

export async function softDeleteFile(recordId: string, userId: string): Promise<void> {
  const record = await prisma.storageFileRecord.findFirst({ where: { id: recordId, userId } });
  if (record) {
    await prisma.storageAuditLog.create({
      data: { action: "DELETE", entityType: "storage_file_record", entityId: recordId, userId, details: { fileUrl: record.fileUrl, soft: true } },
    });
  }
  await prisma.storageFileRecord.updateMany({
    where: { id: recordId, userId },
    data: { deletedAt: new Date() },
  });
}

export async function restoreFile(recordId: string, userId: string): Promise<void> {
  const record = await prisma.storageFileRecord.findFirst({ where: { id: recordId, userId } });
  if (record) {
    await prisma.storageAuditLog.create({
      data: { action: "RESTORE", entityType: "storage_file_record", entityId: recordId, userId, details: { fileUrl: record.fileUrl } },
    });
  }
  await prisma.storageFileRecord.updateMany({
    where: { id: recordId, userId },
    data: { deletedAt: null, restoredAt: new Date() },
  });
}

/** List files in trash (soft-deleted) for the user, within retention window. */
export async function listTrash(userId: string) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TRASH_RETENTION_DAYS);
  return prisma.storageFileRecord.findMany({
    where: {
      userId,
      deletedAt: { not: null, gte: cutoff },
      retentionPolicy: { notIn: ["legal", "invoice", "compliance"] },
    },
    orderBy: { deletedAt: "desc" },
  });
}

/** Get files eligible for permanent deletion (past trash retention, not protected). */
export async function getEligibleForPermanentDeletion(): Promise<
  { id: string; userId: string; fileUrl: string; retentionPolicy: string; deletedAt: Date }[]
> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TRASH_RETENTION_DAYS);
  const rows = await prisma.storageFileRecord.findMany({
    where: {
      deletedAt: { not: null, lt: cutoff },
      retentionPolicy: { notIn: ["legal", "invoice", "compliance"] },
    },
    select: { id: true, userId: true, fileUrl: true, retentionPolicy: true, deletedAt: true },
  });
  return rows.filter((r) => r.deletedAt != null && !isProtectedRetentionPolicy(r.retentionPolicy)) as {
    id: string;
    userId: string;
    fileUrl: string;
    retentionPolicy: string;
    deletedAt: Date;
  }[];
}

/** Mark expired temp/preview/export files as soft-deleted (never legal/invoice/compliance). */
export async function applyRetentionRules(): Promise<{ softDeleted: number }> {
  const now = new Date();
  const tempCutoff = new Date(now);
  tempCutoff.setDate(tempCutoff.getDate() - TEMP_RETENTION_DAYS);
  const previewCutoff = new Date(now);
  previewCutoff.setDate(previewCutoff.getDate() - PREVIEW_RETENTION_DAYS);
  const exportCutoff = new Date(now);
  exportCutoff.setDate(exportCutoff.getDate() - EXPORT_RETENTION_DAYS);

  const result = await prisma.storageFileRecord.updateMany({
    where: {
      deletedAt: null,
      retentionPolicy: { notIn: ["legal", "invoice", "compliance", "standard"] },
      OR: [
        { retentionPolicy: "temp_30d", createdAt: { lt: tempCutoff } },
        { retentionPolicy: "preview_7d", createdAt: { lt: previewCutoff } },
        { retentionPolicy: "export_30d", createdAt: { lt: exportCutoff } },
      ],
    },
    data: { deletedAt: now },
  });

  return { softDeleted: result.count };
}

/** Permanent delete only after retention policy allows; log to audit. */
export async function permanentDeleteFile(
  recordId: string,
  userId: string,
  reason: string
): Promise<boolean> {
  const record = await prisma.storageFileRecord.findFirst({
    where: { id: recordId, userId },
  });
  if (!record || !record.deletedAt) return false;
  if (isProtectedRetentionPolicy(record.retentionPolicy)) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TRASH_RETENTION_DAYS);
  if (record.deletedAt > cutoff) return false;

  await prisma.storageAuditLog.create({
    data: {
      action: "DELETE",
      entityType: "storage_file_record",
      entityId: recordId,
      userId,
      details: { reason, fileUrl: record.fileUrl, retentionPolicy: record.retentionPolicy },
    },
  });
  await prisma.storageFileRecord.delete({ where: { id: recordId } });
  return true;
}
