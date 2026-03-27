/**
 * Create or update StorageFileRecord for uploads. Call after successful save.
 * For images, run compressImage first and pass result to record compressed size.
 */
import { prisma } from "@/lib/db";
import type { CompressionResult } from "./compress";

export type CreateStorageRecordParams = {
  userId: string;
  listingId?: string;
  entityType: string;
  entityId?: string;
  fileUrl: string;
  fileType: string;
  mimeType?: string;
  originalSize: number;
  compressedSize?: number;
  isTemporary?: boolean;
  retentionPolicy?: string;
  optimizationStatus?: string;
};

export async function createStorageFileRecord(params: CreateStorageRecordParams): Promise<string> {
  const record = await prisma.storageFileRecord.create({
    data: {
      userId: params.userId,
      listingId: params.listingId ?? null,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      fileUrl: params.fileUrl,
      fileType: params.fileType,
      mimeType: params.mimeType ?? null,
      originalSize: params.originalSize,
      compressedSize: params.compressedSize ?? null,
      isTemporary: params.isTemporary ?? false,
      retentionPolicy: params.retentionPolicy ?? "standard",
      optimizationStatus: params.optimizationStatus ?? "pending",
    },
  });
  return record.id;
}

/** Create record from compression result (e.g. after image upload). Logs to audit. */
export async function createStorageFileRecordFromCompression(
  params: Omit<CreateStorageRecordParams, "originalSize" | "compressedSize" | "optimizationStatus"> & {
    compressionResult: CompressionResult;
  }
): Promise<string> {
  const r = params.compressionResult;
  const id = await createStorageFileRecord({
    ...params,
    originalSize: r.originalSize,
    compressedSize: r.skipped ? undefined : r.compressedSize,
    optimizationStatus: r.skipped ? "skipped" : "compressed",
  });
  if (!r.skipped && r.savedBytes > 0) {
    await prisma.storageAuditLog.create({
      data: {
        action: "COMPRESS",
        entityType: params.entityType,
        entityId: params.entityId ?? id,
        userId: params.userId,
        details: {
          originalSize: r.originalSize,
          compressedSize: r.compressedSize,
          savedBytes: r.savedBytes,
        },
      },
    });
  }
  return id;
}
