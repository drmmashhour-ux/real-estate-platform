import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { sanitizeFileNameForStorage } from "@/modules/documents/services/sanitize-filename";

function rootDir(): string {
  return process.env.DOCUMENTS_STORAGE_ROOT?.trim() || path.join(process.cwd(), "storage", "documents");
}

export function getStorageProviderName(): string {
  return process.env.DOCUMENTS_STORAGE_PROVIDER?.trim() || "local";
}

export type UploadDocumentResult = {
  storageKey: string;
  checksum: string;
  sizeBytes: number;
};

/**
 * Local filesystem storage — swappable for S3 / Vercel Blob / Supabase later.
 */
export async function uploadDocumentFile(params: {
  buffer: Buffer;
  originalName: string;
  userId: string;
}): Promise<UploadDocumentResult> {
  const checksum = createHash("sha256").update(params.buffer).digest("hex");
  const safe = sanitizeFileNameForStorage(params.originalName);
  const storageKey = path
    .join("docs", params.userId, `${Date.now()}-${safe}`)
    .replace(/\\/g, "/");
  const full = path.join(rootDir(), storageKey);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, params.buffer);
  return {
    storageKey,
    checksum,
    sizeBytes: params.buffer.length,
  };
}

/** Public URL path for downloads (handler streams bytes; never expose raw disk path). */
export function getDocumentDownloadUrl(fileId: string): string {
  return `/api/documents/files/${encodeURIComponent(fileId)}/download`;
}

export async function readDocumentFileFromStorage(storageKey: string): Promise<Buffer> {
  const full = path.join(rootDir(), storageKey);
  return fs.readFile(full);
}

export async function deleteDocumentFileFromStorage(storageKey: string): Promise<void> {
  const full = path.join(rootDir(), storageKey);
  await fs.unlink(full).catch(() => {});
}

export async function moveDocumentFileInStorage(
  fromKey: string,
  toKey: string
): Promise<void> {
  const root = rootDir();
  const from = path.join(root, fromKey);
  const to = path.join(root, toKey);
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.rename(from, to).catch(async () => {
    const buf = await fs.readFile(from);
    await fs.writeFile(to, buf);
    await fs.unlink(from).catch(() => {});
  });
}
