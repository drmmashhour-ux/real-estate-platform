/**
 * User storage quota – free 500MB, Basic 5GB, Pro 50GB.
 * Create storage on first use; check before upload; update after upload/delete.
 */
import { prisma } from "@/lib/db";
import { getStorageStatus, type StorageStatus } from "@/lib/storage/check";

export const FREE_LIMIT_BYTES = 500 * 1024 * 1024; // 500MB
export const BASIC_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; // 5GB
export const PRO_LIMIT_BYTES = 50 * 1024 * 1024 * 1024; // 50GB

export type StoragePlan = "FREE" | "BASIC" | "PRO";

const PLAN_LIMITS: Record<StoragePlan, number> = {
  FREE: FREE_LIMIT_BYTES,
  BASIC: BASIC_LIMIT_BYTES,
  PRO: PRO_LIMIT_BYTES,
};

/** Get or create UserStorage for userId. Default: free plan (500MB). */
export async function getOrCreateUserStorage(userId: string, plan: StoragePlan = "FREE") {
  let row = await prisma.userStorage.findUnique({
    where: { userId },
  });
  if (!row) {
    row = await prisma.userStorage.create({
      data: {
        userId,
        usedBytes: 0,
        limitBytes: PLAN_LIMITS[plan],
      },
    });
  }
  return row;
}

/** Throws if status is full or usedBytes + fileSize would exceed limit. Call before accepting upload. */
export async function checkQuotaBeforeUpload(userId: string, fileSizeBytes: number): Promise<void> {
  const storage = await getOrCreateUserStorage(userId);
  const status = getStorageStatus(storage.usedBytes, storage.limitBytes);
  if (status === "full") {
    throw new Error("Storage limit reached. Upgrade plan.");
  }
  if (storage.usedBytes + fileSizeBytes > storage.limitBytes) {
    throw new Error("Storage limit reached. Upgrade plan.");
  }
}

/** Add file size to usedBytes and update alertLevel. Call after successful upload. */
export async function addUsage(userId: string, fileSizeBytes: number): Promise<void> {
  const updated = await prisma.userStorage.updateMany({
    where: { userId },
    data: { usedBytes: { increment: fileSizeBytes } },
  });
  if (updated.count > 0) await refreshAlertLevel(userId);
}

/** Subtract file size from usedBytes and update alertLevel. Call after successful delete. */
export async function subtractUsage(userId: string, fileSizeBytes: number): Promise<void> {
  const updated = await prisma.userStorage.updateMany({
    where: { userId },
    data: { usedBytes: { decrement: fileSizeBytes } },
  });
  if (updated.count > 0) await refreshAlertLevel(userId);
}

/** Set limit from plan (e.g. on upgrade). Basic → 5GB, Pro → 50GB. */
export async function updateLimitForPlan(userId: string, plan: StoragePlan): Promise<void> {
  const limitBytes = PLAN_LIMITS[plan];
  await prisma.userStorage.upsert({
    where: { userId },
    create: { userId, usedBytes: 0, limitBytes },
    update: { limitBytes },
  });
}

/** Update alertLevel from current used/limit; optionally trigger email alerts at 80%/100%. */
async function refreshAlertLevel(userId: string): Promise<void> {
  const storage = await prisma.userStorage.findUnique({ where: { userId } });
  if (!storage) return;
  const status = getStorageStatus(storage.usedBytes, storage.limitBytes);
  const percent =
    storage.limitBytes > 0
      ? (storage.usedBytes / storage.limitBytes) * 100
      : 0;
  await prisma.userStorage.updateMany({
    where: { userId },
    data: { alertLevel: status },
  });
  if (percent >= 80) {
    const { sendStorageAlertEmail } = await import("@/lib/storage/email-alerts");
    sendStorageAlertEmail(userId, percent, storage.usedBytes, storage.limitBytes).catch(() => {});
  }
}

/** Get usage for API response (used, limit, percent, status). */
export async function getUsage(userId: string) {
  const storage = await getOrCreateUserStorage(userId);
  const percent =
    storage.limitBytes > 0
      ? Math.min(100, Math.round((storage.usedBytes / storage.limitBytes) * 100))
      : 0;
  const status = getStorageStatus(storage.usedBytes, storage.limitBytes) as StorageStatus;
  return {
    usedBytes: storage.usedBytes,
    limitBytes: storage.limitBytes,
    percent,
    status,
  };
}
